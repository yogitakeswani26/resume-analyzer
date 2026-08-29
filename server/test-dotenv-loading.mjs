import dotenv from 'dotenv';

console.log('Before dotenv.config():');
console.log('  process.env.JWT_SECRET:', process.env.JWT_SECRET);
console.log('  process.env.PORT:', process.env.PORT);

const result = dotenv.config();

console.log('\nAfter dotenv.config():');
console.log('  Loaded from:', result.parsed ? '.env' : 'NOT LOADED');
console.log('  process.env.JWT_SECRET:', process.env.JWT_SECRET);
console.log('  process.env.PORT:', process.env.PORT);

if (result.parsed) {
  console.log('\nParsed values:');
  console.log('  JWT_SECRET:', result.parsed.JWT_SECRET);
  console.log('  PORT:', result.parsed.PORT);
}
