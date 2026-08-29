import React from 'react';

interface SectionCheckItem {
  name: string;
  found: boolean;
  score: number;
  details: string;
  suggestions: string[];
  icon: string;
}

interface SectionAnalysisProps {
  sections: SectionCheckItem[];
  overallScore: number;
}

export const SectionAnalysis: React.FC<SectionAnalysisProps> = ({ sections, overallScore }) => {
  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Resume Completeness Score</h2>
          <div className="text-5xl font-bold text-blue-600">{overallScore}%</div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all"
            style={{ width: `${overallScore}%` }}
          />
        </div>
        <p className="text-sm text-gray-600 mt-4">
          {overallScore >= 85
            ? '✅ Your resume is well-structured! Minor improvements needed.'
            : overallScore >= 70
            ? '⚠️ Good start, but missing some key sections. See recommendations below.'
            : '🔴 Missing critical sections. Follow the recommendations to improve significantly.'}
        </p>
      </div>

      {/* Section Checklist */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-800">Resume Sections Analysis</h3>

        {sections.map((section, idx) => (
          <div
            key={idx}
            className={`rounded-lg p-6 border-2 transition-all ${
              section.found
                ? 'bg-green-50 border-green-300'
                : 'bg-red-50 border-red-300'
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{section.icon}</span>
                <div>
                  <h4 className="font-bold text-gray-800">{section.name}</h4>
                  <p className="text-xs text-gray-600">{section.details}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`font-bold text-lg ${
                  section.found ? 'text-green-600' : 'text-red-600'
                }`}>
                  {section.score}/10
                </span>
              </div>
            </div>

            {/* Score Bar */}
            <div className="mb-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    section.found
                      ? 'bg-gradient-to-r from-green-400 to-green-600'
                      : 'bg-gradient-to-r from-red-400 to-red-600'
                  }`}
                  style={{ width: `${section.score * 10}%` }}
                />
              </div>
            </div>

            {/* Suggestions */}
            {section.suggestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700">💡 Recommendations:</p>
                <ul className="space-y-2">
                  {section.suggestions.map((suggestion, sidx) => (
                    <li key={sidx} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-blue-500 mt-1">→</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Key Insights */}
      <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-300">
        <h3 className="font-bold text-yellow-900 mb-3">📌 Key Insights</h3>
        <ul className="space-y-2 text-sm text-yellow-900">
          <li>✓ Professional summary should be 2-3 sentences highlighting your unique value</li>
          <li>✓ Each job should have 3-5 bullet points with quantifiable achievements</li>
          <li>✓ Include specific technologies and tools you&apos;ve used</li>
          <li>✓ Projects section should showcase real-world impact with measurable results</li>
          <li>✓ Keep the total resume length to 1-2 pages for maximum impact</li>
        </ul>
      </div>
    </div>
  );
};
