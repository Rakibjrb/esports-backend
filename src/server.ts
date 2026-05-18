import app from './app';
import env from './config/env';
import { logger } from './config/logger';
import { connectDatabase, disconnectDatabase } from './config/database';
import { redis } from './config/redis';

const startServer = async () => {
  try {
    // 1. Establish Database Connection
    await connectDatabase();

    // 2. Start Listening on HTTP Port
    const server = app.listen(env.PORT, () => {
      logger.info(`🚀 ffairdrop server started successfully in "${env.NODE_ENV}" mode`);
      logger.info(`🎧 Listening on network interface: http://localhost:${env.PORT}`);
    });

    // 3. Graceful shutdown handler
    const gracefulShutdown = async (signal: string) => {
      logger.warn(`⚠️ Received ${signal} signal. Beginning graceful shutdown sequence...`);

      server.close(async () => {
        logger.info('HTTP server closed.');

        // Close MongoDB pools
        await disconnectDatabase();

        // Close Redis clients
        try {
          await redis.quit();
          logger.info('Redis connection quit cleanly.');
        } catch (err) {
          logger.error('Error during Redis disconnection:', err);
        }

        logger.info('👋 Graceful shutdown sequence completed. Exiting process.');
        process.exit(0);
      });

      // Force close after 10 seconds if shutdown hangs
      setTimeout(() => {
        logger.error('💥 Force exit triggered due to hung shutdown sequence.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('❌ Server failed to bootstrap:', error);
    process.exit(1);
  }
};

startServer();
