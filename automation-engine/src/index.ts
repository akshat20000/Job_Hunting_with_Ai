import { startHealthCheckServer } from './healthcheck.js';
import { ScrapeWorker } from './workers/scrapeWorker.js';
import { AIWorker } from './workers/aiWorker.js';
import { ResumeWorker } from './workers/resumeWorker.js';
import { ApplyWorker } from './workers/applyWorker.js';
import { NotificationWorker } from './workers/notificationWorker.js';
import { prisma } from './config/index.js';
import { redisConnection } from './queue/connection.js';

async function bootstrap() {
  console.log('🤖 Starting AI Job Agent - Automation Engine...');

  // 1. Boot up the health status and metrics endpoint server
  const healthServer = startHealthCheckServer();

  // 2. Spin up queue workers to start listening for BullMQ dispatches
  console.log('🚀 Bootstrapping BullMQ Workers...');
  const scrapeWorker = new ScrapeWorker();
  const aiWorker = new AIWorker();
  const resumeWorker = new ResumeWorker();
  const applyWorker = new ApplyWorker();
  const notificationWorker = new NotificationWorker();
  console.log('✅ All BullMQ background workers are active and listening.');

  // 3. Graceful shutdown handler
  const handleShutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Initiating graceful shutdown...`);

    // Terminate worker processes
    await scrapeWorker.close();
    await aiWorker.close();
    await resumeWorker.close();
    await applyWorker.close();
    await notificationWorker.close();
    console.log('🔒 Closed all BullMQ workers.');

    // Disconnect connection pools
    await prisma.$disconnect();
    await redisConnection.quit();
    console.log('🔒 Disconnected DB client and Redis connections.');

    // Close API listening ports
    healthServer.close(() => {
      console.log('🔒 Closed health check HTTP server.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
}

bootstrap().catch((error) => {
  console.error('💥 Fatal error during application boot:', error);
  process.exit(1);
});
export default bootstrap;
