import { BaseWorker } from './baseWorker.js';
import { Job as BullJob } from 'bullmq';
import { QUEUES } from '../queue/constants.js';
import { notificationQueue } from '../queue/jobQueues.js';
import { ApplicationStateMachine } from '../domain/ApplicationStateMachine.js';
import { UserRepository } from '../repositories/userRepository.js';
import { env } from '../config/index.js';
import path from 'path';

// Board-specific automation scripts
import { applyLinkedIn } from '../boards/linkedin/apply.js';
import { applyGreenhouse } from '../boards/greenhouse/apply.js';
import { applyLever } from '../boards/lever/apply.js';

export interface ApplyJobData {
  jobId: string;
  userId: string;
}

/**
 * Typed error thrown when a LinkedIn job is attempted to be auto-submitted.
 *
 * LOCKED DECISION: LinkedIn jobs must NEVER be auto-submitted. The apply worker
 * stops at READY for linkedin.com URLs. The frontend shows a "Review & Submit
 * Manually" CTA for these jobs.
 */
export class LinkedInManualSubmitRequired extends Error {
  readonly jobId: string;
  constructor(jobId: string, url: string) {
    super(
      `Job ${jobId} (${url}) is sourced from LinkedIn. ` +
        `Auto-submission is permanently disabled for LinkedIn jobs. ` +
        `Please review and submit manually via the dashboard.`
    );
    this.name = 'LinkedInManualSubmitRequired';
    this.jobId = jobId;
  }
}

export class ApplyWorker extends BaseWorker<ApplyJobData, void> {
  private userRepo = new UserRepository();

  constructor() {
    super(QUEUES.APPLY);
  }

  protected async processJob(job: BullJob<ApplyJobData, void>): Promise<void> {
    const { jobId, userId } = job.data;
    console.log(`🤖 [ApplyWorker] Launching automation apply sequence for Job ID: ${jobId} (User: ${userId})`);

    // 1. Fetch user (needed further down for notifications/context)
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new Error(`User ${userId} not found.`);
    }

    // NOTE: no daily-limit check here. Usage quota is consumed once, at
    // search time (see UsageLimiter + /api/me/search/start) — applying to
    // matched jobs is unlimited and doesn't touch the quota.

    // 2. Fetch job and application documents
    const dbJob = await this.jobRepo.findById(jobId);
    if (!dbJob) {
      throw new Error(`Job listing with ID ${jobId} was not found in the DB.`);
    }

    const app = await this.applicationRepo.findByUserAndJobId(userId, jobId);
    if (!app || !app.resumePath) {
      throw new Error(`Application details or tailored resume path are missing for Job ID: ${jobId}`);
    }

    // ─── LINKEDIN HARD BLOCK ──────────────────────────────────────────────────
    // LOCKED DECISION: LinkedIn jobs MUST NEVER be auto-submitted.
    // This check is unconditional — no flag can enable LinkedIn auto-apply.
    // The status remains READY; the frontend shows "Review & Submit Manually".
    const jobUrl = dbJob.url.toLowerCase();
    if (jobUrl.includes('linkedin.com')) {
      throw new LinkedInManualSubmitRequired(jobId, dbJob.url);
    }
    // ─────────────────────────────────────────────────────────────────────────

    // Initialize state machine with current status
    const stateMachine = new ApplicationStateMachine(dbJob.status as any);

    try {
      // 4. Validate state machine transition READY/RETRYING -> APPLYING
      stateMachine.transitionTo('APPLYING');
      await this.jobRepo.updateStatus(jobId, 'APPLYING');
      await this.applicationRepo.updateStatus(userId, jobId, 'APPLYING');

      // 5. Prepare storage output folders for screenshots
      const screenshotDir = path.join(env.STORAGE_DIR, 'screenshots', jobId);
      const screenshotPath = path.join(screenshotDir, 'submission_proof.png');

      let isApplied = false;

      // 6. Dispatch browser automation tasks by target platform
      if (jobUrl.includes('greenhouse.io') || jobUrl.includes('gh_jid=')) {
        await applyGreenhouse(dbJob.url, app.resumePath, app.coverLetterPath || undefined, screenshotPath);
        isApplied = true;
      } else if (jobUrl.includes('lever.co') || jobUrl.includes('jobs.lever.co')) {
        await applyLever(dbJob.url, app.resumePath, app.coverLetterPath || undefined, screenshotPath);
        isApplied = true;
      } else {
        throw new Error(`Job board host in URL ${dbJob.url} is currently unsupported by automation engine.`);
      }

      if (isApplied) {
        // 7. Update state APPLYING -> APPLIED
        stateMachine.transitionTo('APPLIED');
        await this.jobRepo.updateStatus(jobId, 'APPLIED');
        await this.applicationRepo.markApplied(userId, jobId, screenshotPath);

        // 8. Schedule success alert
        await notificationQueue.add(`success-email-${jobId}`, {
          jobId,
          success: true,
          screenshotPath,
        });

        console.log(`🎉 [ApplyWorker] Auto-applied successfully for job ${jobId}. Logged screenshot proof.`);
      }
    } catch (error: any) {
      // 9. Handle transient retries vs permanent failures
      const maxAttempts = job.opts.attempts || 1;
      const isFinalAttempt = job.attemptsMade >= maxAttempts;

      if (!isFinalAttempt) {
        console.warn(`🔁 [ApplyWorker] Transient failure for Job ${jobId}. Parked in RETRYING state.`);
        stateMachine.transitionTo('RETRYING');
        await this.jobRepo.updateStatus(jobId, 'RETRYING');
        await this.applicationRepo.updateStatus(userId, jobId, 'RETRYING');
      } else {
        console.error(`🚨 [ApplyWorker] Final attempt failed for Job ${jobId}. Moving to FAILED state.`);
        stateMachine.transitionTo('FAILED');
        await this.jobRepo.updateStatus(jobId, 'FAILED');
      }

      throw error;
    }
  }
}
export default ApplyWorker;