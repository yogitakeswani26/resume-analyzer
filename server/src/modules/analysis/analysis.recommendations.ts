/**
 * Resume Recommendations System
 * Generates specific, actionable recommendations for resume improvement
 * Scores each section from 0-100 and provides targeted advice
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface SectionRecommendation {
  sectionName: string;
  sectionScore: number; // 0-100
  status: 'critical' | 'poor' | 'fair' | 'good' | 'excellent';
  findings: string[];
  recommendations: RecommendationItem[];
  examples?: string[];
}

export interface RecommendationItem {
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  suggestion: string;
  example?: string;
  impact: string; // Brief description of impact
}

export interface RecommendationsReport {
  overallScore: number;
  sectionScores: Record<string, number>;
  sections: SectionRecommendation[];
  topPriorities: RecommendationItem[];
  quickWins: RecommendationItem[];
  formatIssues: string[];
  generatedAt: Date;
}

// ============================================================================
// RESUME PARSING UTILITIES
// ============================================================================

interface ParsedResume {
  contactInfo: string;
  summary: string;
  experience: string;
  education: string;
  skills: string;
  projects: string;
  certifications: string;
  rawContent: string;
}

function parseResumeContent(content: string): ParsedResume {
  const lowerContent = content.toLowerCase();

  // Define section patterns
  const patterns = {
    contactInfo: /^[\s\S]*?(?=summary|objective|professional|experience|work|employment)/i,
    summary: /(?:summary|objective|professional.*profile|about)([\s\S]*?)(?=experience|employment|work|education|skills)/i,
    experience: /(?:experience|employment|work.*history)([\s\S]*?)(?=education|skills|projects|certifications|$)/i,
    education: /(?:education|academic)([\s\S]*?)(?=skills|projects|certifications|experience|$)/i,
    skills: /(?:skills|technical|expertise|proficiencies)([\s\S]*?)(?=projects|certifications|experience|education|$)/i,
    projects: /(?:projects|portfolio|applications)([\s\S]*?)(?=certifications|skills|experience|education|$)/i,
    certifications: /(?:certifications?|licenses?|awards?)([\s\S]*?)(?=skills|projects|experience|education|$)/i,
  };

  const parsed: ParsedResume = {
    contactInfo: extractSection(content, patterns.contactInfo) || '',
    summary: extractSection(content, patterns.summary) || '',
    experience: extractSection(content, patterns.experience) || '',
    education: extractSection(content, patterns.education) || '',
    skills: extractSection(content, patterns.skills) || '',
    projects: extractSection(content, patterns.projects) || '',
    certifications: extractSection(content, patterns.certifications) || '',
    rawContent: content,
  };

  return parsed;
}

function extractSection(content: string, pattern: RegExp): string {
  const match = content.match(pattern);
  return match ? match[1] || match[0] : '';
}

// ============================================================================
// SECTION SCORING FUNCTIONS
// ============================================================================

function scoreContactInfo(contactInfo: string): SectionRecommendation {
  const findings: string[] = [];
  const recommendations: RecommendationItem[] = [];
  let score = 0;

  const hasEmail = /[\w.-]+@[\w.-]+\.\w+/.test(contactInfo);
  const hasPhone = /\+?(\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(contactInfo);
  const hasName = /^[A-Z][a-z]+ [A-Z][a-z]+/m.test(contactInfo);
  const hasLinkedIn = /linkedin|linkedin\.com/i.test(contactInfo);
  const hasGitHub = /github|github\.com/i.test(contactInfo);

  // Calculate base score
  if (hasName) score += 20;
  if (hasEmail) score += 20;
  if (hasPhone) score += 20;
  if (hasLinkedIn) score += 20;
  if (hasGitHub) score += 20;

  if (!hasName) {
    findings.push('Missing or unclear name');
    recommendations.push({
      priority: 'critical',
      category: 'Contact Information',
      suggestion: 'Add your full name as a prominent heading at the top',
      example: 'John Smith (not john_smith or jsmith)',
      impact: 'Essential for recruiter recognition and personalization',
    });
  }

  if (!hasEmail) {
    findings.push('Missing email address');
    recommendations.push({
      priority: 'critical',
      category: 'Contact Information',
      suggestion: 'Include a professional email address',
      example: 'yourname@gmail.com or firstname.lastname@domain.com',
      impact: 'Primary contact method for recruiters',
    });
  }

  if (!hasPhone) {
    findings.push('Missing phone number');
    recommendations.push({
      priority: 'high',
      category: 'Contact Information',
      suggestion: 'Add your phone number in standard format',
      example: '(555) 123-4567 or +1-555-123-4567',
      impact: 'Enables direct recruiter contact',
    });
  }

  if (!hasLinkedIn && !hasGitHub) {
    findings.push('No professional links (LinkedIn/GitHub/Portfolio)');
    recommendations.push({
      priority: 'high',
      category: 'Contact Information',
      suggestion: 'Add LinkedIn profile and GitHub (for tech roles)',
      example: 'linkedin.com/in/yourprofile | github.com/yourprofile',
      impact: 'Provides additional credibility and work samples',
    });
  }

  return {
    sectionName: 'Contact Information',
    sectionScore: score,
    status: score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'fair' : 'critical',
    findings,
    recommendations,
  };
}

function scoreSummary(summary: string): SectionRecommendation {
  const findings: string[] = [];
  const recommendations: RecommendationItem[] = [];
  let score = 100;

  if (!summary || summary.trim().length === 0) {
    score = 0;
    findings.push('Missing professional summary/objective');
    recommendations.push({
      priority: 'high',
      category: 'Professional Summary',
      suggestion: 'Add a 2-3 sentence professional summary',
      example: 'Results-driven Software Engineer with 5+ years of experience building scalable web applications. Expertise in React, Node.js, and cloud technologies. Proven track record of delivering high-impact solutions.',
      impact: 'Provides quick context about your career focus and value proposition',
    });
    return {
      sectionName: 'Professional Summary',
      sectionScore: score,
      status: 'critical',
      findings,
      recommendations,
    };
  }

  const wordCount = summary.split(/\s+/).length;
  if (wordCount < 20) {
    score -= 20;
    findings.push('Summary is too brief');
    recommendations.push({
      priority: 'medium',
      category: 'Professional Summary',
      suggestion: 'Expand summary to 2-3 sentences (50-75 words)',
      impact: 'Better introduction of your value proposition',
    });
  }

  if (wordCount > 150) {
    score -= 15;
    findings.push('Summary is too verbose');
    recommendations.push({
      priority: 'medium',
      category: 'Professional Summary',
      suggestion: 'Trim summary to 2-3 sentences maximum',
      impact: 'Improves readability and maintains recruiter attention',
    });
  }

  if (!/\d+ years?|senior|lead|manager|architect/.test(summary)) {
    score -= 10;
    findings.push('Summary lacks experience level indicators');
    recommendations.push({
      priority: 'medium',
      category: 'Professional Summary',
      suggestion: 'Include years of experience and seniority level',
      example: 'With 5+ years of experience...',
      impact: 'Helps recruiters quickly assess your level',
    });
  }

  if (!/achieved|delivered|built|led|transformed/i.test(summary)) {
    score -= 10;
    findings.push('Summary lacks action-oriented language');
    recommendations.push({
      priority: 'medium',
      category: 'Professional Summary',
      suggestion: 'Use action verbs to describe accomplishments',
      example: 'Replace "worked on" with "led", "built", "delivered"',
      impact: 'Creates stronger first impression',
    });
  }

  return {
    sectionName: 'Professional Summary',
    sectionScore: Math.max(0, score),
    status: score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'fair' : 'poor',
    findings,
    recommendations,
  };
}

function scoreExperience(experience: string): SectionRecommendation {
  const findings: string[] = [];
  const recommendations: RecommendationItem[] = [];
  let score = 100;

  if (!experience || experience.trim().length === 0) {
    score = 0;
    findings.push('Missing work experience section');
    recommendations.push({
      priority: 'critical',
      category: 'Work Experience',
      suggestion: 'Add a work experience section with past roles',
      example: 'Senior Developer at Tech Corp (2021-Present)\n- Led development of microservices architecture\n- Improved API response time by 45%',
      impact: 'Essential section for demonstrating career progression',
    });
    return {
      sectionName: 'Work Experience',
      sectionScore: score,
      status: 'critical',
      findings,
      recommendations,
    };
  }

  // Check for bullet points
  const hasBullets = /[-•]\s/.test(experience);
  if (!hasBullets) {
    score -= 15;
    findings.push('Experience lacks bullet points');
    recommendations.push({
      priority: 'high',
      category: 'Work Experience',
      suggestion: 'Format achievements as bullet points',
      impact: 'Improves readability and ATS compatibility',
    });
  }

  // Check for quantifiable metrics
  const bulletPoints = experience.split(/\n[-•]/).length;
  const pointsWithMetrics = (experience.match(/\d+%|\$\d+|increased|decreased|improved|reduced/gi) || []).length;
  const metricsPercentage = (pointsWithMetrics / Math.max(bulletPoints, 1)) * 100;

  if (metricsPercentage < 60) {
    score -= 20;
    findings.push(`Only ${Math.round(metricsPercentage)}% of achievements include quantifiable metrics`);
    recommendations.push({
      priority: 'critical',
      category: 'Work Experience',
      suggestion: 'Add metrics to all major achievements',
      example: 'Increased application performance by 35%\nReduced deployment time from 2 hours to 30 minutes\nDelivered 12 features ahead of schedule',
      impact: 'Demonstrates concrete impact and value creation',
    });
  }

  // Check for weak verbs
  const weakVerbs = ['helped', 'assisted', 'involved', 'participated', 'responsible for', 'worked on', 'handled'];
  const weakVerbCount = (experience.match(new RegExp(`\\b(${weakVerbs.join('|')})\\b`, 'gi')) || []).length;

  if (weakVerbCount > 0) {
    score -= 15;
    findings.push(`Found ${weakVerbCount} instances of weak action verbs`);
    recommendations.push({
      priority: 'high',
      category: 'Work Experience',
      suggestion: 'Replace weak verbs with strong action verbs',
      example: '"Helped with" → "Led"\n"Worked on" → "Architected"\n"Involved in" → "Spearheaded"',
      impact: 'Makes achievements sound more impactful and authoritative',
    });
  }

  // Check for job titles and companies
  const hasJobTitles = /[A-Z][a-z]+ (?:Engineer|Developer|Manager|Lead|Director|Analyst|Architect)/i.test(experience);
  if (!hasJobTitles) {
    score -= 10;
    findings.push('Unclear job titles or positions');
    recommendations.push({
      priority: 'medium',
      category: 'Work Experience',
      suggestion: 'Clearly state job titles and companies',
      example: 'Software Engineer at Google (2022-Present)',
      impact: 'Helps recruiters understand career progression',
    });
  }

  return {
    sectionName: 'Work Experience',
    sectionScore: Math.max(0, score),
    status: score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'fair' : score >= 20 ? 'poor' : 'critical',
    findings,
    recommendations,
  };
}

function scoreEducation(education: string): SectionRecommendation {
  const findings: string[] = [];
  const recommendations: RecommendationItem[] = [];
  let score = 100;

  if (!education || education.trim().length === 0) {
    score = 0;
    findings.push('Missing education section');
    recommendations.push({
      priority: 'high',
      category: 'Education',
      suggestion: 'Add your educational background',
      example: 'Bachelor of Science in Computer Science\nUniversity of Technology (Graduated May 2020)\nGPA: 3.8/4.0',
      impact: 'Establishes academic credentials and field of study',
    });
    return {
      sectionName: 'Education',
      sectionScore: score,
      status: 'critical',
      findings,
      recommendations,
    };
  }

  // Check for degree type
  const hasDegree = /bachelor|master|phd|diploma|associate|certification/i.test(education);
  if (!hasDegree) {
    score -= 20;
    findings.push('Missing degree type');
    recommendations.push({
      priority: 'high',
      category: 'Education',
      suggestion: 'Specify degree type (B.S., M.S., B.A., etc.)',
      example: 'Bachelor of Science in Computer Science',
      impact: 'Clarifies educational qualification level',
    });
  }

  // Check for institution name
  const hasInstitution = /university|college|school|institute|academy/i.test(education);
  if (!hasInstitution) {
    score -= 20;
    findings.push('Missing institution name');
    recommendations.push({
      priority: 'high',
      category: 'Education',
      suggestion: 'Clearly state the institution name',
      example: 'University of California, Berkeley',
      impact: 'Recruiters need to verify credentials',
    });
  }

  // Check for graduation year
  const hasYear = /\b(19|20)\d{2}\b/.test(education);
  if (!hasYear) {
    score -= 15;
    findings.push('Missing graduation year');
    recommendations.push({
      priority: 'medium',
      category: 'Education',
      suggestion: 'Add graduation year or expected graduation date',
      example: 'Graduated: May 2020 or Expected: May 2025',
      impact: 'Helps recruiters understand timeline',
    });
  }

  // Check for additional details (GPA, honors, etc.)
  const hasDetails = /gpa|honors|dean|cum laude|distinction|award/i.test(education);
  if (!hasDetails && hasInstitution && hasDegree) {
    score -= 10;
    findings.push('Missing additional academic details');
    recommendations.push({
      priority: 'low',
      category: 'Education',
      suggestion: 'Add GPA (if 3.5+), honors, or distinctions',
      example: 'GPA: 3.8/4.0 | Summa Cum Laude',
      impact: 'Provides additional academic credibility',
    });
  }

  return {
    sectionName: 'Education',
    sectionScore: Math.max(0, score),
    status: score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'fair' : 'poor',
    findings,
    recommendations,
  };
}

function scoreSkills(skills: string): SectionRecommendation {
  const findings: string[] = [];
  const recommendations: RecommendationItem[] = [];
  let score = 100;

  if (!skills || skills.trim().length === 0) {
    score = 0;
    findings.push('Missing skills section');
    recommendations.push({
      priority: 'high',
      category: 'Technical Skills',
      suggestion: 'Add a dedicated technical skills section',
      example: 'Programming: JavaScript, Python, Java\nFrameworks: React, Node.js, Django\nDatabases: PostgreSQL, MongoDB\nTools: Git, Docker, AWS',
      impact: 'Makes skills scannable for ATS and recruiters',
    });
    return {
      sectionName: 'Technical Skills',
      sectionScore: score,
      status: 'critical',
      findings,
      recommendations,
    };
  }

  // Count unique skills
  const skillList = skills.split(/[,|•\n-]/).filter(s => s.trim().length > 0);
  const uniqueSkillCount = new Set(skillList).size;

  if (uniqueSkillCount < 5) {
    score -= 30;
    findings.push(`Only ${uniqueSkillCount} unique skills listed`);
    recommendations.push({
      priority: 'critical',
      category: 'Technical Skills',
      suggestion: 'Expand skills list to include 15-20+ relevant technologies',
      example: 'Group by category: Languages, Frameworks, Tools, Databases',
      impact: 'Comprehensive skill display improves job matching',
    });
  } else if (uniqueSkillCount < 10) {
    score -= 15;
    findings.push(`Only ${uniqueSkillCount} skills - consider adding more`);
    recommendations.push({
      priority: 'medium',
      category: 'Technical Skills',
      suggestion: 'Add more relevant technical skills (target: 15-20)',
      impact: 'Better coverage of job requirements',
    });
  }

  // Check for skill categorization
  const hasCategories = /languages?:|frameworks?:|tools?:|databases?:/i.test(skills);
  if (!hasCategories && uniqueSkillCount > 10) {
    score -= 10;
    findings.push('Skills not organized by category');
    recommendations.push({
      priority: 'medium',
      category: 'Technical Skills',
      suggestion: 'Organize skills by category for better readability',
      example: 'Languages: Python, JavaScript\nFrameworks: React, Django\nTools: Git, Docker',
      impact: 'Improves readability and ATS parsing',
    });
  }

  // Check for proficiency levels
  const hasProficiency = /beginner|intermediate|advanced|expert|proficient/i.test(skills);
  if (!hasProficiency && uniqueSkillCount > 5) {
    score -= 5;
    findings.push('No proficiency levels indicated');
    recommendations.push({
      priority: 'low',
      category: 'Technical Skills',
      suggestion: 'Consider adding proficiency levels (optional)',
      example: 'React (Expert), Python (Advanced), AWS (Intermediate)',
      impact: 'Helps recruiters understand expertise depth',
    });
  }

  return {
    sectionName: 'Technical Skills',
    sectionScore: Math.max(0, score),
    status: score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'fair' : score >= 20 ? 'poor' : 'critical',
    findings,
    recommendations,
  };
}

function scoreProjects(projects: string): SectionRecommendation {
  const findings: string[] = [];
  const recommendations: RecommendationItem[] = [];
  let score = 50; // Projects section is optional but valuable

  if (!projects || projects.trim().length === 0) {
    score = 0;
    findings.push('No projects section found');
    recommendations.push({
      priority: 'medium',
      category: 'Projects',
      suggestion: 'Add a projects section showcasing your work',
      example: 'Project: E-Commerce Platform\nTechnologies: React, Node.js, MongoDB\nAchievements: 50K+ monthly active users, 99.9% uptime\n- Built full-stack application from scratch',
      impact: 'Demonstrates practical application of skills',
    });
    return {
      sectionName: 'Projects',
      sectionScore: score,
      status: 'fair',
      findings,
      recommendations,
    };
  }

  // Count projects
  const projectCount = (projects.match(/project:|^[A-Z][^:]*:/gmi) || []).length;
  if (projectCount < 2) {
    score -= 20;
    findings.push(`Only ${projectCount} project(s) listed`);
    recommendations.push({
      priority: 'high',
      category: 'Projects',
      suggestion: 'Add at least 2-3 significant projects',
      impact: 'Provides more evidence of practical skills',
    });
  }

  // Check for technologies mentioned
  const hasTech = /technology|technologies|tech|built with|using|stack|framework|language/i.test(projects);
  if (!hasTech) {
    score -= 15;
    findings.push('Missing technology details in projects');
    recommendations.push({
      priority: 'high',
      category: 'Projects',
      suggestion: 'Specify technologies used in each project',
      example: 'Technologies: React, Node.js, PostgreSQL, Docker',
      impact: 'Shows technical skill application',
    });
  }

  // Check for project links
  const hasLinks = /github|github\.com|link|url|deployed|demo/i.test(projects);
  if (!hasLinks) {
    score -= 15;
    findings.push('Missing project links or demos');
    recommendations.push({
      priority: 'medium',
      category: 'Projects',
      suggestion: 'Include GitHub links or live demos',
      example: 'GitHub: github.com/username/project | Live: example.com',
      impact: 'Allows recruiters to review actual code and work',
    });
  }

  // Check for impact/achievements
  const hasImpact = /users|downloads|stars|performance|improved|optimized|achieved/i.test(projects);
  if (!hasImpact) {
    score -= 15;
    findings.push('Project descriptions lack impact metrics');
    recommendations.push({
      priority: 'medium',
      category: 'Projects',
      suggestion: 'Add metrics and impact of each project',
      example: 'Achieved 50K+ downloads | Optimized performance by 40%',
      impact: 'Quantifies project success and value',
    });
  }

  return {
    sectionName: 'Projects',
    sectionScore: Math.max(0, score),
    status: score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'fair' : 'poor',
    findings,
    recommendations,
  };
}

function scoreCertifications(certifications: string): SectionRecommendation {
  const findings: string[] = [];
  const recommendations: RecommendationItem[] = [];
  let score = 50; // Certifications are optional but valuable

  if (!certifications || certifications.trim().length === 0) {
    findings.push('No certifications section found');
    recommendations.push({
      priority: 'low',
      category: 'Certifications & Awards',
      suggestion: 'Add relevant certifications if you have them',
      example: 'AWS Certified Solutions Architect\nGoogle Cloud Professional Data Engineer\nScrum Master (CSM)',
      impact: 'Demonstrates additional qualifications and commitment',
    });
    return {
      sectionName: 'Certifications & Awards',
      sectionScore: score,
      status: 'fair',
      findings,
      recommendations,
    };
  }

  // Count certifications
  const certCount = (certifications.match(/certification:|certified|award:|license:/gi) || []).length + 1;

  // Check for certificate details
  const hasDetails = /issued|date|provider|issuer|expires|valid/i.test(certifications);
  if (!hasDetails) {
    score -= 10;
    findings.push('Missing certification dates or issuers');
    recommendations.push({
      priority: 'low',
      category: 'Certifications & Awards',
      suggestion: 'Include issuing organization and date',
      example: 'AWS Certified Solutions Architect (Issued: March 2023)',
      impact: 'Helps verify credentials',
    });
  }

  return {
    sectionName: 'Certifications & Awards',
    sectionScore: Math.max(0, score),
    status: score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'fair' : 'poor',
    findings,
    recommendations,
  };
}

// ============================================================================
// FORMAT AND STRUCTURE CHECKS
// ============================================================================

function checkFormatIssues(content: string): string[] {
  const issues: string[] = [];

  // Check for length
  const words = content.split(/\s+/).length;
  const pages = Math.ceil(words / 250);
  if (pages > 2) {
    issues.push('Resume exceeds 2 pages - aim for 1-2 pages maximum');
  }

  // Check for consistency
  if (!/^[A-Z]/.test(content)) {
    issues.push('Resume does not start with proper capitalization');
  }

  // Check for contact info placement
  if (!/[\w.-]+@[\w.-]+\.\w+/.test(content.split('\n')[0])) {
    issues.push('Consider placing contact info at the top of resume');
  }

  // Check for proper spacing
  const doubleSpaces = (content.match(/\n\n\n/g) || []).length;
  if (doubleSpaces > 3) {
    issues.push('Remove excessive spacing between sections');
  }

  // Check for special characters or formatting issues
  if (/[<>{}[\]|\\]/g.test(content)) {
    issues.push('Remove special formatting characters that may not parse correctly');
  }

  // Check for dates consistency
  const datePattern = /\d{4}|\d{1,2}\/\d{1,2}|\d{1,2}-\d{1,2}/g;
  if (!datePattern.test(content)) {
    issues.push('Include dates for all work experience and education');
  }

  return issues;
}

// ============================================================================
// MAIN RECOMMENDATIONS GENERATION FUNCTION
// ============================================================================

export function generateRecommendations(resumeContent: string): RecommendationsReport {
  // Parse resume content
  const parsed = parseResumeContent(resumeContent);

  // Score each section
  const sections: SectionRecommendation[] = [
    scoreContactInfo(parsed.contactInfo),
    scoreSummary(parsed.summary),
    scoreExperience(parsed.experience),
    scoreEducation(parsed.education),
    scoreSkills(parsed.skills),
    scoreProjects(parsed.projects),
    scoreCertifications(parsed.certifications),
  ];

  // Calculate overall score
  const sectionScores = sections.reduce((acc, section) => {
    acc[section.sectionName] = section.sectionScore;
    return acc;
  }, {} as Record<string, number>);

  const overallScore = Math.round(
    sections.reduce((sum, s) => sum + s.sectionScore, 0) / sections.length
  );

  // Collect top priorities and quick wins
  const allRecommendations = sections.flatMap(s => s.recommendations);
  const topPriorities = allRecommendations
    .filter(r => r.priority === 'critical' || r.priority === 'high')
    .slice(0, 5);

  const quickWins = allRecommendations
    .filter(r => r.priority === 'low' || r.priority === 'medium')
    .filter(r => r.impact && r.impact.length < 100)
    .slice(0, 3);

  // Check for format issues
  const formatIssues = checkFormatIssues(resumeContent);

  return {
    overallScore,
    sectionScores,
    sections,
    topPriorities,
    quickWins,
    formatIssues,
    generatedAt: new Date(),
  };
}

// ============================================================================
// HELPER: Generate formatted recommendations text
// ============================================================================

export function formatRecommendationsAsText(report: RecommendationsReport): string {
  const lines: string[] = [];

  lines.push(`RESUME RECOMMENDATIONS REPORT`);
  lines.push(`Generated: ${report.generatedAt.toLocaleDateString()}`);
  lines.push(`Overall Score: ${report.overallScore}/100\n`);

  // Section scores
  lines.push(`SECTION SCORES:`);
  Object.entries(report.sectionScores).forEach(([section, score]) => {
    lines.push(`  ${section}: ${score}/100`);
  });
  lines.push('');

  // Top priorities
  if (report.topPriorities.length > 0) {
    lines.push(`TOP PRIORITIES (${report.topPriorities.length}):`);
    report.topPriorities.forEach((rec, i) => {
      lines.push(`\n  ${i + 1}. ${rec.suggestion}`);
      if (rec.example) lines.push(`     Example: ${rec.example}`);
      lines.push(`     Impact: ${rec.impact}`);
    });
    lines.push('');
  }

  // Quick wins
  if (report.quickWins.length > 0) {
    lines.push(`QUICK WINS (${report.quickWins.length}):`);
    report.quickWins.forEach((rec, i) => {
      lines.push(`\n  ${i + 1}. ${rec.suggestion}`);
      if (rec.example) lines.push(`     Example: ${rec.example}`);
    });
    lines.push('');
  }

  // Format issues
  if (report.formatIssues.length > 0) {
    lines.push(`FORMAT ISSUES (${report.formatIssues.length}):`);
    report.formatIssues.forEach((issue, i) => {
      lines.push(`  ${i + 1}. ${issue}`);
    });
    lines.push('');
  }

  return lines.join('\n');
}

// ============================================================================
// HELPER: Get recommendations by priority
// ============================================================================

export function getRecommendationsByPriority(report: RecommendationsReport) {
  const allRecs = report.sections.flatMap(s => s.recommendations);

  return {
    critical: allRecs.filter(r => r.priority === 'critical'),
    high: allRecs.filter(r => r.priority === 'high'),
    medium: allRecs.filter(r => r.priority === 'medium'),
    low: allRecs.filter(r => r.priority === 'low'),
  };
}
