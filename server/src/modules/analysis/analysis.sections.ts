/**
 * Section-by-Section Resume Analysis (Redesigned)
 * New approach: Count headers, paragraphs, bullet points, then map to standard sections
 * Calculate completeness based on content structure rather than regex patterns
 * Enhanced: Comprehensive logging, fallback detection, PDF variation handling
 */

// ============================================================================
// LOGGING UTILITIES
// ============================================================================
interface LogEntry {
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  message: string;
  data?: Record<string, any>;
}

const analysisLogs: LogEntry[] = [];

function log(level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR', message: string, data?: Record<string, any>): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    data,
  };
  analysisLogs.push(entry);
  if (level === 'ERROR' || level === 'WARN') {
    console.warn(`[${level}] ${message}`, data || '');
  }
}

export function getAnalysisLogs(): LogEntry[] {
  return analysisLogs;
}

export interface SectionScore {
  section: string;
  score: number;
  maxScore: number;
  completeness: number; // 0-100%
  feedback: string[];
  suggestions: string[];
  status: 'excellent' | 'good' | 'fair' | 'needs-improvement';
  metrics?: {
    headerCount: number;
    paragraphCount: number;
    bulletCount: number;
    contentLength: number;
    lineCount?: number;
  };
}

export interface SectionAnalysisResult {
  sectionScores: SectionScore[];
  overallSectionScore: number;
  totalSections: number;
  completeSections: number;
  detectedSections: string[];
  structureAnalysis?: {
    totalHeaders: number;
    totalParagraphs: number;
    totalBullets: number;
  };
}

// ============================================================================
// SECTION DETECTION ENGINE - Core Algorithm
// ============================================================================

interface DetectedSection {
  name: string;
  rawHeader: string;
  standardName: string;
  content: string;
  startLine: number;
  endLine: number;
  metrics: {
    headerCount: number;
    paragraphCount: number;
    bulletCount: number;
    contentLength: number;
    lineCount: number;
  };
}

/**
 * FALLBACK: Detects sections by content keywords when no headers found
 * Searches for keyword patterns that indicate section boundaries
 */
function detectSectionsByContent(
  content: string,
  sectionKeywords: Record<string, string[]>
): DetectedSection[] {
  const lines = content.split('\n');
  const detectedSections: DetectedSection[] = [];

  log('INFO', 'Starting fallback content-based section detection');

  // Build a map of keywords to section types
  const keywordToSection: Record<string, string> = {};
  for (const [standard, keywords] of Object.entries(sectionKeywords)) {
    keywords.forEach(kw => {
      keywordToSection[kw.toLowerCase()] = standard;
    });
  }

  // Scan for keyword matches with higher tolerance
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim().toLowerCase();

    // Look for lines that contain prominent keywords
    for (const [keyword, standard] of Object.entries(keywordToSection)) {
      if (
        trimmed === keyword ||
        (trimmed.length < 80 && trimmed.includes(keyword) && /^[a-z\s&\-\/|]+$/.test(trimmed))
      ) {
        // Found a potential section start
        const sectionContent = lines.slice(i + 1).join('\n');
        const rawHeader = lines[i].trim();

        // Only add if content exists
        if (sectionContent.trim().length > 0) {
          detectedSections.push({
            name: rawHeader,
            rawHeader,
            standardName: standard,
            content: sectionContent,
            startLine: i,
            endLine: lines.length,
            metrics: analyzeContentMetrics(sectionContent),
          });
          log('DEBUG', 'Fallback detection found section', { header: rawHeader, standard });
          break;
        }
      }
    }
  }

  return detectedSections;
}

/**
 * Detects all headers in the content and extracts sections
 * Headers are identified by common patterns: ALL CAPS, title case, underlines, etc.
 */
