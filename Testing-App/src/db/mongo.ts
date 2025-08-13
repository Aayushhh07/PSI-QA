import mongoose from 'mongoose';
import { logger } from '../utils/logger';

let isConnected = false;

export async function connectToMongo(): Promise<void> {
  if (isConnected) return;
  const uri = process.env.MONGODB_URI || '';
  if (!uri) {
    logger.warn('MONGODB_URI not set. Skipping MongoDB connection.');
    return;
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
    } as any);
    isConnected = true;
    logger.info('✅ Connected to MongoDB');
  } catch (error) {
    logger.error(`❌ Failed to connect to MongoDB: ${error}`);
  }
}

export default mongoose;



