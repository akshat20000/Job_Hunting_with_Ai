import { Worker, Job as BullJob, WorkerOptions } from 'bullmq';
import { redisConnection } from '../queue/connection.js';
import { notificationQueue } from '../queue/jobQueues.js';
import { ApplicationRepository } from '../repositories/applicationRepository.js';
import { JobRepository } from '../repositories/jobRepository.js';

export abstract class BaseWorker<TData = any, TResult = any> {
  protected worker: Worker<TData, TResult>;
  protected applicationRepo = new ApplicationRepository();
  protected jobRepo = new JobRepository();

  constructor(queueName: string, options?: Partial<WorkerOptions>) {
    this.worker = new Worker<TData, TResult>(
      queueName,
      async (job) => {
        console.log(`📡 [Worker - ${queueName}] Starting job ID: ${job.id}`);
        try {
          const result = await this.processJob(job);
          console.log(`✅ [Worker - ${queueName}] Finished job ID: ${job.id}`);
          return result;
        } catch (error: any) {
          console.error(`❌ [Worker - ${queueName}] Failed job ID ${job.id}:`, error.message);
          await this.handleFailure(job, error);
          throw error; // Re-throw to trigger BullMQ's automatic retry backoffs
        }
      },
      {
        connection: redisConnection as any,
        concurrency: 1,
        ...options,
      }
    );

    this.worker.on('failed', (job, err) => {
      console.error(`🚨 [Worker - ${queueName}] Job ID ${job?.id} failed permanently: ${err.message}`);
    });
  }

  protected abstract processJob(job: BullJob<TData, TResult>): Promise<TResult>;

  protected async handleFailure(job: BullJob<TData, TResult>, error: Error): Promise<void> {
    const data = job.data as any;
    if (data && data.jobId) {
      try {
        // Log details to Database and Application
        await this.applicationRepo.markFailed(data.jobId, error.message);
        await this.jobRepo.updateStatus(data.jobId, 'FAILED');

        // Queue a notification job about the failure
        await notificationQueue.add(`fail-notification-${data.jobId}`, {
          jobId: data.jobId,
          success: false,
          error: error.message,
        });
      } catch (dbError) {
        console.error(
          `⚠️ [BaseWorker] Could not write failure audit logs to DB for jobId: ${data.jobId}`,
          dbError
        );
      }
    }
  }

  async close() {
    await this.worker.close();
  }
}
