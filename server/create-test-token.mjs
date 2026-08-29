import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET || 'test_secret_key_minimum_32_characters_long_for_testing';
const testUserId = 'test-user-001';

const token = jwt.sign(
  {
    userId: testUserId,
    email: 'test@example.com',
    role: 'recruiter',
  },
  secret,
  { algorithm: 'HS256', expiresIn: '1d' }
);

console.log('Test JWT Token:');
console.log(token);
