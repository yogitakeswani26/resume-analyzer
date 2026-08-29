export interface IUser {
  _id?: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'student' | 'admin';
  phone?: string;
  location?: string;
  bio?: string;
  expertise?: string;
  passwordResetToken?: string | null;
  passwordResetExpiresAt?: Date | null;
  invalidatedRefreshTokens?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IResume {
  _id?: string;
  userId: string;
  title: string;
  fileUrl: string;
  fileType: 'pdf' | 'docx';
  originalFileName: string;
  rawText: string;
  structuredProfile?: IStructuredResume;
  currentVersion: number;
  status: 'UPLOADED' | 'PROCESSING' | 'READY' | 'FAILED';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IStructuredResume {
  summary: string;
  skills: string[];
  education: IEducation[];
  projects: IProject[];
  experience: IExperience[];
  certifications: string[];
  achievements: string[];
  links: string[];
}

export interface IEducation {
  degree: string;
  institution: string;
  graduationYear: number;
}

export interface IProject {
  title: string;
  description: string;
  technologies: string[];
  achievements: string[];
}

export interface IExperience {
  title: string;
  company: string;
  duration: string;
  achievements: string[];
}

export interface IJob {
  _id?: string;
  userId: string;
  title: string;
  company: string;
  description: string;
  requiredSkills: string[];
  preferredSkills: string[];
  experienceLevel: string;
  createdAt?: Date;
}

export interface IAnalysis {
  _id?: string;
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
  createdAt?: Date;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    accessToken: string;
    refreshToken: string;
    user: Partial<IUser>;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  timestamp?: Date;
}
