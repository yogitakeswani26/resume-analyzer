import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

import app from './app.js';
import { config, validateConfig } from './config/env.js';
import { connectDatabase } from './config/database.js';

const startServer = async () => {
  try {
    // Validate environment variables
    validateConfig();

    // Connect to database
    await connectDatabase();

    // Start server - bind to 0.0.0.0 for container environments
    const port = config.port || 3000;
    app.listen(port, '0.0.0.0', () => {
      // Server started successfully
    });
  } catch (error) {
    process.exit(1);
  }
};

startServer();
