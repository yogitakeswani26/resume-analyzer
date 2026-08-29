import { Analysis } from './analysis.model.js';
import { Resume } from '../resumes/resume.model.js';
import { AppError } from '../../utils/errors.js';
import { performAdvancedAnalysis } from './analysis.advanced.js';
import { analyzeResumeWithAI, generateEnhancedResume } from './analysis.ai.js';
import { generateRecommendations, formatRecommendationsAsText } from './analysis.recommendations.js';
import { performSectionAnalysis } from './analysis.sections.js';

const SKILL_KEYWORDS = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'PHP', 'Swift', 'Kotlin',
  'React', 'Vue', 'Angular', 'Next.js', 'Svelte', 'Ember', 'Gatsby', 'Flutter', 'React Native',
  'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'FastAPI', 'Ruby on Rails', 'Nest.js',
  'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch', 'Firebase', 'DynamoDB', 'Cassandra',
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'Ansible', 'CloudFormation',
  'Git', 'GitHub', 'GitLab', 'Bitbucket', 'SVN', 'Mercurial',
  'HTML', 'CSS', 'SASS', 'Tailwind', 'Bootstrap', 'Material UI', 'Styled Components',
  'REST API', 'GraphQL', 'WebSocket', 'gRPC', 'SOAP', 'tRPC',
  'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Keras', 'Scikit-learn', 'XGBoost',
  'Data Science', 'Pandas', 'NumPy', 'R', 'Tableau', 'Power BI', 'Looker',
  'DevOps', 'CI/CD', 'Jenkins', 'GitLab CI', 'GitHub Actions', 'CircleCI', 'Travis CI',
  'Linux', 'Unix', 'Windows', 'macOS', 'Shell', 'Bash', 'Zsh',
  'Agile', 'Scrum', 'Kanban', 'Jira', 'Confluence', 'Monday.com',
  'Testing', 'Jest', 'Mocha', 'Pytest', 'JUnit', 'Selenium', 'Cypress', 'Vitest',
  'Security', 'OAuth', 'JWT', 'SSL/TLS', 'Cryptography', 'HTTPS',
  'Microservices', 'Serverless', 'Lambda', 'Cloud Functions', 'Vercel', 'Netlify',
  'Webpack', 'Babel', 'Gulp', 'Grunt', 'Vite', 'Rollup',
  'Figma', 'Sketch', 'Adobe XD', 'Wireframing', 'UI/UX', 'Design Systems',
  'API Design', 'System Design', 'Architecture', 'Database Design', 'Software Patterns',
];

