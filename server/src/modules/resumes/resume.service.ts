import { Resume } from './resume.model.js';
import { AppError } from '../../utils/errors.js';

export const resumeService = {
  async uploadResume(
    userId: string,
    fileName: string,
    fileUrl: string,
    content: string
  ) {
    try {
      if (!userId || !fileName || !content) {
        throw new AppError('Missing required fields', 400);
      }

      const resume = await Resume.create({
        userId,
        fileName,
        fileUrl: fileUrl || `resume_${Date.now()}`,
        content,
        skills: extractSkills(content),
        candidateName: extractCandidateName(content, fileName),
        candidateEmail: extractEmail(content),
        location: extractLocation(content),
        experience: extractExperienceYears(content),
      });
      return resume;
    } catch (error: any) {
      console.error('Resume upload error:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(error.message || 'Failed to upload resume', 500);
    }
  },

  async getUserResumes(userId: string) {
    try {
      const resumes = await Resume.find({ userId }).sort({ createdAt: -1 });
      return resumes;
    } catch (error) {
      throw new AppError('Failed to fetch resumes', 500);
    }
  },

  async getResume(resumeId: string, userId: string) {
    try {
      const resume = await Resume.findOne({ _id: resumeId, userId });
      if (!resume) {
        throw new AppError('Resume not found', 404);
      }
      return resume;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch resume', 500);
    }
  },

  async deleteResume(resumeId: string, userId: string) {
    try {
      const resume = await Resume.findOneAndDelete({ _id: resumeId, userId });
      if (!resume) {
        throw new AppError('Resume not found', 404);
      }
      return resume;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to delete resume', 500);
    }
  },

  async deduplicateResumes() {
    try {
      const resumes = await Resume.find().sort({ createdAt: -1 });
      const seenEmails = new Set<string>();
      let deleted = 0;

      for (const resume of resumes) {
        const email = resume.candidateEmail || resume.fileName;

        if (seenEmails.has(email)) {
          // Duplicate found - delete it
          await Resume.deleteOne({ _id: resume._id });
          deleted++;
          console.log(`[Dedup] Deleted duplicate: ${email} (${resume.fileName})`);
        } else {
          seenEmails.add(email);
          console.log(`[Dedup] Kept: ${email} (${resume.fileName})`);
        }
      }

      console.log(`[Dedup Complete] Deleted ${deleted} duplicate resumes`);
      return { deleted, total: resumes.length, remaining: resumes.length - deleted };
    } catch (error: any) {
      console.error('Error deduplicating resumes:', error);
      throw error;
    }
  },

  async updateExistingResumes() {
    try {
      const resumes = await Resume.find();
      let updated = 0;

      for (const resume of resumes) {
        const updateData: any = {};

        // Use content if available, fall back to filename
        const content = resume.content || '';

        // Extract name - pass fileName as parameter for filename-based extraction
        let extractedName = extractCandidateName(content, resume.fileName);

        // Update name if missing or "Unknown"
        if (!resume.candidateName || resume.candidateName === 'Unknown') {
          updateData.candidateName = extractedName;
        }

        // Extract email if missing (emails only in content, not filename)
        const extractedEmail = extractEmail(content);
        if (!resume.candidateEmail && extractedEmail) {
          updateData.candidateEmail = extractedEmail;
        }

        // Extract location if missing
        const extractedLocation = extractLocation(content);
        if (!resume.location && extractedLocation) {
          updateData.location = extractedLocation;
        }

        // Extract experience if missing or 0
        if (!resume.experience || resume.experience === 0) {
          const extractedExp = extractExperienceYears(content);
          if (extractedExp > 0) {
            updateData.experience = extractedExp;
          }
        }

        // Always re-extract skills to upgrade from old 20 keywords to 200+
        const extractedSkills = extractSkills(content);
        if (extractedSkills.length > 0) {
          updateData.skills = extractedSkills;
        }

        if (Object.keys(updateData).length > 0) {
          await Resume.updateOne({ _id: resume._id }, updateData);
          updated++;
          console.log(`[Migration] Updated resume ${resume.fileName}: name=${extractedName}, skills=${extractedSkills.length}`);
        }
      }

      console.log(`[Migration Complete] Updated ${updated} resumes with extracted data`);
      return { updated };
    } catch (error: any) {
      console.error('Error updating existing resumes:', error);
      throw error;
    }
  },
};

function extractCandidateName(content: string, fileName?: string): string {
  if (!content || content.trim().length === 0) {
    return 'Unknown';
  }

  // TRY 1: Extract from filename first (most reliable)
  if (fileName) {
    // Remove file extensions
    let filename = fileName.replace(/\.[a-z]+$/i, '').trim();

    // Remove common resume/cv suffixes FIRST (before splitting)
    filename = filename
      .replace(/[-_]?\s*(resume|cv|curriculum\s+vitae|cv_|_cv).*$/i, '')
      .replace(/\s*\(\d+\)\s*$/i, '') // Remove "(1)", "(2)", etc
      .trim();

    // Skip if filename still contains "resume" keyword (e.g., "Resume June")
    if (filename.toLowerCase().includes('resume') ||
        filename.toLowerCase().includes('cv') ||
        filename.length < 2) {
      // Fall through to content extraction
    } else {
      // Handle CamelCase: "YuvikaSingodia" → "Yuvika Singodia"
      filename = filename.replace(/([a-z])([A-Z])/g, '$1 $2');

      // Replace remaining dashes/underscores with spaces
      filename = filename.replace(/[-_]/g, ' ').trim();

      // Clean up multiple spaces
      filename = filename.replace(/\s+/g, ' ').trim();

      // Split into words
      const words = filename.split(/\s+/).filter(w => w.length > 0);

      // Validate: 1-5 words, mostly letters, each word 2+ chars
      if (words.length >= 1 && words.length <= 5) {
        const validWords = words.filter(w => /^[a-zA-Z]+$/.test(w) && w.length >= 2);
        if (validWords.length === words.length) {
          // Proper case: capitalize each word
          const result = words
            .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(' ');
          if (result && result !== 'Unknown') {
            return result;
          }
        }
      }
    }
  }

  // TRY 2: Look at content lines for potential name
  const lines = content.split('\n').filter(line => line.trim().length > 0);

  // Look at first 5 lines for potential name
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i].trim();

    // Skip common header words
    if (line.toLowerCase().includes('resume') ||
        line.toLowerCase().includes('cv') ||
        line.toLowerCase().includes('curriculum') ||
        line.toLowerCase().includes('@') ||
        line.length > 100 ||
        line.length < 2) {
      continue;
    }

    // If line has 1-5 words and mostly capitalized, likely a name
    const words = line.split(/\s+/);
    if (words.length >= 1 && words.length <= 5) {
      const capitalizedWords = words.filter(w => /^[A-Z]/.test(w));
      // Accept if at least 50% words are capitalized and has 2+ words (or 1 word with 3+ chars)
      if (capitalizedWords.length >= Math.ceil(words.length * 0.5)) {
        if (words.length >= 2 || (words.length === 1 && words[0].length >= 3)) {
          return line;
        }
      }
    }
  }

  return 'Unknown';
}

