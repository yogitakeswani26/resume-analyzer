/**
 * TypeScript type definitions for the Resume Analytics system
 */

// ============================================================================
// TIMELINE DATA
// ============================================================================

export interface TimelineEntry {
  date: string;
  healthScore: number;
  atsScore: number;
}

export interface TimelineDatapoint {
  date: Date;
  healthScore: number;
  atsScore: number;
  percentile?: number;
}

// ============================================================================
// SECTION ANALYSIS
// ============================================================================

export interface SectionStrength {
  section: string;
  score: number;
  feedback?: string;
  lastUpdated?: Date;
}

export enum ResumeSection {
  SUMMARY = 'Summary',
  EXPERIENCE = 'Experience',
  SKILLS = 'Skills',
  EDUCATION = 'Education',
  PROJECTS = 'Projects',
  CERTIFICATIONS = 'Certifications',
  AWARDS = 'Awards',
  LANGUAGES = 'Languages',
}

export interface SectionAnalysis {
  section: ResumeSection;
  score: number;
  maxScore: number;
  improvements: string[];
  strengths: string[];
  benchmark?: number; // Industry average
}

// ============================================================================
// SKILLS ANALYSIS
// ============================================================================

export interface Skill {
  name: string;
  proficiency: number; // 0-100
  yearsOfExperience?: number;
  lastUsed?: Date;
  endorsed?: boolean;
  endorsementCount?: number;
}

export interface SkillRadarPoint {
  skill: string;
  proficiency: number; // Your skill level
  demand: number; // Market demand for this skill
  gap?: number; // demand - proficiency
  trend?: 'up' | 'down' | 'stable';
}

export interface SkillGap {
  skill: string;
  yourLevel: number;
  requiredLevel: number;
  gap: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

// ============================================================================
// ATS SCORING
// ============================================================================

export interface ATSTrendPoint {
  date: string;
  atsScore: number;
  percentile?: number;
  feedback?: string;
}

export interface ATSAnalysis {
  score: number; // 0-100
  percentile?: number;
  keywordMatches: number;
  formatIssues: string[];
  atsCompatibility: 'excellent' | 'good' | 'fair' | 'poor';
  suggestions: string[];
  trend: {
    currentScore: number;
    previousScore: number;
    change: number;
    changePercentage: number;
  };
}

// ============================================================================
// RECOMMENDATIONS
// ============================================================================

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  section: ResumeSection;
  priority: 'critical' | 'high' | 'medium' | 'low';
  implemented: boolean;
  implementedDate?: Date;
  impactScore?: number; // Expected impact on ATS score
  estimatedTime?: number; // Minutes to implement
  action?: string; // Call to action
}

export interface RecommendationsTracker {
  total: number;
  implemented: number;
  pending: number;
  critical: number;
  byPriority?: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export interface RecommendationsBySection {
  section: ResumeSection;
  recommendations: Recommendation[];
  implementationProgress: number;
}

// ============================================================================
// INDUSTRY BENCHMARKING
// ============================================================================

export interface IndustryComparisonPoint {
  metric: string;
  yourScore: number;
  industryAverage: number;
  percentile?: number;
  trend?: 'above' | 'below' | 'inline';
}

export interface IndustryBenchmark {
  role: string;
  location?: string;
  experience?: string;
  metrics: IndustryComparisonPoint[];
  percentileRank?: number;
  insights?: string[];
}

export interface ComparisonMetric {
  name: string;
  yourValue: number;
  benchmark: number;
  unit?: string;
  interpretation: 'good' | 'average' | 'below-average';
}

// ============================================================================
// HEALTH SCORE
// ============================================================================

export interface ResumeHealthScore {
  overall: number; // 0-100
  sections: Record<string, number>;
  components: {
    content: number;
    formatting: number;
    ats: number;
    completeness: number;
  };
  trend?: {
    current: number;
    previous: number;
    change: number;
  };
  lastCalculated: Date;
}

export interface HealthScoreTrend {
  date: Date;
  score: number;
  components: Record<string, number>;
}

// ============================================================================
// COMPREHENSIVE ANALYTICS DATA
// ============================================================================

export interface AnalyticsData {
  resumeId?: string;
  resumeName?: string;
  generatedAt: Date;

  // Timeline data
  timeline: TimelineEntry[];
  timelineStats?: {
    averageHealth: number;
    averageATS: number;
    highestHealth: number;
    highestATS: number;
  };

  // Section analysis
  sectionStrengths: SectionStrength[];
  sectionAnalysis?: SectionAnalysis[];

  // Skills analysis
  skillsRadar: SkillRadarPoint[];
  topSkills?: Skill[];
  skillGaps?: SkillGap[];

  // ATS scoring
  atsScoreTrend: ATSTrendPoint[];
  currentATS?: ATSAnalysis;

