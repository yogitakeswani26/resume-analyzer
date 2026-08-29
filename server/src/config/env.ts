export const config = {
  node_env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5001'),

  // Database
  mongodb_uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/resume-analyzer',

  // JWT
  jwt_secret: process.env.JWT_SECRET || 'dev_secret_key_change_in_production',
  jwt_refresh_secret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_key_change_in_production',
  jwt_expire: process.env.JWT_EXPIRE || '15m',
  jwt_refresh_expire: process.env.JWT_REFRESH_EXPIRE || '7d',

  // Redis
  redis_url: process.env.REDIS_URL || 'redis://localhost:6379',

  // Frontend
  frontend_url: process.env.FRONTEND_URL || 'http://localhost:5173',

  // Storage
  storage_type: process.env.STORAGE_TYPE || 'local',
  storage_path: process.env.STORAGE_PATH || './uploads',

  // AI
  ai_provider: process.env.AI_PROVIDER || 'openai',
  ai_api_key: process.env.AI_API_KEY || '',
  ai_model: process.env.AI_MODEL || 'gpt-4-turbo',
};

export const validateConfig = () => {
  const required = ['jwt_secret', 'mongodb_uri'];
  const missing = required.filter(key => !config[key as keyof typeof config]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // CRITICAL: Ensure JWT_SECRET is not the default development secret
  if (config.jwt_secret === 'dev_secret_key_change_in_production') {
    throw new Error(
      'CRITICAL: JWT_SECRET must be set in environment variables. ' +
      'Using default development secret will cause token verification failures in production. ' +
      'Set JWT_SECRET environment variable to a strong random string (min 32 chars).'
    );
  }

  // CRITICAL: Ensure JWT_SECRET has minimum length
  if (config.jwt_secret.length < 32) {
    throw new Error(
      `JWT_SECRET must be at least 32 characters. Current length: ${config.jwt_secret.length}`
    );
  }
};
