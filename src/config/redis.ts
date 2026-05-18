import Redis, { RedisOptions } from 'ioredis';
import env from './env';
import logger from './logger';

const redisConfig: RedisOptions = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null, // Critical configuration required by BullMQ
  enableReadyCheck: true,
  reconnectOnError: (err) => {
    logger.error('Redis reconnection triggered by error:', err);
    return true;
  },
};

export const createRedisClient = (): Redis => {
  const client = new Redis(redisConfig);

  client.on('connect', () => {
    logger.info('Redis connection established.');
  });

  client.on('ready', () => {
    logger.info('✅ Redis client is ready.');
  });

  client.on('error', (err) => {
    logger.error('❌ Redis client connection error:', err);
  });

  client.on('close', () => {
    logger.warn('Redis connection closed.');
  });

  return client;
};

// Singleton Redis Client for standard cache/locking
export const redis = createRedisClient();

export default redis;
