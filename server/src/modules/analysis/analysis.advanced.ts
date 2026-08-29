/**
 * Advanced Resume Analysis Engine - v3 (Stricter Scoring)
 * 4-Pillar Scoring System:
 * - Keywords & Skills (40%)
 * - Section Completeness (30%)
 * - Years of Experience (15%)
 * - Resume Health & Quality (15%)
 *
 * Expected score for ideal resume: 80-90% (stricter evaluation)
 * Scoring uses weighted component analysis with realistic thresholds.
 */

export interface AnalysisCheck {
  category: string;
  name: string;
  score: number;
  maxScore: number;
  feedback: string[];
  weight: number;
}

export interface PillarScore {
  name: string;
  score: number;
  maxScore: number;
  percentage: number;
  weight: number;
  breakdown: { label: string; value: number }[];
}

export interface DetailedAnalysis {
  overallScore: number;
  atsScore: number;
  healthScore: number;
  checks: AnalysisCheck[];
  prioritizedSuggestions: string[];
  strengths: string[];
  weaknesses: string[];
  pillarScores?: PillarScore[];
  scoreExplanation?: string;
}

// ============================================================================
// WEAK ACTION VERBS DETECTION (Check 1)
// ============================================================================
const WEAK_VERBS = [
  'helped', 'assisted', 'involved', 'participated', 'responsible for',
  'worked on', 'handled', 'did', 'made', 'tried', 'attempted',
  'supported', 'contributed to', 'engaged in', 'took part in'
];

const STRONG_VERBS = [
  'led', 'spearheaded', 'architected', 'engineered', 'orchestrated',
  'accelerated', 'transformed', 'revolutionized', 'optimized', 'streamlined',
  'scaled', 'launched', 'executed', 'pioneered', 'established', 'implemented',
  'designed', 'developed', 'built', 'created', 'delivered', 'drove'
];

export function checkWeakActionVerbs(content: string): AnalysisCheck {
  // Validation
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    console.warn('[DEBUG-VERBS] Empty content provided');
    return {
      category: 'Impact & Achievements',
      name: 'Weak Action Verbs',
      score: 5,
      maxScore: 10,
      feedback: ['No content to analyze for weak action verbs.'],
      weight: 1.5,
    };
  }

  const lines = content.split(/\n|\./).filter(l => l.trim().length > 0);
  const weakVerbLines: string[] = [];
  const suggestions: string[] = [];

  lines.forEach(line => {
    const lowerLine = line.toLowerCase().trim();
    WEAK_VERBS.forEach(verb => {
      if (lowerLine.startsWith(verb)) {
        weakVerbLines.push(line.trim());
        const replacement = STRONG_VERBS[Math.floor(Math.random() * STRONG_VERBS.length)];
        suggestions.push(`Replace "${verb}" with "${replacement}": "${line.trim().substring(0, 50)}..."`);
      }
    });
  });

  const score = Math.max(0, 10 - (weakVerbLines.length * 2));

  console.log(`[DEBUG-VERBS] Found ${weakVerbLines.length} weak verb instances`);

  return {
    category: 'Impact & Achievements',
    name: 'Weak Action Verbs',
    score: Math.min(score, 10),
    maxScore: 10,
    feedback: suggestions.length > 0
      ? suggestions.slice(0, 3)
      : ['Great job using strong action verbs! Your achievements sound impactful.'],
    weight: 1.5,
  };
}

// ============================================================================
// MISSING QUANTIFIABLE METRICS (Check 2)
// ============================================================================
export function checkQuantifiableMetrics(content: string): AnalysisCheck {
  // Validation
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    console.warn('[DEBUG-METRICS] Empty content provided');
    return {
      category: 'Impact & Achievements',
      name: 'Quantifiable Metrics',
      score: 0,
      maxScore: 10,
      feedback: ['No content to analyze for quantifiable metrics.'],
      weight: 1.8,
    };
  }

  const bullets = content.split(/\n-|\n•/).filter(b => b.trim());

  if (bullets.length === 0) {
    console.warn('[DEBUG-METRICS] No bullet points found');
    return {
      category: 'Impact & Achievements',
      name: 'Quantifiable Metrics',
      score: 3,
      maxScore: 10,
      feedback: ['No bullet points detected. Use bullet format for achievements.'],
      weight: 1.8,
    };
  }

  const bulletsWithoutMetrics: string[] = [];

  bullets.forEach(bullet => {
    const hasMetric = bullet.match(/\d+%|\$[\d,]+|\d+[\s,]\d{3,}|increased|decreased|improved|reduced|achieved|delivered|generated/gi);
    if (!hasMetric && bullet.length > 20) {
      bulletsWithoutMetrics.push(bullet.trim().substring(0, 50));
    }
  });

  const score = Math.max(0, 10 - (bulletsWithoutMetrics.length * 0.7));
  const percentageWithMetrics = ((bullets.length - bulletsWithoutMetrics.length) / Math.max(bullets.length, 1)) * 100;

  console.log(`[DEBUG-METRICS] ${Math.round(percentageWithMetrics)}% of bullets have metrics (${bullets.length - bulletsWithoutMetrics.length}/${bullets.length})`);

  return {
    category: 'Impact & Achievements',
    name: 'Quantifiable Metrics',
    score: Math.min(score, 10),
    maxScore: 10,
    feedback: [
      `${Math.round(percentageWithMetrics)}% of your bullet points include metrics or quantifiable results.`,
      'Add metrics like percentages, numbers, or dollar amounts to remaining achievements.',
      'Example: "Increased API response time by 40%" instead of "Improved API performance"',
    ],
    weight: 1.8,
  };
}

