import { Router, Request, Response } from 'express';
import { requireUserId, AuthenticatedRequest } from '../middleware/auth.js';
import { ApplicationRepository } from '../../repositories/applicationRepository.js';
import { applyQueue } from '../../queue/jobQueues.js';
import { prisma } from '../../config/index.js';

const router = Router();
const appRepo = new ApplicationRepository();

/**
 * GET /api/me/applications
 * Returns all applications for the authenticated user with job + company details.
 */
router.get('/', requireUserId, async (req: Request, res: Response) => {
  const { userId } = req as AuthenticatedRequest;
  try {
    const apps = await appRepo.findByUserId(userId);
    res.json(
      apps.map((a) => ({
        id: a.id,
        status: a.status,
        appliedAt: a.appliedAt,
        createdAt: a.createdAt,
        job: {
          id: a.job.id,
          title: a.job.title,
          url: a.job.url,
          location: a.job.location,
          salary: a.job.salary,
          score: a.job.score,
          fitExplanation: a.job.fitExplanation,
          company: { name: a.job.company.name },
          // Signal to the frontend that this is a LinkedIn job requiring manual submission
          isLinkedIn: a.job.url.toLowerCase().includes('linkedin.com'),
        },
      }))
    );
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/me/applications/:id
 * Returns a single application (scoped to authenticated user).
 */
router.get('/:id', requireUserId, async (req: Request, res: Response) => {
  const { userId } = req as AuthenticatedRequest;
  const id = req.params['id'] as string;
  try {
    const app = await appRepo.findById(id);
    if (!app || app.userId !== userId) {
      res.status(404).json({ error: 'Application not found.' });
      return;
    }
    res.json(app);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/me/jobs/:jobId/approve
 * Manually enqueue a READY LinkedIn job for manual apply (human review gate).
 * For LinkedIn jobs this just confirms the user has reviewed — they still submit
 * manually through LinkedIn's own UI.
 */
router.post('/approve/:jobId', requireUserId, async (req: Request, res: Response) => {
  const { userId } = req as AuthenticatedRequest;
  const jobId = req.params['jobId'] as string;
  try {
    const app = await appRepo.findByUserAndJobId(userId, jobId);
    if (!app) {
      res.status(404).json({ error: 'Application not found.' });
      return;
    }
    if (app.status !== 'READY') {
      res.status(400).json({ error: `Application is in status "${app.status}", not READY.` });
      return;
    }

    // For non-LinkedIn jobs: enqueue to the apply worker
    const isLinkedIn = app.job.url.toLowerCase().includes('linkedin.com');
    if (!isLinkedIn) {
      await applyQueue.add(`apply-submission-${jobId}`, { jobId, userId });
      res.json({ success: true, queued: true, message: 'Enqueued for auto-apply.' });
    } else {
      // LinkedIn: just mark as acknowledged — user submits manually via LinkedIn
      res.json({
        success: true,
        queued: false,
        message: 'LinkedIn job acknowledged. Please submit manually at the job URL.',
        jobUrl: app.job.url,
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
