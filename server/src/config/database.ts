import mongoose from 'mongoose';
import { config } from './env.js';

export const connectDatabase = async () => {
  try {
    await mongoose.connect(config.mongodb_uri);
  } catch (error) {
    process.exit(1);
  }
};

export const disconnectDatabase = async () => {
  try {
    await mongoose.disconnect();
  } catch (error) {
    // Disconnection error - non-critical
  }
};
