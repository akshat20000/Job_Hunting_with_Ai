export const QUEUES = {
  SCRAPE: 'scrape-queue',
  AI: 'ai-queue',
  TAILOR: 'tailor-queue',
  APPLY: 'apply-queue',
  NOTIFICATION: 'notification-queue',
} as const;

export type QueueName = typeof QUEUES[keyof typeof QUEUES];