  // Recommendations
  recommendationsTracker: RecommendationsTracker;
  recommendations?: Recommendation[];
  recommendationsBySection?: RecommendationsBySection[];

  // Industry comparison
  industryComparison: IndustryComparisonPoint[];
  industryBenchmark?: IndustryBenchmark;

  // Health score
  healthScore?: ResumeHealthScore;
  healthScoreTrend?: HealthScoreTrend[];
}

// ============================================================================
// COMPONENT PROPS
// ============================================================================

export interface ResumeAnalyticsDashboardProps {
  data?: AnalyticsData;
  resumeId?: string;
  onExport?: (format: ExportFormat) => void;
  onRefresh?: () => void;
  showMockData?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  compact?: boolean; // Show compact view with fewer charts
}

export interface StatTileProps {
  label: string;
  value: string | number;
  delta?: {
    value: number;
    isPositive: boolean;
    period?: string; // e.g., "vs last week"
  };
  icon: string;
  bgColor: string;
  textColor: string;
  onClick?: () => void;
  trend?: 'up' | 'down' | 'stable';
}

// ============================================================================
// EXPORT & REPORTING
// ============================================================================

export type ExportFormat = 'json' | 'csv' | 'tsv' | 'html' | 'pdf' | 'docx';

export interface ExportOption {
  format: ExportFormat;
  label: string;
  description: string;
  mimeType: string;
  requiresLibrary?: string;
}

export interface ExportConfig {
  includeCharts: boolean;
  includeRecommendations: boolean;
  includeBenchmarks: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  fileName: string;
  watermark?: string;
}

// ============================================================================
// SCORE & FEEDBACK
// ============================================================================

export type ScoreStatus = 'excellent' | 'good' | 'fair' | 'poor';

export interface ScoreInterpretation {
  score: number;
  status: ScoreStatus;
  message: string;
  suggestions: string[];
  nextSteps: string[];
}

export interface FeedbackItem {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  description: string;
  action?: {
    label: string;
    handler: () => void;
  };
  dismissible?: boolean;
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

export interface ReportConfig {
  title: string;
  subtitle?: string;
  includeExecutiveSummary: boolean;
  includeSectionAnalysis: boolean;
  includeSkillsAssessment: boolean;
  includeATSAnalysis: boolean;
  includeRecommendations: boolean;
  includeBenchmarking: boolean;
  reportType: 'full' | 'summary' | 'executive';
  format: ExportFormat;
}

export interface ReportMetadata {
  title: string;
  generatedDate: Date;
  resumeName: string;
  userName?: string;
  version: string;
  pageCount?: number;
}

// ============================================================================
// PAGINATION & FILTERING
// ============================================================================

export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterOptions {
  section?: ResumeSection;
  priority?: ('critical' | 'high' | 'medium' | 'low')[];
  implemented?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
  };
  timestamp: Date;
}

export interface AnalyticsApiResponse extends ApiResponse<AnalyticsData> {}

export interface HealthScoreApiResponse extends ApiResponse<ResumeHealthScore> {}

export interface RecommendationsApiResponse extends ApiResponse<Recommendation[]> {}

// ============================================================================
// VISUALIZATION-SPECIFIC TYPES
// ============================================================================

export interface ChartDataPoint {
  [key: string]: string | number;
}

export interface ChartConfig {
  responsive: boolean;
  maintainAspectRatio: boolean;
  showLegend: boolean;
  showTooltip: boolean;
  showGrid: boolean;
}

export interface TooltipPayload {
  name: string;
  value: number;
  color?: string;
  unit?: string;
}

// ============================================================================
// COLOR PALETTE TYPES
// ============================================================================

export interface ColorPalette {
  surface: string;
  page: string;
  primary: string;
  secondary: string;
  muted: string;
  gridline: string;
  baseline: string;
  border: string;
  series: string[];
  sequential: string[];
  diverging: {
    positive: string;
    negative: string;
    neutral: string;
  };
  status: {
    good: string;
    warning: string;
    serious: string;
    critical: string;
  };
}

// ============================================================================
// SORTING & GROUPING
// ============================================================================

export interface GroupedRecommendations {
  bySection: Record<ResumeSection, Recommendation[]>;
  byPriority: Record<'critical' | 'high' | 'medium' | 'low', Recommendation[]>;
  byStatus: {
    implemented: Recommendation[];
    pending: Recommendation[];
  };
}

// ============================================================================
// COMMON UTILITY TYPES
// ============================================================================

export type DateRange = {
  start: Date;
  end: Date;
};

export type Period = 'week' | 'month' | 'quarter' | 'year' | 'all';

export type ComparisonDirection = 'above' | 'below' | 'inline';

export interface Trend {
  direction: 'up' | 'down' | 'stable';
  percentage: number;
  period: Period;
}

// ============================================================================
// VALIDATION
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