function detectSectionHeaders(content: string): DetectedSection[] {
  const lines = content.split('\n');
  const detectedSections: DetectedSection[] = [];
  let currentSectionStart = -1;

  // Standard resume section keywords (COMPREHENSIVELY EXPANDED)
  const sectionKeywords: Record<string, string[]> = {
    'Contact': [
      'contact', 'personal info', 'header', 'phone', 'email', 'address', 'location',
      'contact information', 'contact details', 'personal details', 'info',
      'phone number', 'email address', 'website', 'url', 'linkedin', 'github',
      'social media', 'profiles', 'web presence', 'online presence',
    ],
    'Summary': [
      'summary', 'objective', 'profile', 'about me', 'professional summary',
      'executive summary', 'about', 'introduction', 'overview', 'synopsis',
      'career objective', 'career summary', 'professional profile', 'professional objective',
      'personal statement', 'about yourself', 'career highlights', 'key summary',
      'professional overview', 'career overview', 'executive profile',
    ],
    'Experience': [
      'experience', 'professional experience', 'work history', 'employment',
      'career', 'work experience', 'professional background', 'career history',
      'job history', 'employment history', 'work background', 'career background',
      'professional history', 'relevant experience', 'previous experience',
      'past experience', 'work background', 'professional roles', 'positions',
    ],
    'Education': [
      'education', 'academic', 'degree', 'university', 'college', 'institute',
      'institute of technology', 'school', 'educational background',
      'academic background', 'qualifications', 'academic credentials',
      'higher education', 'college education', 'university education',
      'academic qualifications', 'schooling', 'alma mater', 'courses',
      'education background',
    ],
    'Skills': [
      'skills', 'technical skills', 'expertise', 'proficiencies', 'competencies',
      'languages', 'technical expertise', 'core skills', 'core competencies',
      'abilities', 'strengths', 'key skills', 'professional skills',
      'technical abilities', 'capabilities', 'skill set', 'specialized skills',
      'programming skills', 'technical proficiencies', 'areas of expertise',
      'competency', 'skill sets', 'areas of expertise',
    ],
    'Projects': [
      'projects', 'portfolio', 'side projects', 'personal projects',
      'notable projects', 'featured projects', 'showcase', 'portfolio projects',
      'key projects', 'selected projects', 'sample projects', 'work samples',
      'project portfolio', 'sample work', 'case studies', 'implementations',
      'applications', 'development projects', 'technical projects',
    ],
    'Certifications': [
      'certifications', 'licenses', 'credentials', 'certified', 'professional certifications',
      'qualifications', 'certifications & licenses', 'licenses & certifications',
      'professional credentials', 'certifications and licenses',
      'certificate', 'certificates', 'licensure', 'licensing',
      'professional development', 'industry certifications', 'accreditations',
      'accreditation', 'certifications and qualifications',
    ],
    'Achievements': [
      'achievements', 'awards', 'honors', 'recognition', 'awards and recognition',
      'accomplishments', 'success', 'results', 'highlights', 'key achievements',
      'accolades', 'awards & recognition', 'special recognition',
      'performance', 'accomplishments and awards', 'key results',
      'distinguished achievements', 'key accomplishments',
    ],
  };

  // Helper: Check if a line is a header
  const isHeaderLine = (line: string, index: number): { isHeader: boolean; strength: number } => {
    const trimmed = line.trim();
    if (trimmed.length === 0) return { isHeader: false, strength: 0 };

    const nextLine = index + 1 < lines.length ? lines[index + 1].trim() : '';
    const prevLine = index > 0 ? lines[index - 1].trim() : '';

    let strength = 0;

    // ALL CAPS with no lowercase (strong indicator)
    if (/^[A-Z\s\-&|\/]+$/.test(trimmed) && trimmed.length > 2 && /[A-Z]/.test(trimmed)) {
      strength += 10;
      log('DEBUG', 'Header detected: ALL CAPS pattern', { text: trimmed });
    }

    // Mixed case with numbers (like "12. SKILLS" or "2. Experience")
    if (/^\d+[\.\)]\s*[A-Z]/.test(trimmed)) {
      strength += 9;
      log('DEBUG', 'Header detected: numbered pattern', { text: trimmed });
    }

    // Underlined or over-lined (with dashes or equal signs or special chars)
    if (/^[-=*_]{3,}$/.test(nextLine) || /^[-=*_]{3,}$/.test(prevLine)) {
      strength += 9;
      log('DEBUG', 'Header detected: underline/overline pattern', { text: trimmed });
    }

    // Title Case followed by empty line or bullet (common resume format)
    if (/^[A-Z][a-z\s&\-]*$/.test(trimmed) && (nextLine === '' || nextLine.match(/^[\s]*[-•*]/))) {
      strength += 7;
      log('DEBUG', 'Header detected: title case + empty/bullet', { text: trimmed });
    }

    // Bold markers detection (PDF often renders bold as **text** or similar)
    if (/^\*{1,2}[A-Z][a-zA-Z\s&\-]*\*{1,2}$/.test(trimmed) || /^__[A-Z].*__$/.test(trimmed)) {
      strength += 8;
      log('DEBUG', 'Header detected: bold markers', { text: trimmed });
    }

    // Matches known section keywords (FLEXIBLE - includes partial matches)
    const lowerTrimmed = trimmed.toLowerCase();
    for (const [standard, keywords] of Object.entries(sectionKeywords)) {
      if (keywords.some(kw => {
        const kwLower = kw.toLowerCase();
        return (
          lowerTrimmed === kwLower ||
          lowerTrimmed.startsWith(kwLower) ||
          lowerTrimmed.endsWith(kwLower) ||
          (lowerTrimmed.includes(kwLower) && trimmed.length < 70) // Flexible for compound titles
        );
      })) {
        strength += 9; // Increased from 8
        log('DEBUG', 'Header detected: keyword match', { text: trimmed, standard });
      }
    }

    // Short line (typically headers are short) + capital start
    if (trimmed.length < 70 && /^[A-Z]/.test(trimmed) && trimmed.split(/\s+/).length <= 6) {
      strength += 5; // Increased from 4
    }

    // Keyword-first detection: if line contains keyword at start (case insensitive)
    const firstWord = lowerTrimmed.split(/[\s\-]/)[0];
    const keywordStarts = ['professional', 'technical', 'work', 'employment', 'academic', 'core', 'relevant', 'key'];
    if (keywordStarts.includes(firstWord)) {
      strength += 6; // Increased from 5
    }

    // PDF-specific pattern: dates/years often appear before section header
    // If next line is empty and line before is a year/date, this might be a header
    if (/20\d{2}/.test(prevLine) && nextLine === '') {
      strength += 3;
    }

    return { isHeader: strength >= 6, strength }; // Require 6+ strength to avoid false positives
  };

  // Helper: Map raw header text to standard section name
  const mapToStandardSection = (headerText: string): string => {
    const lower = headerText.toLowerCase().trim();
    for (const [standard, keywords] of Object.entries(sectionKeywords)) {
      if (keywords.some(kw => lower.includes(kw) || lower === kw)) {
        return standard;
      }
    }
    return headerText.trim(); // Return as-is if no match
  };

  // Scan through lines to detect headers
  for (let i = 0; i < lines.length; i++) {
    const { isHeader, strength } = isHeaderLine(lines[i], i);

    if (isHeader) {
      // Save previous section if exists
      if (currentSectionStart !== -1 && i > currentSectionStart) {
        // Get all non-empty lines between headers, skip empty lines at start/end
        let contentLines = lines.slice(currentSectionStart + 1, i);

        // Remove leading empty lines after header
        while (contentLines.length > 0 && contentLines[0].trim().length === 0) {
          contentLines.shift();
        }
        // Remove trailing empty lines before next header
        while (contentLines.length > 0 && contentLines[contentLines.length - 1].trim().length === 0) {
          contentLines.pop();
        }

        const sectionContent = contentLines.join('\n');

        // Only add if there's meaningful content
        if (sectionContent.trim().length > 0) {
          const standardName = mapToStandardSection(lines[currentSectionStart]);
          detectedSections.push({
            name: lines[currentSectionStart].trim(),
            rawHeader: lines[currentSectionStart].trim(),
            standardName,
            content: sectionContent,
            startLine: currentSectionStart,
            endLine: i,
            metrics: analyzeContentMetrics(sectionContent),
          });
          log('DEBUG', `Section detected: ${standardName} (${sectionContent.length} chars)`);
        }
      }
      currentSectionStart = i;
    }
  }

  // Handle last section
  if (currentSectionStart !== -1 && currentSectionStart < lines.length) {
    let contentLines = lines.slice(currentSectionStart + 1);

    // Remove leading/trailing empty lines
    while (contentLines.length > 0 && contentLines[0].trim().length === 0) {
      contentLines.shift();
    }
    while (contentLines.length > 0 && contentLines[contentLines.length - 1].trim().length === 0) {
      contentLines.pop();
    }

    const sectionContent = contentLines.join('\n');

    if (sectionContent.trim().length > 0) {
      const standardName = mapToStandardSection(lines[currentSectionStart]);
      detectedSections.push({
        name: lines[currentSectionStart].trim(),
        rawHeader: lines[currentSectionStart].trim(),
        standardName,
        content: sectionContent,
        startLine: currentSectionStart,
        endLine: lines.length,
        metrics: analyzeContentMetrics(sectionContent),
      });
      log('DEBUG', `Final section detected: ${standardName} (${sectionContent.length} chars)`);
    }
  }

  // FALLBACK DETECTION: If no sections detected OR very few sections, try content-based detection
  if (detectedSections.length === 0) {
    log('WARN', 'No sections detected with header patterns, attempting fallback detection');
    const fallbackSections = detectSectionsByContent(content, sectionKeywords);
    if (fallbackSections.length > 0) {
      detectedSections.push(...fallbackSections);
      log('INFO', `Fallback detection found ${fallbackSections.length} sections`);
    }
  } else {
    log('INFO', `Detected ${detectedSections.length} sections with header patterns`);
  }

  return detectedSections;
}

