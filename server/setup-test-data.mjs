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

async function setupTestData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const Resume = mongoose.model('Resume', resumeSchema);

    // Clear existing data
    await Resume.deleteMany({});
    console.log('Cleared existing test data');

    const testUserId = 'test-user-001';

    // Create sample resume data
    const testResumes = [
      {
        userId: testUserId,
        fileName: 'john-smith-resume.pdf',
        candidateName: 'John Smith',
        candidateEmail: 'john.smith@email.com',
        location: 'New York, NY',
        content: 'Senior Software Engineer with 7 years of experience in full-stack development',
        skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'MongoDB', 'Docker', 'Kubernetes'],
        experience: 7,
        rating: 4.5,
        status: 'Applied',
        matchScore: 85,
      },
      {
        userId: testUserId,
        fileName: 'jane-doe-resume.pdf',
        candidateName: 'Jane Doe',
        candidateEmail: 'jane.doe@email.com',
        location: 'San Francisco, CA',
        content: 'Full-Stack Developer with expertise in React and Node.js',
        skills: ['React', 'Node.js', 'JavaScript', 'SQL', 'Git', 'AWS'],
        experience: 5,
        rating: 4,
        status: 'Screening',
        matchScore: 75,
      },
      {
        userId: testUserId,
        fileName: 'bob-wilson-resume.pdf',
        candidateName: 'Bob Wilson',
        candidateEmail: 'bob.wilson@email.com',
        location: 'Austin, TX',
        content: 'Backend Engineer specializing in microservices and databases',
        skills: ['Java', 'Spring Boot', 'MongoDB', 'PostgreSQL', 'Docker', 'Kubernetes', 'REST API'],
        experience: 6,
        rating: 3.5,
        status: 'Interview',
        matchScore: 70,
      },
      {
        userId: testUserId,
        fileName: 'alice-johnson-resume.pdf',
        candidateName: 'Alice Johnson',
        candidateEmail: 'alice.johnson@email.com',
        location: 'Boston, MA',
        content: 'Data Scientist with machine learning expertise',
        skills: ['Python', 'Machine Learning', 'TensorFlow', 'Pandas', 'SQL', 'Spark'],
        experience: 4,
        rating: 3,
        status: 'Offer',
        matchScore: 65,
      },
      {
        userId: testUserId,
        fileName: 'charlie-brown-resume.pdf',
        candidateName: 'Charlie Brown',
        candidateEmail: 'charlie.brown@email.com',
        location: 'Chicago, IL',
        content: 'Frontend specialist with React and Vue expertise',
        skills: ['React', 'Vue.js', 'JavaScript', 'CSS', 'HTML', 'Webpack'],
        experience: 3,
        rating: 3.5,
        status: 'Applied',
        matchScore: 60,
      },
    ];

    // Insert test data
    const inserted = await Resume.insertMany(testResumes);
    console.log(`Created ${inserted.length} test resumes`);

    // Verify insertion
    const count = await Resume.countDocuments({ userId: testUserId });
    console.log(`Total resumes in database: ${count}`);

    console.log('\n✓ Test data setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error setting up test data:', error);
    process.exit(1);
  }
}

setupTestData();
