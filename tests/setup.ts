import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import logger from '../src/config/logger';

let replSet: MongoMemoryReplSet;

// Adjust test execution timeout for handling replica set boot
jest.setTimeout(60000);

beforeAll(async () => {
  try {
    logger.info('Spawning local In-Memory 3-node MongoDB Replica Set for tests...');
    
    // Spawn a local in-memory 3-node MongoDB Replica Set
    replSet = await MongoMemoryReplSet.create({
      replSet: { storageEngine: 'ephemeralForTest', count: 3 }
    });
    
    const uri = replSet.getUri();
    
    // Silence standard logs during tests to keep console outputs clean
    logger.transports.forEach((t) => (t.silent = true));

    await mongoose.connect(uri, {
      connectTimeoutMS: 10000,
    });
  } catch (error) {
    console.error('❌ Failed to connect to local memory replica set:', error);
    throw error;
  }
});

afterAll(async () => {
  try {
    await mongoose.disconnect();
    if (replSet) {
      await replSet.stop();
    }
  } catch (error) {
    console.error('❌ Failed to clean up memory replica set:', error);
  }
});