/**
 * Analyzes content metrics: paragraphs, bullet points, lines
 * IMPROVED: Better detection of various bullet formats and edge cases
 */
function analyzeContentMetrics(content: string): {
  headerCount: number;
  paragraphCount: number;
  bulletCount: number;
  contentLength: number;
  lineCount: number;
} {
  const lines = content.split('\n');
  const nonEmptyLines = lines.filter(l => l.trim().length > 0);

  // Count bullet points and list items (multiple formats)
  // Handles: -, •, *, →, >, •, ◦, ▪, ◆, ◇, etc.
  const bulletPatterns = [
    /^[\s]*[-•*→>◦▪◆◇]\s+/gm,      // Basic bullets
    /^[\s]*\d+[\.\)]\s+/gm,         // Numbered lists
    /^[\s]*[a-z]\)\s+/gm,           // Letter lists
  ];
  const bulletCount = bulletPatterns.reduce((count, pattern) => {
    const matches = content.match(pattern) || [];
    return count + matches.length;
  }, 0);

  // Count paragraphs (separated by blank lines) with better tolerance
  const paragraphBlocks = content
    .split(/\n\s*\n+/) // Multiple newlines = paragraph break
    .filter(p => p.trim().length > 10); // Require minimum paragraph length
  const paragraphCount = Math.max(0, paragraphBlocks.length);

  // Count headers within this section (sub-headers with better patterns)
  const headerPatterns = [
    /^[A-Z][A-Z\s\-&|\/]+$/gm,      // ALL CAPS headers
    /^\*{1,2}[A-Z].*\*{1,2}$/gm,   // Bold markers
    /^__[A-Z].*__$/gm,             // Underline markers
  ];
  const headerCount = headerPatterns.reduce((count, pattern) => {
    const matches = content.match(pattern) || [];
    return count + matches.length;
  }, 0);

  // Calculate meaningful line count (exclude pure whitespace)
  const meaningfulLineCount = nonEmptyLines.length;

  return {
    headerCount,
    paragraphCount,
    bulletCount,
    contentLength: content.length,
    lineCount: meaningfulLineCount,
  };
}

