import React from 'react';

interface DetailedRecommendations {
  summary?: string;
  experience?: string;
  skills?: string;
  education?: string;
  projects?: string;
  format?: string;
}

interface AIAnalysisProps {
  analysis: {
    overallAssessment: string;
    strengths: string[];
    weaknesses: string[];
    detailedRecommendations: DetailedRecommendations;
    atsScore: number;
    careerAdvice: string;
    nextSteps: string[];
    improvementPriority: 'critical' | 'high' | 'medium' | 'low';
  };
}

export const AIAnalysisDisplay: React.FC<AIAnalysisProps> = ({ analysis }) => {
  const priorityColors = {
    critical: 'bg-red-50 border-red-300',
    high: 'bg-orange-50 border-orange-300',
    medium: 'bg-yellow-50 border-yellow-300',
    low: 'bg-green-50 border-green-300',
  };

  const priorityIcons = {
    critical: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '🟢',
  };

  return (
    <div className="space-y-8 py-8">
      {/* Overall Assessment */}
      <div className={`p-8 rounded-xl border-2 ${priorityColors[analysis.improvementPriority]}`}>
        <div className="flex items-start gap-4">
          <span className="text-4xl">{priorityIcons[analysis.improvementPriority]}</span>
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-3 text-gray-800">AI Assessment</h2>
            <p className="text-gray-700 leading-relaxed text-lg">{analysis.overallAssessment}</p>
            <p className="text-sm text-gray-600 mt-3">
              Priority Level: <span className="font-semibold capitalize">{analysis.improvementPriority}</span>
            </p>
          </div>
        </div>
      </div>

      {/* ATS Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-xl border-2 border-blue-300">
          <p className="text-gray-600 mb-2">ATS Score</p>
          <div className="text-5xl font-bold text-blue-600 mb-2">{analysis.atsScore}%</div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full"
              style={{ width: `${analysis.atsScore}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-3">
            {analysis.atsScore >= 80
              ? '✅ Excellent ATS compatibility'
              : analysis.atsScore >= 60
              ? '⚠️ Good, but needs improvements'
              : '🔴 Significant ATS issues to fix'}
          </p>
        </div>

        {/* Strengths */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-xl border-2 border-green-300">
          <h3 className="font-bold text-lg mb-4 text-green-900">💪 Strengths</h3>
          <ul className="space-y-2">
            {analysis.strengths.map((strength, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-green-900">
                <span className="text-green-600 mt-1">✓</span>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Weaknesses */}
        <div className="bg-gradient-to-br from-red-50 to-pink-50 p-8 rounded-xl border-2 border-red-300">
          <h3 className="font-bold text-lg mb-4 text-red-900">⚠️ Areas to Improve</h3>
          <ul className="space-y-2">
            {analysis.weaknesses.map((weakness, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-red-900">
                <span className="text-red-600 mt-1">✕</span>
                <span>{weakness}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Detailed Recommendations by Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-800">📋 Section-by-Section Recommendations</h2>

        {analysis.detailedRecommendations.summary && (
          <div className="bg-blue-50 border-2 border-blue-300 p-6 rounded-xl">
            <h3 className="font-bold text-lg text-blue-900 mb-3">📝 Professional Summary</h3>
            <p className="text-gray-700 leading-relaxed">{analysis.detailedRecommendations.summary}</p>
          </div>
        )}

        {analysis.detailedRecommendations.experience && (
          <div className="bg-purple-50 border-2 border-purple-300 p-6 rounded-xl">
            <h3 className="font-bold text-lg text-purple-900 mb-3">💼 Work Experience</h3>
            <p className="text-gray-700 leading-relaxed">{analysis.detailedRecommendations.experience}</p>
          </div>
        )}

        {analysis.detailedRecommendations.skills && (
          <div className="bg-indigo-50 border-2 border-indigo-300 p-6 rounded-xl">
            <h3 className="font-bold text-lg text-indigo-900 mb-3">⚙️ Technical Skills</h3>
            <p className="text-gray-700 leading-relaxed">{analysis.detailedRecommendations.skills}</p>
          </div>
        )}

        {analysis.detailedRecommendations.education && (
          <div className="bg-amber-50 border-2 border-amber-300 p-6 rounded-xl">
            <h3 className="font-bold text-lg text-amber-900 mb-3">🎓 Education</h3>
            <p className="text-gray-700 leading-relaxed">{analysis.detailedRecommendations.education}</p>
          </div>
        )}

        {analysis.detailedRecommendations.projects && (
          <div className="bg-teal-50 border-2 border-teal-300 p-6 rounded-xl">
            <h3 className="font-bold text-lg text-teal-900 mb-3">🚀 Projects</h3>
            <p className="text-gray-700 leading-relaxed">{analysis.detailedRecommendations.projects}</p>
          </div>
        )}

        {analysis.detailedRecommendations.format && (
          <div className="bg-pink-50 border-2 border-pink-300 p-6 rounded-xl">
            <h3 className="font-bold text-lg text-pink-900 mb-3">📐 Format & ATS</h3>
            <p className="text-gray-700 leading-relaxed">{analysis.detailedRecommendations.format}</p>
          </div>
        )}
      </div>

      {/* Career Advice */}
      <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-8 rounded-xl border-2 border-purple-300">
        <h2 className="text-2xl font-bold text-purple-900 mb-4">🎯 Career Guidance</h2>
        <p className="text-gray-700 leading-relaxed text-lg">{analysis.careerAdvice}</p>
      </div>

      {/* Next Steps */}
      <div className="bg-green-50 p-8 rounded-xl border-2 border-green-300">
        <h2 className="text-2xl font-bold text-green-900 mb-6">✅ Action Plan - Next Steps</h2>
        <div className="space-y-3">
          {analysis.nextSteps.map((step, idx) => (
            <div key={idx} className="flex items-start gap-4 p-4 bg-white rounded-lg border border-green-200">
              <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">
                {idx + 1}
              </div>
              <p className="text-gray-700 flex-1 mt-1">{step}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-8 rounded-xl">
        <h2 className="text-2xl font-bold mb-4">🚀 Your Resume Potential</h2>
        <p className="leading-relaxed text-lg">
          Your resume has strong foundations! By implementing these AI-recommended changes, you can significantly
          improve your chances of passing ATS systems and impressing recruiters. Focus on the action plan above and
          track your progress. Good luck! 💪
        </p>
      </div>
    </div>
  );
};
