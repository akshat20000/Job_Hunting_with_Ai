import { BaseWorker } from './baseWorker.js';
import { Job as BullJob } from 'bullmq';
import { QUEUES } from '../queue/constants.js';
import { applyQueue } from '../queue/jobQueues.js';
import { brainEngineClient } from '../clients/brainEngineClient.js';
import { ApplicationStateMachine } from '../domain/ApplicationStateMachine.js';
import { env } from '../config/index.js';
import path from 'path';

export interface ResumeJobData {
  jobId: string;
}

export class ResumeWorker extends BaseWorker<ResumeJobData, void> {
  constructor() {
    super(QUEUES.TAILOR);
  }

  protected async processJob(job: BullJob<ResumeJobData, void>): Promise<void> {
    const { jobId } = job.data;
    console.log(`📄 [ResumeWorker] Tailoring resume/cover letter for Job ID: ${jobId}`);

    // 1. Fetch job with company metadata
    const dbJob = await this.jobRepo.findById(jobId);
    if (!dbJob) {
      throw new Error(`Job listing with ID ${jobId} was not found in the DB.`);
    }

    const stateMachine = new ApplicationStateMachine(dbJob.status as any);

    // 2. Prepare the local target folder for pdf outputs
    const targetStoragePath = path.join(env.STORAGE_DIR, 'applications', jobId);

    // 3. Command brain engine to compile tailored files
    const result = await brainEngineClient.generateArtifacts({
      job_title: dbJob.title,
      company_name: dbJob.company.name,
      job_description: dbJob.description,
      output_dir: targetStoragePath,
    });

    console.log(`💾 [ResumeWorker] Tailored PDFs created:`);
    console.log(`   - Resume: ${result.resume_pdf_path}`);
    console.log(`   - Cover Letter: ${result.cover_letter_pdf_path}`);

    // 4. Transition MATCHED -> TAILORED
    stateMachine.transitionTo('TAILORED');
    await this.jobRepo.updateStatus(jobId, 'TAILORED');
    await this.applicationRepo.updateStatus(jobId, 'TAILORED', {
      resumePath: result.resume_pdf_path,
      coverLetterPath: result.cover_letter_pdf_path,
    });

    // 5. Transition TAILORED -> READY (Meaning artifacts are built and checked out)
    stateMachine.transitionTo('READY');
    await this.jobRepo.updateStatus(jobId, 'READY');
    await this.applicationRepo.updateStatus(jobId, 'READY');

    // 6. Push to Apply Worker Queue
    await applyQueue.add(`apply-submission-${jobId}`, {
      jobId,
    });
    console.log(`🚀 [ResumeWorker] Job ID ${jobId} ready to apply. Enqueued to Apply queue.`);
  }
}
export default ResumeWorker;
