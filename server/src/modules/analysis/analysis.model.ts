import mongoose from 'mongoose';

// Section score subdocument schema
const sectionScoreSchema = new mongoose.Schema({
  section: String,
  score: Number,
  maxScore: Number,
  completeness: Number,
  feedback: [String],
  suggestions: [String],
  status: String,
}, { _id: false });

const analysisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      required: true,
    },
    jobDescription: {
      type: String,
      required: true,
    },
    matchScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    matchedSkills: [String],
    missingSkills: [String],
    suggestions: [String],
    resumeHealth: {
      type: Number,
      min: 0,
      max: 100,
    },
    atsScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    summary: String,
    // New section-by-section analysis
    sectionAnalysis: {
      sectionScores: [sectionScoreSchema],
      overallSectionScore: Number,
      totalSections: Number,
      completeSections: Number,
    },
  },
  { timestamps: true }
);

// Add indexes for performance
analysisSchema.index({ userId: 1 });
analysisSchema.index({ resumeId: 1 });
analysisSchema.index({ userId: 1, createdAt: -1 });

export const Analysis = mongoose.model('Analysis', analysisSchema);
