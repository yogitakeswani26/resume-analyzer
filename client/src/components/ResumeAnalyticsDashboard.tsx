import React, { useState, useRef, useEffect } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface AnalyticsData {
  timeline: TimelineEntry[];
  sectionStrengths: SectionStrength[];
  skillsRadar: SkillRadarPoint[];
  atsScoreTrend: ATSTrendPoint[];
  recommendationsTracker: RecommendationsTracker;
  industryComparison: IndustryComparisonPoint[];
}

interface TimelineEntry {
  date: string;
  healthScore: number;
  atsScore: number;
}

interface SectionStrength {
  section: string;
  score: number;
}

interface SkillRadarPoint {
  skill: string;
  proficiency: number;
  demand: number;
}

interface ATSTrendPoint {
  date: string;
  atsScore: number;
  percentile?: number;
}

interface RecommendationsTracker {
  total: number;
  implemented: number;
  pending: number;
  critical: number;
}

interface IndustryComparisonPoint {
  metric: string;
  yourScore: number;
  industryAverage: number;
}

interface ResumeAnalyticsDashboardProps {
  data?: AnalyticsData;
  resumeId?: string;
}

// ============================================================================
// COLOR PALETTE (Reference: dataviz/references/palette.md)
// ============================================================================

const COLORS = {
  light: {
    surface: '#fcfcfb',
    page: '#f9f9f7',
    primary: '#0b0b0b',
    secondary: '#52514e',
    muted: '#898781',
    gridline: '#e1e0d9',
    baseline: '#c3c2b7',
    border: 'rgba(11,11,11,0.10)',
    // Categorical
    series1: '#2a78d6', // blue
    series2: '#1baf7a', // aqua
    series3: '#eda100', // yellow
    series4: '#008300', // green
    series5: '#4a3aa7', // violet
    series6: '#e34948', // red
    // Sequential (blue)
    seq100: '#cde2fb',
    seq150: '#b7d3f6',
    seq200: '#9ec5f4',
    seq250: '#86b6ef',
    seq300: '#6da7ec',
    seq350: '#5598e7',
    seq400: '#3987e5',
    seq450: '#2a78d6',
    seq500: '#256abf',
    seq550: '#1c5cab',
    seq600: '#184f95',
    seq650: '#104281',
    seq700: '#0d366b',
    // Diverging
    divBlue100: '#cde2fb',
    divBlue500: '#256abf',
    divNeutral: '#f0efec',
    divRed500: '#e63c3b',
    divRed100: '#fbd5d5',
    // Status
    good: '#0ca30c',
    warning: '#fab219',
    serious: '#ec835a',
    critical: '#d03b3b',
  },
  dark: {
    surface: '#1a1a19',
    page: '#0d0d0d',
    primary: '#ffffff',
    secondary: '#c3c2b7',
    muted: '#898781',
    gridline: '#2c2c2a',
    baseline: '#383835',
    border: 'rgba(255,255,255,0.10)',
    // Categorical
    series1: '#3987e5', // blue
    series2: '#199e70', // aqua
    series3: '#c98500', // yellow
    series4: '#008300', // green
    series5: '#9085e9', // violet
    series6: '#e66767', // red
    // Sequential (blue)
    seq100: '#1a3a52',
    seq150: '#1b475f',
    seq200: '#1d556e',
    seq250: '#236280',
    seq300: '#2a7094',
    seq350: '#327fab',
    seq400: '#3987e5',
    seq450: '#4a95f0',
    seq500: '#5da7f8',
    seq550: '#7eb8fc',
    seq600: '#9ec8fd',
    seq650: '#bdd8fd',
    seq700: '#cfe5fe',
    // Diverging
    divBlue100: '#1a3a52',
    divBlue500: '#3987e5',
    divNeutral: '#383835',
    divRed500: '#e66767',
    divRed100: '#5a2c2c',
    // Status
    good: '#0ca30c',
    warning: '#fab219',
    serious: '#ec835a',
    critical: '#d03b3b',
  },
};

// ============================================================================
// MOCK DATA GENERATOR (for demonstration)
// ============================================================================

