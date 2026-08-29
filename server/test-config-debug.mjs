import dotenv from 'dotenv';
const result = dotenv.config();

console.log('After dotenv.config():');
console.log('  Loaded:', result.parsed ? 'Yes' : 'No');
console.log('  process.env.JWT_SECRET length:', (process.env.JWT_SECRET || '').length);
console.log('  process.env.JWT_SECRET value:', process.env.JWT_SECRET);

// Now import the config
import('./dist/config/env.js').then(module => {
  const config = module.config;
  console.log('\nConfig object:');
  console.log('  config.jwt_secret length:', config.jwt_secret.length);
  console.log('  config.jwt_secret value:', config.jwt_secret);
  console.log('  config.port:', config.port);

  const validateConfig = module.validateConfig;
  try {
    validateConfig();
    console.log('\nValidation passed!');
  } catch (error) {
    console.log('\nValidation failed:');
    console.log('  Error:', error.message);
  }
}).catch(err => {
  console.error('Failed to import config:', err);
});
