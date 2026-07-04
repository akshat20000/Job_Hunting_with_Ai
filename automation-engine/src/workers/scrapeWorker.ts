import { BaseWorker } from './baseWorker.js';
import { Job as BullJob } from 'bullmq';
import { QUEUES } from '../queue/constants.js';
import { aiQueue } from '../queue/jobQueues.js';
import { CompanyRepository } from '../repositories/companyRepository.js';

// Board-specific scraper modules (to be implemented in Group 8)
import { scrapeLinkedIn } from '../boards/linkedin/search.js';
import { scrapeGreenhouse } from '../boards/greenhouse/search.js';
import { scrapeLever } from '../boards/lever/search.js';
import { scrapeAdzuna } from '../boards/adzuna/search.js';

export interface ScrapeJobData {
  boards: ('linkedin' | 'greenhouse' | 'lever' | 'adzuna')[];
  searchQueries?: string[];
  locations?: string[];
  limit?: number;
}

export class ScrapeWorker extends BaseWorker<ScrapeJobData, void> {
  private companyRepo = new CompanyRepository();

  constructor() {
    super(QUEUES.SCRAPE);
  }

  protected async processJob(job: BullJob<ScrapeJobData, void>): Promise<void> {
    const {
      boards,
      searchQueries = ['Software Engineer'],
      locations = ['Remote'],
      limit = 5,
    } = job.data;

    console.log(
      `🔍 [ScrapeWorker] Executing scrape for boards: ${boards.join(', ')} | ` +
      `Queries: ${searchQueries.join(', ')} | Locations: ${locations.join(', ')}`
    );

    for (const board of boards) {
      for (const searchQuery of searchQueries) {
        // Greenhouse/Lever are polled per-company and don't take a location
        // filter, so looping locations for them would just repeat identical
        // calls. Only Adzuna actually uses location, so only it loops there.
        const locationsToTry = board === 'adzuna' ? locations : [locations[0]];

        for (const location of locationsToTry) {
          try {
            let scrapedJobs: any[] = [];
            if (board === 'linkedin') {
              scrapedJobs = await scrapeLinkedIn(searchQuery, location, limit);
            } else if (board === 'greenhouse') {
              scrapedJobs = await scrapeGreenhouse(searchQuery, limit);
            } else if (board === 'lever') {
              scrapedJobs = await scrapeLever(searchQuery, limit);
            } else if (board === 'adzuna') {
              scrapedJobs = await scrapeAdzuna(searchQuery, location, limit);
            }

            console.log(
              `📊 [ScrapeWorker] Found ${scrapedJobs.length} listings from ${board} ` +
              `(query: "${searchQuery}", location: "${location}")`
            );

            for (const sj of scrapedJobs) {
              // 1. Upsert Company info
              const company = await this.companyRepo.upsert(sj.companyName, sj.companyWebsite);

              // 2. Prevent duplicates: skip existing URL entries
              const existingJob = await this.jobRepo.findByUrl(sj.url);
              if (existingJob) {
                console.log(`⏭️ [ScrapeWorker] Listing already exists: ${sj.url}. Skipping.`);
                continue;
              }

              // 3. Persist Job
              const newJob = await this.jobRepo.create({
                title: sj.title,
                description: sj.description,
                url: sj.url,
                location: sj.location,
                salary: sj.salary,
                companyId: company.id,
                status: 'FOUND',
              });

              // 4. Create Application record matching state machine
              await this.applicationRepo.upsert(newJob.id, {
                status: 'FOUND',
              });

              // 5. Delegate to AI evaluation queue
              await aiQueue.add(`ai-evaluate-${newJob.id}`, {
                jobId: newJob.id,
              });
              console.log(`🤖 [ScrapeWorker] Enqueued Job ID ${newJob.id} for fit evaluation.`);
            }
          } catch (boardError: any) {
            console.error(
              `❌ [ScrapeWorker] Scrape failed on board "${board}" (query: "${searchQuery}"):`,
              boardError.message
            );
          }
        }
      }
    }
  }

  protected async handleFailure(job: BullJob<ScrapeJobData, void>, error: Error): Promise<void> {
    console.error(`🚨 [ScrapeWorker] Scrape session failed completely:`, error.message);
  }
}
