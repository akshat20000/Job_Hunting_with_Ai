import { Queue } from 'bullmq';
import { redisConnection } from './queue/connection.js';
import { QUEUES } from './queue/constants.js';

async function triggerFirstScrape() {
  console.log('🔌 Connecting to Scrape Queue...');
  const scrapeQueue = new Queue(QUEUES.SCRAPE, { connection: redisConnection as any });

  // Define what you want to search for
  const payload = {
    boards: ['greenhouse', 'lever', 'adzuna'],
    searchQueries: ['Software Engineer'],
    locations: ['Remote', 'India'],
    limit: 5
  };

  console.log(`🚀 Dispatching scrape job for: "${payload.searchQueries}"...`);
  
  await scrapeQueue.add('manual-trigger-scrape', payload);

  console.log('✅ Job successfully enqueued! Your Docker containers should start processing it now.');
  await scrapeQueue.close();
  process.exit(0);
}

triggerFirstScrape().catch((err) => {
  console.error('💥 Failed to trigger scrape:', err);
  process.exit(1);
});