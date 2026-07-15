import { Router, Request, Response } from 'express';
import { requireUserId, AuthenticatedRequest } from '../middleware/auth.js';
import { SearchProfileRepository } from '../../repositories/searchProfileRepository.js';
import { ResumeRepository } from '../../repositories/resumeRepository.js';
import { scrapeQueue } from '../../queue/jobQueues.js';

const router = Router();
const searchProfileRepo = new SearchProfileRepository();
const resumeRepo = new ResumeRepository();

const DEFAULT_BOARDS = ['greenhouse', 'lever'];
const DEFAULT_LOCATIONS = ['Remote'];
const SCRAPE_LIMIT_PER_QUERY = 5;

/**
 * POST /api/me/search/start
 *
 * The "missing button": onboarding only stores a resume and a search profile,
 * nothing ever puts a job on the scrape queue. This route reads the
 * authenticated user's saved resume + search profile and enqueues a
 * user-scoped scrape job so the existing ScrapeWorker -> AIWorker -> ResumeWorker
 * -> ApplyWorker pipeline actually starts moving.
 */
router.post('/start', requireUserId, async (req: Request, res: Response) => {
  const { userId } = req as AuthenticatedRequest;

  try {
    // 1. Require an active resume — nothing to evaluate fit against otherwise.
    const activeResume = await resumeRepo.findActiveByUser(userId);
    if (!activeResume) {
      res.status(400).json({
        error: 'No resume on file. Upload a resume before starting a job search.',
      });
      return;
    }

    // 2. Require a search profile with at least one job title.
    const profile = await searchProfileRepo.findByUser(userId);
    if (!profile || !profile.titles || profile.titles.length === 0) {
      res.status(400).json({
        error: 'No search profile set. Add at least one job title in Settings before starting a job search.',
      });
      return;
    }

    // 3. Avoid piling up duplicate runs if the user double-clicks or a
    //    previous search for this user is still in flight.
    const [waiting, active, delayed] = await Promise.all([
      scrapeQueue.getJobs(['waiting']),
      scrapeQueue.getJobs(['active']),
      scrapeQueue.getJobs(['delayed']),
    ]);
    const alreadyQueued = [...waiting, ...active, ...delayed].some(
      (j) => j.data?.userId === userId
    );
    if (alreadyQueued) {
      res.status(409).json({
        error: 'A job search is already running for your account. Sit tight — new matches will appear on the dashboard shortly.',
      });
      return;
    }

    // Board names in the search profile are validated at save-time against
    // ['linkedin', 'greenhouse', 'lever']. LinkedIn scraping stays opt-in only
    // (see README ToS note) but is honored here if the user explicitly chose it.
    const boards = profile.boards && profile.boards.length > 0 ? profile.boards : DEFAULT_BOARDS;
    const locations = profile.locations && profile.locations.length > 0 ? profile.locations : DEFAULT_LOCATIONS;

    const job = await scrapeQueue.add(`user-triggered-scrape-${userId}`, {
      boards,
      searchQueries: profile.titles,
      locations,
      limit: SCRAPE_LIMIT_PER_QUERY,
      userId,
    });

    console.log(
      `🚀 [SearchRoute] User ${userId} started a job search. Boards: ${boards.join(', ')} | ` +
      `Titles: ${profile.titles.join(', ')} | Locations: ${locations.join(', ')} | BullMQ Job ID: ${job.id}`
    );

    res.status(202).json({
      success: true,
      queued: true,
      message: 'Job search started. New matches will appear on your dashboard as they\'re found.',
      boards,
      titles: profile.titles,
      locations,
    });
  } catch (err: any) {
    console.error('[SearchRoute] Failed to start search:', err);
    res.status(500).json({ error: err.message || 'Failed to start job search.' });
  }
});

export default router;