/**
 * Calculate section completeness based on structure
 * Returns percentage (0-100) indicating how complete/detailed the section is
 * IMPROVED: Better balanced formula, normalized scoring
 */
function calculateSectionCompleteness(metrics: ReturnType<typeof analyzeContentMetrics>, sectionType: string): number {
  const { bulletCount, paragraphCount, lineCount, contentLength } = metrics;

  // Define ideal metrics for each section type with target ranges
  const ideals: Record<
    string,
    { targetBullets: number; targetParagraphs: number; targetLines: number; targetLength: number }
  > = {
    'Contact': { targetBullets: 0, targetParagraphs: 0, targetLines: 3, targetLength: 150 },
    'Summary': { targetBullets: 0, targetParagraphs: 1, targetLines: 4, targetLength: 300 },
    'Experience': { targetBullets: 12, targetParagraphs: 3, targetLines: 20, targetLength: 800 },
    'Education': { targetBullets: 0, targetParagraphs: 2, targetLines: 4, targetLength: 300 },
    'Skills': { targetBullets: 0, targetParagraphs: 1, targetLines: 8, targetLength: 400 },
    'Projects': { targetBullets: 8, targetParagraphs: 2, targetLines: 12, targetLength: 600 },
    'Certifications': { targetBullets: 0, targetParagraphs: 2, targetLines: 6, targetLength: 400 },
    'Achievements': { targetBullets: 6, targetParagraphs: 2, targetLines: 10, targetLength: 500 },
  };

  const ideal = ideals[sectionType] || ideals['Summary'];

  if (contentLength === 0) return 0;

  // Normalized scoring approach (0-100 scale)
  let totalScore = 0;
  let scoreComponents = 0;

  // Content length component (0-25 points)
  const lengthRatio = Math.min(contentLength / ideal.targetLength, 1);
  totalScore += lengthRatio * 25;
  scoreComponents++;

  // Line count component (0-25 points)
  const lineRatio = Math.min(lineCount / ideal.targetLines, 1);
  totalScore += lineRatio * 25;
  scoreComponents++;

  // Bullet point component (0-25 points)
  if (bulletCount > 0 || ideal.targetBullets > 0) {
    const bulletRatio = ideal.targetBullets > 0
      ? Math.min(bulletCount / ideal.targetBullets, 1)
      : (bulletCount > 0 ? 0.5 : 0); // Bonus if bullets unexpected but present
    totalScore += bulletRatio * 25;
    scoreComponents++;
  }

  // Paragraph component (0-25 points)
  if (paragraphCount > 0 || ideal.targetParagraphs > 0) {
    const paragraphRatio = ideal.targetParagraphs > 0
      ? Math.min(paragraphCount / ideal.targetParagraphs, 1)
      : (paragraphCount > 0 ? 0.5 : 0);
    totalScore += paragraphRatio * 25;
    scoreComponents++;
  }

  // Average the components
  const completeness = Math.round((totalScore / scoreComponents) * 100 / 25);

  log('DEBUG', 'Completeness calculated', {
    section: sectionType,
    metrics: { bulletCount, paragraphCount, lineCount, contentLength },
    completeness,
  });

  return Math.min(100, Math.max(0, completeness));
}