// ============================================================================
// PASSIVE VS ACTIVE VOICE (Check 3)
// ============================================================================
export function checkVoiceUsage(content: string): AnalysisCheck {
  const lines = content.split(/\n/).filter(l => l.trim());
  const passiveIndicators = [
    ' was ', ' were ', ' being ', ' been ', ' is ', ' are ',
    ' by me', ' by the team', ' by our team'
  ];

  let passiveCount = 0;
  lines.forEach(line => {
    passiveIndicators.forEach(indicator => {
      if (line.toLowerCase().includes(indicator)) passiveCount++;
    });
  });

  const activePercentage = ((lines.length - passiveCount) / lines.length) * 100;
  const score = Math.min(activePercentage / 10, 10);

  return {
    category: 'Brevity & Wording',
    name: 'Active Voice Usage',
    score: Math.round(score),
    maxScore: 10,
    feedback: [
      `${Math.round(activePercentage)}% of your content uses active voice.`,
      'Target: 90%+ active voice for stronger communication.',
      'Example: "Led team" instead of "Was responsible for leading team"',
    ],
    weight: 1.3,
  };
}

// ============================================================================
// FILLER WORDS DETECTION (Check 4)
// ============================================================================
const FILLER_WORDS = [
  'very', 'really', 'just', 'quite', 'simply', 'basically', 'actually',
  'literally', 'absolutely', 'definitely', 'somewhat', 'rather', 'arguably'
];

export function checkFillerWords(content: string): AnalysisCheck {
  let fillerCount = 0;
  const lowerContent = content.toLowerCase();

  FILLER_WORDS.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = content.match(regex) || [];
    fillerCount += matches.length;
  });

  const score = Math.max(0, 10 - (fillerCount * 0.5));
  const feedback: string[] = [];

  if (fillerCount > 0) {
    feedback.push(`Found ${fillerCount} instances of filler words.`);
    feedback.push('Remove unnecessary qualifiers: "very good" → "excellent"');
    feedback.push('Be direct and confident in your achievements.');
  } else {
    feedback.push('Excellent! No unnecessary filler words detected.');
  }

  return {
    category: 'Brevity & Wording',
    name: 'Filler Words',
    score: Math.min(score, 10),
    maxScore: 10,
    feedback,
    weight: 1.2,
  };
}

// ============================================================================
// BULLET POINT LENGTH (Check 5)
// ============================================================================
export function checkBulletPointLength(content: string): AnalysisCheck {
  const bullets = content.split(/\n-|\n•/).filter(b => b.trim());
  const longBullets = bullets.filter(b => b.split(/\s+/).length > 20);
  const shortBullets = bullets.filter(b => b.split(/\s+/).length < 3);

  const score = Math.min(
    10,
    10 - (longBullets.length * 1.5) - (shortBullets.length * 0.5)
  );

  return {
    category: 'Brevity & Wording',
    name: 'Bullet Point Length',
    score: Math.max(score, 0),
    maxScore: 10,
    feedback: [
      `${longBullets.length} bullet points exceed recommended length (should be 1-2 lines).`,
      `${shortBullets.length} bullet points are too brief.`,
      'Ideal: 15-20 words per bullet point (1-2 lines max)',
    ],
    weight: 1.4,
  };
}

// ============================================================================
// SECTION COMPLETENESS (Check 6)
// ============================================================================
export function checkSectionCompleteness(content: string): AnalysisCheck {
  const lowerContent = content.toLowerCase();
  // EXPANDED PATTERNS - less strict, handle more variations
  const sections = {
    'Contact Info': /\b[\w.-]+@[\w.-]+\.\w+\b|phone|contact|linkedin|github|portfolio|email|\+[\d\s\-()]{8,}/i,
    'Professional Summary': /(?:professional\s+)?summary|objective|profile|about(?:\s+me)?|introduction|executive\s+summary|career\s+summary/i,
    'Experience': /(?:professional\s+)?experience|employment|work\s+history|work\s+experience|career(?:\s+history)?|professional\s+background|employment\s+history/i,
    'Skills': /(?:technical\s+)?skills?|expertise|competencies|proficiencies|technical\s+expertise|core\s+competencies|technical\s+skills/i,
    'Education': /education|degree|university|college|institute|academic|b\.tech|b\.e|b\.a|m\.s|m\.tech|b\.sc|m\.sc|b\.com|m\.com|diploma|graduate|undergraduate/i,
    'Certifications': /certification|cert(?:ified)?|license|aws|azure|gcp|scrum|cissp|training|professional\s+development/i,
    'Projects': /projects?|portfolio|showcases?|work\s+samples|case\s+studies/i,
    'Achievements': /achievements?|awards?|recognition|honors|accomplishments/i,
  };

  let foundSections = 0;
  const feedback: string[] = [];
  const missingSections: string[] = [];

  Object.entries(sections).forEach(([section, pattern]) => {
    if (pattern.test(content)) {
      foundSections++;
    } else if (section !== 'Certifications' && section !== 'Achievements' && section !== 'Projects') {
      missingSections.push(section);
    }
  });

  const score = (foundSections / 5) * 10;

  if (missingSections.length > 0) {
    feedback.push(`Missing sections: ${missingSections.join(', ')}`);
  }
  feedback.push(`Has ${foundSections}/${Math.min(foundSections, 8)} key sections (target: 5+)`);

  return {
    category: 'Formatting & Structure',
    name: 'Section Completeness',
    score: Math.round(score),
    maxScore: 10,
    feedback,
    weight: 1.6,
  };
}

// ============================================================================
// RESUME LENGTH (Check 7)
// ============================================================================
export function checkResumeLength(content: string): AnalysisCheck {
  const words = content.split(/\s+/).length;
  const lines = content.split(/\n/).length;
  const estimatedPages = Math.ceil(words / 250); // ~250 words per page

  let score = 10;
  let feedback: string[] = [];

  if (estimatedPages < 1) {
    score = 4;
    feedback = ['Resume is too brief. Add more details about experience, skills, and achievements.'];
  } else if (estimatedPages === 1) {
    score = 10;
    feedback = ['Perfect length for most roles (1 page).'];
  } else if (estimatedPages === 2) {
    score = 8;
    feedback = ['Good length for experienced professionals (2 pages).'];
  } else {
    score = 4;
    feedback = [`Your resume is ${estimatedPages} pages. Consider trimming to 1-2 pages for better readability.`];
  }

  return {
    category: 'Formatting & Structure',
    name: 'Resume Length',
    score,
    maxScore: 10,
    feedback: [
      `Word count: ${words} (~${estimatedPages} page${estimatedPages !== 1 ? 's' : ''})`,
      ...feedback,
    ],
    weight: 1.2,
  };
}

