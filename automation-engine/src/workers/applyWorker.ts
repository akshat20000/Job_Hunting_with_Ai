import { BaseWorker } from './baseWorker.js';
import { Job as BullJob } from 'bullmq';
import { QUEUES } from '../queue/constants.js';
import { notificationQueue } from '../queue/jobQueues.js';
import { ApplicationStateMachine } from '../domain/ApplicationStateMachine.js';
import { env } from '../config/index.js';
import path from 'path';

// Board-specific automation scripts (to be implemented in Group 8)
import { applyLinkedIn } from '../boards/linkedin/apply.js';
import { applyGreenhouse } from '../boards/greenhouse/apply.js';
import { applyLever } from '../boards/lever/apply.js';

export interface ApplyJobData {
  jobId: string;
}

export class ApplyWorker extends BaseWorker<ApplyJobData, void> {
  constructor() {
    super(QUEUES.APPLY);
  }

  protected async processJob(job: BullJob<ApplyJobData, void>): Promise<void> {
    const { jobId } = job.data;
    console.log(`🤖 [ApplyWorker] Launching automation apply sequence for Job ID: ${jobId}`);

    // 1. Fetch job and application documents
    const dbJob = await this.jobRepo.findById(jobId);
    if (!dbJob) {
      throw new Error(`Job listing with ID ${jobId} was not found in the DB.`);
    }

    const app = await this.applicationRepo.findByJobId(jobId);
    if (!app || !app.resumePath) {
      throw new Error(`Application details or tailored resume path are missing for Job ID: ${jobId}`);
    }

    // 2. Validate state machine transition READY -> APPLYING
    const stateMachine = new ApplicationStateMachine(dbJob.status as any);
    stateMachine.transitionTo('APPLYING');
    await this.jobRepo.updateStatus(jobId, 'APPLYING');
    await this.applicationRepo.updateStatus(jobId, 'APPLYING');

    // 3. Prepare storage output folders for screenshots
    const screenshotDir = path.join(env.STORAGE_DIR, 'screenshots', jobId);
    const screenshotPath = path.join(screenshotDir, 'submission_proof.png');

    let isApplied = false;
    const url = dbJob.url.toLowerCase();

    // 4. Dispatch browser automation tasks by target platform
    if (url.includes('linkedin.com')) {
      if (!env.LINKEDIN_AUTOMATION_ENABLED) {
        throw new Error(
          'LinkedIn application skipped because LINKEDIN_AUTOMATION_ENABLED is set to false in configs.'
        );
      }
      await applyLinkedIn(dbJob.url, app.resumePath, app.coverLetterPath || undefined, screenshotPath);
      isApplied = true;
    } else if (url.includes('greenhouse.io') || url.includes('boards.greenhouse.io')) {
      await applyGreenhouse(dbJob.url, app.resumePath, app.coverLetterPath || undefined, screenshotPath);
      isApplied = true;
    } else if (url.includes('lever.co') || url.includes('jobs.lever.co')) {
      await applyLever(dbJob.url, app.resumePath, app.coverLetterPath || undefined, screenshotPath);
      isApplied = true;
    } else {
      throw new Error(`Job board host in URL ${dbJob.url} is currently unsupported by automation engine.`);
    }

    if (isApplied) {
      // 5. Update state APPLYING -> SUBMITTED
      stateMachine.transitionTo('SUBMITTED');
      await this.jobRepo.updateStatus(jobId, 'SUBMITTED');
      await this.applicationRepo.markApplied(jobId, screenshotPath);

      // 6. Schedule success alert
      await notificationQueue.add(`success-email-${jobId}`, {
        jobId,
        success: true,
        screenshotPath,
      });

      console.log(`🎉 [ApplyWorker] Auto-applied successfully for job ${jobId}. Logged screenshot proof.`);
    }
  }
}
export default ApplyWorker;