// ============================================================================
// ENHANCED SECTION SCORING
// ============================================================================

function scoreSectionByType(detected: DetectedSection, fullContent: string): SectionScore {
  const sectionType = detected.standardName;
  const { metrics } = detected;
  const completeness = calculateSectionCompleteness(metrics, sectionType);
  const feedback: string[] = [];
  const suggestions: string[] = [];
  let score = 0;

  log('INFO', `Scoring ${sectionType} section`, { metrics, completeness });

  // Check content presence
  if (metrics.contentLength === 0) {
    log('WARN', `${sectionType} section has no content`);
    return {
      section: sectionType,
      score: 0,
      maxScore: 10,
      completeness: 0,
      feedback: [`No ${sectionType} content found`],
      suggestions: [getMissingSectionSuggestion(sectionType)],
      status: 'needs-improvement',
      metrics,
    };
  }

  // Base score from completeness (0-10 scale)
  score = Math.max(1, (completeness / 100) * 10); // Minimum 1 point for having content

  // Add bonus for well-structured content
  if (metrics.bulletCount > 0) {
    feedback.push(`✓ ${metrics.bulletCount} bullet point${metrics.bulletCount > 1 ? 's' : ''} found`);
    score += 0.5;
  }
  if (metrics.paragraphCount > 1) {
    feedback.push(`✓ ${metrics.paragraphCount} paragraphs detected`);
    score += 0.5;
  }
  if (metrics.lineCount >= 5) {
    feedback.push(`✓ Substantial content (${metrics.lineCount} lines)`);
    score += 0.3;
  }

  // Type-specific analysis
  switch (sectionType) {
    case 'Contact':
      scoreContactSection(detected.content, feedback, suggestions, score);
      break;
    case 'Summary':
      scoreSummarySection(detected.content, feedback, suggestions, score);
      break;
    case 'Experience':
      scoreExperienceSection(detected.content, feedback, suggestions, score);
      break;
    case 'Education':
      scoreEducationSection(detected.content, feedback, suggestions, score);
      break;
    case 'Skills':
      scoreSkillsSection(detected.content, feedback, suggestions, score);
      break;
    case 'Projects':
      scoreProjectsSection(detected.content, feedback, suggestions, score);
      break;
    case 'Certifications':
      scoreCertificationsSection(detected.content, feedback, suggestions, score);
      break;
    case 'Achievements':
      scoreAchievementsSection(fullContent, feedback, suggestions, score);
      break;
  }

  // Recalculate status based on final score
  let status: 'excellent' | 'good' | 'fair' | 'needs-improvement' = 'needs-improvement';
  if (score >= 8) status = 'excellent';
  else if (score >= 6) status = 'good';
  else if (score >= 4) status = 'fair';

  return {
    section: sectionType,
    score: Math.min(score, 10),
    maxScore: 10,
    completeness,
    feedback: feedback.length > 0 ? feedback : [`${sectionType} is present`],
    suggestions: suggestions.length > 0 ? suggestions : [`${sectionType} section is well-structured`],
    status,
    metrics,
  };
}

// Type-specific scoring helpers
function scoreContactSection(content: string, feedback: string[], suggestions: string[], baseScore: number): void {
  const hasEmail = /\b[\w.-]+@[\w.-]+\.\w+\b/.test(content);
  const hasPhone = /\+?1?\s*\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})/.test(content);
  const hasLinkedin = /linkedin\.com|github\.com|portfolio/i.test(content);

  if (hasEmail) feedback.push('✓ Email found');
  else suggestions.push('Add professional email');

  if (hasPhone) feedback.push('✓ Phone number found');
  else suggestions.push('Add phone number');

  if (hasLinkedin) feedback.push('✓ Professional profiles found');
  else suggestions.push('Add LinkedIn/GitHub/Portfolio');
}

function scoreSummarySection(content: string, feedback: string[], suggestions: string[], baseScore: number): void {
  const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;

  if (wordCount >= 30 && wordCount <= 200) {
    feedback.push(`✓ Length is optimal (${wordCount} words)`);
  } else if (wordCount < 30) {
    suggestions.push('Expand summary to 50-150 words');
  } else {
    suggestions.push('Trim summary to 2-3 sentences');
  }

  if (/\d+\+?\s*years?|expert|proficient/.test(content)) {
    feedback.push('✓ Experience level mentioned');
  } else {
    suggestions.push('Mention years of experience');
  }
}

