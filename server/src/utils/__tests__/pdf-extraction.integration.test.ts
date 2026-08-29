import { parseFile } from '../fileParser';

describe('PDF Text Extraction Integration Tests', () => {
  describe('Extract 150+ Word Summaries', () => {
    it('should extract 150+ words from simulated large text content', async () => {
      // Simulate a 150+ word resume content
      const largeResumeContent = `
John Doe
john.doe@email.com
(555) 123-4567

Professional Summary
Experienced Software Engineer with 8+ years of expertise in full-stack development. Proficient in React, Node.js, TypeScript, and MongoDB. Demonstrated ability to design scalable systems, lead cross-functional teams, and deliver high-quality software solutions. Strong background in cloud technologies, DevOps practices, and agile methodologies.

Experience

Senior Software Engineer
Tech Corp Inc. | January 2020 - Present
- Led development of microservices architecture serving 1M+ daily users
- Implemented CI/CD pipelines reducing deployment time by 60%
- Mentored junior developers and conducted code reviews
- Architected new payment processing system handling \$50M+ annual transactions

Software Engineer
StartUp Labs | June 2018 - December 2019
- Built RESTful APIs and real-time features using Node.js and WebSockets
- Developed React components with 95%+ test coverage
- Optimized database queries improving performance by 40%
- Collaborated with product team on feature specifications and requirements

Skills
Languages: JavaScript, TypeScript, Python, Java
Frontend: React, Next.js, Vue.js, Tailwind CSS
Backend: Node.js, Express, NestJS, GraphQL
Databases: MongoDB, PostgreSQL, Redis
Cloud: AWS, GCP, Docker, Kubernetes

Education
Bachelor of Computer Science
University of Technology, 2016
      `;

      const buffer = Buffer.from(largeResumeContent, 'utf-8');
      const result = await parseFile(buffer, 'text/plain');

      // Count words in result
      const wordCount = result.split(/\s+/).filter((w: string) => w.length > 0).length;

      console.log(`Extracted content length: ${result.length} characters`);
      console.log(`Extracted word count: ${wordCount} words`);

      // Verify we extracted at least 150 words
      expect(wordCount).toBeGreaterThanOrEqual(150);
      expect(result.length).toBeGreaterThan(150);

      // Verify key content is preserved
      expect(result).toContain('John Doe');
      expect(result).toContain('Software Engineer');
      expect(result).toContain('React');
      expect(result).toContain('Node.js');
      expect(result).toContain('MongoDB');
    });

    it('should extract complete headers, paragraphs, and bullet points', async () => {
      const structuredContent = `
JOHN DOE
john@email.com | (555) 123-4567

PROFESSIONAL SUMMARY
Experienced full-stack developer with strong expertise in modern web technologies. Proven track record of delivering scalable solutions and leading technical teams.

TECHNICAL SKILLS
- Languages: JavaScript, TypeScript, Python
- Frontend: React, Vue, Next.js
- Backend: Node.js, Express, Django
- Databases: MongoDB, PostgreSQL, Redis
- DevOps: Docker, Kubernetes, AWS

PROFESSIONAL EXPERIENCE

Senior Developer
ABC Company | 2020 - Present
- Architected microservices using Node.js and GraphQL
- Implemented automated testing increasing coverage to 85%
- Reduced API response times by 50% through database optimization
- Led team of 5 developers in sprint planning and code reviews

Full Stack Developer
XYZ Startup | 2018 - 2020
- Developed React-based dashboard for real-time analytics
- Built Python backend for data processing pipeline
- Implemented CI/CD pipeline using GitHub Actions
- Mentored 2 junior developers

EDUCATION
BS Computer Science - University of Tech, 2018
      `;

      const buffer = Buffer.from(structuredContent, 'utf-8');
      const result = await parseFile(buffer, 'text/plain');

      // Verify structure is preserved
      expect(result).toContain('PROFESSIONAL SUMMARY');
      expect(result).toContain('TECHNICAL SKILLS');
      expect(result).toContain('PROFESSIONAL EXPERIENCE');
      expect(result).toContain('Senior Developer');
      expect(result).toContain('Full Stack Developer');

      // Verify bullet points are captured
      expect(result).toContain('Architected microservices');
      expect(result).toContain('Implemented automated testing');
      expect(result).toContain('Reduced API response times');

      // Count words - should be significant
      const wordCount = result.split(/\s+/).filter((w: string) => w.length > 0).length;
      expect(wordCount).toBeGreaterThan(100);
    });

    it('should handle multi-line paragraphs without truncation', async () => {
      // Create content with multiple paragraphs
      const paragraphContent = `
Professional Summary:
This is a comprehensive professional summary that spans multiple lines and contains detailed information about the candidate's background, experience, and expertise in software development. The summary includes specific achievements, technical competencies, and soft skills that make the candidate an excellent fit for senior engineering roles. Additional details about industry experience, certifications, and notable projects are also included to provide a complete picture of the professional's qualifications and career trajectory.

Technical Expertise:
The candidate possesses deep expertise in full-stack web development with particular strengths in JavaScript and TypeScript ecosystems. Years of experience with React, Node.js, MongoDB, and AWS have resulted in the successful delivery of numerous high-performance applications. Database optimization, cloud architecture, and microservices patterns are among the core competencies that have been refined through practical application in production environments.

Leadership Experience:
As a technical lead and architect, the candidate has successfully managed cross-functional teams ranging from 3 to 15 engineers. Project management experience includes agile methodologies, sprint planning, and delivery of complex features within tight timelines. Mentoring junior developers and fostering a culture of continuous learning have been key responsibilities throughout the career.
      `;

      const buffer = Buffer.from(paragraphContent, 'utf-8');
      const result = await parseFile(buffer, 'text/plain');

      const wordCount = result.split(/\s+/).filter((w: string) => w.length > 0).length;

      // Should preserve full paragraph content without truncation
      expect(result).toContain('Professional Summary');
      expect(result).toContain('Technical Expertise');
      expect(result).toContain('Leadership Experience');
      expect(wordCount).toBeGreaterThan(180);
      expect(result.length).toBeGreaterThan(1000);
    });
  });

  describe('Content Structure Preservation', () => {
    it('should preserve headers and section organization', async () => {
      const structuredResume = `
RESUME

NAME: Jane Smith
EMAIL: jane@example.com
PHONE: (555) 987-6543

OBJECTIVE
Seeking a challenging role as Senior Full Stack Developer where I can leverage my expertise in modern web technologies and contribute to innovative product development.

CORE COMPETENCIES
• Full-stack web development
• RESTful and GraphQL API design
• Database design and optimization
• Cloud deployment and DevOps
• Agile/Scrum methodologies
• Team leadership and mentoring

PROFESSIONAL BACKGROUND
2021-Present: Lead Developer at Tech Innovation Corp
2019-2021: Senior Developer at Digital Solutions Inc
2017-2019: Mid-level Developer at Web Services LLC
2015-2017: Junior Developer at Startup XYZ

EDUCATION
Master of Science in Computer Science (2015)
Bachelor of Science in Computer Science (2013)
      `;

      const buffer = Buffer.from(structuredResume, 'utf-8');
      const result = await parseFile(buffer, 'text/plain');

      // Verify key sections are present
      expect(result).toContain('OBJECTIVE');
      expect(result).toContain('CORE COMPETENCIES');
      expect(result).toContain('PROFESSIONAL BACKGROUND');
      expect(result).toContain('Jane Smith');

      // Verify formatting is somewhat preserved
      const lines = result.split('\n');
      expect(lines.length).toBeGreaterThan(10);
    });

    it('should maintain spacing and line breaks for readability', async () => {
      const contentWithBreaks = `
Header 1
Content for header 1

Header 2
Content for header 2 with more details

Header 3
- Bullet point 1
- Bullet point 2
- Bullet point 3
      `;

      const buffer = Buffer.from(contentWithBreaks, 'utf-8');
      const result = await parseFile(buffer, 'text/plain');

      // Should have multiple lines
      const lines = result.split('\n');
      expect(lines.length).toBeGreaterThan(1);

      // Should contain all headers
      expect(result).toContain('Header 1');
      expect(result).toContain('Header 2');
      expect(result).toContain('Header 3');

      // Should contain bullet points
      expect(result).toContain('Bullet point 1');
    });
  });

  describe('Edge Cases and Validation', () => {
    it('should reject empty text files', async () => {
      const emptyContent = '';
      const buffer = Buffer.from(emptyContent, 'utf-8');

      await expect(parseFile(buffer, 'text/plain')).rejects.toThrow();
    });

    it('should accept files with any non-empty content', async () => {
      const shortContent = 'Hello';
      const buffer = Buffer.from(shortContent, 'utf-8');

      const result = await parseFile(buffer, 'text/plain');
      expect(result.length).toBeGreaterThan(0);
      expect(result).toBe('Hello');
    });

    it('should accept files with 10+ characters', async () => {
      const minimalContent = 'Hello World Text';
      const buffer = Buffer.from(minimalContent, 'utf-8');

      const result = await parseFile(buffer, 'text/plain');
      expect(result.length).toBeGreaterThanOrEqual(10);
    });

    it('should handle very long content (5000+ characters)', async () => {
      // Create very long content
      const longContent = 'Resume content line. '.repeat(300); // ~6000 characters
      const buffer = Buffer.from(longContent, 'utf-8');

      const result = await parseFile(buffer, 'text/plain');

      expect(result.length).toBeGreaterThan(5000);
      expect(result).toContain('Resume content line');
    });
  });
});
