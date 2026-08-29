import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const resumeSchema = new mongoose.Schema({
  userId: String,
  fileName: String,
  candidateName: String,
  candidateEmail: String,
  location: String,
  content: String,
  skills: [String],
  experience: Number,
  rating: { type: Number, default: 0 },
  status: { type: String, default: 'Applied' },
  matchScore: { type: Number, default: 0 },
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

async function checkDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const Resume = mongoose.model('Resume', resumeSchema);

    const allCount = await Resume.countDocuments({});
    console.log(`Total resumes in DB: ${allCount}`);

    const testUserCount = await Resume.countDocuments({ userId: 'test-user-001' });
    console.log(`Resumes for test-user-001: ${testUserCount}`);

    const samples = await Resume.find({ userId: 'test-user-001' }).limit(3);
    console.log('\nSample records:');
    samples.forEach(s => {
      console.log(`- ${s.candidateName} (${s.status})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkDB();
