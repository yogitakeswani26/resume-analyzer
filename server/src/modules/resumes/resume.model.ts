import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    skills: [String],
    experience: Number,
    education: [String],
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    notes: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Applied', 'Screening', 'Interview', 'Offer', 'Rejected'],
      default: 'Applied',
    },
    matchScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    candidateName: String,
    candidateEmail: String,
    location: String,
  },
  { timestamps: true }
);

// Add indexes for performance
resumeSchema.index({ userId: 1 });
resumeSchema.index({ userId: 1, createdAt: -1 });
resumeSchema.index({ createdAt: -1 });

export const Resume = mongoose.model('Resume', resumeSchema);
