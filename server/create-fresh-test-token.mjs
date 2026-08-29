import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const secret = process.env.JWT_SECRET || 'test_secret_key_minimum_32_characters_long_for_testing';
const testUserId = 'test-user-001';

// Create a token that lasts 30 days
const token = jwt.sign(
  {
    userId: testUserId,
    email: 'test@example.com',
    role: 'recruiter',
  },
  secret,
  { algorithm: 'HS256', expiresIn: '30d' }
);

console.log('Fresh Test JWT Token:');
console.log(token);

// Also decode and show it
const decoded = jwt.decode(token);
console.log('\nToken decoded:');
console.log(JSON.stringify(decoded, null, 2));
