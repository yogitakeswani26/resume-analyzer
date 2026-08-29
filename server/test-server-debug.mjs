import dotenv from 'dotenv';
dotenv.config();

console.log('Environment loaded. PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MONGODB_URI:', process.env.MONGODB_URI?.substring(0, 40) + '...');

import { connectDatabase } from './dist/config/database.js';
import { config, validateConfig } from './dist/config/env.js';

console.log('Config port:', config.port);

try {
  console.log('Validating config...');
  validateConfig();
  console.log('Config validated');

  console.log('Connecting to database...');
  await connectDatabase();
  console.log('Database connected');

  console.log('Importing app...');
  import('./dist/app.js').then(module => {
    const app = module.default;
    const port = config.port || 3000;
    console.log(`Starting server on port ${port}...`);
    const server = app.listen(port, '0.0.0.0', () => {
      console.log(`Server listening on port ${port}`);
    });

    server.on('error', (err) => {
      console.error('Server error:', err);
      process.exit(1);
    });
  }).catch(err => {
    console.error('Failed to import app:', err);
    process.exit(1);
  });
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