// ============================================================================
// KEYWORD RELEVANCE (Check 8)
// ============================================================================
export function checkKeywordRelevance(resumeContent: string, jobDescription: string): AnalysisCheck {
  // Validation
  if (!resumeContent || typeof resumeContent !== 'string' || !jobDescription || typeof jobDescription !== 'string') {
    console.warn('[DEBUG-KW] Invalid resume or job description provided');
    return {
      category: 'Skills & Keywords',
      name: 'Keyword Relevance',
      score: 0,
      maxScore: 10,
      feedback: ['Unable to analyze keyword relevance due to missing job description.'],
      weight: 2.0,
    };
  }

  // Extract keywords from job description using word boundary matching
  const extractKeywords = (text: string): string[] => {
    // Remove common stop words that don't carry meaning
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
      'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
      'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must',
      'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
      'as', 'if', 'while', 'so', 'which', 'who', 'what', 'when', 'where', 'why', 'how'
    ]);

    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    return [...new Set(words.filter(w => w.length > 2 && !stopWords.has(w)))];
  };

  const jobKeywords = extractKeywords(jobDescription);
  const resumeKeywords = extractKeywords(resumeContent);

  if (jobKeywords.length === 0) {
    console.warn('[DEBUG-KW] No meaningful keywords extracted from job description');
    return {
      category: 'Skills & Keywords',
      name: 'Keyword Relevance',
      score: 5,
      maxScore: 10,
      feedback: ['Job description is too short to analyze keyword relevance.'],
      weight: 2.0,
    };
  }

  // Count keyword matches (how many job keywords appear in resume)
  const matchedKeywords = jobKeywords.filter(keyword =>
    resumeKeywords.includes(keyword)
  );

  const matchPercentage = (matchedKeywords.length / jobKeywords.length) * 100;
  const score = Math.min(matchPercentage / 10, 10);

  console.log(`[DEBUG-KW] Matched ${matchedKeywords.length}/${jobKeywords.length} keywords (${matchPercentage.toFixed(1)}%)`);

  return {
    category: 'Skills & Keywords',
    name: 'Keyword Relevance',
    score: Math.round(score),
    maxScore: 10,
    feedback: [
      `${Math.round(matchPercentage)}% keyword match with job description.`,
      'Incorporate more job-specific terminology and industry terms.',
      'Target: 70%+ keyword alignment with target job postings',
    ],
    weight: 2.0,
  };
}

// ============================================================================
// EXPERIENCE PROGRESSION (Check 9)
// ============================================================================
export function checkCareerProgression(content: string): AnalysisCheck {
  const titlePattern = /([A-Z][a-z]+\s+(Engineer|Developer|Manager|Lead|Senior|Principal|Director|Manager))/gi;
  const titles = content.match(titlePattern) || [];

  const juniorKeywords = /junior|intern|entry|associate/i;
  const midKeywords = /senior|specialist|architect/i;
  const leaderKeywords = /lead|principal|director|manager|head/i;

  let progression = 0;
  if (titles.some(t => juniorKeywords.test(t))) progression++;
  if (titles.some(t => midKeywords.test(t))) progression++;
  if (titles.some(t => leaderKeywords.test(t))) progression++;

  const score = (progression / 3) * 10;

  return {
    category: 'Experience Assessment',
    name: 'Career Progression',
    score: Math.round(score),
    maxScore: 10,
    feedback: [
      `Clear career progression detected: ${progression}/3 levels shown.`,
      titles.length > 0 ? `Job titles found: ${titles.slice(0, 3).join(', ')}` : 'Add specific job titles.',
    ],
    weight: 1.5,
  };
}

// ============================================================================
// ACHIEVEMENT DENSITY (Check 10)
// ============================================================================
export function checkAchievementDensity(content: string): AnalysisCheck {
  const achievementKeywords = [
    'increased', 'decreased', 'improved', 'optimized', 'reduced', 'saved',
    'accelerated', 'streamlined', 'eliminated', 'achieved', 'exceeded',
    'delivered', 'launched', 'transformed', 'pioneered'
  ];

  const sentences = content.split(/[.!?]\s+/);
  let achievementCount = 0;

  sentences.forEach(sentence => {
    if (achievementKeywords.some(keyword => sentence.toLowerCase().includes(keyword))) {
      achievementCount++;
    }
  });

  const achievementPercentage = (achievementCount / sentences.length) * 100;
  const score = Math.min(achievementPercentage / 10, 10);

  return {
    category: 'Experience Assessment',
    name: 'Achievement Density',
    score: Math.round(score),
    maxScore: 10,
    feedback: [
      `${Math.round(achievementPercentage)}% of sentences focus on achievements.`,
      'Target: 70%+ achievement-oriented language.',
      'Use impact words: increased, improved, optimized, delivered.',
    ],
    weight: 1.7,
  };
}

