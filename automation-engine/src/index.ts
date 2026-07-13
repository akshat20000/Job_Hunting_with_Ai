import { startHealthCheckServer } from './healthcheck.js';
import { createApiApp } from './api/server.js';
import { ScrapeWorker } from './workers/scrapeWorker.js';
import { AIWorker } from './workers/aiWorker.js';
import { ResumeWorker } from './workers/resumeWorker.js';
import { ApplyWorker } from './workers/applyWorker.js';
import { NotificationWorker } from './workers/notificationWorker.js';
import { prisma } from './config/index.js';
import { env } from './config/index.js';
import { redisConnection } from './queue/connection.js';
import http from 'http';

async function bootstrap() {
  console.log('🤖 Starting AI Job Agent - Automation Engine...');

  // 1. Boot up the health status and metrics endpoint server
  const healthServer = startHealthCheckServer();

  // 2. Start the new multi-tenant API server on PORT+1
  const apiApp = createApiApp();
  const API_PORT = env.PORT + 1; // e.g. 3001 if PORT=3000
  const apiServer = http.createServer(apiApp);
  apiServer.listen(API_PORT, () => {
    console.log(`🔐 [API Server] Multi-tenant API running on port ${API_PORT}`);
    console.log(`   Auth:           POST http://localhost:${API_PORT}/api/auth/signup`);
    console.log(`   Usage:          GET  http://localhost:${API_PORT}/api/me/usage`);
    console.log(`   Applications:   GET  http://localhost:${API_PORT}/api/me/applications`);
    console.log(`   Resumes:        POST http://localhost:${API_PORT}/api/me/resumes`);
    console.log(`   Search Profile: GET  http://localhost:${API_PORT}/api/me/search-profile`);
  });

  // 3. Spin up queue workers to start listening for BullMQ dispatches
  console.log('🚀 Bootstrapping BullMQ Workers...');
  const scrapeWorker = new ScrapeWorker();
  const aiWorker = new AIWorker();
  const resumeWorker = new ResumeWorker();
  const applyWorker = new ApplyWorker();
  const notificationWorker = new NotificationWorker();
  console.log('✅ All BullMQ background workers are active and listening.');

  // 4. Graceful shutdown handler
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
      apiServer.close(() => {
        console.log('🔒 Closed all HTTP servers.');
        process.exit(0);
      });
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
