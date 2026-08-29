import React, { useState, useEffect } from 'react';
import { resumeAPI, analysisAPI } from '../services/api';

export const MatchJob: React.FC = () => {
  const [resumes, setResumes] = useState<any[]>([]);
  const [selectedResume, setSelectedResume] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingResumes, setFetchingResumes] = useState(true);

  useEffect(() => {
    loadResumes();
  }, []);

  const loadResumes = async () => {
    try {
      const response = await resumeAPI.list();
      setResumes(response.data.data);
    } catch (err) {
      setError('Failed to load resumes');
    } finally {
      setFetchingResumes(false);
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!selectedResume || !jobDescription) {
        setError('Please select a resume and enter a job description');
        return;
      }

      const response = await analysisAPI.analyze({
        resumeId: selectedResume,
        jobDescription,
      });

      setAnalysis(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingResumes) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-white text-lg">Loading your resumes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12 px-4">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black text-white mb-3">🎯 Match with Job</h1>
          <p className="text-gray-300 text-lg">Compare your resume against job requirements</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 backdrop-blur">
            ⚠️ {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Card */}
          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">📋 Job Matching</h2>

            {resumes.length === 0 ? (
              <p className="text-gray-300 text-center py-8">No resumes uploaded yet</p>
            ) : (
              <form onSubmit={handleAnalyze} className="space-y-6">
                {/* Resume Selector */}
                <div>
                  <label className="block text-white font-semibold mb-3">Select Your Resume</label>
                  <select
                    value={selectedResume}
                    onChange={(e) => setSelectedResume(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 backdrop-blur"
                  >
                    <option value="" className="bg-slate-900">-- Select a Resume --</option>
                    {resumes.map((resume) => (
                      <option key={resume._id} value={resume._id} className="bg-slate-900">
                        {resume.fileName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Job Description */}
                <div>
                  <label className="block text-white font-semibold mb-3">Paste Job Description</label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the complete job description here..."
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 backdrop-blur h-64 resize-none"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || !selectedResume}
                  className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg font-bold text-white hover:shadow-lg hover:shadow-green-500/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '⏳ Analyzing...' : '🚀 Match Resume'}
                </button>
              </form>
            )}
          </div>

          {/* Results Card */}
          {analysis && (
            <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">📊 Match Results</h2>

              {/* Match Score */}
              <div className="mb-8 text-center">
                <div className="mb-4">
                  <div className="text-6xl font-black bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
                    {analysis.matchScore}%
                  </div>
                  <p className="text-gray-300 mt-2">Overall Match Score</p>
                </div>
                <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all"
                    style={{ width: `${analysis.matchScore}%` }}
                  />
                </div>
              </div>

              {/* Matched Skills */}
              {analysis.matchedSkills.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-white font-bold mb-3">✅ Matched Skills ({analysis.matchedSkills.length})</h3>
                  <div className="flex flex-wrap gap-2">
                    {analysis.matchedSkills.map((skill: string) => (
                      <span
                        key={skill}
                        className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm border border-green-500/50"
                      >
                        ✓ {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing Skills */}
              {analysis.missingSkills.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-white font-bold mb-3">❌ Missing Skills ({analysis.missingSkills.length})</h3>
                  <div className="flex flex-wrap gap-2">
                    {analysis.missingSkills.map((skill: string) => (
                      <span
                        key={skill}
                        className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-sm border border-red-500/50"
                      >
                        ✗ {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {analysis.suggestions.length > 0 && (
                <div>
                  <h3 className="text-white font-bold mb-3">💡 Suggestions</h3>
                  <div className="space-y-2">
                    {analysis.suggestions.map((suggestion: string, idx: number) => (
                      <div key={idx} className="p-3 bg-blue-500/20 border-l-4 border-blue-500 rounded text-gray-200 text-sm">
                        → {suggestion}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-8 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-4">⏳</div>
                <p className="text-white font-semibold">Analyzing your resume...</p>
              </div>
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