// ============================================================================
// PILLAR 1: KEYWORDS & SKILLS (40% weight)
// Stricter scoring: requires 70%+ keyword match, 60%+ skills coverage, 10+ skills
// ============================================================================
export function scorePillar1_Keywords(
  resumeContent: string,
  jobDescription: string,
  resumeSkills: string[]
): PillarScore {
  const breakdown = [];

  // Component 1: Keyword Relevance (50% of pillar = 5 points max)
  // Strict threshold: requires 70%+ match for full score
  const keywordCheck = checkKeywordRelevance(resumeContent, jobDescription);
  const keywordPercentage = (keywordCheck.score / 10) * 100;
  let keywordScore = 0;
  if (keywordPercentage >= 70) keywordScore = 5;
  else if (keywordPercentage >= 50) keywordScore = 3.5;
  else if (keywordPercentage >= 30) keywordScore = 2;
  else keywordScore = Math.max(0, (keywordPercentage / 30) * 2);

  breakdown.push({
    label: 'Keyword Relevance (70%+ needed)',
    value: Math.round(keywordScore * 10) / 10
  });

  // Component 2: Technical Skills Coverage (35% of pillar = 3.5 points max)
  // Strict threshold: requires 60%+ match for full score
  const jobSkills = extractSkillsFromText(jobDescription);
  const matchedSkills = resumeSkills.filter(skill =>
    jobSkills.some(js => js.toLowerCase() === skill.toLowerCase())
  );
  let skillsCoverage = 0;
  if (jobSkills.length > 0) {
    const coveragePercentage = (matchedSkills.length / jobSkills.length) * 100;
    if (coveragePercentage >= 60) skillsCoverage = 3.5;
    else if (coveragePercentage >= 40) skillsCoverage = 2.3;
    else if (coveragePercentage >= 20) skillsCoverage = 1.2;
    else skillsCoverage = (coveragePercentage / 20) * 1.2;
  } else {
    skillsCoverage = 1.75; // Neutral score if no job skills provided
  }
  breakdown.push({
    label: 'Skills Coverage (60%+ needed)',
    value: Math.round(skillsCoverage * 10) / 10
  });

  // Component 3: Skill Diversity (15% of pillar = 1.5 points max)
  // Strict threshold: requires 10+ skills for full score
  let diversityBonus = 0;
  if (resumeSkills.length >= 10) diversityBonus = 1.5;
  else if (resumeSkills.length >= 7) diversityBonus = 1;
  else if (resumeSkills.length >= 5) diversityBonus = 0.5;
  else diversityBonus = (resumeSkills.length / 10) * 1.5;

  breakdown.push({
    label: 'Skill Diversity (10+ needed)',
    value: Math.round(diversityBonus * 10) / 10
  });

  const totalScore = Math.min(keywordScore + skillsCoverage + diversityBonus, 10);
  const maxScore = 10;

  console.log(`[DEBUG-P1] Keywords: ${keywordScore.toFixed(2)}, Skills: ${skillsCoverage.toFixed(2)}, Diversity: ${diversityBonus.toFixed(2)} = ${totalScore.toFixed(2)}`);

  return {
    name: 'Keywords & Skills Match (40%)',
    score: totalScore,
    maxScore,
    percentage: Math.round((totalScore / maxScore) * 1000) / 10,
    weight: 0.40,
    breakdown,
  };
}

// Helper function to extract skills from text
function extractSkillsFromText(text: string): string[] {
  // Validation: check for null/undefined/empty
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    console.log('[DEBUG-SKILLS] Empty or invalid text passed to extractSkillsFromText');
    return [];
  }

  const skillKeywords = [
    // Programming Languages (10)
    'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust', 'php', 'kotlin',
    // Frontend Frameworks (8)
    'react', 'vue', 'angular', 'svelte', 'next.js', 'nuxt', 'ember', 'backbone',
    // Backend Frameworks (12)
    'node.js', 'express', 'django', 'flask', 'spring', 'spring boot', 'fastapi', 'laravel',
    'rails', 'asp.net', 'gradle', 'maven',
    // Databases (10)
    'mongodb', 'postgresql', 'mysql', 'redis', 'cassandra', 'dynamodb', 'firebase', 'neo4j',
    'elasticsearch', 'memcached',
    // Cloud Platforms (9)
    'aws', 'azure', 'gcp', 'heroku', 'vercel', 'netlify', 'digital ocean', 'linode', 'vultr',
    // DevOps & Tools (15)
    'docker', 'kubernetes', 'jenkins', 'gitlab', 'github', 'bitbucket', 'terraform', 'ansible',
    'prometheus', 'grafana', 'datadog', 'splunk', 'elk', 'new relic', 'circleci',
    // Version Control (4)
    'git', 'svn', 'mercurial', 'perforce',
    // API & Architecture (8)
    'rest', 'graphql', 'grpc', 'soap', 'microservices', 'serverless', 'api gateway', 'oauth',
    // Testing (10)
    'jest', 'mocha', 'pytest', 'junit', 'testng', 'cypress', 'selenium', 'rspec', 'xunit', 'karma',
    // Mobile (8)
    'react native', 'flutter', 'swift', 'kotlin', 'objective-c', 'xamarin', 'cordova', 'ionic',
    // Data & AI (12)
    'tensorflow', 'pytorch', 'scikit-learn', 'pandas', 'numpy', 'spark', 'hadoop', 'kafka',
    'airflow', 'dbt', 'sql', 'machine learning',
    // Web Technologies (10)
    'html', 'css', 'sass', 'less', 'webpack', 'vite', 'rollup', 'babel', 'tailwind', 'bootstrap',
    // Other Tech (15)
    'linux', 'windows', 'macos', 'unix', 'bash', 'shell', 'powershell', 'json', 'xml', 'yaml',
    'jwt', 'oauth2', 'ssl', 'tls', 'https', 'websockets',
    // Soft Skills & Concepts (20)
    'agile', 'scrum', 'kanban', 'leadership', 'communication', 'problem solving', 'critical thinking',
    'project management', 'product management', 'business analysis', 'data analysis', 'system design',
    'architecture', 'optimization', 'refactoring', 'debugging', 'documentation', 'mentoring',
    'collaboration', 'teamwork'
  ];

  const foundSkills = new Set<string>();
  const lowerText = text.toLowerCase();

  skillKeywords.forEach(skill => {
    // Use word boundary check to avoid partial matches (e.g., "java" should not match "javascript")
    const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    if (regex.test(lowerText)) {
      foundSkills.add(skill);
    }
  });

  return Array.from(foundSkills);
}

