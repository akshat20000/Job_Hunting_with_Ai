import http from 'http';
import { env, prisma } from './config/index.js';
import { redisConnection } from './queue/connection.js';
import { register } from './monitoring/metrics.js';

export function startHealthCheckServer() {
  const server = http.createServer(async (req, res) => {
    if (req.url === '/health') {
      let isDbConnected = false;
      let isRedisConnected = false;

      try {
        await prisma.$queryRaw`SELECT 1`;
        isDbConnected = true;
      } catch (dbError) {
        console.error('❌ [Healthcheck] Database check failure:', dbError);
      }

      try {
        await redisConnection.ping();
        isRedisConnected = true;
      } catch (redisError) {
        console.error('❌ [Healthcheck] Redis check failure:', redisError);
      }

      const isHealthy = isDbConnected && isRedisConnected;
      const responseStatus = isHealthy ? 200 : 500;

      res.writeHead(responseStatus, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          status: isHealthy ? 'healthy' : 'unhealthy',
          database: isDbConnected ? 'connected' : 'disconnected',
          redis: isRedisConnected ? 'connected' : 'disconnected',
        })
      );
    } else if (req.url === '/metrics') {
      res.writeHead(200, { 'Content-Type': register.contentType });
      res.end(await register.metrics());
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  const port = env.PORT || 3000;
  server.listen(port, () => {
    console.log(`🏥 [Healthcheck] Server successfully booted on port ${port}`);
  });

  return server;
}

export default startHealthCheckServer;
