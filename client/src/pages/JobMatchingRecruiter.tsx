import React, { useState, useEffect } from 'react';
import { recruiterAPI } from '../services/api';

interface JobMatch {
  resumeId: string;
  candidateName: string;
  fileName: string;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  totalSkillsRequired: number;
  experience?: number;
  rating?: number;
  location?: string;
  status?: string;
}

export const JobMatchingRecruiter: React.FC = () => {
  const [jobDescription, setJobDescription] = useState('');
  const [extractedSkills, setExtractedSkills] = useState<string[]>([]);
  const [allMatches, setAllMatches] = useState<JobMatch[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<JobMatch[]>([]);
  const [minMatchScore, setMinMatchScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [jobParsed, setJobParsed] = useState(false);

  // Auto-filter when min score changes
  useEffect(() => {
    const filtered = allMatches.filter(match => match.matchScore >= minMatchScore);
    setFilteredMatches(filtered);
  }, [minMatchScore, allMatches]);

  const handleMatch = async () => {
    if (!jobDescription.trim()) {
      setError('Please enter a job description');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const response = await recruiterAPI.matchJobDescription(jobDescription);

      if (response.data.success && response.data.data) {
        const matches = response.data.data;
        setAllMatches(matches);
        setFilteredMatches(matches);

        // Extract unique skills from all matches
        const allSkills = new Set<string>();
        matches.forEach((match: JobMatch) => {
          match.matchedSkills.forEach(skill => allSkills.add(skill));
          match.missingSkills.forEach(skill => allSkills.add(skill));
        });
        setExtractedSkills(Array.from(allSkills).sort());
        setJobParsed(true);
        setMinMatchScore(0);
      } else {
        setError('No matches found');
      }
    } catch (err: any) {
      console.error('Failed to match job:', err);
      const errorMsg = err.response?.data?.error?.message || err.message || 'Failed to perform matching';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const getMatchColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getMatchBg = (score: number) => {
    if (score >= 80) return 'bg-green-500/20 border-green-500/50';
    if (score >= 60) return 'bg-yellow-500/20 border-yellow-500/50';
    if (score >= 40) return 'bg-orange-500/20 border-orange-500/50';
    return 'bg-red-500/20 border-red-500/50';
  };

  const getMatchLabel = (score: number) => {
    if (score >= 80) return 'Perfect Match';
    if (score >= 60) return 'Good Match';
    if (score >= 40) return 'Partial Match';
    return 'Poor Match';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🎯 Job Matching Engine</h1>
          <p className="text-gray-400">Automatically rank all candidates for a job based on skills</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
            <div className="flex items-start gap-2">
              <span>❌</span>
              <div>
                <p className="font-semibold">Matching Error</p>
                <p>{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Job Description Input */}
        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-8 mb-8">
          <label className="block text-white font-semibold mb-4">Paste Job Description</label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the full job description here... (required skills, experience, responsibilities, etc.)"
            className="w-full h-48 px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
          />

          <button
            onClick={handleMatch}
            disabled={loading}
            className="mt-6 w-full px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg font-bold text-white hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '⏳ Analyzing all candidates...' : '🚀 Find Matches'}
          </button>
        </div>

        {/* Extracted Skills & Filters */}
        {jobParsed && extractedSkills.length > 0 && (
          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-6 mb-8">
            <div className="mb-6">
              <p className="text-white font-semibold mb-3">Extracted Skills from Job Description</p>
              <div className="flex flex-wrap gap-2">
                {extractedSkills.slice(0, 20).map((skill, i) => (
                  <span key={i} className="px-3 py-1 bg-blue-500/30 text-blue-200 text-sm rounded-full font-medium">
                    {skill}
                  </span>
                ))}
                {extractedSkills.length > 20 && (
                  <span className="px-3 py-1 bg-white/10 text-gray-300 text-sm rounded-full">
                    +{extractedSkills.length - 20} more
                  </span>
                )}
              </div>
            </div>

            {/* Minimum Match Filter */}
            <div className="border-t border-white/20 pt-6">
              <div className="flex items-center justify-between mb-4">
                <label className="text-white font-semibold">Filter by Minimum Match Score</label>
                <span className={`text-2xl font-bold ${getMatchColor(minMatchScore)}`}>{minMatchScore}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={minMatchScore}
                onChange={(e) => setMinMatchScore(parseInt(e.target.value))}
                className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-gray-400 text-xs mt-2">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        )}

        {/* Matching Results */}
        {jobParsed && filteredMatches.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                Ranked Candidates
              </h2>
              <div className="text-gray-400 text-sm">
                Showing {filteredMatches.length} of {allMatches.length} matches
              </div>
            </div>

            {filteredMatches.map((match, idx) => (
              <div
                key={match.resumeId}
                className={`bg-white/10 backdrop-blur border rounded-xl p-6 hover:bg-white/15 transition ${getMatchBg(match.matchScore)}`}
              >
                {/* Top Row: Rank, Score, and Status */}
                <div className="grid md:grid-cols-5 gap-6 mb-6 pb-6 border-b border-white/10">
                  <div>
                    <p className="text-gray-400 text-sm mb-2">Rank</p>
                    <div className="text-3xl font-bold text-white">#{idx + 1}</div>
                  </div>

                  <div>
                    <p className="text-gray-400 text-sm mb-2">Match Score</p>
                    <div className={`text-4xl font-bold ${getMatchColor(match.matchScore)}`}>
                      {match.matchScore}%
                    </div>
                    <div className={`mt-2 px-3 py-1 rounded-full text-xs font-semibold inline-block ${getMatchBg(match.matchScore)} ${getMatchColor(match.matchScore)}`}>
                      {getMatchLabel(match.matchScore)}
                    </div>
                  </div>

                  <div>
                    <p className="text-gray-400 text-sm mb-2">Candidate</p>
                    <p className="text-white font-semibold text-lg">{match.candidateName}</p>
                    <p className="text-gray-400 text-xs mt-1">{match.fileName}</p>
                  </div>

                  <div className="space-y-2">
                    {match.experience !== undefined && (
                      <div>
                        <p className="text-gray-400 text-xs">Experience</p>
                        <p className="text-white font-medium">{match.experience} years</p>
                      </div>
                    )}
                    {match.location && (
                      <div>
                        <p className="text-gray-400 text-xs">Location</p>
                        <p className="text-white font-medium">{match.location}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    {match.rating !== undefined && (
                      <div>
                        <p className="text-gray-400 text-xs">Rating</p>
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-400">{'★'.repeat(Math.round(match.rating))}</span>
                          <span className="text-gray-600">{'★'.repeat(5 - Math.round(match.rating))}</span>
                          <span className="text-white font-medium ml-1">{match.rating?.toFixed(1)}</span>
                        </div>
                      </div>
                    )}
                    {match.status && (
                      <div>
                        <p className="text-gray-400 text-xs">Status</p>
                        <span className="inline-block px-2 py-1 bg-blue-500/30 text-blue-200 text-xs rounded">
                          {match.status}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Skills Section */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Matched Skills */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-green-400 font-bold text-lg">✓</span>
                      <p className="text-white font-semibold">Matched Skills ({match.matchedSkills.length})</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {match.matchedSkills.map((skill, i) => (
                        <span key={i} className="px-3 py-1 bg-green-500/30 text-green-200 text-xs rounded-full font-medium">
                          {skill}
                        </span>
                      ))}
                      {match.matchedSkills.length === 0 && (
                        <span className="text-gray-400 text-sm italic">No matched skills</span>
                      )}
                    </div>
                  </div>

                  {/* Missing Skills */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-red-400 font-bold text-lg">✗</span>
                      <p className="text-white font-semibold">Missing Skills ({match.missingSkills.length})</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {match.missingSkills.map((skill, i) => (
                        <span key={i} className="px-3 py-1 bg-red-500/30 text-red-200 text-xs rounded-full font-medium">
                          {skill}
                        </span>
                      ))}
                      {match.missingSkills.length === 0 && (
                        <span className="text-green-400 text-sm italic">All required skills matched!</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Match Details Bar */}
                <div className="mt-6 pt-6 border-t border-white/10">
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className={`h-full rounded-full transition-all ${getMatchColor(match.matchScore).replace('text', 'bg')}`}
                      style={{ width: `${match.matchScore}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-2">
                    <span>{match.matchedSkills.length} of {match.totalSkillsRequired} skills matched</span>
                    <span>{match.missingSkills.length} skills needed</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Matches Message */}
        {jobParsed && filteredMatches.length === 0 && allMatches.length > 0 && (
          <div className="text-center py-12 bg-white/10 backdrop-blur border border-white/20 rounded-xl">
            <p className="text-gray-400 text-lg">No candidates match your minimum score of {minMatchScore}%</p>
            <p className="text-gray-500 text-sm mt-2">Try lowering the filter or adjusting your job description</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredMatches.length === 0 && !jobParsed && (
          <div className="text-center py-12">
            <p className="text-gray-400">Enter a job description and click "Find Matches" to see ranked candidates</p>
          </div>
        )}
      </div>
    </div>
  );
};