const generateMockData = (): AnalyticsData => {
  const today = new Date();
  const timeline: TimelineEntry[] = [];
  for (let i = 30; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    timeline.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      healthScore: 75,
      atsScore: 80,
    });
  }

  return {
    timeline,
    sectionStrengths: [
      { section: 'Summary', score: 82 },
      { section: 'Experience', score: 76 },
      { section: 'Skills', score: 68 },
      { section: 'Education', score: 85 },
      { section: 'Projects', score: 72 },
      { section: 'Certifications', score: 55 },
    ],
    skillsRadar: [
      { skill: 'TypeScript', proficiency: 85, demand: 92 },
      { skill: 'React', proficiency: 88, demand: 95 },
      { skill: 'Node.js', proficiency: 80, demand: 88 },
      { skill: 'Python', proficiency: 75, demand: 90 },
      { skill: 'AWS', proficiency: 70, demand: 85 },
      { skill: 'SQL', proficiency: 82, demand: 87 },
    ],
    atsScoreTrend: timeline.slice(-15).map((entry, idx) => ({
      date: entry.date,
      atsScore: entry.atsScore,
      percentile: 40 + idx * 2,
    })),
    recommendationsTracker: {
      total: 24,
      implemented: 15,
      pending: 9,
      critical: 3,
    },
    industryComparison: [
      { metric: 'ATS Score', yourScore: 78, industryAverage: 72 },
      { metric: 'Keyword Match', yourScore: 85, industryAverage: 68 },
      { metric: 'Experience', yourScore: 76, industryAverage: 74 },
      { metric: 'Skills Match', yourScore: 82, industryAverage: 70 },
      { metric: 'Format Quality', yourScore: 88, industryAverage: 75 },
    ],
  };
};

// ============================================================================
// CUSTOM COMPONENTS
// ============================================================================

interface StatTileProps {
  label: string;
  value: string | number;
  delta?: {
    value: number;
    isPositive: boolean;
  };
  icon: string;
  bgColor: string;
  textColor: string;
}