export const analysisService = {
  async analyzeResume(userId: string, resumeId: string, jobDescription: string) {
    try {
      const resume = await Resume.findOne({ _id: resumeId, userId });
      if (!resume) {
        throw new AppError('Resume not found', 404);
      }

      // Use advanced analysis
      const advancedAnalysis = performAdvancedAnalysis(resume.content, jobDescription);

      // Use section-by-section analysis
      const sectionAnalysis = performSectionAnalysis(resume.content);

      // Extract skills from both resume and job
      const resumeSkills = extractAllSkills(resume.content);
      const jobSkills = extractAllSkills(jobDescription);

      const matchedSkills = findMatchedSkills(resumeSkills, jobSkills);
      const missingSkills = findMissingSkills(jobSkills, matchedSkills);
      const matchScore = advancedAnalysis.overallScore;

      const analysis = await Analysis.create({
        userId,
        resumeId,
        jobDescription,
        matchScore,
        matchedSkills,
        missingSkills,
        suggestions: advancedAnalysis.prioritizedSuggestions,
        resumeHealth: advancedAnalysis.healthScore,
        atsScore: advancedAnalysis.atsScore,
        summary: `Your resume scores ${matchScore}% overall with an ATS score of ${advancedAnalysis.atsScore}%. ${matchedSkills.length} skills match the job, but you're missing ${missingSkills.length} key skills.`,
        sectionAnalysis: sectionAnalysis,
      });

      return analysis;
    } catch (error: any) {
      console.error('Analysis error:', error);
      throw error;
    }
  },

  async getUserAnalyses(userId: string) {
    try {
      const analyses = await Analysis.find({ userId })
        .populate('resumeId')
        .sort({ createdAt: -1 });
      return analyses;
    } catch (error) {
      throw new AppError('Failed to fetch analyses', 500);
    }
  },

  async getAnalysis(analysisId: string, userId: string) {
    try {
      const analysis = await Analysis.findOne({ _id: analysisId, userId });
      if (!analysis) {
        throw new AppError('Analysis not found', 404);
      }
      return analysis;
    } catch (error) {
      throw error;
    }
  },

  async getResumeHealth(userId: string, resumeId: string) {
    try {
      const resume = await Resume.findOne({ _id: resumeId, userId });
      if (!resume) {
        throw new AppError('Resume not found', 404);
      }

      const content = resume.content as string;
      if (!content || typeof content !== 'string') {
        throw new AppError('Resume content is not available', 400);
      }

      const skills = extractAllSkills(content);
      const advancedAnalysis = performAdvancedAnalysis(content, '');
      const sectionAnalysis = performSectionAnalysis(content);
      const health = advancedAnalysis.healthScore;
      const recommendations = generateHealthRecommendations(content, skills);
      const atsScore = advancedAnalysis.atsScore;

      return {
        score: health,
        atsScore,
        recommendations,
        skillCount: skills.length,
        experienceYears: extractExperienceYears(content),
        keywordDensity: calculateKeywordDensity(content),
        sectionScores: sectionAnalysis.sectionScores,
        overallSectionScore: sectionAnalysis.overallSectionScore,
        completeSections: sectionAnalysis.completeSections,
        totalSections: sectionAnalysis.totalSections,
      };
    } catch (error) {
      throw error;
    }
  },

  async analyzeWithAI(userId: string, resumeId: string) {
    try {
      const resume = await Resume.findOne({ _id: resumeId, userId });
      if (!resume) {
        throw new AppError('Resume not found', 404);
      }

      if (!resume.content || resume.content.trim().length < 50) {
        throw new AppError('Resume content is too short for AI analysis', 400);
      }

      console.log('Starting AI analysis for resume:', resumeId);
      const aiAnalysis = await analyzeResumeWithAI(resume.content);
      console.log('AI analysis completed successfully');

      return aiAnalysis;
    } catch (error: any) {
      console.error('AI Analysis failed:', {
        message: error.message,
        code: error.code,
        status: error.statusCode,
      });

      if (error.statusCode) {
        throw error;
      }

      if (error.message?.includes('API key')) {
        throw new AppError('AI service not configured. Please contact support.', 503);
      }

      throw new AppError(error.message || 'Failed to perform AI analysis. Please try again.', 500);
    }
  },

  async generateEnhancedResume(userId: string, resumeId: string) {
    try {
      const resume = await Resume.findOne({ _id: resumeId, userId });
      if (!resume) {
        throw new AppError('Resume not found', 404);
      }

      if (!resume.content || resume.content.trim().length < 50) {
        throw new AppError('Resume content is too short for enhancement', 400);
      }

      console.log('Starting enhanced resume generation for:', resumeId);
      const enhancedContent = await generateEnhancedResume(resume.content);
      console.log('Enhanced resume generated successfully');

      return {
        original: resume.content,
        enhanced: enhancedContent,
        fileName: `Enhanced_${resume.fileName}`,
      };
    } catch (error: any) {
      console.error('Enhanced resume generation failed:', {
        message: error.message,
        code: error.code,
      });

      if (error.statusCode) {
        throw error;
      }

      throw new AppError(error.message || 'Failed to generate enhanced resume. Please try again.', 500);
    }
  },

  async getRecommendations(userId: string, resumeId: string) {
    try {
      const resume = await Resume.findOne({ _id: resumeId, userId });
      if (!resume) {
        throw new AppError('Resume not found', 404);
      }

      if (!resume.content || resume.content.trim().length < 50) {
        throw new AppError('Resume content is too short for analysis', 400);
      }

      console.log('Generating recommendations for resume:', resumeId);
      const recommendations = generateRecommendations(resume.content);
      console.log('Recommendations generated successfully');

      return {
        resumeId,
        recommendations,
        formattedText: formatRecommendationsAsText(recommendations),
        generatedAt: new Date(),
      };
    } catch (error: any) {
      console.error('Recommendations generation failed:', {
        message: error.message,
        code: error.code,
      });

      if (error.statusCode) {
        throw error;
      }

      throw new AppError(error.message || 'Failed to generate recommendations. Please try again.', 500);
    }
  },

  async getSectionAnalysis(userId: string, resumeId: string) {
    try {
      const resume = await Resume.findOne({ _id: resumeId, userId });
      if (!resume) {
        throw new AppError('Resume not found', 404);
      }

      const content = resume.content as string;
      if (!content || typeof content !== 'string' || content.trim().length < 50) {
        throw new AppError('Resume content is too short for section analysis', 400);
      }

      console.log('Generating section analysis for resume:', resumeId);
      const sectionAnalysis = performSectionAnalysis(content);
      console.log('Section analysis generated successfully');

      return {
        resumeId,
        ...sectionAnalysis,
        generatedAt: new Date(),
      };
    } catch (error: any) {
      console.error('Section analysis failed:', {
        message: error.message,
        code: error.code,
      });

      if (error.statusCode) {
        throw error;
      }

      throw new AppError(error.message || 'Failed to generate section analysis. Please try again.', 500);
    }
  },
};

