import mongoose from 'mongoose';
import env from './env';
import logger from './logger';

export const connectDatabase = async (): Promise<void> => {
  const options: mongoose.ConnectOptions = {
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  };

  try {
    logger.info('Connecting to MongoDB...');
    await mongoose.connect(env.MONGODB_URI, options);
    
    const db = mongoose.connection;
    
    // Quick validation to check if replica set transactions are available
    const isReplSet = db.db && (await db.db.admin().command({ isMaster: 1 })).setName;
    if (isReplSet) {
      logger.info(`✅ MongoDB Connected successfully to Replica Set: "${isReplSet}" (Transactions ENABLED)`);
    } else {
      logger.warn('⚠️ MongoDB Connected to a Standalone node. MongoDB ACID Transactions will FAIL if replica set is not configured locally.');
    }
  } catch (error) {
    logger.error('❌ MongoDB Connection Failure:', error);
    process.exit(1);
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected successfully.');
  } catch (error) {
    logger.error('Error during MongoDB disconnection:', error);
  }
};