// ============================================================================
// PILLAR 2: SECTION COMPLETENESS (30% weight)
// Stricter scoring: requires ALL 5 key sections, contact complete, summary detailed
// ============================================================================
export function scorePillar2_Sections(content: string): PillarScore {
  const breakdown = [];
  const lowerContent = content.toLowerCase();

  // Contact Information (20% of pillar = 2 points)
  // Requires: email + phone + (LinkedIn or GitHub) + location
  let contactScore = 0;
  const hasEmail = /\b[\w.-]+@[\w.-]+\.\w+\b/.test(content);
  const hasPhone = /\+?[\d\s\-\(\)]{10,}|\+?1?\s*\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})|\d{10,}/.test(content);
  const hasLinkedInOrGithub = /(linkedin|github|portfolio|github\.com|linkedin\.com)/i.test(content);
  const hasLocation = /(city|location|based|jaipur|mumbai|delhi|bangalore|pune|hyderabad|nyc|sf|chicago|los angeles|boston|seattle|raj|maharashtra|karnataka|tamil nadu|uttar pradesh)/i.test(content);

  if (hasEmail) contactScore += 0.5;
  if (hasPhone) contactScore += 0.5;
  if (hasLinkedInOrGithub) contactScore += 0.5;
  if (hasLocation) contactScore += 0.5;

  const contactPoints = Math.min(contactScore, 2);
  breakdown.push({
    label: 'Contact Info (Email+Phone+LinkedIn+Location)',
    value: Math.round(contactPoints * 10) / 10
  });

  // Professional Summary (17% of pillar = 1.7 points)
  // Requires: summary section + 30+ words + mentions years/expertise
  let summaryScore = 0;
  const hasSummary = /(professional\s*)?summary|objective|profile|about/i.test(content);
  const summaryMatch = content.match(/(?:professional\s*)?(?:summary|objective|profile|about)([\s\S]*?)(?=(?:\n[A-Z]|\n\n|experience|education|skills|project|achievement|\Z))/i);
  const summaryWordCount = summaryMatch ? summaryMatch[1].split(/\s+/).length : 0;
  const hasSummaryExpertise = summaryMatch && /\d+\+?\s*(?:years?|y|yrs?)|(?:years?\s+of\s+)?(?:experience|expertise)|expert|proficient|lead|specialized|skilled/i.test(summaryMatch[1]);

  if (hasSummary) summaryScore += 0.5;
  if (summaryWordCount >= 30) summaryScore += 0.6;
  if (summaryWordCount >= 80) summaryScore += 0.2; // Bonus for longer summary
  if (hasSummaryExpertise) summaryScore += 0.6;

  const summaryPoints = Math.min(summaryScore, 1.7);
  breakdown.push({
    label: 'Professional Summary (30+ words, expertise)',
    value: Math.round(summaryPoints * 10) / 10
  });

  // Experience Section (35% of pillar = 3.5 points)
  // Requires: experience title + 2+ positions + metrics + strong verbs
  let experienceScore = 0;
  const hasExperienceSection = /experience|employment|work\s+history|professional\s+background/i.test(content);

  // More flexible position detection: look for job titles (capitalized words followed by dates or company names)
  const positions = (content.match(/(?:^|\n)[A-Z][A-Za-z\s]{5,50}?(?:at|@|-|,|–|\()\s*(?:[A-Z][A-Za-z\s]*|\d{4})/gm) || []).length;

  const metricsCount = (content.match(/\d+%|\$[\d,]+|\d+[\s,]\d{3,}|increased|decreased|improved|achieved|delivered|generated|reduced|saved/gi) || []).length;
  const hasStrongVerbs = /(led|spearheaded|architected|engineered|orchestrated|accelerated|optimized|transformed|designed|developed|built|created|delivered|drove|managed|directed|launched)/i.test(content);

  if (hasExperienceSection) experienceScore += 0.7;
  if (positions >= 2) experienceScore += 0.9;
  if (metricsCount >= 5) experienceScore += 1.0;
  if (hasStrongVerbs) experienceScore += 0.9;

  const experiencePoints = Math.min(experienceScore, 3.5);
  breakdown.push({
    label: 'Experience (2+ roles, metrics, strong verbs)',
    value: Math.round(experiencePoints * 10) / 10
  });

  // Skills Section (17% of pillar = 1.7 points)
  // Requires: skills section + 10+ skills (more flexible detection)
  let skillsScore = 0;
  const hasSkillsSection = /(?:technical\s+)?skills?|expertise|proficiencies|competencies|technical\s+expertise/i.test(content);
  // Look for common skill keywords from tech industry
  const techSkillKeywords = /(javascript|typescript|python|java|react|node|express|mongodb|postgresql|aws|docker|kubernetes|git|html|css|sql)/gi;
  const skillMatches = (content.match(techSkillKeywords) || []).length;

  if (hasSkillsSection) skillsScore += 0.8;
  if (skillMatches >= 5) skillsScore += 0.5;
  if (skillMatches >= 10) skillsScore += 0.4; // Bonus for many technical skills

  const skillsPoints = Math.min(skillsScore, 1.7);
  breakdown.push({
    label: 'Skills Section (10+ skills listed)',
    value: Math.round(skillsPoints * 10) / 10
  });

  // Education Section (11% of pillar = 1.1 points)
  // Requires: education section + degree type + institution + graduation year
  let educationScore = 0;
  const hasEducationSection = /education|degree|university|college|institute|academic|b\.tech|b\.e|b\.a|m\.tech|m\.s|m\.ba/i.test(content);
  const hasDegreeType = /(bachelor|master|phd|b\.tech|b\.e|b\.s|b\.a|m\.s|m\.tech|m\.ba|m\.e|diploma|associate|btech|be|ba|ma|bsc|msc)/i.test(content);
  const hasInstitution = /university|college|institute|school|iit|nyu|stanford|harvard|mit|georgia tech|technical|engineering|polytechnic/i.test(content);
  const hasGraduationYear = /(?:graduation|passed|graduated|batch|year)?\s*(?::)?\s*\b(20\d{2}|19\d{2})\b|(?:20\d{2}|19\d{2})\s*(?:-\s*(?:present|current|now))?/i.test(content);

  if (hasEducationSection) educationScore += 0.4;
  if (hasDegreeType) educationScore += 0.3;
  if (hasInstitution) educationScore += 0.2;
  if (hasGraduationYear) educationScore += 0.2;

  const educationPoints = Math.min(educationScore, 1.1);
  breakdown.push({
    label: 'Education (Degree, Institution, Year)',
    value: Math.round(educationPoints * 10) / 10
  });

  const totalScore = Math.min(contactPoints + summaryPoints + experiencePoints + skillsPoints + educationPoints, 10);
  const maxScore = 10;

  console.log(`[DEBUG-P2] Contact: ${contactPoints.toFixed(2)}, Summary: ${summaryPoints.toFixed(2)}, Exp: ${experiencePoints.toFixed(2)}, Skills: ${skillsPoints.toFixed(2)}, Edu: ${educationPoints.toFixed(2)} = ${totalScore.toFixed(2)}`);

  return {
    name: 'Section Completeness (30%)',
    score: totalScore,
    maxScore,
    percentage: Math.round((totalScore / maxScore) * 1000) / 10,
    weight: 0.30,
    breakdown,
  };
}

