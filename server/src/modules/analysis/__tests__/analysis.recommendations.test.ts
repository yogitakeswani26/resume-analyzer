/**
 * Test suite for Resume Recommendations System
 * Demonstrates various scenarios and expected outputs
 */

import {
  generateRecommendations,
  formatRecommendationsAsText,
  getRecommendationsByPriority,
} from '../analysis.recommendations.js';

describe('Resume Recommendations System', () => {
  // ========================================================================
  // EXAMPLE 1: MINIMAL RESUME (Critical Issues)
  // ========================================================================
  describe('Minimal Resume Analysis', () => {
    const minimalResume = `
John
john@gmail.com

Experience:
- Worked on web development
- Helped with database design
- Participated in code reviews

Skills:
JavaScript, React, Node.js

Education:
BS in Computer Science
2020
    `;

    test('should identify critical issues in minimal resume', () => {
      const report = generateRecommendations(minimalResume);

      expect(report.overallScore).toBeLessThan(60);
      expect(report.topPriorities.length).toBeGreaterThan(0);

      // Check for specific critical findings
      const criticalItems = report.topPriorities.filter(r => r.priority === 'critical');
      expect(criticalItems.length).toBeGreaterThan(0);

      // Should find weak verbs
      const weakVerbRec = report.sections
        .find(s => s.sectionName === 'Work Experience')
        ?.recommendations.some(r => r.suggestion.includes('action verb'));
      expect(weakVerbRec).toBeTruthy();

      // Should find missing metrics
      const metricsRec = report.sections
        .find(s => s.sectionName === 'Work Experience')
        ?.recommendations.some(r => r.suggestion.includes('metrics'));
      expect(metricsRec).toBeTruthy();
    });

    test('should recommend adding phone number', () => {
      const report = generateRecommendations(minimalResume);
      const contactSection = report.sections.find(s => s.sectionName === 'Contact Information');

      expect(contactSection?.sectionScore).toBeLessThan(100);
      expect(contactSection?.recommendations.some(r => r.suggestion.includes('phone'))).toBeTruthy();
    });

    test('should output formatted text without errors', () => {
      const report = generateRecommendations(minimalResume);
      const text = formatRecommendationsAsText(report);

      expect(text).toContain('RESUME RECOMMENDATIONS REPORT');
      expect(text).toContain('Overall Score');
      expect(text).toContain('TOP PRIORITIES');
    });
  });

  // ========================================================================
  // EXAMPLE 2: GOOD RESUME (Minor Improvements)
  // ========================================================================
  describe('Good Resume Analysis', () => {
    const goodResume = `
JOHN SMITH
john.smith@gmail.com | (555) 123-4567 | linkedin.com/in/johnsmith | github.com/johnsmith

PROFESSIONAL SUMMARY
Results-driven Full Stack Developer with 5+ years of experience building scalable web applications.
Expertise in React, Node.js, and cloud technologies. Proven track record of delivering high-impact solutions.

WORK EXPERIENCE

Senior Software Engineer | Tech Corp (2022-Present)
- Led development of microservices architecture, improving system scalability by 60%
- Architected CI/CD pipeline reducing deployment time from 2 hours to 15 minutes
- Mentored team of 4 junior developers, improving code quality metrics by 45%
- Optimized database queries, reducing API response time by 35%

Software Engineer | StartupXYZ (2020-2022)
- Built full-stack e-commerce platform serving 50K+ monthly active users
- Implemented real-time notification system using WebSockets and Redis
- Reduced frontend bundle size by 40% through code optimization
- Established automated testing framework increasing coverage from 30% to 85%

EDUCATION
Bachelor of Science in Computer Science
University of California, Berkeley
Graduated: May 2020 | GPA: 3.8/4.0

TECHNICAL SKILLS
Languages: JavaScript, TypeScript, Python, Java
Frameworks: React, Next.js, Node.js, Express, Django
Databases: PostgreSQL, MongoDB, Redis
Cloud & DevOps: AWS, Docker, Kubernetes, GitHub Actions
Tools: Git, Figma, Jira, Jest, Cypress

PROJECTS
E-Commerce Platform (2022)
- Built full-stack application from scratch using React and Node.js
- Technologies: React, Node.js, PostgreSQL, Docker
- 50K+ monthly active users, 99.9% uptime
- GitHub: github.com/johnsmith/ecommerce-platform

Real-Time Analytics Dashboard (2021)
- Developed interactive dashboard for data visualization
- Technologies: React, D3.js, Python, FastAPI
- 200K+ data points processed daily
- Live Demo: analytics-demo.com
    `;

    test('should recognize good resume quality', () => {
      const report = generateRecommendations(goodResume);

      expect(report.overallScore).toBeGreaterThan(70);
      expect(report.sectionScores['Work Experience']).toBeGreaterThan(80);
      expect(report.sectionScores['Education']).toBeGreaterThan(80);
      expect(report.sectionScores['Technical Skills']).toBeGreaterThan(75);
    });

    test('should provide quick wins rather than critical issues', () => {
      const report = generateRecommendations(goodResume);
      const criticalCount = report.topPriorities.filter(r => r.priority === 'critical').length;

      expect(criticalCount).toBeLessThan(2);
      expect(report.quickWins.length).toBeGreaterThan(0);
    });

    test('should suggest minor formatting improvements', () => {
      const report = generateRecommendations(goodResume);

      expect(report.formatIssues.length).toBeLessThanOrEqual(2);
    });
  });

  // ========================================================================
  // EXAMPLE 3: RESUME WITH SPECIFIC ISSUES
  // ========================================================================
  describe('Resume with Specific Issues', () => {
    const issueResume = `
Bob (no email or phone)

I have been working in the software industry for several years.
I am very good at programming and I really enjoy building applications.

Work Experience:
Company 1 (2020-2022)
- Helped with development of web applications
- Participated in code reviews
- Worked on bug fixes and features
- Responsible for database maintenance

Company 2 (2018-2020)
- Involved in building mobile apps
- Assisted team members with technical issues
- Contributed to various projects

Education:
Studied Computer Science at University

Skills:
Python, Java, JavaScript

Certifications:
AWS Certified
    `;

    test('should identify missing contact information', () => {
      const report = generateRecommendations(issueResume);
      const contactSection = report.sections.find(s => s.sectionName === 'Contact Information');

      expect(contactSection?.sectionScore).toBeLessThan(50);
      expect(contactSection?.findings.length).toBeGreaterThan(0);
    });

    test('should identify weak action verbs', () => {
      const report = generateRecommendations(issueResume);
      const experienceSection = report.sections.find(s => s.sectionName === 'Work Experience');

      const weakVerbRec = experienceSection?.recommendations.find(
        r => r.suggestion.includes('verb') || r.suggestion.includes('Replace')
      );
      expect(weakVerbRec).toBeDefined();
    });

    test('should identify missing metrics', () => {
      const report = generateRecommendations(issueResume);
      const experienceSection = report.sections.find(s => s.sectionName === 'Work Experience');

      const metricsRec = experienceSection?.recommendations.find(
        r => r.suggestion.includes('metrics')
      );
      expect(metricsRec).toBeDefined();
    });

    test('should identify filler words', () => {
      const report = generateRecommendations(issueResume);

      // Summary section should detect "very" and "really"
      const summarySection = report.sections.find(s => s.sectionName === 'Professional Summary');
      expect(summarySection?.sectionScore).toBeLessThan(100);
    });
  });

  // ========================================================================
  // EXAMPLE 4: RECOMMENDATIONS PRIORITY GROUPING
  // ========================================================================
  describe('Recommendations Priority Grouping', () => {
    const testResume = `
Jane Doe
jane@example.com

Summary: I am a software engineer

Experience:
- Worked on projects
- Helped with development

Skills: Java, C++

Education: BS Computer Science, State University, 2021
    `;

    test('should group recommendations by priority', () => {
      const report = generateRecommendations(testResume);
      const byPriority = getRecommendationsByPriority(report);

      expect(byPriority.critical.length).toBeGreaterThan(0);
      expect(byPriority.high.length).toBeGreaterThan(0);
      expect(byPriority.medium.length).toBeGreaterThanOrEqual(0);
    });

    test('should have fewer critical than lower priority items', () => {
      const report = generateRecommendations(testResume);
      const byPriority = getRecommendationsByPriority(report);

      expect(byPriority.critical.length).toBeLessThanOrEqual(byPriority.high.length + 1);
    });
  });

  // ========================================================================
  // EXAMPLE 5: SECTION SCORING EDGE CASES
  // ========================================================================
  describe('Section Scoring Edge Cases', () => {
    test('should handle resume with only name', () => {
      const minimal = 'Alice Johnson';
      const report = generateRecommendations(minimal);

      expect(report.overallScore).toBeLessThan(30);
      expect(report.sections[0].sectionName).toBe('Contact Information');
    });

    test('should handle very long resume', () => {
      const longResume = `
JANE DOE
jane@example.com | (555) 987-6543 | linkedin.com/in/janedoe

OBJECTIVE
This is a very long objective section that goes on and on...

${Array(50).fill('Experience Section ' + Math.random()).join('\n')}

${'Education Entry ' + Math.random()}

${'Skill ' + Math.random() + ' Skill ' + Math.random()}
      `;

      const report = generateRecommendations(longResume);
      const formatIssues = report.formatIssues;

      expect(formatIssues.some(issue => issue.includes('exceeds') || issue.includes('long'))).toBeTruthy();
    });

    test('should handle resume with special characters', () => {
      const specialResume = `
<John Smith>
john@example.com

[EXPERIENCE]
{Senior Developer}
* Increased revenue by 50%
* Built [amazing] systems using <React>

#SKILLS
JavaScript | React | Node.js
      `;

      const report = generateRecommendations(specialResume);
      const hasFormatIssues = report.formatIssues.some(
        issue => issue.includes('special') || issue.includes('formatting')
      );

      expect(hasFormatIssues).toBeTruthy();
    });
  });

  // ========================================================================
  // EXAMPLE 6: FORMATTED OUTPUT
  // ========================================================================
  describe('Formatted Output', () => {
    const sampleResume = `
Mike Chen
mike.chen@gmail.com | (555) 246-8135 | linkedin.com/in/mikechen

Software Engineer with 3 years of experience

Experience:
Senior Developer at TechCo (2022-Present)
- Improved system performance by 40%
- Led API redesign project

Junior Developer at StartupXYZ (2021-2022)
- Built frontend features using React

Education: BS Computer Science, Tech University (2021)

Skills: JavaScript, React, Python, AWS
    `;

    test('should generate valid formatted text', () => {
      const report = generateRecommendations(sampleResume);
      const text = formatRecommendationsAsText(report);

      expect(text).toContain('RESUME RECOMMENDATIONS REPORT');
      expect(text).toContain('Overall Score');
      expect(text).toContain('SECTION SCORES');
      expect(text.match(/\/100/g)?.length).toBeGreaterThan(0);
    });

    test('formatted output should include all sections', () => {
      const report = generateRecommendations(sampleResume);
      const text = formatRecommendationsAsText(report);

      expect(text).toContain('Contact Information');
      expect(text).toContain('Professional Summary');
      expect(text).toContain('Work Experience');
      expect(text).toContain('Education');
      expect(text).toContain('Technical Skills');
    });

    test('formatted output should include priorities when present', () => {
      const report = generateRecommendations(sampleResume);
      const text = formatRecommendationsAsText(report);

      if (report.topPriorities.length > 0) {
        expect(text).toContain('TOP PRIORITIES');
      }

      if (report.quickWins.length > 0) {
        expect(text).toContain('QUICK WINS');
      }
    });
  });

  // ========================================================================
  // EXAMPLE 7: METRICS AND QUANTIFICATION
  // ========================================================================
  describe('Metrics Detection', () => {
    test('should recognize resumes with good metrics', () => {
      const withMetrics = `
Experience:
- Increased page load time by 35%
- Reduced costs by $500K annually
- Served 10M+ users
- Achieved 99.9% uptime
      `;

      const report = generateRecommendations(withMetrics);
      expect(report.sections.find(s => s.sectionName === 'Work Experience')?.sectionScore).toBeGreaterThan(70);
    });

    test('should flag resumes lacking metrics', () => {
      const noMetrics = `
Experience:
- Worked on website
- Helped improve performance
- Fixed bugs
- Attended meetings
      `;

      const report = generateRecommendations(noMetrics);
      const expSection = report.sections.find(s => s.sectionName === 'Work Experience');

      expect(expSection?.recommendations.some(r => r.suggestion.includes('metrics'))).toBeTruthy();
    });
  });

  // ========================================================================
  // EXAMPLE 8: SKILL CATEGORIZATION
  // ========================================================================
  describe('Skill Categorization Analysis', () => {
    test('should recognize categorized skills', () => {
      const categorized = `
Skills:
Languages: Python, JavaScript, TypeScript
Frameworks: Django, React, Next.js
Databases: PostgreSQL, MongoDB
Cloud: AWS, Azure
Tools: Git, Docker, Kubernetes
      `;

      const report = generateRecommendations(categorized);
      const skillScore = report.sectionScores['Technical Skills'];

      expect(skillScore).toBeGreaterThan(70);
    });

    test('should recommend categorization for flat skill list', () => {
      const flat = `
Skills: Python, JavaScript, React, Django, PostgreSQL, AWS, Docker, Kubernetes
      `;

      const report = generateRecommendations(flat);
      const skillSection = report.sections.find(s => s.sectionName === 'Technical Skills');

      expect(skillSection?.recommendations.some(r => r.suggestion.includes('categor'))).toBeTruthy();
    });
  });
});

// ========================================================================
// INTEGRATION EXAMPLES
// ========================================================================

describe('Integration Examples', () => {
  test('should work in service context', async () => {
    const resumeContent = `
Alice B
alice@example.com | (555) 123-4567

Full Stack Engineer | 4 Years Experience

Achievements:
- Led team of 5 engineers
- Increased efficiency by 50%
- Shipped 20+ features

Technical: Python, JavaScript, React, Django, PostgreSQL
Education: Bachelor of Technology, 2021
    `;

    // Simulate service usage
    const recommendations = generateRecommendations(resumeContent);

    expect(recommendations).toHaveProperty('overallScore');
    expect(recommendations).toHaveProperty('sections');
    expect(recommendations).toHaveProperty('topPriorities');
    expect(recommendations).toHaveProperty('quickWins');
    expect(recommendations.sections.length).toBe(7);
  });
});
