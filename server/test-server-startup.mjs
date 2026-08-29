import app from './dist/app.js';
import { connectDatabase } from './dist/config/database.js';
import { config } from './dist/config/env.js';

async function startServer() {
  try {
    console.log('[LOG] Starting server...');
    
    // Connect to database
    console.log('[LOG] Connecting to database...');
    await connectDatabase();
    console.log('[LOG] Database connected');

    // Start server
    const port = config.port || 8000;
    const server = app.listen(port, () => {
      console.log(`[LOG] Server listening on port ${port}`);
    });

    server.on('error', (err) => {
      console.error('[ERROR] Server error:', err);
    });
  } catch (error) {
    console.error('[ERROR] Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