function extractEmail(content: string): string {
  const emailRegex = /[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = content.match(emailRegex);
  return emails ? emails[0] : '';
}

function extractLocation(content: string): string {
  // Comprehensive list of 50+ cities (Indian + Global)
  const locationKeywords = [
    // India (25+ cities)
    'India', 'Delhi', 'New Delhi', 'Mumbai', 'Bangalore', 'Bengaluru', 'Hyderabad',
    'Pune', 'Chennai', 'Kolkata', 'Gurgaon', 'Noida', 'Ahmedabad', 'Indore',
    'Jaipur', 'Chandigarh', 'Coimbatore', 'Thiruvananthapuram', 'Kochi',
    'Visakhapatnam', 'Vadodara', 'Surat', 'Bhopal', 'Lucknow', 'Nagpur', 'Patna',

    // USA (15+ cities)
    'USA', 'United States', 'New York', 'San Francisco', 'Los Angeles', 'Seattle',
    'Austin', 'Boston', 'Chicago', 'Denver', 'Miami', 'Phoenix', 'Portland',
    'Washington DC', 'Dallas', 'Atlanta',

    // Global (15+ cities/countries)
    'UK', 'London', 'Manchester', 'Canada', 'Toronto', 'Vancouver', 'Australia',
    'Sydney', 'Melbourne', 'Singapore', 'Dubai', 'Hong Kong', 'Tokyo', 'Berlin',
    'Paris', 'Amsterdam',
  ];

  // Use word boundaries to avoid matching name parts
  for (const location of locationKeywords) {
    const escapedLocation = location.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedLocation}\\b`, 'i');
    if (regex.test(content)) {
      return location;
    }
  }

  // Try to extract from explicit patterns like "Based in City" or "Location: City"
  const explicitPatterns = [
    /based\s+in\s+([A-Za-z\s]+?)(?:[,.\n]|$)/i,
    /location\s*:\s*([A-Za-z\s]+?)(?:[,.\n]|$)/i,
    /address\s*:\s*([A-Za-z\s]+?)(?:[,.\n]|$)/i,
    /city\s*:\s*([A-Za-z\s]+?)(?:[,.\n]|$)/i,
  ];

  for (const pattern of explicitPatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      const potential = match[1].trim();
      // Only return if 2-3 words (avoid matching full paragraphs)
      const wordCount = potential.split(/\s+/).length;
      if (wordCount >= 1 && wordCount <= 3 && potential.length < 50) {
        return potential;
      }
    }
  }

  return '';
}

function extractExperienceYears(content: string): number {
  // CRITICAL FIX: Extract ONLY from PROFESSIONAL EXPERIENCE section
  // Don't use education dates (2023-2027) which would give false 4 years!

  const workSection = content.match(
    /(?:professional\s+experience|work\s+experience|employment)([\s\S]*?)(?=education|technical\s+skills|skills|projects?|achievements?|\Z)/i
  );

  if (!workSection || !workSection[1]) {
    return 0; // No work experience section found
  }

  const workContent = workSection[1];

  // Pattern 1: "Month Year – Month Year" or "Month YYYY – Month YYYY" (e.g., "June 2025 – July 2025")
  // Calculate exact months/years from date ranges
  const dateRangePattern = /(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})\s+[–-]\s+(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Present)\s+(\d{4}|Present)/gi;

  let totalMonths = 0;
  let match;
  const dateRegex = new RegExp(dateRangePattern.source, 'gi');

  while ((match = dateRegex.exec(workContent)) !== null) {
    const startYear = parseInt(match[1]);
    const endYear = match[2] === 'Present' ? new Date().getFullYear() : parseInt(match[2]);

    // Calculate months difference
    const yearDiff = endYear - startYear;
    // Rough estimate: each year ~12 months
    totalMonths += yearDiff * 12;
  }

  // Convert months to years (round down)
  if (totalMonths > 0) {
    return Math.floor(totalMonths / 12) || 0; // Return 0 if less than 1 year
  }

  // Pattern 2: If no detailed dates, look for year ranges only in work section
  const yearMatches = workContent.match(/\b(19|20)\d{2}\b/g);
  if (yearMatches && yearMatches.length >= 2) {
    const years = yearMatches.map(y => parseInt(y));
    const maxYear = Math.max(...years);
    const minYear = Math.min(...years);
    const difference = maxYear - minYear;

    // Only return if difference is reasonable (0-50 years, and NOT picking up education dates)
    if (difference >= 0 && difference < 50) {
      return difference;
    }
  }

  return 0; // No valid experience found
}

function extractSkills(content: string): string[] {
  // Comprehensive skill keywords database (200+) - USES WORD BOUNDARIES FOR ACCURACY
  let SKILL_KEYWORDS = [
    // Programming Languages (25+)
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'C', 'Go', 'Rust', 'PHP', 'Swift', 'Kotlin',
    'Ruby', 'Scala', 'Groovy', 'R', 'MATLAB', 'Lua', 'Perl', 'Bash', 'Shell', 'Objective-C', 'Dart',
    'Elixir', 'Clojure', 'Haskell', 'VB.NET', 'PL/SQL', 'T-SQL',

    // Frontend Frameworks (20+)
    'React', 'Vue', 'Vue.js', 'Angular', 'AngularJS', 'Svelte', 'Next.js', 'Nuxt', 'Gatsby',
    'Remix', 'Ember.js', 'Backbone.js', 'Preact', 'Solid.js', 'Qwik', 'Alpine.js', 'htmx',
    'jQuery', 'AJAX', 'Stimulus',

    // Backend Frameworks (20+)
    'Node.js', 'Express', 'Express.js', 'Django', 'Flask', 'FastAPI', 'Spring', 'Spring Boot', 'ASP.NET',
    'ASP.NET Core', 'Laravel', 'Ruby on Rails', 'Rails', 'Phoenix', 'Akka', 'Play Framework',
    'NestJS', 'Hapi', 'Koa', 'Fastify', 'Loopback', 'Sails.js',

    // Databases (25+)
    'MongoDB', 'PostgreSQL', 'MySQL', 'MariaDB', 'Redis', 'Elasticsearch', 'Cassandra',
    'DynamoDB', 'Firebase', 'Firestore', 'Oracle', 'SQLite', 'CouchDB', 'Neo4j', 'InfluxDB',
    'Memcached', 'RabbitMQ', 'Apache Kafka', 'Kafka', 'Solr', 'Amazon RDS', 'GraphQL',
    'TimescaleDB', 'Prisma', 'Sequelize', 'TypeORM', 'SQLAlchemy', 'Mongoose',

    // Cloud Platforms (20+)
    'AWS', 'Amazon Web Services', 'Azure', 'Google Cloud', 'GCP', 'Google Cloud Platform',
    'Heroku', 'DigitalOcean', 'Linode', 'Netlify', 'Vercel', 'Railway', 'Render', 'AWS Lambda',
    'AWS EC2', 'AWS S3', 'AWS RDS', 'AWS DynamoDB', 'Google App Engine', 'Azure App Service',
    'AWS SQS', 'AWS SNS', 'Google Pub/Sub',

    // DevOps & Containers (15+)
    'Docker', 'Kubernetes', 'K8s', 'Docker Compose', 'Docker Swarm', 'Podman', 'Helm',
    'OpenShift', 'Amazon ECS', 'AWS Fargate', 'Google GKE', 'Azure AKS', 'Minikube', 'Kind',

    // CI/CD (15+)
    'Jenkins', 'CircleCI', 'GitHub Actions', 'GitLab CI', 'Travis CI', 'Bitbucket Pipelines',
    'ArgoCD', 'Drone', 'Spinnaker', 'GitOps', 'Continuous Integration', 'Continuous Deployment',
    'CI/CD Pipeline', 'GitHub Workflows', 'Azure Pipelines',

    // Infrastructure (12+)
    'Terraform', 'Ansible', 'CloudFormation', 'Puppet', 'Chef', 'SaltStack', 'AWS CloudFormation',
    'Infrastructure as Code', 'IaC', 'Vagrant', 'Packer', 'Pulumi',

    // Real-time Messaging (10+)
    'Socket.io', 'Socket.IO', 'WebSocket', 'WebSockets', 'Pusher', 'Firebase Realtime',
    'SignalR', 'MQTT', 'Ably', 'Server-Sent Events',

    // Testing (20+)
    'Jest', 'Mocha', 'Chai', 'Pytest', 'JUnit', 'TestNG', 'Selenium', 'Cypress', 'Playwright',
    'Testing', 'Unit Testing', 'Integration Testing', 'E2E Testing', 'End-to-End Testing',
    'TDD', 'BDD', 'Behavior-Driven Development', 'Test Automation', 'Vitest', 'Jasmine', 'Puppeteer',

    // Data Science (18+)
    'Data Science', 'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Keras',
    'Pandas', 'NumPy', 'Scikit-learn', 'Big Data', 'Hadoop', 'Apache Spark', 'Spark',
    'Tableau', 'Power BI', 'Looker', 'Data Analytics', 'Business Intelligence', 'ETL',

    // Version Control (8+)
    'Git', 'GitHub', 'GitLab', 'Bitbucket', 'SVN', 'Mercurial', 'Git Flow', 'GitHub Enterprise',

    // Build Tools (15+)
    'Webpack', 'Vite', 'Babel', 'Parcel', 'Rollup', 'Esbuild', 'Gulp', 'Grunt', 'Nx',
    'Yarn', 'npm', 'pnpm', 'Maven', 'Gradle', 'Cargo',

    // Styling & CSS (12+)
    'Tailwind CSS', 'Bootstrap', 'Material UI', 'Material Design', 'Ant Design', 'Chakra UI',
    'CSS Grid', 'Flexbox', 'SASS', 'SCSS', 'PostCSS', 'Styled Components',

    // State Management (12+)
    'Redux', 'Redux Saga', 'Redux Thunk', 'MobX', 'Zustand', 'Recoil', 'Jotai', 'XState',
    'Vuex', 'Pinia', 'Context API', 'Apollo Client',

    // APIs (15+)
    'REST', 'REST API', 'RESTful', 'GraphQL', 'SOAP', 'gRPC', 'tRPC', 'OpenAPI', 'Swagger',
    'OAuth', 'OAuth2', 'OpenID Connect', 'JWT', 'JSON Web Token', 'CORS',

    // CMS & Headless (10+)
    'Contentful', 'Strapi', 'Sanity', 'Prismic', 'Directus', 'Ghost', 'Headless CMS',
    'JAMstack', 'Static Site Generation', 'SSG', 'Server-Side Rendering',

    // Auth & Security (12+)
    'Auth0', 'Firebase Auth', 'Okta', 'LDAP', 'SAML', 'Session Management',
    'Password Hashing', 'Bcrypt', 'Argon2', 'SSL', 'TLS', 'HTTPS',

    // Logging & Monitoring (12+)
    'ELK Stack', 'Logstash', 'Kibana', 'Splunk', 'Datadog', 'New Relic',
    'Prometheus', 'Grafana', 'CloudWatch', 'Sentry', 'Log Management',

    // OS (8+)
    'Linux', 'Ubuntu', 'CentOS', 'RHEL', 'Debian', 'Windows', 'macOS', 'Alpine',

    // Tools (10+)
    'JIRA', 'Confluence', 'Slack', 'Microsoft Teams', 'Asana', 'Monday.com', 'Trello',
    'Notion', 'GitHub Issues', 'Linear',

    // Mobile (10+)
    'React Native', 'Flutter', 'iOS', 'Android', 'Xamarin', 'Ionic', 'Cordova', 'NativeScript',

    // Search (8+)
    'Solr', 'Algolia', 'MeiliSearch', 'Whoosh', 'Lunr', 'Full-Text Search',

    // Methodologies (15+)
    'Agile', 'Scrum', 'Kanban', 'Extreme Programming', 'XP', 'System Design', 'Microservices',
    'Monolithic', 'API Design', 'Software Architecture', 'Clean Architecture', 'SOLID Principles',
    'Design Patterns', 'DDD', 'Domain-Driven Design',

    // General Skills (15+)
    'DevOps', 'SRE', 'Site Reliability Engineer', 'Web Development', 'Full Stack Development',
    'Frontend Development', 'Backend Development', 'Cloud Architecture', 'Data Engineering',
    'Database Design', 'Performance Optimization', 'Scalability', 'High Availability', 'Reliability',
    'HTML', 'CSS', 'API', 'Web Services', 'Microservices Architecture', 'Disaster Recovery', 'Load Balancing',
  ];

  // CRITICAL FIX: Deduplicate keywords
  SKILL_KEYWORDS = Array.from(new Set(SKILL_KEYWORDS));

  // CRITICAL FIX: Sort by length descending (longest-match-first)
  // Prevents "Java" matching "JavaScript", "C" matching "React"/"Cassandra"
  SKILL_KEYWORDS.sort((a, b) => b.length - a.length);

  const foundSkills = new Set<string>();
  const lowerText = content.toLowerCase();

  // CRITICAL FIX: Use word-boundary regex with proper escaping
  SKILL_KEYWORDS.forEach(skill => {
    const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedSkill}\\b`, 'gi');
    if (regex.test(lowerText)) {
      foundSkills.add(skill);
    }
  });

  return Array.from(foundSkills).sort();
}
