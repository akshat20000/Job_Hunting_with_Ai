import { BaseWorker } from './baseWorker.js';
import { Job as BullJob } from 'bullmq';
import { QUEUES } from '../queue/constants.js';
import { emailSender } from '../notifications/emailSender.js';

export interface NotificationJobData {
  jobId: string;
  success: boolean;
  error?: string;
  screenshotPath?: string;
}

export class NotificationWorker extends BaseWorker<NotificationJobData, void> {
  constructor() {
    super(QUEUES.NOTIFICATION);
  }

  protected async processJob(job: BullJob<NotificationJobData, void>): Promise<void> {
    const { jobId, success, error, screenshotPath } = job.data;
    console.log(`✉️ [NotificationWorker] Dispatching application email for Job ID: ${jobId} (Status: ${success ? 'SUCCESS' : 'FAILURE'})`);

    // 1. Fetch details for email templates
    const dbJob = await this.jobRepo.findById(jobId);
    if (!dbJob) {
      throw new Error(`Job listing with ID ${jobId} was not found in the DB.`);
    }

    // 2. Dispatch email via nodemailer transporter
    await emailSender.sendNotification({
      jobTitle: dbJob.title,
      companyName: dbJob.company.name,
      jobUrl: dbJob.url,
      success,
      errorDetails: error,
      screenshotPath,
    });

    console.log(`📬 [NotificationWorker] Notification email sent successfully for job: ${dbJob.title} @ ${dbJob.company.name}`);
  }

  protected async handleFailure(job: BullJob<NotificationJobData, void>, error: Error): Promise<void> {
    // Avoid triggering notificationWorker errors recursively. Simply log the failures.
    console.error(`🚨 [NotificationWorker] Transporter email failure:`, error.message);
  }
}
export default NotificationWorker;