function scoreExperienceSection(content: string, feedback: string[], suggestions: string[], baseScore: number): void {
  const jobTitles = (content.match(/engineer|developer|manager|lead|senior|analyst|architect/gi) || []).length;
  const dates = (content.match(/20\d{2}|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/gi) || []).length;
  const metrics = (content.match(/\d+%|\$\d+|improved|increased|reduced/gi) || []).length;

  if (jobTitles > 0) feedback.push(`✓ ${jobTitles} job titles identified`);
  else suggestions.push('List job titles clearly');

  if (dates >= 2) feedback.push('✓ Employment dates included');
  else suggestions.push('Add start/end dates for each role');

  if (metrics > 0) feedback.push(`✓ ${metrics} quantifiable results found`);
  else suggestions.push('Add metrics (%, $, timeframes)');
}

function scoreEducationSection(content: string, feedback: string[], suggestions: string[], baseScore: number): void {
  const hasDegree = /bachelor|master|phd|b\.s\.|m\.s\.|diploma/i.test(content);
  const hasField = /computer science|engineering|business|data science/i.test(content);
  const hasDate = /20\d{2}|graduated|expected/i.test(content);

  if (hasDegree) feedback.push('✓ Degree type specified');
  else suggestions.push('Specify degree type');

  if (hasField) feedback.push('✓ Field of study identified');
  else suggestions.push('Include field of study');

  if (hasDate) feedback.push('✓ Graduation date included');
  else suggestions.push('Add graduation date');
}

function scoreSkillsSection(content: string, feedback: string[], suggestions: string[], baseScore: number): void {
  const skills = content.split(/[,;\n-]/).filter(s => s.trim().length > 0).length;
  const techKeywords = (content.match(/javascript|python|java|react|node|aws|sql|docker/gi) || []).length;

  if (skills >= 15) feedback.push(`✓ ${skills} skills listed (comprehensive)`);
  else if (skills >= 10) feedback.push(`✓ ${skills} skills listed`);
  else suggestions.push(`Add more skills (have ${skills}, aim for 15+)`);

  if (techKeywords > 0) feedback.push(`✓ ${techKeywords} technical skills`);
  else suggestions.push('Include programming languages and frameworks');
}

function scoreProjectsSection(content: string, feedback: string[], suggestions: string[], baseScore: number): void {
  const projectCount = (content.match(/^[A-Z][a-z\w\s]*$/gm) || []).length;
  const hasTech = /javascript|python|react|node|database|api/i.test(content);
  const hasLinks = /github|live|demo|url|deployed/i.test(content);

  if (projectCount > 0) feedback.push(`✓ ${projectCount} projects documented`);
  if (hasTech) feedback.push('✓ Technologies mentioned');
  if (hasLinks) feedback.push('✓ Project links provided');
  if (!hasLinks) suggestions.push('Add GitHub links or live project URLs');
}

function scoreCertificationsSection(content: string, feedback: string[], suggestions: string[], baseScore: number): void {
  const certs = content.split('\n').filter(l => l.trim().length > 5).length;
  const hasIndustryRecognized = /aws|azure|kubernetes|google|certified/i.test(content);
  const hasDates = /20\d{2}|january|february|march/i.test(content);

  if (certs > 0) feedback.push(`✓ ${certs} certification(s) listed`);
  if (hasIndustryRecognized) feedback.push('✓ Industry-recognized certifications');
  if (hasDates) feedback.push('✓ Dates included');
  if (!hasIndustryRecognized) suggestions.push('Include industry-recognized certs (AWS, Azure)');
}

function scoreAchievementsSection(fullContent: string, feedback: string[], suggestions: string[], baseScore: number): void {
  const achievementKeywords = /increased|improved|optimized|achieved|delivered|reduced|scaled/gi;
  const achievements = (fullContent.match(achievementKeywords) || []).length;
  const metrics = (fullContent.match(/\d+%|\$\d+/g) || []).length;

  if (achievements >= 10) feedback.push(`✓ Strong achievement focus (${achievements} indicators)`);
  else if (achievements > 0) suggestions.push('Add more achievement-focused language');

  if (metrics > 0) feedback.push(`✓ ${metrics} quantifiable metrics found`);
  else suggestions.push('Add numbers and percentages to achievements');
}

function getMissingSectionSuggestion(section: string): string {
  const suggestions: Record<string, string> = {
    'Contact': 'Add your email, phone, and professional profiles (LinkedIn, GitHub)',
    'Summary': 'Add a 2-3 sentence professional summary highlighting your key strengths',
    'Experience': 'Add job titles, companies, dates, and bullet-pointed achievements',
    'Education': 'Add degree, field, institution, and graduation date',
    'Skills': 'Add 15+ technical skills organized by category',
    'Projects': 'Add 2-3 projects with descriptions, tech stack, and links',
    'Certifications': 'Add relevant industry certifications with dates',
    'Achievements': 'Highlight quantifiable results and metrics throughout',
  };
  return suggestions[section] || `Add ${section} section to your resume`;
}

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