const StatTile: React.FC<StatTileProps> = ({
  label,
  value,
  delta,
  icon,
  bgColor,
  textColor,
}) => {
  const isDark = bgColor.includes('dark');
  const theme = isDark ? COLORS.dark : COLORS.light;

  return (
    <div
      className="rounded-xl p-6 backdrop-blur border"
      style={{
        backgroundColor: bgColor,
        borderColor: theme.border,
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <span className="text-3xl">{icon}</span>
      </div>
      <div
        className="text-sm font-medium mb-2"
        style={{ color: theme.secondary }}
      >
        {label}
      </div>
      <div className="flex items-baseline gap-3">
        <div
          className="text-3xl font-bold"
          style={{ color: textColor }}
        >
          {value}
        </div>
        {delta && (
          <div
            className="text-sm font-semibold"
            style={{
              color: delta.isPositive ? theme.good : COLORS.light.critical,
            }}
          >
            {delta.isPositive ? '↑' : '↓'} {Math.abs(delta.value)}%
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// EXPORT UTILITIES
// ============================================================================

const exportToJSON = (data: AnalyticsData, fileName: string = 'resume-analytics') => {
  const dataStr = JSON.stringify(data, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

const exportToPDF = (elementId: string, fileName: string = 'resume-analytics') => {
  // Note: This requires jsPDF and html2canvas to be installed
  // npm install jspdf html2canvas
  const element = document.getElementById(elementId);
  if (!element) {
    console.error('Element not found for PDF export');
    return;
  }

  // For now, provide feedback that PDF export requires additional setup
  alert(
    'PDF export requires jsPDF and html2canvas. Install with: npm install jspdf html2canvas'
  );

  // Once libraries are installed, uncomment this code:
  /*
  import html2canvas from 'html2canvas';
  import { jsPDF } from 'jspdf';

  html2canvas(element).then((canvas) => {
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(`${fileName}.pdf`);
  });
  */
};

const exportToCSV = (data: AnalyticsData, fileName: string = 'resume-analytics') => {
  const csvContent = [
    ['Resume Analytics Export', new Date().toISOString()],
    [],
    ['Timeline'],
    ['Date', 'Health Score', 'ATS Score'],
    ...data.timeline.map((entry) => [
      entry.date,
      entry.healthScore.toFixed(2),
      entry.atsScore.toFixed(2),
    ]),
    [],
    ['Section Strengths'],
    ['Section', 'Score'],
    ...data.sectionStrengths.map((sec) => [sec.section, sec.score]),
    [],
    ['Recommendations Tracker'],
    ['Metric', 'Count'],
    ['Total', data.recommendationsTracker.total],
    ['Implemented', data.recommendationsTracker.implemented],
    ['Pending', data.recommendationsTracker.pending],
    ['Critical', data.recommendationsTracker.critical],
  ]
    .map((row) => row.join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ResumeAnalyticsDashboard: React.FC<ResumeAnalyticsDashboardProps> = ({
  data: initialData,
}) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [data, setData] = useState<AnalyticsData>(
    initialData || generateMockData()
  );
  const dashboardRef = useRef<HTMLDivElement>(null);

  const theme = isDarkMode ? COLORS.dark : COLORS.light;

  // Detect system dark mode preference
  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDark);
  }, []);

  return (
    <div
      ref={dashboardRef}
      className="min-h-screen py-12 px-4 transition-colors duration-300"
      style={{
        backgroundColor: theme.page,
        color: theme.primary,
      }}
    >
      {/* ====== HEADER ====== */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">📊 Resume Analytics</h1>
            <p style={{ color: theme.secondary }}>
              Track your resume health and improvement over time
            </p>
          </div>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="px-4 py-2 rounded-lg font-semibold transition-colors"
            style={{
              backgroundColor: isDarkMode ? '#3a3a38' : '#e8e8e5',
              color: isDarkMode ? '#ffffff' : '#0b0b0b',
              borderColor: theme.border,
            }}
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>

        {/* ====== KEY METRICS ====== */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatTile
            label="Overall Health"
            value={`${Math.round(data.timeline[data.timeline.length - 1]?.healthScore || 0)}%`}
            delta={{ value: 12, isPositive: true }}
            icon="💪"
            bgColor={`rgba(42, 120, 214, ${isDarkMode ? 0.15 : 0.08})`}
            textColor={isDarkMode ? COLORS.dark.series1 : COLORS.light.series1}
          />
          <StatTile
            label="ATS Score"
            value={`${Math.round(data.timeline[data.timeline.length - 1]?.atsScore || 0)}%`}
            delta={{ value: 8, isPositive: true }}
            icon="🎯"
            bgColor={`rgba(27, 175, 122, ${isDarkMode ? 0.15 : 0.08})`}
            textColor={isDarkMode ? COLORS.dark.series2 : COLORS.light.series2}
          />
          <StatTile
            label="Skills Listed"
            value={data.skillsRadar.length}
            icon="⚙️"
            bgColor={`rgba(237, 161, 0, ${isDarkMode ? 0.15 : 0.08})`}
            textColor={isDarkMode ? COLORS.dark.series3 : COLORS.light.series3}
          />
          <StatTile
            label="Recommendations"
            value={`${data.recommendationsTracker.implemented}/${data.recommendationsTracker.total}`}
            delta={{ value: 62, isPositive: true }}
            icon="✅"
            bgColor={`rgba(0, 131, 0, ${isDarkMode ? 0.15 : 0.08})`}
            textColor={isDarkMode ? COLORS.dark.series4 : COLORS.light.series4}
          />
        </div>

        {/* ====== MAIN CHARTS ====== */}
        <div className="space-y-8">
          {/* ====== RESUME HEALTH TIMELINE ====== */}
          <div
            className="rounded-xl p-8 backdrop-blur border"
            style={{
              backgroundColor: `rgba(${isDarkMode ? '26, 26, 25' : '252, 252, 251'}, 0.8)`,
              borderColor: theme.border,
            }}
          >
            <h2 className="text-2xl font-bold mb-6">📈 Resume Health Timeline</h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.timeline}>
                <defs>
                  <linearGradient id="healthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={theme.series1}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor={theme.series1}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="0"
                  stroke={theme.gridline}
                  vertical={false}
                  style={{ opacity: 0.5 }}
                />
                <XAxis
                  dataKey="date"
                  stroke={theme.muted}
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke={theme.muted}
                  style={{ fontSize: '12px' }}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#2c2c2a' : '#fcfcfb',
                    borderColor: theme.series1,
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: theme.primary }}
                  itemStyle={{ color: theme.primary }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="healthScore"
                  stroke={theme.series1}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#healthGradient)"
                  name="Health Score"
                  dot={{ fill: theme.series1, r: 4, strokeWidth: 2, stroke: theme.surface }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* ====== SECTION-BY-SECTION STRENGTH ====== */}
          <div
            className="rounded-xl p-8 backdrop-blur border"
            style={{
              backgroundColor: `rgba(${isDarkMode ? '26, 26, 25' : '252, 252, 251'}, 0.8)`,
              borderColor: theme.border,
            }}
          >
            <h2 className="text-2xl font-bold mb-6">📋 Section Strengths</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.sectionStrengths}>
                <CartesianGrid
                  strokeDasharray="0"
                  stroke={theme.gridline}
                  vertical={false}
                  style={{ opacity: 0.5 }}
                />
                <XAxis
                  dataKey="section"
                  stroke={theme.muted}
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke={theme.muted}
                  style={{ fontSize: '12px' }}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#2c2c2a' : '#fcfcfb',
                    borderColor: theme.series1,
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: theme.primary }}
                  itemStyle={{ color: theme.primary }}
                />
                <Bar
                  dataKey="score"
                  fill={theme.series1}
                  radius={[4, 4, 0, 0]}
                  name="Strength Score"
                >
                  {data.sectionStrengths.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={theme.series1} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* ====== SKILLS RADAR CHART ====== */}
          <div
            className="rounded-xl p-8 backdrop-blur border"
            style={{
              backgroundColor: `rgba(${isDarkMode ? '26, 26, 25' : '252, 252, 251'}, 0.8)`,
              borderColor: theme.border,
            }}
          >
            <h2 className="text-2xl font-bold mb-6">⚙️ Skills Proficiency vs Market Demand</h2>
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={data.skillsRadar}>
                <PolarGrid
                  stroke={theme.gridline}
                  style={{ opacity: 0.5 }}
                />
                <PolarAngleAxis
                  dataKey="skill"
                  stroke={theme.muted}
                  style={{ fontSize: '12px' }}
                />
                <PolarRadiusAxis
                  stroke={theme.muted}
                  style={{ fontSize: '12px' }}
                  domain={[0, 100]}
                />
                <Radar
                  name="Your Proficiency"
                  dataKey="proficiency"
                  stroke={theme.series1}
                  fill={theme.series1}
                  fillOpacity={0.25}
                />
                <Radar
                  name="Market Demand"
                  dataKey="demand"
                  stroke={theme.series2}
                  fill={theme.series2}
                  fillOpacity={0.25}
                />
                <Legend />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#2c2c2a' : '#fcfcfb',
                    borderColor: theme.series1,
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: theme.primary }}
                  itemStyle={{ color: theme.primary }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* ====== ATS SCORE TREND ====== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div
              className="rounded-xl p-8 backdrop-blur border"
              style={{
                backgroundColor: `rgba(${isDarkMode ? '26, 26, 25' : '252, 252, 251'}, 0.8)`,
                borderColor: theme.border,
              }}
            >
              <h2 className="text-2xl font-bold mb-6">🎯 ATS Score Trend</h2>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={data.atsScoreTrend}>
                  <CartesianGrid
                    strokeDasharray="0"
                    stroke={theme.gridline}
                    vertical={false}
                    style={{ opacity: 0.5 }}
                  />
                  <XAxis
                    dataKey="date"
                    stroke={theme.muted}
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis
                    stroke={theme.muted}
                    style={{ fontSize: '12px' }}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDarkMode ? '#2c2c2a' : '#fcfcfb',
                      borderColor: theme.series2,
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: theme.primary }}
                    itemStyle={{ color: theme.primary }}
                  />
                  <Line
                    type="monotone"
                    dataKey="atsScore"
                    stroke={theme.series2}
                    strokeWidth={2}
                    dot={{ fill: theme.series2, r: 4, strokeWidth: 2, stroke: theme.surface }}
                    name="ATS Score"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* ====== RECOMMENDATIONS TRACKER ====== */}
            <div
              className="rounded-xl p-8 backdrop-blur border"
              style={{
                backgroundColor: `rgba(${isDarkMode ? '26, 26, 25' : '252, 252, 251'}, 0.8)`,
                borderColor: theme.border,
              }}
            >
              <h2 className="text-2xl font-bold mb-6">📋 Recommendations Tracker</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg"
                  style={{ backgroundColor: `rgba(${isDarkMode ? '57, 135, 229' : '42, 120, 214'}, 0.1)` }}>
                  <span style={{ color: theme.secondary }}>Total Recommendations</span>
                  <span className="text-2xl font-bold" style={{ color: theme.series1 }}>
                    {data.recommendationsTracker.total}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg"
                  style={{ backgroundColor: `rgba(${isDarkMode ? '25, 158, 112' : '27, 175, 122'}, 0.1)` }}>
                  <span style={{ color: theme.secondary }}>✅ Implemented</span>
                  <span className="text-2xl font-bold" style={{ color: theme.series2 }}>
                    {data.recommendationsTracker.implemented}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg"
                  style={{ backgroundColor: `rgba(${isDarkMode ? '201, 133, 0' : '237, 161, 0'}, 0.1)` }}>
                  <span style={{ color: theme.secondary }}>⏳ Pending</span>
                  <span className="text-2xl font-bold" style={{ color: theme.series3 }}>
                    {data.recommendationsTracker.pending}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg"
                  style={{ backgroundColor: `rgba(${isDarkMode ? '230, 103, 103' : '227, 73, 72'}, 0.1)` }}>
                  <span style={{ color: theme.secondary }}>🔴 Critical</span>
                  <span className="text-2xl font-bold" style={{ color: theme.series6 }}>
                    {data.recommendationsTracker.critical}
                  </span>
                </div>
                <div className="mt-6 pt-4 border-t" style={{ borderColor: theme.gridline }}>
                  <div className="text-sm font-semibold mb-3" style={{ color: theme.secondary }}>
                    Progress
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden"
                    style={{ backgroundColor: isDarkMode ? '#383835' : '#e8e8e5' }}>
                    <div
                      className="h-3 rounded-full transition-all duration-500"
                      style={{
                        width: `${(data.recommendationsTracker.implemented / data.recommendationsTracker.total) * 100}%`,
                        backgroundColor: theme.series2,
                      }}
                    />
                  </div>
                  <p className="text-xs mt-2" style={{ color: theme.secondary }}>
                    {Math.round((data.recommendationsTracker.implemented / data.recommendationsTracker.total) * 100)}% complete
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ====== INDUSTRY COMPARISON ====== */}
          <div
            className="rounded-xl p-8 backdrop-blur border"
            style={{
              backgroundColor: `rgba(${isDarkMode ? '26, 26, 25' : '252, 252, 251'}, 0.8)`,
              borderColor: theme.border,
            }}
          >
            <h2 className="text-2xl font-bold mb-6">📊 Comparison to Industry Averages</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.industryComparison}>
                <CartesianGrid
                  strokeDasharray="0"
                  stroke={theme.gridline}
                  vertical={false}
                  style={{ opacity: 0.5 }}
                />
                <XAxis
                  dataKey="metric"
                  stroke={theme.muted}
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke={theme.muted}
                  style={{ fontSize: '12px' }}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#2c2c2a' : '#fcfcfb',
                    borderColor: theme.series1,
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: theme.primary }}
                  itemStyle={{ color: theme.primary }}
                />
                <Legend />
                <Bar
                  dataKey="yourScore"
                  fill={theme.series1}
                  radius={[4, 4, 0, 0]}
                  name="Your Score"
                />
                <Bar
                  dataKey="industryAverage"
                  fill={theme.series5}
                  radius={[4, 4, 0, 0]}
                  name="Industry Average"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* ====== EXPORT OPTIONS ====== */}
          <div
            className="rounded-xl p-8 backdrop-blur border"
            style={{
              backgroundColor: `rgba(${isDarkMode ? '26, 26, 25' : '252, 252, 251'}, 0.8)`,
              borderColor: theme.border,
            }}
          >
            <h2 className="text-2xl font-bold mb-6">💾 Export & Download</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => exportToJSON(data)}
                className="px-6 py-4 rounded-lg font-semibold transition-all hover:shadow-lg"
                style={{
                  backgroundColor: theme.series1,
                  color: '#ffffff',
                }}
              >
                📄 Download JSON
              </button>
              <button
                onClick={() => exportToCSV(data)}
                className="px-6 py-4 rounded-lg font-semibold transition-all hover:shadow-lg"
                style={{
                  backgroundColor: theme.series2,
                  color: '#ffffff',
                }}
              >
                📊 Download CSV
              </button>
              <button
                onClick={() => exportToPDF('analytics-dashboard')}
                className="px-6 py-4 rounded-lg font-semibold transition-all hover:shadow-lg"
                style={{
                  backgroundColor: theme.series3,
                  color: '#ffffff',
                }}
              >
                📑 Download PDF
              </button>
              <button
                onClick={() => window.print()}
                className="px-6 py-4 rounded-lg font-semibold transition-all hover:shadow-lg"
                style={{
                  backgroundColor: theme.series5,
                  color: '#ffffff',
                }}
              >
                🖨️ Print Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ====== FOOTER ====== */}
      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t" style={{ borderColor: theme.gridline }}>
        <p className="text-center text-sm" style={{ color: theme.secondary }}>
          Last updated: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};

export default ResumeAnalyticsDashboard;
