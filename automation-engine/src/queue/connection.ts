import { env } from '../config/index.js';
import { Redis } from 'ioredis';

export const redisConnection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

export default redisConnection;