export function performSectionAnalysis(content: string): SectionAnalysisResult {
  log('INFO', 'Starting section analysis', { contentLength: content.length });

  // Step 1: Detect all sections
  const detectedSections = detectSectionHeaders(content);
  log('INFO', `Step 1 complete: Detected ${detectedSections.length} sections`);

  // Step 2: Score each detected section
  const sectionScores: SectionScore[] = detectedSections.map(section =>
    scoreSectionByType(section, content)
  );
  log('INFO', `Step 2 complete: Scored ${sectionScores.length} sections`);

  // Step 3: Ensure all standard sections are represented
  const standardSections = ['Contact', 'Summary', 'Experience', 'Education', 'Skills', 'Projects', 'Certifications', 'Achievements'];
  const scoredSectionNames = new Set(sectionScores.map(s => s.section));

  // Detect missing critical sections (Contact, Summary, Experience, Education, Skills)
  const criticalSections = ['Contact', 'Summary', 'Experience', 'Education', 'Skills'];
  const missingCritical = criticalSections.filter(s => !scoredSectionNames.has(s));

  if (missingCritical.length > 0) {
    log('WARN', `Missing critical sections: ${missingCritical.join(', ')}`);
  }

  for (const standard of standardSections) {
    if (!scoredSectionNames.has(standard)) {
      // Add missing section with score 0
      const isCritical = criticalSections.includes(standard);
      sectionScores.push({
        section: standard,
        score: 0,
        maxScore: 10,
        completeness: 0,
        feedback: [`No ${standard} section found${isCritical ? ' (critical)' : ' (optional)'}`],
        suggestions: [getMissingSectionSuggestion(standard)],
        status: 'needs-improvement',
        metrics: {
          headerCount: 0,
          paragraphCount: 0,
          bulletCount: 0,
          contentLength: 0,
          lineCount: 0,
        },
      });
      log('INFO', `Added missing section: ${standard}`);
    }
  }

  // Step 4: Calculate overall metrics with validation
  const completeSections = sectionScores.filter(s => s.score > 0).length;
  const totalSections = sectionScores.length;

  // More robust overall score calculation
  const totalScore = sectionScores.reduce((sum, s) => sum + s.score, 0);
  const overallSectionScore = totalSections > 0
    ? Math.round((totalScore / (totalSections * 10)) * 100) // Convert to 0-100 scale
    : 0;

  log('INFO', `Step 3 complete: Calculated overall metrics`, {
    completeSections,
    totalSections,
    overallScore: overallSectionScore,
  });

  // Step 5: Calculate structure analysis with edge case handling
  const structureMetrics = {
    totalHeaders: Math.max(1, detectedSections.length), // At least 1 if content exists
    totalParagraphs: detectedSections.reduce((sum, s) => sum + s.metrics.paragraphCount, 0),
    totalBullets: detectedSections.reduce((sum, s) => sum + s.metrics.bulletCount, 0),
  };

  const result: SectionAnalysisResult = {
    sectionScores,
    overallSectionScore: Math.max(0, Math.min(100, overallSectionScore)), // Clamp to 0-100
    totalSections,
    completeSections,
    detectedSections: detectedSections.map(s => s.standardName),
    structureAnalysis: structureMetrics,
  };

  log('INFO', 'Section analysis complete', {
    totalSections: result.totalSections,
    completeSections: result.completeSections,
    overallScore: result.overallSectionScore,
  });

  return result;
}

// ============================================================================
// LEGACY COMPATIBILITY - Maintain old function signatures
// ============================================================================

export function analyzeContactSection(content: string): SectionScore {
  log('INFO', 'Legacy function: analyzeContactSection');
  const detected = detectSectionHeaders(content).find(s => s.standardName === 'Contact');
  if (detected) {
    log('DEBUG', 'Contact section found');
    return scoreSectionByType(detected, content);
  }
  log('WARN', 'Contact section not found');
  return {
    section: 'Contact',
    score: 0,
    maxScore: 10,
    completeness: 0,
    feedback: ['Contact section not found'],
    suggestions: ['Add email, phone, and professional profiles'],
    status: 'needs-improvement',
    metrics: { headerCount: 0, paragraphCount: 0, bulletCount: 0, contentLength: 0, lineCount: 0 },
  };
}

export function analyzeSummarySection(content: string): SectionScore {
  log('INFO', 'Legacy function: analyzeSummarySection');
  const detected = detectSectionHeaders(content).find(s => s.standardName === 'Summary');
  if (detected) {
    log('DEBUG', 'Summary section found');
    return scoreSectionByType(detected, content);
  }
  log('WARN', 'Summary section not found');
  return {
    section: 'Summary/Objective',
    score: 0,
    maxScore: 10,
    completeness: 0,
    feedback: ['Summary section not found'],
    suggestions: ['Add a professional summary'],
    status: 'needs-improvement',
    metrics: { headerCount: 0, paragraphCount: 0, bulletCount: 0, contentLength: 0, lineCount: 0 },
  };
}

