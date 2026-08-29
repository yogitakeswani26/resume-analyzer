import dotenv from 'dotenv';
const result = dotenv.config();

console.log('dotenv.config() result:', result.parsed ? 'Loaded' : 'Not loaded');
if (result.error) {
  console.log('Error:', result.error.message);
}
if (result.parsed) {
  console.log('PORT:', result.parsed.PORT);
}
console.log('process.env.PORT:', process.env.PORT);
