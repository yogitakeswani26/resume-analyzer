/**
 * Detailed Resume Section Analysis
 * Analyzes resume for completeness and provides specific recommendations
 */

export interface SectionAnalysisResult {
  name: string;
  found: boolean;
  score: number;
  details: string;
  suggestions: string[];
  icon: string;
}

interface AnalysisReport {
  sections: SectionAnalysisResult[];
  overallScore: number;
  missingCritical: string[];
  topRecommendations: string[];
}

const SECTION_PATTERNS = {
  summary: {
    patterns: [/summary|objective|profile|introduction/i],
    minChars: 100,
    icon: '📝',
    name: 'Professional Summary',
  },
  experience: {
    patterns: [/experience|work.*history|employment|career/i],
    minChars: 200,
    icon: '💼',
    name: 'Work Experience',
  },
  skills: {
    patterns: [/skill|technical|expertise|proficien/i],
    minChars: 50,
    icon: '⚙️',
    name: 'Technical Skills',
  },
  education: {
    patterns: [/education|degree|university|college|diploma/i],
    minChars: 50,
    icon: '🎓',
    name: 'Education',
  },
  projects: {
    patterns: [/project|portfolio|built|developed|created/i],
    minChars: 100,
    icon: '🚀',
    name: 'Projects',
  },
  achievements: {
    patterns: [/achievement|award|recognition|certif/i],
    minChars: 50,
    icon: '🏆',
    name: 'Achievements/Certifications',
  },
  contact: {
    patterns: [/email|phone|linkedin|contact|location/i],
    minChars: 10,
    icon: '📞',
    name: 'Contact Information',
  },
};

export function analyzeResumeCompleteness(content: string): AnalysisReport {
  const sections: SectionAnalysisResult[] = [];
  const missingCritical: string[] = [];
  const topRecommendations: string[] = [];

  const lowerContent = content.toLowerCase();
  const contentLength = content.length;

  // Analyze each section
  Object.entries(SECTION_PATTERNS).forEach(([key, section]) => {
    const found = section.patterns.some(pattern => pattern.test(content));

    // Extract section content
    let sectionContent = '';
    if (found) {
      const match = content.match(
        new RegExp(`${section.patterns[0].source}[^]*?(?=(?:${
          Object.values(SECTION_PATTERNS)
            .filter(s => s !== section)
            .map(s => s.patterns[0].source)
            .join('|')
        })|$)`, 'i')
      );
      sectionContent = match ? match[0] : '';
    }

    const score = calculateSectionScore(key, found, sectionContent, section.minChars);
    const suggestions = generateSuggestions(key, found, sectionContent, section.minChars);

    sections.push({
      name: section.name,
      found,
      score,
      details: found ? `${sectionContent.length} characters` : 'Not found in resume',
      suggestions,
      icon: section.icon,
    });

    if (!found && ['summary', 'experience', 'skills', 'education'].includes(key)) {
      missingCritical.push(section.name);
    }
  });

  // Calculate overall score
  const overallScore = Math.round(
    (sections.reduce((sum, s) => sum + s.score, 0) / sections.length) * 10
  );

  // Generate top recommendations
  sections.forEach(section => {
    if (!section.found && section.suggestions.length > 0) {
      topRecommendations.push(`Add ${section.name}: ${section.suggestions[0]}`);
    }
  });

  // Add general recommendations
  if (contentLength < 300) {
    topRecommendations.unshift('Expand your resume - aim for 400+ characters minimum');
  }

  if (!lowerContent.includes('quantif') && !lowerContent.match(/\d+%|\d+x/)) {
    topRecommendations.unshift('Add quantifiable metrics - e.g., "increased by 30%", "served 1000+ users"');
  }

  return {
    sections,
    overallScore,
    missingCritical,
    topRecommendations: topRecommendations.slice(0, 5),
  };
}

function calculateSectionScore(
  key: string,
  found: boolean,
  content: string,
  minChars: number
): number {
  if (!found) return 0;
  if (content.length < minChars) return 3;
  if (content.length < minChars * 2) return 5;
  if (content.length < minChars * 3) return 7;
  return 10;
}

function generateSuggestions(
  key: string,
  found: boolean,
  content: string,
  minChars: number
): string[] {
  const suggestions: string[] = [];

  if (!found) {
    const advices: { [key: string]: string } = {
      summary: 'Add a 2-3 sentence professional summary highlighting your key strengths and career goals',
      experience: 'List your past roles with 3-5 achievement bullets per position, using quantifiable results',
      skills: 'Organize technical skills by category: Languages, Frameworks, Tools, Databases',
      education: 'Include your degree, institution, graduation date, and relevant coursework or honors',
      projects: 'Showcase 2-3 key projects with technologies used and measurable impact',
      achievements: 'Add relevant certifications, awards, or recognition that validates your expertise',
      contact: 'Add your email, phone, LinkedIn profile, and location for easy contact',
    };
    return [advices[key] || 'Add this section to improve completeness'];
  }

  // Content too short
  if (content.length < minChars) {
    suggestions.push(`Expand this section - currently ${content.length} chars, aim for ${minChars}+`);
  }

  // Specific section advice
  if (key === 'summary' && content.length < 150) {
    suggestions.push('Professional summary is too brief - expand to 2-3 sentences');
  }

  if (key === 'experience' && !content.match(/\d+\s*(year|yr)/i)) {
    suggestions.push('Include time periods for each role (e.g., "2020 - 2023")');
  }

  if (key === 'projects' && !content.match(/\d+%|increased|improved|reduced/i)) {
    suggestions.push('Add quantifiable impact to projects - e.g., "improved performance by 40%"');
  }

  if (key === 'skills') {
    if (!content.match(/javascript|react|python|java/i)) {
      suggestions.push('Include specific programming languages and frameworks');
    }
    if (content.split(',').length < 5) {
      suggestions.push('Add more technical skills - aim for 15+ key technologies');
    }
  }

  if (!content.match(/led|managed|architected|designed|developed/i)) {
    suggestions.push('Use strong action verbs to describe your impact and leadership');
  }

  return suggestions.length > 0 ? suggestions : ['Section looks good!'];
}