function extractAllSkills(text: string): string[] {
  if (!text) return [];
  const foundSkills = new Set<string>();
  const lowerText = text.toLowerCase();

  SKILL_KEYWORDS.forEach((skill) => {
    if (lowerText.includes(skill.toLowerCase())) {
      foundSkills.add(skill);
    }
  });

  return Array.from(foundSkills);
}

function findMatchedSkills(resumeSkills: string[], jobSkills: string[]): string[] {
  return resumeSkills.filter((skill) =>
    jobSkills.some((jobSkill) => skill.toLowerCase() === jobSkill.toLowerCase())
  );
}

function findMissingSkills(jobSkills: string[], matchedSkills: string[]): string[] {
  return jobSkills.filter((skill) => !matchedSkills.includes(skill));
}

function calculateKeywordDensity(text: string): number {
  if (!text) return 0;
  const skills = extractAllSkills(text);
  const skillMatches = skills.filter((s) => text.toLowerCase().includes(s.toLowerCase())).length;
  const totalWords = text.split(/\s+/).length;
  return Math.round((skillMatches / totalWords) * 100 * 10) / 10;
}

function extractExperienceYears(text: string): number {
  if (!text) return 0;
  const yearMatch = text.match(/(\d+)\s*years?/gi);
  if (yearMatch) {
    const years = yearMatch.map((m) => parseInt(m));
    return Math.max(...years);
  }
  return 0;
}

function generateHealthRecommendations(content: string, skills: string[]): string[] {
  const recommendations = [];

  if (!content || content.length < 300) {
    recommendations.push('Expand your resume with more detailed descriptions');
  }

  if (!content.toLowerCase().includes('experience')) {
    recommendations.push('Add a dedicated experience section with past roles and achievements');
  }

  if (!content.toLowerCase().includes('education')) {
    recommendations.push('Include your educational background (degree, institution, graduation year)');
  }

  if (skills.length === 0) {
    recommendations.push('Add a technical skills section highlighting your expertise');
  } else if (skills.length < 5) {
    recommendations.push('Add more relevant technical skills to strengthen your profile');
  }

  if (!content.toLowerCase().includes('project')) {
    recommendations.push('Showcase projects with impact and technologies used');
  }

  if (!content.match(/\d+%|increased|improved|achieved/gi)) {
    recommendations.push('Quantify your achievements with metrics and impact numbers');
  }

  if (!content.toLowerCase().includes('certification') && !content.toLowerCase().includes('award')) {
    recommendations.push('Add relevant certifications and awards if applicable');
  }

  return recommendations.length > 0
    ? recommendations
    : ['Your resume is well-structured! Focus on adding impact metrics and new accomplishments.'];
}