// ============================================================================
// PILLAR 3: YEARS OF EXPERIENCE (15% weight)
// Stricter scoring: emphasizes reasonable experience + clear progression
// ============================================================================
export function scorePillar3_Experience(content: string): PillarScore {
  const breakdown = [];

  // Extract years of experience - EXPANDED FLEXIBLE PATTERNS
  const patterns = [
    /(\d+)\s*\+?\s*years?(?:\s+of\s+)?(?:experience|exp|yoe)/gi,  // "6 years of experience", "6+ years of experience"
    /(\d+)\s*(?:to|-|–)\s*(\d+)\s*(?:years?|yrs?)/gi,  // "6 to 7 years", "6-7 yrs", "6–10 years"
    /(\d+)\+?\s*(?:years?|yrs?|y)(?:\s+of\s+exp)?/gi,  // "6+ years", "6y", "6yrs", "6 yrs of exp"
    /experience\s*(?:of|:)?\s*(\d+)\s*years?/gi,  // "experience of 6 years", "experience: 6 years"
    /(\d+)\s*years?\s*(?:of\s+)?(?:professional|professional\s+)?experience/gi,  // "6 years of professional experience"
    /years?(?:\s+of\s+experience)?:\s*(\d+)\+?/gi,  // "Years: 6", "Years of experience: 6+"
  ];

  let experienceYears = 0;

  // Try each pattern to extract years
  for (const pattern of patterns) {
    const matches = content.match(pattern);
    if (matches && matches.length > 0) {
      matches.forEach(match => {
        const nums = match.match(/\d+/g);
        if (nums && nums.length > 0) {
          // For ranges like "6-7 years", take the max
          // For single values like "6 years", take that
          const extractedYears = nums.map(n => parseInt(n, 10));
          const maxYears = Math.max(...extractedYears);
          if (maxYears > 0 && maxYears < 100) { // Validate: 0-100 years is reasonable
            experienceYears = Math.max(experienceYears, maxYears);
          }
        }
      });
    }
    if (experienceYears > 0) break; // Use first successful pattern
  }

  // If no exact match found, try to find date ranges (employment duration)
  if (experienceYears === 0) {
    const datePattern = /(\d{4})\s*[-–]\s*(\d{4}|present|current|now)/gi;
    const dateMatches = content.match(datePattern);
    if (dateMatches) {
      dateMatches.forEach(dateRange => {
        const nums = dateRange.match(/\d{4}/g);
        if (nums && nums.length >= 1) {
          const startYear = parseInt(nums[0], 10);
          const endYear = nums[1] ? parseInt(nums[1], 10) : 2026;
          if (startYear > 1980 && startYear <= 2026) { // Validate year range
            const duration = Math.max(0, endYear - startYear);
            experienceYears = Math.max(experienceYears, duration);
          }
        }
      });
    }
  }

  console.log(`[DEBUG-P3] Extracted ${experienceYears} years of experience`);

  // Base score by experience level (60% of pillar = 6 points max)
  // STRICTER thresholds: ideal resumes need 10+ years
  let experienceScore = 0;
  if (experienceYears >= 15) experienceScore = 6;
  else if (experienceYears >= 10) experienceScore = 5.5;
  else if (experienceYears >= 7) experienceScore = 4.5;
  else if (experienceYears >= 5) experienceScore = 3.5;
  else if (experienceYears >= 3) experienceScore = 2;
  else if (experienceYears >= 1) experienceScore = 0.8;
  else experienceScore = 0;

  breakdown.push({
    label: `Experience Level (${experienceYears} years detected)`,
    value: Math.round(experienceScore * 10) / 10
  });

  // Career progression bonus (40% of pillar = 4 points max)
  // Requires: progression through at least 2 levels
  const juniorTitles = /(junior|intern|entry|associate|associate dev)/i;
  const midTitles = /(senior|specialist|architect|lead developer|tech lead)/i;
  const leaderTitles = /(lead|principal|director|manager|head|vp|cto|ceo)/i;

  let progressionLevels = 0;
  if (juniorTitles.test(content)) progressionLevels++;
  if (midTitles.test(content)) progressionLevels++;
  if (leaderTitles.test(content)) progressionLevels++;

  let progressionBonus = 0;
  if (progressionLevels >= 3) progressionBonus = 4;
  else if (progressionLevels === 2) progressionBonus = 2;
  else if (progressionLevels === 1) progressionBonus = 0.2;
  else progressionBonus = 0;

  breakdown.push({
    label: `Career Progression (${progressionLevels} levels detected)`,
    value: Math.round(progressionBonus * 10) / 10
  });

  const totalScore = Math.min(experienceScore + progressionBonus, 10);
  const maxScore = 10;

  console.log(`[DEBUG-P3] Experience score: ${experienceScore.toFixed(2)}, Progression bonus: ${progressionBonus.toFixed(2)} = ${totalScore.toFixed(2)}`);

  return {
    name: 'Years of Experience (15%)',
    score: totalScore,
    maxScore,
    percentage: Math.round((totalScore / maxScore) * 1000) / 10,
    weight: 0.15,
    breakdown,
  };
}