export function analyzeExperienceSection(content: string): SectionScore {
  log('INFO', 'Legacy function: analyzeExperienceSection');
  const detected = detectSectionHeaders(content).find(s => s.standardName === 'Experience');
  if (detected) {
    log('DEBUG', 'Experience section found');
    return scoreSectionByType(detected, content);
  }
  log('WARN', 'Experience section not found');
  return {
    section: 'Experience',
    score: 0,
    maxScore: 10,
    completeness: 0,
    feedback: ['Experience section not found'],
    suggestions: ['Add professional experience details'],
    status: 'needs-improvement',
    metrics: { headerCount: 0, paragraphCount: 0, bulletCount: 0, contentLength: 0, lineCount: 0 },
  };
}

export function analyzeEducationSection(content: string): SectionScore {
  log('INFO', 'Legacy function: analyzeEducationSection');
  const detected = detectSectionHeaders(content).find(s => s.standardName === 'Education');
  if (detected) {
    log('DEBUG', 'Education section found');
    return scoreSectionByType(detected, content);
  }
  log('WARN', 'Education section not found');
  return {
    section: 'Education',
    score: 0,
    maxScore: 10,
    completeness: 0,
    feedback: ['Education section not found'],
    suggestions: ['Add education section with degree information'],
    status: 'needs-improvement',
    metrics: { headerCount: 0, paragraphCount: 0, bulletCount: 0, contentLength: 0, lineCount: 0 },
  };
}

export function analyzeSkillsSection(content: string): SectionScore {
  log('INFO', 'Legacy function: analyzeSkillsSection');
  const detected = detectSectionHeaders(content).find(s => s.standardName === 'Skills');
  if (detected) {
    log('DEBUG', 'Skills section found');
    return scoreSectionByType(detected, content);
  }
  log('WARN', 'Skills section not found');
  return {
    section: 'Skills',
    score: 0,
    maxScore: 10,
    completeness: 0,
    feedback: ['Skills section not found'],
    suggestions: ['Add a comprehensive skills section'],
    status: 'needs-improvement',
    metrics: { headerCount: 0, paragraphCount: 0, bulletCount: 0, contentLength: 0, lineCount: 0 },
  };
}

export function analyzeCertificationsSection(content: string): SectionScore {
  log('INFO', 'Legacy function: analyzeCertificationsSection');
  const detected = detectSectionHeaders(content).find(s => s.standardName === 'Certifications');
  if (detected) {
    log('DEBUG', 'Certifications section found');
    return scoreSectionByType(detected, content);
  }
  log('WARN', 'Certifications section not found (optional)');
  return {
    section: 'Certifications',
    score: 5,
    maxScore: 10,
    completeness: 50,
    feedback: ['Certifications section not found (optional)'],
    suggestions: ['Add relevant industry certifications'],
    status: 'fair',
    metrics: { headerCount: 0, paragraphCount: 0, bulletCount: 0, contentLength: 0, lineCount: 0 },
  };
}

export function analyzeProjectsSection(content: string): SectionScore {
  log('INFO', 'Legacy function: analyzeProjectsSection');
  const detected = detectSectionHeaders(content).find(s => s.standardName === 'Projects');
  if (detected) {
    log('DEBUG', 'Projects section found');
    return scoreSectionByType(detected, content);
  }
  log('WARN', 'Projects section not found (optional)');
  return {
    section: 'Projects',
    score: 5,
    maxScore: 10,
    completeness: 50,
    feedback: ['Projects section not found (optional)'],
    suggestions: ['Add a projects section with portfolio items'],
    status: 'fair',
    metrics: { headerCount: 0, paragraphCount: 0, bulletCount: 0, contentLength: 0, lineCount: 0 },
  };
}

export function analyzeAchievementsSection(content: string): SectionScore {
  log('INFO', 'Legacy function: analyzeAchievementsSection');
  const result = performSectionAnalysis(content);
  const achievements = result.sectionScores.find(s => s.section === 'Achievements');
  if (achievements && achievements.score > 0) {
    log('DEBUG', 'Achievements detected in full analysis');
    return achievements;
  }
  log('WARN', 'No achievements section found');
  return achievements || {
    section: 'Achievements',
    score: 0,
    maxScore: 10,
    completeness: 0,
    feedback: ['No achievements section found'],
    suggestions: ['Highlight quantifiable achievements throughout'],
    status: 'needs-improvement',
    metrics: { headerCount: 0, paragraphCount: 0, bulletCount: 0, contentLength: 0, lineCount: 0 },
  };
}
