export interface IUser {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface IResume {
  _id: string;
  userId: string;
  title: string;
  fileUrl: string;
  fileType: 'pdf' | 'docx';
  originalFileName: string;
  status: 'UPLOADED' | 'PROCESSING' | 'READY' | 'FAILED';
  currentVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface IJob {
  _id: string;
  userId: string;
  title: string;
  company: string;
  description: string;
  requiredSkills: string[];
  preferredSkills: string[];
  experienceLevel: string;
  createdAt: string;
}

export interface IAnalysis {
  _id: string;
  userId: string;
  resumeId: string;
  jobId: string;
  atsScore: number;
  matchScore: number;
  categoryScores: {
    skills: number;
    projects: number;
    experience: number;
    keywords: number;
    structure: number;
  };
  matchedSkills: string[];
  missingSkills: string[];
  weakSkills: string[];
  recommendations: string[];
  createdAt: string;
}

export interface ICandidate {
  _id: string;
  userId: string;
  fileName: string;
  candidateName: string;
  candidateEmail: string;
  location: string;
  rating: number;
  status: 'Applied' | 'Screening' | 'Interview' | 'Offer';
  matchScore: number;
  experience: number;
  skills: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICandidateNote {
  _id: string;
  resumeId: string;
  userId: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// Error types for type-safe error handling
export interface APIError {
  response?: {
    data?: {
      error?: {
        message: string;
        code?: string;
      };
    };
    status?: number;
    statusText?: string;
  };
  message?: string;
  code?: string;
}

export class TypedAPIError extends Error {
  constructor(
    public message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'TypedAPIError';
  }
}

// Common error extraction helper
export const extractErrorMessage = (error: unknown): string => {
  if (error instanceof TypedAPIError) {
    return error.message;
  }
  if (error && typeof error === 'object') {
    const apiError = error as APIError;
    return (
      apiError.response?.data?.error?.message ||
      apiError.message ||
      'An unknown error occurred'
    );
  }
  return 'An unknown error occurred';
};