// ============================================================================
// PILLAR 4: RESUME HEALTH & QUALITY (15% weight)
// Stricter scoring: minimal weak verbs, strong metrics, professional formatting
// ============================================================================
export function scorePillar4_Health(content: string): PillarScore {
  const breakdown = [];

  // Component 1: Writing Quality (35% of pillar = 3.5 points)
  // Strict: NO weak verbs, NO filler words, mostly active voice
  let writingScore = 0;

  // Check strong action verbs vs weak verbs
  const weakVerbs = /(helped|assisted|participated|responsible for|worked on|tried|just|involved)/gi;
  const weakVerbCount = (content.match(weakVerbs) || []).length;
  if (weakVerbCount === 0) writingScore += 1.5;
  else if (weakVerbCount <= 1) writingScore += 0.8;
  else if (weakVerbCount <= 3) writingScore += 0.3;

  // Check filler words (strict)
  const fillerWords = /(very|really|quite|simply|basically|actually|literally)/gi;
  const fillerCount = (content.match(fillerWords) || []).length;
  if (fillerCount === 0) writingScore += 1.5;
  else if (fillerCount <= 1) writingScore += 0.8;
  else if (fillerCount <= 3) writingScore += 0.3;

  // Check active voice
  const passiveIndicators = /\s(was|were|is|are|been|being)\s/gi;
  const passiveCount = (content.match(passiveIndicators) || []).length;
  const lines = content.split('\n').length;
  const passiveRatio = passiveCount / Math.max(lines, 1);
  if (passiveRatio < 0.05) writingScore += 0.5;
  else if (passiveRatio < 0.1) writingScore += 0.3;

  const writingPoints = Math.min(writingScore, 3.5);
  breakdown.push({
    label: 'Writing Quality (No weak verbs/fillers, active voice)',
    value: Math.round(writingPoints * 10) / 10
  });

  // Component 2: Quantifiable Metrics (35% of pillar = 3.5 points)
  // Strict: 60%+ bullets with metrics, high achievement density
  let metricsScore = 0;

  // Achievement density (requires 50%+ of sentences)
  const achievementKeywords = /(increased|decreased|improved|optimized|reduced|saved|accelerated|delivered|launched|transformed|achieved|exceeded)/gi;
  const achievementCount = (content.match(achievementKeywords) || []).length;
  const sentences = Math.max(content.split(/[.!?]/).length, 1);
  const achievementDensity = achievementCount / sentences;
  if (achievementDensity >= 0.5) metricsScore += 1.75;
  else if (achievementDensity >= 0.35) metricsScore += 1;
  else if (achievementDensity >= 0.2) metricsScore += 0.5;

  // Metric inclusion (requires 60%+ bullets with metrics)
  const metricsPattern = /\d+%|\$\d+|increased|decreased/gi;
  const bullets = Math.max(content.split(/\n-|\n•/).length, 1);
  const metricsCount = (content.match(metricsPattern) || []).length;
  const metricsPercentage = metricsCount / bullets;
  if (metricsPercentage >= 0.6) metricsScore += 1.75;
  else if (metricsPercentage >= 0.4) metricsScore += 1;
  else if (metricsPercentage >= 0.2) metricsScore += 0.5;

  const metricsPoints = Math.min(metricsScore, 3.5);
  breakdown.push({
    label: 'Quantifiable Metrics (60%+ bullets with numbers)',
    value: Math.round(metricsPoints * 10) / 10
  });

  // Component 3: Formatting & Structure (30% of pillar = 3 points)
  // Strict: 1-2 pages, 10+ bullets, clear sections
  let formattingScore = 0;

  // Resume length check (1-2 pages = 250-500 words)
  const words = content.split(/\s+/).length;
  const estimatedPages = Math.ceil(words / 250);
  if (estimatedPages >= 1 && estimatedPages <= 2) formattingScore += 1.2;
  else if (estimatedPages > 0 && estimatedPages < 4) formattingScore += 0.6;
  else formattingScore += 0;

  // Bullet point formatting (requires 10+ bullets)
  const bulletPoints = (content.match(/\n-|\n•/g) || []).length;
  if (bulletPoints >= 10) formattingScore += 1;
  else if (bulletPoints >= 7) formattingScore += 0.6;
  else if (bulletPoints >= 4) formattingScore += 0.3;

  // Clear section headings (all 5 key sections)
  const hasAllSections = /(summary|objective|profile)/i.test(content) &&
    /(experience|employment)/i.test(content) &&
    /(education|degree)/i.test(content) &&
    /(skills|technical)/i.test(content) &&
    /(\b[\w.-]+@[\w.-]+\.\w+\b|phone|contact)/i.test(content);

  if (hasAllSections) formattingScore += 0.8;
  else formattingScore += 0.2;

  const formattingPoints = Math.min(formattingScore, 3);
  breakdown.push({
    label: 'Formatting & Structure (1-2 pages, 10+ bullets, all sections)',
    value: Math.round(formattingPoints * 10) / 10
  });

  const totalScore = Math.min(writingPoints + metricsPoints + formattingPoints, 10);
  const maxScore = 10;

  console.log(`[DEBUG-P4] Writing: ${writingPoints.toFixed(2)}, Metrics: ${metricsPoints.toFixed(2)}, Formatting: ${formattingPoints.toFixed(2)} = ${totalScore.toFixed(2)}`);

  return {
    name: 'Resume Health & Quality (15%)',
    score: totalScore,
    maxScore,
    percentage: Math.round((totalScore / maxScore) * 1000) / 10,
    weight: 0.15,
    breakdown,
  };
}

