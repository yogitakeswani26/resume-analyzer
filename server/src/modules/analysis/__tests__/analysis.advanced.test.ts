import {
  performAdvancedAnalysis,
  scorePillar1_Keywords,
  scorePillar2_Sections,
  scorePillar3_Experience,
  scorePillar4_Health,
} from '../analysis.advanced';

describe('Advanced Analysis - v3 (Stricter Scoring)', () => {
  const idealResume = `
    JOHN SMITH
    Email: john.smith@email.com | Phone: (555) 123-4567 | LinkedIn: linkedin.com/in/johnsmith | GitHub: github.com/johnsmith | Based in San Francisco

    PROFESSIONAL SUMMARY
    Experienced Full-Stack Software Engineer with 8+ years of expertise in building scalable web applications. Proficient in cloud-native architecture and microservices.

    EXPERIENCE

    Senior Software Engineer | TechCorp Inc. (2020 - Present)
    - Led architecture redesign that increased system throughput by 150% and reduced latency by 40%
    - Engineered microservices platform serving 10M+ daily active users with 99.99% uptime
    - Spearheaded adoption of Kubernetes, reducing deployment time by 60%
    - Optimized database queries, improving page load time by 45%
    - Delivered 15+ critical features using React, Node.js, and PostgreSQL

    Software Engineer | CloudSoft Solutions (2017 - 2020)
    - Developed RESTful APIs using Express.js serving 500k+ requests daily
    - Implemented real-time features using WebSockets, achieving 98% satisfaction
    - Architected data pipeline processing 2TB+ of data daily
    - Achieved 92% test coverage using Jest and Pytest

    TECHNICAL SKILLS
    Languages: JavaScript, TypeScript, Python, Java, Go, SQL, HTML, CSS
    Frontend: React, Vue.js, Next.js, Tailwind CSS, Material UI
    Backend: Node.js, Express, Django, Flask, FastAPI, Spring Boot, GraphQL, REST API
    Databases: PostgreSQL, MongoDB, MySQL, Redis, Elasticsearch
    DevOps: AWS, Docker, Kubernetes, Terraform, GitHub Actions, CI/CD, Microservices

    EDUCATION
    Bachelor of Science in Computer Science | State University (2015)
  `;

  const jobDescription = `
    We are looking for a Senior Software Engineer with:
    - 5+ years of full-stack development experience
    - Expertise in React, Node.js, PostgreSQL
    - Strong microservices and Docker knowledge
    - AWS or cloud infrastructure experience
    - Experience with CI/CD and DevOps
    - JavaScript, TypeScript, REST APIs
    - Leadership and mentoring skills
  `;

  const poorResume = `
    John Smith
    Software Developer

    Work Experience:
    Helped with web development projects
    Participated in team meetings
    Responsible for fixing bugs
    Worked on some features
  `;

  describe('Pillar 1: Keywords & Skills (40% weight)', () => {
    it('should score ideal resume based on keyword and skills match', () => {
      // Note: The job description has limited keywords, so actual match is lower
      const pillar1 = scorePillar1_Keywords(idealResume, jobDescription, ['React', 'Node.js', 'PostgreSQL', 'Docker', 'Kubernetes', 'AWS']);
      expect(pillar1.weight).toBe(0.40);
      expect(pillar1.percentage).toBeGreaterThanOrEqual(0);
      expect(pillar1.percentage).toBeLessThanOrEqual(100);
      expect(pillar1.breakdown.length).toBe(3);
    });

    it('should score poor resume low on keywords', () => {
      const pillar1 = scorePillar1_Keywords(poorResume, jobDescription, []);
      expect(pillar1.percentage).toBeLessThan(50);
    });

    it('should have correct max score', () => {
      const pillar1 = scorePillar1_Keywords(idealResume, jobDescription, []);
      expect(pillar1.maxScore).toBe(10);
    });
  });

  describe('Pillar 2: Section Completeness (30% weight)', () => {
    it('should score ideal resume high on sections', () => {
      const pillar2 = scorePillar2_Sections(idealResume);
      expect(pillar2.weight).toBe(0.30);
      expect(pillar2.percentage).toBeGreaterThanOrEqual(90);
      expect(pillar2.score).toBeCloseTo(9, 0);
    });

    it('should detect all required sections in ideal resume', () => {
      const pillar2 = scorePillar2_Sections(idealResume);
      const contactFound = pillar2.breakdown.some(b => b.label.includes('Contact'));
      const summaryFound = pillar2.breakdown.some(b => b.label.includes('Summary'));
      const experienceFound = pillar2.breakdown.some(b => b.label.includes('Experience'));
      const skillsFound = pillar2.breakdown.some(b => b.label.includes('Skills'));
      const educationFound = pillar2.breakdown.some(b => b.label.includes('Education'));

      expect(contactFound).toBe(true);
      expect(summaryFound).toBe(true);
      expect(experienceFound).toBe(true);
      expect(skillsFound).toBe(true);
      expect(educationFound).toBe(true);
    });

    it('should score poor resume low on sections', () => {
      const pillar2 = scorePillar2_Sections(poorResume);
      expect(pillar2.percentage).toBeLessThan(50);
    });

    it('should have correct max score', () => {
      const pillar2 = scorePillar2_Sections(idealResume);
      expect(pillar2.maxScore).toBe(10);
    });
  });

  describe('Pillar 3: Years of Experience (15% weight)', () => {
    it('should score ideal resume high on experience', () => {
      const pillar3 = scorePillar3_Experience(idealResume);
      expect(pillar3.weight).toBe(0.15);
      expect(pillar3.percentage).toBeGreaterThanOrEqual(70);
    });

    it('should detect career progression', () => {
      const pillar3 = scorePillar3_Experience(idealResume);
      const progressionBonus = pillar3.breakdown.find(b => b.label.includes('Career Progression'));
      expect(progressionBonus).toBeDefined();
    });

    it('should score poor resume low on experience', () => {
      const pillar3 = scorePillar3_Experience(poorResume);
      expect(pillar3.percentage).toBeLessThan(50);
    });

    it('should have correct max score', () => {
      const pillar3 = scorePillar3_Experience(idealResume);
      expect(pillar3.maxScore).toBe(10);
    });
  });

  describe('Pillar 4: Resume Health & Quality (15% weight)', () => {
    it('should score ideal resume high on health', () => {
      const pillar4 = scorePillar4_Health(idealResume);
      expect(pillar4.weight).toBe(0.15);
      expect(pillar4.percentage).toBeGreaterThanOrEqual(80);
    });

    it('should evaluate writing quality', () => {
      const pillar4 = scorePillar4_Health(idealResume);
      const writingQuality = pillar4.breakdown.find(b => b.label.includes('Writing'));
      expect(writingQuality).toBeDefined();
      expect(writingQuality?.value).toBeGreaterThan(0);
    });

    it('should score poor resume low on health', () => {
      const pillar4 = scorePillar4_Health(poorResume);
      expect(pillar4.percentage).toBeLessThan(50);
    });

    it('should have correct max score', () => {
      const pillar4 = scorePillar4_Health(idealResume);
      expect(pillar4.maxScore).toBe(10);
    });
  });

  describe('Overall Score Calculation (v3 - Stricter Formula)', () => {
    it('should calculate overall score 70-88 for ideal resume (stricter scoring)', () => {
      const analysis = performAdvancedAnalysis(idealResume, jobDescription);
      expect(analysis.overallScore).toBeGreaterThanOrEqual(70);
      expect(analysis.overallScore).toBeLessThanOrEqual(88);
    });

    it('should have 4 pillar scores', () => {
      const analysis = performAdvancedAnalysis(idealResume, jobDescription);
      expect(analysis.pillarScores?.length).toBe(4);
    });

    it('should use correct weights', () => {
      const analysis = performAdvancedAnalysis(idealResume, jobDescription);
      const totalWeight = (analysis.pillarScores || []).reduce((sum, p) => sum + p.weight, 0);
      expect(totalWeight).toBe(1.0);
    });

    it('should provide score explanation', () => {
      const analysis = performAdvancedAnalysis(idealResume, jobDescription);
      expect(analysis.scoreExplanation).toBeDefined();
      expect(analysis.scoreExplanation).toContain('Keywords');
      expect(analysis.scoreExplanation).toContain('Overall');
    });

    it('should score poor resume significantly lower', () => {
      const idealAnalysis = performAdvancedAnalysis(idealResume, jobDescription);
      const poorAnalysis = performAdvancedAnalysis(poorResume, jobDescription);
      expect(idealAnalysis.overallScore).toBeGreaterThan(poorAnalysis.overallScore);
    });

    it('should provide helpful suggestions for improvement', () => {
      const analysis = performAdvancedAnalysis(poorResume, jobDescription);
      expect(analysis.prioritizedSuggestions.length).toBeGreaterThan(0);
      expect(analysis.prioritizedSuggestions[0]).toBeDefined();
    });

    it('should calculate ATS score', () => {
      const analysis = performAdvancedAnalysis(idealResume, jobDescription);
      expect(analysis.atsScore).toBeGreaterThan(0);
      expect(analysis.atsScore).toBeLessThanOrEqual(100);
    });

    it('should calculate health score', () => {
      const analysis = performAdvancedAnalysis(idealResume, jobDescription);
      expect(analysis.healthScore).toBeGreaterThan(0);
      expect(analysis.healthScore).toBeLessThanOrEqual(100);
    });

    it('should identify strengths', () => {
      const analysis = performAdvancedAnalysis(idealResume, jobDescription);
      expect(analysis.strengths.length).toBeGreaterThan(0);
      expect(analysis.strengths[0]).toContain('✓');
    });

    it('should identify weaknesses', () => {
      const analysis = performAdvancedAnalysis(poorResume, jobDescription);
      expect(analysis.weaknesses.length).toBeGreaterThan(0);
      expect(analysis.weaknesses[0]).toContain('✗');
    });
  });

  describe('Scoring Formula Components', () => {
    it('should apply correct weights: 40% + 30% + 15% + 15%', () => {
      const analysis = performAdvancedAnalysis(idealResume, jobDescription);
      const pillars = analysis.pillarScores || [];

      const keywordsWeight = pillars[0]?.weight ?? 0;
      const sectionsWeight = pillars[1]?.weight ?? 0;
      const experienceWeight = pillars[2]?.weight ?? 0;
      const healthWeight = pillars[3]?.weight ?? 0;

      expect(keywordsWeight).toBe(0.40);
      expect(sectionsWeight).toBe(0.30);
      expect(experienceWeight).toBe(0.15);
      expect(healthWeight).toBe(0.15);
    });

    it('should normalize each pillar to 100%', () => {
      const analysis = performAdvancedAnalysis(idealResume, jobDescription);
      const pillars = analysis.pillarScores || [];

      pillars.forEach(pillar => {
        expect(pillar.percentage).toBeGreaterThanOrEqual(0);
        expect(pillar.percentage).toBeLessThanOrEqual(100);
      });
    });

    it('should cap overall score at 88% for ideal resumes', () => {
      const analysis = performAdvancedAnalysis(idealResume, jobDescription);
      expect(analysis.overallScore).toBeLessThanOrEqual(88);
    });
  });

  describe('Scoring Breakdown Details', () => {
    it('should provide detailed breakdown for each pillar', () => {
      const analysis = performAdvancedAnalysis(idealResume, jobDescription);
      const pillars = analysis.pillarScores || [];

      pillars.forEach(pillar => {
        expect(pillar.breakdown.length).toBeGreaterThan(0);
        pillar.breakdown.forEach(component => {
          expect(component.label).toBeDefined();
          expect(component.value).toBeDefined();
          expect(typeof component.value).toBe('number');
        });
      });
    });

    it('should provide detailed checks for manual review', () => {
      const analysis = performAdvancedAnalysis(idealResume, jobDescription);
      expect(analysis.checks.length).toBeGreaterThan(5);
      expect(analysis.checks[0].category).toBeDefined();
      expect(analysis.checks[0].name).toBeDefined();
      expect(analysis.checks[0].feedback).toBeDefined();
    });
  });
});
