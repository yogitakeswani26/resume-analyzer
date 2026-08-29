import dotenv from 'dotenv';
dotenv.config();

import { connectDatabase } from './dist/config/database.js';
import { config } from './dist/config/env.js';

console.log('Port:', config.port);
console.log('MongoDB URI:', process.env.MONGODB_URI?.substring(0, 30) + '...');

try {
  await connectDatabase();
  console.log('Database connected successfully');
  process.exit(0);
} catch (error) {
  console.error('Failed to connect to database:', error.message);
  process.exit(1);
}