// ============================================================================
// COMPOSITE ANALYSIS FUNCTION (v2 - 4 Pillar System)
// ============================================================================
export function performAdvancedAnalysis(
  resumeContent: string,
  jobDescription: string
): DetailedAnalysis {
  // Validation & normalization
  if (!resumeContent || typeof resumeContent !== 'string') {
    console.warn('[DEBUG-ANALYSIS] Empty or invalid resume content');
    resumeContent = '';
  }
  if (!jobDescription || typeof jobDescription !== 'string') {
    console.warn('[DEBUG-ANALYSIS] Empty or invalid job description');
    jobDescription = '';
  }

  // Normalize content: handle PDF extraction artifacts
  const normalizedContent = resumeContent
    .replace(/\x00/g, '') // Remove null chars from PDF extraction
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  const normalizedJobDesc = jobDescription.trim();

  console.log(`[DEBUG-ANALYSIS] Content length: ${normalizedContent.length} chars`);

  // First, run legacy checks for detailed feedback
  const checks: AnalysisCheck[] = [
    checkWeakActionVerbs(normalizedContent),
    checkQuantifiableMetrics(normalizedContent),
    checkVoiceUsage(normalizedContent),
    checkFillerWords(normalizedContent),
    checkBulletPointLength(normalizedContent),
    checkSectionCompleteness(normalizedContent),
    checkResumeLength(normalizedContent),
    checkKeywordRelevance(normalizedContent, normalizedJobDesc),
    checkCareerProgression(normalizedContent),
    checkAchievementDensity(normalizedContent),
  ];

  // Extract skills for pillar scoring
  const resumeSkills = extractAllSkills(normalizedContent);
  console.log(`[DEBUG-ANALYSIS] Extracted ${resumeSkills.length} skills`);

  // Calculate 4-pillar scores
  const pillar1 = scorePillar1_Keywords(normalizedContent, normalizedJobDesc, resumeSkills);
  const pillar2 = scorePillar2_Sections(normalizedContent);
  const pillar3 = scorePillar3_Experience(normalizedContent);
  const pillar4 = scorePillar4_Health(normalizedContent);

  console.log(`[DEBUG-ANALYSIS] Pillar1: ${pillar1.score}/${pillar1.maxScore} (${pillar1.percentage}%)`);
  console.log(`[DEBUG-ANALYSIS] Pillar2: ${pillar2.score}/${pillar2.maxScore} (${pillar2.percentage}%)`);
  console.log(`[DEBUG-ANALYSIS] Pillar3: ${pillar3.score}/${pillar3.maxScore} (${pillar3.percentage}%)`);
  console.log(`[DEBUG-ANALYSIS] Pillar4: ${pillar4.score}/${pillar4.maxScore} (${pillar4.percentage}%)`);

  // Calculate overall score using 4-pillar formula (v3 - stricter scoring)
  // Each pillar is weighted: 40% + 30% + 15% + 15% = 100%
  const pillarScores = [pillar1, pillar2, pillar3, pillar4];

  // Calculate weighted score: (pillar% * weight)
  const weightedScore =
    (pillar1.percentage * pillar1.weight) +
    (pillar2.percentage * pillar2.weight) +
    (pillar3.percentage * pillar3.weight) +
    (pillar4.percentage * pillar4.weight);

  console.log(`[DEBUG-ANALYSIS] Weighted score before cap: ${weightedScore.toFixed(1)}`);

  // Cap at 88 to ensure ideal resumes score 80-90%
  // This accounts for the fact that perfect resumes rarely achieve 100% on all metrics
  const cappedScore = Math.min(Math.round(weightedScore), 88);
  console.log(`[DEBUG-ANALYSIS] Final capped score: ${cappedScore}`);

  // Categorize feedback
  const strengths = checks.filter(c => c.score >= 7).map(c => `✓ ${c.name}: ${c.feedback[0]}`);
  const weaknesses = checks.filter(c => c.score < 6).map(c => `✗ ${c.name}: ${c.feedback[0]}`);

  // Create prioritized suggestions
  const prioritizedSuggestions = checks
    .filter(c => c.score < 7)
    .sort((a, b) => (a.score - b.score) || (b.weight - a.weight))
    .flatMap(c => c.feedback.slice(0, 2))
    .slice(0, 5);

  // Calculate ATS score (based on section completeness and keyword relevance)
  const atsScore = Math.round((pillar2.percentage + pillar1.percentage) / 2);

  // Calculate health score (based on health pillar and other quality checks)
  const healthScore = Math.round(pillar4.percentage);

  // Generate score explanation
  const scoreExplanation = generateScoreExplanation(pillarScores, cappedScore);

  return {
    overallScore: cappedScore,
    atsScore,
    healthScore,
    checks,
    prioritizedSuggestions,
    strengths,
    weaknesses,
    pillarScores,
    scoreExplanation,
  };
}

// Helper function to generate human-readable score explanation
function generateScoreExplanation(pillarScores: PillarScore[], overallScore: number): string {
  const pillars = pillarScores.map(p => `${p.name.split(' ')[0]}: ${p.percentage}%`).join(' | ');

  let interpretation = '';
  if (overallScore >= 90) interpretation = 'Exceptional - Ready for top opportunities';
  else if (overallScore >= 80) interpretation = 'Excellent - Strong candidate with minor tweaks needed';
  else if (overallScore >= 70) interpretation = 'Good - Competitive, some improvements recommended';
  else if (overallScore >= 60) interpretation = 'Fair - Significant room for improvement';
  else if (overallScore >= 50) interpretation = 'Weak - Major revisions needed';
  else interpretation = 'Poor - Complete overhaul recommended';

  return `${pillars} | Overall: ${overallScore}% - ${interpretation}`;
}

// Extract all skills from content (used by pillar scoring)
function extractAllSkills(text: string): string[] {
  // Validation: check for null/undefined/empty
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    console.log('[DEBUG-SKILLS] Empty or invalid text passed to extractAllSkills');
    return [];
  }

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

  const foundSkills = new Set<string>();
  const lowerText = text.toLowerCase();

  SKILL_KEYWORDS.forEach((skill) => {
    const skillLower = skill.toLowerCase();
    // Use word boundary check for exact matches where applicable
    try {
      // For multi-word skills, allow flexible matching
      if (skill.includes(' ') || skill.includes('.') || skill.includes('/')) {
        // For "Node.js", "REST API", etc., do flexible matching
        if (lowerText.includes(skillLower)) {
          foundSkills.add(skill);
        }
      } else {
        // For single-word skills like "Python", use word boundary to avoid false matches
        const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (regex.test(lowerText)) {
          foundSkills.add(skill);
        }
      }
    } catch (e) {
      console.warn(`[DEBUG-SKILLS] Regex error for skill "${skill}":`, e);
    }
  });

  const skillsArray = Array.from(foundSkills);
  console.log(`[DEBUG-SKILLS] Found ${skillsArray.length} skills: ${skillsArray.slice(0, 5).join(', ')}${skillsArray.length > 5 ? '...' : ''}`);
  return skillsArray;
}
