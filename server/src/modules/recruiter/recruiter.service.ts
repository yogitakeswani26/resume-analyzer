import { Resume } from '../resumes/resume.model.js';
import { AppError } from '../../middleware/error.middleware.js';

export const recruiterService = {
  // 1. Get Candidate Database (with search & filters)
  async getCandidateDatabase(userId: string, filters: any) {
    try {
      const query: any = { userId };

      if (filters.search) {
        query.$or = [
          { userId, candidateName: { $regex: filters.search, $options: 'i' } },
          { userId, candidateEmail: { $regex: filters.search, $options: 'i' } },
          { userId, location: { $regex: filters.search, $options: 'i' } },
          { userId, content: { $regex: filters.search, $options: 'i' } },
        ];
      }

      if (filters.minScore) {
        const minScoreValue = parseInt(filters.minScore);
        if (isNaN(minScoreValue)) {
          throw new AppError('INVALID_INPUT', 'minScore must be a valid number', 400);
        }
        query.matchScore = { $gte: minScoreValue };
      }

      if (filters.status) {
        query.status = filters.status;
      }

      if (filters.minRating) {
        const minRatingValue = parseInt(filters.minRating);
        if (isNaN(minRatingValue)) {
          throw new AppError('INVALID_INPUT', 'minRating must be a valid number', 400);
        }
        query.rating = { $gte: minRatingValue };
      }

      if (filters.location) {
        query.location = { $regex: filters.location, $options: 'i' };
      }

      const resumes = await Resume.find(query)
        .sort({ createdAt: -1 })
        .select('fileName candidateName candidateEmail location rating status matchScore experience skills createdAt');

      return resumes;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError('FETCH_ERROR', `Failed to fetch candidate database: ${error?.message || 'Unknown error'}`, 500);
    }
  },

  // 2. Compare Resumes
  async compareResumes(userId: string, resumeIds: string[]) {
    try {
      if (resumeIds.length < 2 || resumeIds.length > 3) {
        throw new AppError('INVALID_INPUT', 'Please select 2-3 resumes to compare', 400);
      }

      const resumes = await Resume.find({
        _id: { $in: resumeIds },
        userId,
      });

      if (resumes.length !== resumeIds.length) {
        throw new AppError('NOT_FOUND', 'One or more resumes not found', 404);
      }

      return resumes.map(r => ({
        id: r._id,
        name: r.candidateName || 'Unknown',
        fileName: r.fileName,
        skills: r.skills || [],
        experience: r.experience || 0,
        rating: r.rating,
        matchScore: r.matchScore,
        notes: r.notes,
      }));
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError('COMPARE_ERROR', `Failed to compare resumes: ${error?.message || 'Unknown error'}`, 500);
    }
  },

  // 3. Match Resumes with Job Description
  async matchJobDescription(userId: string, jobDescription: string) {
    try {
      if (!jobDescription || jobDescription.trim().length < 20) {
        throw new AppError('INVALID_INPUT', 'Job description must be at least 20 characters', 400);
      }

      const resumes = await Resume.find({ userId });
      if (resumes.length === 0) {
        throw new AppError('NOT_FOUND', 'No candidates found in database', 404);
      }

      const jobSkills = extractSkills(jobDescription);

      if (jobSkills.length === 0) {
        throw new AppError('INVALID_INPUT', 'Could not extract any skills from job description. Please include technical skills like JavaScript, React, Python, etc.', 400);
      }

      const matches = resumes.map(resume => {
        const resumeSkills = resume.skills || [];

        // Case-insensitive skill matching with normalization
        const matched = resumeSkills.filter(s =>
          jobSkills.some(js =>
            js.toLowerCase().trim() === s.toLowerCase().trim() ||
            js.toLowerCase().includes(s.toLowerCase()) ||
            s.toLowerCase().includes(js.toLowerCase())
          )
        );

        // Calculate score with normalization
        const score = jobSkills.length > 0
          ? Math.round((matched.length / jobSkills.length) * 100)
          : 0;

        // Get missing skills
        const missingSkills = jobSkills.filter(jobSkill =>
          !resumeSkills.some(rSkill =>
            jobSkill.toLowerCase().trim() === rSkill.toLowerCase().trim() ||
            jobSkill.toLowerCase().includes(rSkill.toLowerCase()) ||
            rSkill.toLowerCase().includes(jobSkill.toLowerCase())
          )
        );

        return {
          resumeId: resume._id,
          candidateName: resume.candidateName || 'Unknown',
          fileName: resume.fileName,
          matchScore: Math.max(0, Math.min(100, score)), // Ensure score is 0-100
          matchedSkills: matched.length > 0 ? matched : [],
          missingSkills: missingSkills,
          totalSkillsRequired: jobSkills.length,
          experience: resume.experience || 0,
          rating: resume.rating || 0,
          location: resume.location || '',
          status: resume.status || 'Applied',
        };
      });

      // Bulk update matchScores in database (single operation)
      if (matches.length > 0) {
        const bulkOps = matches.map(match => ({
          updateOne: {
            filter: { _id: match.resumeId, userId: userId as any },
            update: { $set: { matchScore: match.matchScore } }
          }
        }));
        await Resume.bulkWrite(bulkOps as any);
      }

      // Sort by score descending, then by rating descending
      return matches.sort((a, b) => {
        if (b.matchScore !== a.matchScore) {
          return b.matchScore - a.matchScore;
        }
        return (b.rating || 0) - (a.rating || 0);
      });
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError('COMPARE_ERROR', `Failed to compare resumes: ${error?.message || 'Unknown error'}`, 500);
    }
  },

  // 4. Update Candidate Rating & Notes
  async updateCandidateInfo(userId: string, resumeId: string, data: any) {
    try {
      const resume = await Resume.findOne({ _id: resumeId, userId });
      if (!resume) {
        throw new AppError('NOT_FOUND', 'Resume not found', 404);
      }

      if (data.rating !== undefined) {
        if (data.rating < 0 || data.rating > 5) {
          throw new AppError('INVALID_INPUT', 'Rating must be between 0 and 5', 400);
        }
        resume.rating = data.rating;
      }

      if (data.notes !== undefined) {
        resume.notes = data.notes;
      }

      if (data.status !== undefined) {
        const validStatuses = ['Applied', 'Screening', 'Interview', 'Offer'];
        if (!validStatuses.includes(data.status)) {
          throw new AppError('INVALID_INPUT', 'Invalid status', 400);
        }
        resume.status = data.status;
      }

      if (data.candidateName !== undefined) {
        resume.candidateName = data.candidateName;
      }

      if (data.location !== undefined) {
        resume.location = data.location;
      }

      await resume.save();
      return resume;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError('UPDATE_ERROR', `Failed to update candidate info: ${error?.message || 'Unknown error'}`, 500);
    }
  },

  // 5. Get Analytics Dashboard with advanced metrics
  async getAnalytics(userId: string, filters: any = {}) {
    try {
      let query: any = { userId };

      // Date range filtering
      if (filters.startDate || filters.endDate) {
        query.createdAt = {};
        if (filters.startDate) {
          query.createdAt.$gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          const endDate = new Date(filters.endDate);
          endDate.setHours(23, 59, 59, 999);
          query.createdAt.$lte = endDate;
        }
      }

      // Status filter
      if (filters.status) {
        query.status = filters.status;
      }

      const resumes = await Resume.find(query);

      if (resumes.length === 0) {
        return {
          totalCandidates: 0,
          topSkills: [],
          averageScore: 0,
          statusBreakdown: { Applied: 0, Screening: 0, Interview: 0, Offer: 0 },
          experienceDistribution: [],
          ratingDistribution: [],
          topCandidates: [],
          atsScoresBySkill: [],
          conversionRates: { screening: 0, interview: 0, offer: 0 },
          timeToHire: { average: 0, median: 0, fastest: 0, slowest: 0 },
          skillDemand: [],
          skillDemandChart: [],
        };
      }

      // Total candidates
      const totalCandidates = resumes.length;

      // Top skills with average scores
      const skillMetrics: { [key: string]: { count: number; totalScore: number; scores: number[] } } = {};
      resumes.forEach(r => {
        (r.skills || []).forEach(skill => {
          if (!skillMetrics[skill]) {
            skillMetrics[skill] = { count: 0, totalScore: 0, scores: [] };
          }
          skillMetrics[skill].count++;
          skillMetrics[skill].totalScore += r.matchScore || 0;
          skillMetrics[skill].scores.push(r.matchScore || 0);
        });
      });

      const topSkills = Object.entries(skillMetrics)
        .map(([skill, metrics]) => ({
          skill,
          count: metrics.count,
          avgScore: Math.round(metrics.totalScore / metrics.count),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const atsScoresBySkill = Object.entries(skillMetrics)
        .map(([skill, metrics]) => ({
          skill,
          avgScore: Math.round(metrics.totalScore / metrics.count),
          minScore: Math.min(...metrics.scores),
          maxScore: Math.max(...metrics.scores),
          count: metrics.count,
        }))
        .sort((a, b) => b.avgScore - a.avgScore)
        .slice(0, 15);

      // Average score
      const averageScore = Math.round(
        resumes.reduce((sum, r) => sum + (r.matchScore || 0), 0) / resumes.length
      );

      // Status breakdown
      const statusBreakdown: { [key: string]: number } = {
        Applied: 0,
        Screening: 0,
        Interview: 0,
        Offer: 0,
      };
      resumes.forEach(r => {
        statusBreakdown[r.status] = (statusBreakdown[r.status] || 0) + 1;
      });

      // Top candidates ranking
      const topCandidates = resumes
        .map(r => ({
          id: r._id,
          name: r.candidateName || 'Unknown',
          email: r.candidateEmail,
          rating: r.rating || 0,
          matchScore: r.matchScore || 0,
          status: r.status,
          skills: (r.skills || []).slice(0, 3),
          experience: r.experience || 0,
        }))
        .sort((a, b) => {
          const scoreA = (a.matchScore * 0.5) + (a.rating * 10);
          const scoreB = (b.matchScore * 0.5) + (b.rating * 10);
          return scoreB - scoreA;
        })
        .slice(0, 10);

      // Hiring funnel conversion rates
      const applied = statusBreakdown.Applied || 1;
      const conversionRates = {
        screening: Math.round((statusBreakdown.Screening / applied) * 100) || 0,
        interview: Math.round((statusBreakdown.Interview / applied) * 100) || 0,
        offer: Math.round((statusBreakdown.Offer / applied) * 100) || 0,
      };

      // Time-to-hire metrics
      const timeDifferences = resumes
        .map(r => {
          if (!r.createdAt || !r.updatedAt) return null;
          const diffMs = (r.updatedAt as any).getTime() - (r.createdAt as any).getTime();
          return Math.ceil(diffMs / (1000 * 60 * 60 * 24)); // Convert to days
        })
        .filter((d): d is number => d !== null && d >= 0);

      const timeToHire = {
        average: timeDifferences.length > 0 ? Math.round(timeDifferences.reduce((a, b) => a + b) / timeDifferences.length) : 0,
        median: timeDifferences.length > 0 ? Math.round(timeDifferences.sort((a, b) => a - b)[Math.floor(timeDifferences.length / 2)]) : 0,
        fastest: timeDifferences.length > 0 ? Math.min(...timeDifferences) : 0,
        slowest: timeDifferences.length > 0 ? Math.max(...timeDifferences) : 0,
      };

      // Experience distribution
      const experienceMap: { [key: string]: number } = {
        '0-1': 0,
        '1-3': 0,
        '3-5': 0,
        '5-10': 0,
        '10+': 0,
      };
      resumes.forEach(r => {
        const exp = r.experience || 0;
        if (exp <= 1) experienceMap['0-1']++;
        else if (exp <= 3) experienceMap['1-3']++;
        else if (exp <= 5) experienceMap['3-5']++;
        else if (exp <= 10) experienceMap['5-10']++;
        else experienceMap['10+']++;
      });

      // Rating distribution
      const ratingMap: { [key: string]: number } = {
        '5': 0,
        '4': 0,
        '3': 0,
        '2': 0,
        '1': 0,
        '0': 0,
      };
      resumes.forEach(r => {
        const rating = Math.round(r.rating || 0);
        ratingMap[rating.toString()]++;
      });

      // Skill demand (enhanced with trend data)
      const skillDemand = Object.entries(skillMetrics)
        .map(([skill, metrics]) => ({
          skill,
          demand: metrics.count,
          avgQuality: Math.round(metrics.totalScore / metrics.count),
        }))
        .sort((a, b) => b.demand - a.demand)
        .slice(0, 8);

      // Group skills by demand level for chart
      const skillDemandChart = skillDemand.map(s => ({
        name: s.skill,
        candidates: s.demand,
        quality: s.avgQuality,
      }));

      return {
        totalCandidates,
        topSkills,
        averageScore,
        statusBreakdown,
        topCandidates,
        atsScoresBySkill,
        conversionRates,
        timeToHire,
        experienceDistribution: Object.entries(experienceMap).map(([range, count]) => ({
          range,
          count,
        })),
        ratingDistribution: Object.entries(ratingMap).map(([stars, count]) => ({
          stars: parseInt(stars),
          count,
        })),
        skillDemand,
        skillDemandChart,
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError('ANALYTICS_ERROR', `Failed to fetch analytics: ${error?.message || 'Unknown error'}`, 500);
    }
  },

  // 6. Get Candidate Pipeline
  async getCandidatePipeline(userId: string) {
    try {
      const resumes = await Resume.find({ userId }).sort({ createdAt: -1 });

      const pipeline: { [key: string]: any[] } = {
        Applied: [],
        Screening: [],
        Interview: [],
        Offer: [],
      };

      resumes.forEach(r => {
        const status = r.status || 'Applied';
        pipeline[status].push({
          id: r._id,
          name: r.candidateName || 'Unknown',
          fileName: r.fileName,
          rating: r.rating,
          matchScore: r.matchScore,
          notes: r.notes,
        });
      });

      return pipeline;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError('PIPELINE_ERROR', `Failed to fetch candidate pipeline: ${error?.message || 'Unknown error'}`, 500);
    }
  },

  // 7. Move Candidate to Different Status
  async moveCandidateStatus(userId: string, resumeId: string, newStatus: string) {
    try {
      const validStatuses = ['Applied', 'Screening', 'Interview', 'Offer'];
      if (!validStatuses.includes(newStatus)) {
        throw new AppError('INVALID_INPUT', 'Invalid status', 400);
      }

      const resume = await Resume.findOneAndUpdate(
        { _id: resumeId, userId },
        { status: newStatus, updatedAt: new Date() },
        { new: true }
      );

      if (!resume) {
        throw new AppError('NOT_FOUND', 'Resume not found', 404);
      }

      return resume;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError('MOVE_STATUS_ERROR', `Failed to move candidate status: ${error?.message || 'Unknown error'}`, 500);
    }
  },

  // 8. Bulk update status
  async bulkUpdateStatus(userId: string, resumeIds: string[], newStatus: string) {
    try {
      const validStatuses = ['Applied', 'Screening', 'Interview', 'Offer'];
      if (!validStatuses.includes(newStatus)) {
        throw new AppError('INVALID_INPUT', 'Invalid status', 400);
      }

      if (!Array.isArray(resumeIds) || resumeIds.length === 0) {
        throw new AppError('INVALID_INPUT', 'No resumes selected', 400);
      }

      // Security: Prevent unlimited bulk operations
      if (resumeIds.length > 100) {
        throw new AppError('INVALID_INPUT', 'Maximum 100 resumes can be updated at once', 400);
      }

      const result = await Resume.updateMany(
        { _id: { $in: resumeIds }, userId },
        { status: newStatus, updatedAt: new Date() }
      );

      return {
        matched: result.matchedCount,
        modified: result.modifiedCount,
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError('BULK_STATUS_ERROR', `Failed to update status in bulk: ${error?.message || 'Unknown error'}`, 500);
    }
  },

  // 9. Bulk add notes
  async bulkAddNotes(userId: string, resumeIds: string[], notes: string) {
    try {
      if (!Array.isArray(resumeIds) || resumeIds.length === 0) {
        throw new AppError('INVALID_INPUT', 'No resumes selected', 400);
      }

      // Security: Prevent unlimited bulk operations
      if (resumeIds.length > 100) {
        throw new AppError('INVALID_INPUT', 'Maximum 100 resumes can be updated at once', 400);
      }

      if (!notes || notes.trim().length === 0) {
        throw new AppError('INVALID_INPUT', 'Notes cannot be empty', 400);
      }

      const result = await Resume.updateMany(
        { _id: { $in: resumeIds }, userId },
        {
          $set: { notes: notes, updatedAt: new Date() }
        }
      );

      return {
        matched: result.matchedCount,
        modified: result.modifiedCount,
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError('BULK_NOTES_ERROR', `Failed to add notes in bulk: ${error?.message || 'Unknown error'}`, 500);
    }
  },

  // 10. Bulk send email (mock implementation)
  async bulkSendEmail(userId: string, resumeIds: string[], subject: string, message: string) {
    try {
      if (!Array.isArray(resumeIds) || resumeIds.length === 0) {
        throw new AppError('INVALID_INPUT', 'No resumes selected', 400);
      }

      // Security: Prevent unlimited bulk operations
      if (resumeIds.length > 100) {
        throw new AppError('INVALID_INPUT', 'Maximum 100 resumes can be emailed at once', 400);
      }

      const resumes = await Resume.find({ _id: { $in: resumeIds }, userId });

      if (resumes.length === 0) {
        throw new AppError('NOT_FOUND', 'No resumes found', 404);
      }

      // Mock email sending - in production, integrate with email service
      console.log(`📧 Mock Email - Sending to ${resumes.length} candidates`);
      console.log(`Subject: ${subject}`);
      console.log(`Message: ${message}`);

      // Validate email format for each recipient
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const recipients = resumes
        .filter(r => {
          if (!r.candidateEmail || !emailRegex.test(r.candidateEmail)) {
            console.warn(`Skipping invalid email: ${r.candidateEmail}`);
            return false;
          }
          return true;
        })
        .map(r => ({
          email: r.candidateEmail,
          name: r.candidateName,
        }));

      if (recipients.length === 0) {
        throw new AppError('INVALID_INPUT', 'No valid email addresses found among selected candidates', 400);
      }

      return {
        success: true,
        recipientCount: recipients.length,
        recipients: recipients,
        message: 'Emails queued for sending (mock)',
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError('BULK_EMAIL_ERROR', `Failed to send emails in bulk: ${error?.message || 'Unknown error'}`, 500);
    }
  },

  // 11. Get candidate details
  async getCandidateDetails(userId: string, resumeId: string) {
    try {
      const resume = await Resume.findOne({ _id: resumeId, userId });
      if (!resume) {
        throw new AppError('NOT_FOUND', 'Resume not found', 404);
      }
      return resume;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError('FETCH_DETAILS_ERROR', `Failed to fetch candidate details: ${error?.message || 'Unknown error'}`, 500);
    }
  },

  // 12. Add note to candidate
  async addNote(userId: string, resumeId: string, note: string) {
    try {
      if (!note || note.trim().length === 0) {
        throw new AppError('INVALID_INPUT', 'Note cannot be empty', 400);
      }

      // Fetch current resume to get existing notes
      const resume = await Resume.findOne({ _id: resumeId, userId });
      if (!resume) {
        throw new AppError('NOT_FOUND', 'Resume not found', 404);
      }

      // Append note with timestamp using atomic findOneAndUpdate
      const timestamp = new Date().toISOString();
      const newNote = `[${timestamp}] ${note}`;
      const existingNotes = resume.notes || '';
      const updatedNotes = existingNotes ? `${existingNotes}\n\n${newNote}` : newNote;

      const updatedResume = await Resume.findOneAndUpdate(
        { _id: resumeId, userId },
        {
          $set: {
            notes: updatedNotes,
            updatedAt: new Date()
          }
        },
        { new: true }
      );

      if (!updatedResume) {
        throw new AppError('NOT_FOUND', 'Resume not found or failed to update', 404);
      }

      return {
        resumeId: updatedResume._id,
        note: newNote,
        allNotes: updatedResume.notes,
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError('UPDATE_ERROR', `Failed to add note: ${error?.message || 'Unknown error'}`, 500);
    }
  },

  // 13. Get notes for candidate
  async getNotes(userId: string, resumeId: string) {
    try {
      const resume = await Resume.findOne({ _id: resumeId, userId });
      if (!resume) {
        throw new AppError('NOT_FOUND', 'Resume not found', 404);
      }

      const notes = resume.notes || '';
      // Parse notes by timestamp
      if (!notes) {
        return [];
      }

      const notesArray = notes.split('\n\n').map(n => ({
        note: n.trim(),
        timestamp: extractTimestamp(n),
      }));

      return notesArray;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError('FETCH_NOTES_ERROR', `Failed to fetch notes: ${error?.message || 'Unknown error'}`, 500);
    }
  },
};

function extractTimestamp(note: string): string {
  const match = note.match(/\[(\d{4}-\d{2}-\d{2}T[\d:]+\.\d+Z)\]/);
  return match ? match[1] : new Date().toISOString();
}

function extractSkills(text: string): string[] {
  // Comprehensive skill keywords database (200+ keywords) - DEDUPED & NORMALIZED
  let SKILL_KEYWORDS = [
    // ============================================================================
    // PROGRAMMING LANGUAGES (25+)
    // ============================================================================
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'C', 'Go', 'Rust', 'PHP', 'Swift', 'Kotlin',
    'Ruby', 'Scala', 'Groovy', 'R', 'MATLAB', 'Lua', 'Perl', 'Bash', 'Shell', 'Objective-C', 'Dart',
    'Elixir', 'Clojure', 'Haskell', 'VB.NET', 'PL/SQL', 'T-SQL',

    // ============================================================================
    // FRONTEND FRAMEWORKS & LIBRARIES (20+) - React.js normalized to React
    // ============================================================================
    'React', 'Vue', 'Vue.js', 'Angular', 'AngularJS', 'Svelte', 'Next.js', 'Nuxt', 'Gatsby',
    'Remix', 'Ember.js', 'Backbone.js', 'Preact', 'Solid.js', 'Qwik', 'Alpine.js', 'htmx',
    'jQuery', 'AJAX', 'Stimulus',

    // ============================================================================
    // BACKEND & SERVER FRAMEWORKS (20+)
    // ============================================================================
    'Node.js', 'Express', 'Express.js', 'Django', 'Flask', 'FastAPI', 'Spring', 'Spring Boot', 'ASP.NET',
    'ASP.NET Core', 'Laravel', 'Ruby on Rails', 'Rails', 'Phoenix', 'Akka', 'Play Framework',
    'NestJS', 'Hapi', 'Koa', 'Fastify', 'Loopback', 'Sails.js',

    // ============================================================================
    // DATABASES & DATA STORES (25+)
    // ============================================================================
    'MongoDB', 'PostgreSQL', 'MySQL', 'MariaDB', 'Redis', 'Elasticsearch', 'Cassandra',
    'DynamoDB', 'Firebase', 'Firestore', 'Oracle', 'SQLite', 'CouchDB', 'Neo4j', 'InfluxDB',
    'Memcached', 'RabbitMQ', 'Apache Kafka', 'Kafka', 'Solr', 'Amazon RDS', 'GraphQL',
    'TimescaleDB', 'Prisma', 'Sequelize', 'TypeORM', 'SQLAlchemy', 'Mongoose',

    // ============================================================================
    // CLOUD PLATFORMS & SERVICES (20+)
    // ============================================================================
    'AWS', 'Amazon Web Services', 'Azure', 'Google Cloud', 'GCP', 'Google Cloud Platform',
    'Heroku', 'DigitalOcean', 'Linode', 'Netlify', 'Vercel', 'Railway', 'Render', 'AWS Lambda',
    'AWS EC2', 'AWS S3', 'AWS RDS', 'AWS DynamoDB', 'Google App Engine', 'Azure App Service',
    'AWS SQS', 'AWS SNS', 'Google Pub/Sub',

    // ============================================================================
    // CONTAINERIZATION & ORCHESTRATION (15+)
    // ============================================================================
    'Docker', 'Kubernetes', 'K8s', 'Docker Compose', 'Docker Swarm', 'Podman', 'Helm',
    'OpenShift', 'Amazon ECS', 'AWS Fargate', 'Google GKE', 'Azure AKS', 'Minikube', 'Kind',

    // ============================================================================
    // CI/CD & AUTOMATION (15+)
    // ============================================================================
    'Jenkins', 'CircleCI', 'GitHub Actions', 'GitLab CI', 'Travis CI', 'Bitbucket Pipelines',
    'ArgoCD', 'Drone', 'Spinnaker', 'GitOps', 'Continuous Integration', 'Continuous Deployment',
    'CI/CD Pipeline', 'GitHub Workflows', 'Azure Pipelines', 'CodePipeline',

    // ============================================================================
    // INFRASTRUCTURE AS CODE & CONFIGURATION (12+)
    // ============================================================================
    'Terraform', 'Ansible', 'CloudFormation', 'Puppet', 'Chef', 'SaltStack', 'AWS CloudFormation',
    'Infrastructure as Code', 'IaC', 'Vagrant', 'Packer', 'Pulumi',

    // ============================================================================
    // REAL-TIME COMMUNICATION & MESSAGING (10+)
    // ============================================================================
    'Socket.io', 'Socket.IO', 'WebSocket', 'WebSockets', 'Pusher', 'Firebase Realtime',
    'SignalR', 'MQTT', 'Ably', 'Server-Sent Events', 'SSE', 'Message Queue',

    // ============================================================================
    // PAYMENT GATEWAYS & FINTECH (8+)
    // ============================================================================
    'Razorpay', 'Stripe', 'PayPal', 'Square', 'Braintree', 'Authorize.net', 'Paddle',
    'Payment Gateway', 'Payment Processing',

    // ============================================================================
    // TESTING & QA (20+)
    // ============================================================================
    'Jest', 'Mocha', 'Chai', 'Pytest', 'JUnit', 'TestNG', 'Selenium', 'Cypress', 'Playwright',
    'Testing', 'Unit Testing', 'Integration Testing', 'E2E Testing', 'End-to-End Testing',
    'TDD', 'BDD', 'Behavior-Driven Development', 'Test Automation', 'Vitest', 'Jasmine',
    'Puppeteer', 'NightmareJS', 'WebdriverIO',

    // ============================================================================
    // DATA & ANALYTICS (18+)
    // ============================================================================
    'Data Science', 'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Keras',
    'Pandas', 'NumPy', 'Scikit-learn', 'Big Data', 'Hadoop', 'Apache Spark', 'Spark',
    'Tableau', 'Power BI', 'Looker', 'Data Analytics', 'Business Intelligence', 'ETL',

    // ============================================================================
    // VERSION CONTROL & COLLABORATION (8+)
    // ============================================================================
    'Git', 'GitHub', 'GitLab', 'Bitbucket', 'SVN', 'Mercurial', 'Git Flow', 'GitHub Enterprise',

    // ============================================================================
    // BUILD TOOLS & BUNDLERS (15+)
    // ============================================================================
    'Webpack', 'Vite', 'Babel', 'Parcel', 'Rollup', 'Esbuild', 'Gulp', 'Grunt', 'Nx',
    'Yarn', 'npm', 'pnpm', 'Maven', 'Gradle', 'Cargo',

    // ============================================================================
    // STYLING & CSS (12+)
    // ============================================================================
    'Tailwind CSS', 'Bootstrap', 'Material UI', 'Material Design', 'Ant Design', 'Chakra UI',
    'CSS Grid', 'Flexbox', 'SASS', 'SCSS', 'PostCSS', 'Styled Components', 'Emotion',

    // ============================================================================
    // STATE MANAGEMENT (12+)
    // ============================================================================
    'Redux', 'Redux Saga', 'Redux Thunk', 'MobX', 'Zustand', 'Recoil', 'Jotai', 'XState',
    'Vuex', 'Pinia', 'Context API', 'Apollo Client',

    // ============================================================================
    // API & PROTOCOL TECHNOLOGIES (15+) - DEDUPE: OAuth only once
    // ============================================================================
    'REST', 'REST API', 'RESTful', 'GraphQL', 'SOAP', 'gRPC', 'tRPC', 'OpenAPI', 'Swagger',
    'OAuth', 'OAuth2', 'OpenID Connect', 'JWT', 'JSON Web Token', 'CORS', 'HAL',

    // ============================================================================
    // CONTENT MANAGEMENT & HEADLESS CMS (10+)
    // ============================================================================
    'Contentful', 'Strapi', 'Sanity', 'Prismic', 'Directus', 'Ghost', 'Headless CMS',
    'JAMstack', 'Static Site Generation', 'SSG', 'Server-Side Rendering', 'SSR',

    // ============================================================================
    // AUTHENTICATION & SECURITY (12+)
    // ============================================================================
    'Auth0', 'Firebase Auth', 'Okta', 'LDAP', 'SAML', 'Session Management',
    'Password Hashing', 'Bcrypt', 'Argon2', 'SSL', 'TLS', 'HTTPS',

    // ============================================================================
    // LOGGING & MONITORING (12+) - DEDUPE: Elasticsearch only once
    // ============================================================================
    'ELK Stack', 'Logstash', 'Kibana', 'Splunk', 'Datadog', 'New Relic',
    'Prometheus', 'Grafana', 'CloudWatch', 'Sentry', 'Log Management',

    // ============================================================================
    // OPERATING SYSTEMS (8+)
    // ============================================================================
    'Linux', 'Ubuntu', 'CentOS', 'RHEL', 'Debian', 'Windows', 'macOS', 'Alpine',

    // ============================================================================
    // COLLABORATION & PROJECT MANAGEMENT TOOLS (10+)
    // ============================================================================
    'JIRA', 'Confluence', 'Slack', 'Microsoft Teams', 'Asana', 'Monday.com', 'Trello',
    'Notion', 'GitHub Issues', 'Linear',

    // ============================================================================
    // DESIGN & PROTOTYPING TOOLS (8+)
    // ============================================================================
    'Figma', 'Adobe XD', 'Sketch', 'Framer', 'Webflow', 'Invision', 'Prototyping', 'UI Design',

    // ============================================================================
    // API TESTING & DEVELOPMENT (8+)
    // ============================================================================
    'Postman', 'Insomnia', 'REST Client', 'Thunder Client', 'Swagger UI', 'API Documentation',

    // ============================================================================
    // MOBILE DEVELOPMENT (12+)
    // ============================================================================
    'React Native', 'Flutter', 'iOS', 'Android', 'Xamarin', 'Ionic',
    'Cordova', 'NativeScript', 'Mobile Development', 'Cross-platform',

    // ============================================================================
    // SEARCH & INDEXING (8+)
    // ============================================================================
    'Solr', 'Algolia', 'MeiliSearch', 'Whoosh', 'Lunr', 'Full-Text Search',

    // ============================================================================
    // MESSAGE QUEUING & EVENT STREAMING (10+)
    // ============================================================================
    'Apache Kafka', 'RabbitMQ', 'AWS SQS', 'Google Pub/Sub', 'Apache ActiveMQ',
    'Message Queue', 'Event Streaming', 'Pub/Sub',

    // ============================================================================
    // SERVERLESS & FUNCTIONS (10+)
    // ============================================================================
    'Google Cloud Functions', 'Azure Functions', 'Serverless Framework',
    'Serverless', 'Function as a Service', 'FaaS', 'Edge Computing', 'Edge Functions',

    // ============================================================================
    // METHODOLOGIES & PRACTICES (15+)
    // ============================================================================
    'Agile', 'Scrum', 'Kanban', 'Extreme Programming', 'XP', 'System Design', 'Microservices',
    'Monolithic', 'API Design', 'Software Architecture', 'Clean Architecture', 'SOLID Principles',
    'Design Patterns', 'DDD', 'Domain-Driven Design',

    // ============================================================================
    // GENERAL SKILLS & CONCEPTS (15+)
    // ============================================================================
    'DevOps', 'SRE', 'Site Reliability Engineer', 'Web Development', 'Full Stack Development',
    'Frontend Development', 'Backend Development', 'Cloud Architecture', 'Data Engineering',
    'Database Design', 'Performance Optimization', 'Scalability', 'High Availability', 'Reliability',

    // ============================================================================
    // YEARS OF EXPERIENCE KEYWORDS (10+) - Keep minimal to avoid false matches
    // ============================================================================
    'years of experience', 'years of', 'years experienced',
  ];

  // CRITICAL FIX 1: Deduplicate keywords
  SKILL_KEYWORDS = Array.from(new Set(SKILL_KEYWORDS));

  // CRITICAL FIX 2: Sort by length descending for longest-match-first strategy
  // This prevents "Java" matching in "JavaScript" and "C" matching in "C++" or "C#"
  SKILL_KEYWORDS.sort((a, b) => b.length - a.length);

  const foundSkills = new Set<string>();
  const lowerText = text.toLowerCase();

  // CRITICAL FIX 3: Use word-boundary regex with proper character escaping
  // Escape special regex characters: . ^ $ * + ? { } [ ] \ | ( )
  SKILL_KEYWORDS.forEach(skill => {
    const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Use \b for word boundaries: \bskill\b matches whole words only
    // This prevents: "Java" matching "JavaScript", "C" matching "React"/"Cassandra"
    const regex = new RegExp(`\\b${escapedSkill}\\b`, 'gi');
    if (regex.test(lowerText)) {
      foundSkills.add(skill);
    }
  });

  return Array.from(foundSkills).sort();
}
