import React, { useState, useEffect } from 'react';
import { resumeAPI, analysisAPI } from '../services/api';
import { IResume, IAnalysis, extractErrorMessage } from '../types/index';

interface HealthDataResponse {
  score?: number;
  skillCount?: number;
  experienceYears?: number;
  recommendations?: string[];
}

interface ResumeDisplay extends IResume {
  fileName?: string;
}

interface AnalysisDisplay extends IAnalysis {
  summary?: string;
}

export const ViewAnalytics: React.FC = () => {
  const [resumes, setResumes] = useState<ResumeDisplay[]>([]);
  const [selectedResume, setSelectedResume] = useState('');
  const [health, setHealth] = useState<HealthDataResponse | null>(null);
  const [analyses, setAnalyses] = useState<AnalysisDisplay[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (): Promise<void> => {
    try {
      const resumesResponse = await resumeAPI.list();
      setResumes(resumesResponse.data.data);

      const analysesResponse = await analysisAPI.list();
      setAnalyses(analysesResponse.data.data);
    } catch (err: unknown) {
      const message = extractErrorMessage(err);
      setError(message);
    } finally {
      setFetchingData(false);
    }
  };

  const handleSelectResume = async (resumeId: string): Promise<void> => {
    setSelectedResume(resumeId);
    setLoading(true);
    setError('');

    try {
      const response = await analysisAPI.getHealth(resumeId);
      setHealth(response.data.data);
    } catch (err: unknown) {
      const message = extractErrorMessage(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-white text-lg">Loading your analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12 px-4">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black text-white mb-3">Resume Analytics</h1>
          <p className="text-gray-300 text-lg">Track your resume health and improvement</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 backdrop-blur">
            ⚠️ {error}
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Select Resume Card */}
          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">📋 Select Resume</h2>

            {resumes.length === 0 ? (
              <p className="text-gray-300 text-center py-8">No resumes uploaded yet</p>
            ) : (
              <div className="space-y-3">
                {resumes.map((resume) => (
                  <button
                    key={resume._id}
                    onClick={() => handleSelectResume(resume._id)}
                    className={`w-full px-6 py-3 rounded-lg font-semibold text-left transition transform hover:scale-105 ${
                      selectedResume === resume._id
                        ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/50'
                        : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                    }`}
                  >
                    {resume.fileName}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Resume Health Card */}
          {health && !loading && (
            <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-8">💪 Resume Health</h2>

              {/* Health Score Circle */}
              <div className="mb-8">
                <div className="text-center mb-6">
                  <div className="text-6xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    {health.score}%
                  </div>
                  <p className="text-gray-300 mt-3">Overall Health Score</p>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${health.score}%` }}
                  />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur border border-blue-500/30 rounded-xl p-5">
                  <div className="text-3xl font-bold text-blue-400">{health.skillCount}</div>
                  <p className="text-gray-300 text-sm mt-2">Skills Found</p>
                </div>
                <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 backdrop-blur border border-green-500/30 rounded-xl p-5">
                  <div className="text-3xl font-bold text-green-400">{health.experienceYears}</div>
                  <p className="text-gray-300 text-sm mt-2">Years Experience</p>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-8 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl mb-3">⏳</div>
                <p className="text-white">Analyzing resume...</p>
              </div>
            </div>
          )}
        </div>

        {/* Recommendations */}
        {health && health.recommendations && health.recommendations.length > 0 && (
          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">🎯 Recommendations</h2>
            <div className="space-y-4">
              {health.recommendations.map((rec: string, idx: number) => (
                <div
                  key={idx}
                  className="p-4 bg-blue-500/20 border-l-4 border-blue-500 rounded-lg text-gray-200 flex items-start gap-3"
                >
                  <span className="text-xl">💡</span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analysis History */}
        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6">📊 Analysis History</h2>

          {analyses.length === 0 ? (
            <p className="text-gray-300 text-center py-8">No analyses yet</p>
          ) : (
            <div className="space-y-4">
              {analyses.map((analysis) => (
                <div
                  key={analysis._id}
                  className="bg-white/5 border border-white/20 rounded-xl p-6 hover:bg-white/10 transition"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-white text-lg">📈 Match Analysis</h3>
                    <span className="text-2xl font-black bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                      {analysis.matchScore}%
                    </span>
                  </div>
                  {analysis.summary && <p className="text-gray-300 mb-3">{analysis.summary}</p>}
                  <div className="text-xs text-gray-400">
                    📅 {new Date(analysis.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Animation Styles */}
      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
};
