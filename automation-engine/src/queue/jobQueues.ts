import { Queue } from 'bullmq';
import { redisConnection } from './connection.js';
import { QUEUES } from './constants.js';

const queueOptions = {
  connection: redisConnection as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential' as const,
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
};

export const scrapeQueue = new Queue(QUEUES.SCRAPE, queueOptions);
export const aiQueue = new Queue(QUEUES.AI, queueOptions);
export const tailorQueue = new Queue(QUEUES.TAILOR, queueOptions);
export const applyQueue = new Queue(QUEUES.APPLY, queueOptions);
export const notificationQueue = new Queue(QUEUES.NOTIFICATION, queueOptions);
