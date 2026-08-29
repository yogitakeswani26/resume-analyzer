import React, { useState, useEffect } from 'react';
import { recruiterAPI, resumeAPI } from '../services/api';

interface ComparisonData {
  id: string;
  name: string;
  fileName: string;
  skills: string[];
  experience: number;
  rating: number;
  matchScore: number;
  notes: string;
  education?: string[];
}

interface ComparisonState {
  resumes: ComparisonData[];
  ratings: { [key: string]: number };
  notes: { [key: string]: string };
  selectedForRating: string | null;
}

export const CompareResumes: React.FC = () => {
  const [allResumes, setAllResumes] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [comparison, setComparison] = useState<ComparisonState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showRatingPanel, setShowRatingPanel] = useState<string | null>(null);

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const response = await resumeAPI.list();
      if (response.data.success) {
        setAllResumes(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch resumes:', error);
      setError('Failed to fetch resumes');
    }
  };

  const handleCompare = async () => {
    if (selectedIds.length < 2) {
      setError('Please select at least 2 resumes to compare');
      return;
    }

    const token = localStorage.getItem('token');
    console.log('🔍 DEBUG - Token in localStorage:', !!token ? '✅ EXISTS' : '❌ MISSING');
    if (!token) {
      setError('Authentication error: No token found. Please login again.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await recruiterAPI.compareResumes(selectedIds);
      if (response.data.success) {
        const data = response.data.data;
        setComparison({
          resumes: data,
          ratings: data.reduce((acc: any, r: any) => ({ ...acc, [r.id]: r.rating || 0 }), {}),
          notes: data.reduce((acc: any, r: any) => ({ ...acc, [r.id]: r.notes || '' }), {}),
          selectedForRating: null,
        });
      }
    } catch (error: any) {
      console.error('Compare error:', error.response?.status, error.message);
      const errMsg = error.response?.data?.error?.message || error.message || 'Failed to compare resumes';
      setError('Error: ' + errMsg);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      } else if (prev.length < 2) {
        return [...prev, id];
      }
      return prev;
    });
  };

  const updateRating = (resumeId: string, rating: number) => {
    if (comparison) {
      setComparison({
        ...comparison,
        ratings: { ...comparison.ratings, [resumeId]: rating },
      });
    }
  };

  const updateNotes = (resumeId: string, notes: string) => {
    if (comparison) {
      setComparison({
        ...comparison,
        notes: { ...comparison.notes, [resumeId]: notes },
      });
    }
  };

  const saveRatingAndNotes = async (resumeId: string) => {
    try {
      await recruiterAPI.updateCandidateInfo(resumeId, {
        rating: comparison!.ratings[resumeId],
        notes: comparison!.notes[resumeId],
      });
      setShowRatingPanel(null);
      alert('Rating and notes saved successfully!');
    } catch (error: any) {
      alert('Failed to save: ' + (error.response?.data?.error?.message || error.message));
    }
  };

  const downloadComparisonReport = () => {
    if (!comparison) return;

    const report = generateComparisonReport();
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(report));
    element.setAttribute('download', `resume-comparison-${new Date().toISOString().slice(0, 10)}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const generateComparisonReport = (): string => {
    if (!comparison) return '';

    const resumes = comparison.resumes;
    const ratings = comparison.ratings;
    const notes = comparison.notes;

    let report = `RESUME COMPARISON REPORT\n`;
    report += `Generated: ${new Date().toLocaleString()}\n`;
    report += `${'='.repeat(60)}\n\n`;

    // Summary
    report += `CANDIDATES COMPARED: ${resumes.length}\n`;
    report += `${'='.repeat(60)}\n\n`;

    resumes.forEach((r, idx) => {
      report += `${idx + 1}. ${r.name} (${r.fileName})\n`;
      report += `   Match Score: ${r.matchScore}%\n`;
      report += `   Experience: ${r.experience} years\n`;
      report += `   Rating: ${ratings[r.id]}/5\n`;
      report += `\n`;
    });

    // Skills Comparison
    report += `SKILLS COMPARISON\n`;
    report += `${'='.repeat(60)}\n`;
    const allSkills = new Set<string>();
    resumes.forEach(r => {
      r.skills.forEach(s => allSkills.add(s));
    });

    Array.from(allSkills).forEach(skill => {
      report += `\n${skill}:\n`;
      resumes.forEach(r => {
        const hasSkill = r.skills.includes(skill);
        report += `  ${r.name}: ${hasSkill ? '✓' : '✗'}\n`;
      });
    });

    // Experience Comparison
    report += `\nEXPERIENCE COMPARISON\n`;
    report += `${'='.repeat(60)}\n`;
    resumes.forEach(r => {
      report += `${r.name}: ${r.experience} years\n`;
    });
    const avgExp = (resumes.reduce((sum, r) => sum + r.experience, 0) / resumes.length).toFixed(1);
    report += `Average: ${avgExp} years\n`;

    // Match Score Comparison
    report += `\nMATCH SCORE COMPARISON\n`;
    report += `${'='.repeat(60)}\n`;
    resumes.forEach(r => {
      report += `${r.name}: ${r.matchScore}%\n`;
    });
    const topCandidate = resumes.reduce((a, b) => (a.matchScore > b.matchScore ? a : b));
    report += `\nTop Candidate: ${topCandidate.name} (${topCandidate.matchScore}%)\n`;

    // Notes
    report += `\nNOTES & RATINGS\n`;
    report += `${'='.repeat(60)}\n`;
    resumes.forEach(r => {
      report += `\n${r.name}:\n`;
      report += `Rating: ${'⭐'.repeat(ratings[r.id])} (${ratings[r.id]}/5)\n`;
      report += `Notes: ${notes[r.id] || 'No notes'}\n`;
    });

    return report;
  };

  const getMatchingSkills = (): { [key: string]: string[] } => {
    if (!comparison || comparison.resumes.length < 2) return {};

    const firstResume = comparison.resumes[0];
    const result: { [key: string]: string[] } = {};

    comparison.resumes.forEach((r, idx) => {
      const matching = idx === 0
        ? firstResume.skills.filter(s =>
            comparison.resumes.slice(1).every(other => other.skills.includes(s))
          )
        : r.skills.filter(s => firstResume.skills.includes(s));
      result[r.id] = matching;
    });

    return result;
  };

  const getDifferentSkills = (resumeId: string): string[] => {
    if (!comparison || comparison.resumes.length < 2) return [];

    const resume = comparison.resumes.find(r => r.id === resumeId);
    const other = comparison.resumes.find(r => r.id !== resumeId);

    if (!resume || !other) return [];

    return resume.skills.filter(s => !other.skills.includes(s));
  };

  const matchingSkills = getMatchingSkills();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🔄 Compare Resumes</h1>
          <p className="text-gray-400">Select 2 resumes to compare side by side with detailed analysis</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-300">
            <p>{error}</p>
          </div>
        )}

        {/* Resume Selection */}
        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Select Resumes ({selectedIds.length}/2)</h2>
          {allResumes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">No resumes found. Upload resumes first to compare.</p>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {allResumes.map((resume) => (
                  <div
                    key={resume._id}
                    onClick={() => toggleSelect(resume._id)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                      selectedIds.includes(resume._id)
                        ? 'border-blue-500 bg-blue-500/20'
                        : 'border-white/20 hover:border-white/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(resume._id)}
                        onChange={() => {}}
                        className="w-5 h-5 cursor-pointer"
                      />
                      <div className="flex-1">
                        <p className="text-white font-semibold">{resume.fileName || resume.candidateName}</p>
                        <p className="text-gray-400 text-sm">Match: {resume.matchScore || 0}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleCompare}
                disabled={selectedIds.length < 2 || loading}
                className="w-full px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg font-bold text-white hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '⏳ Comparing...' : '🔍 Compare Selected'}
              </button>
            </>
          )}
        </div>

        {/* Comparison Results */}
        {comparison && comparison.resumes.length > 0 && (
          <div className="space-y-8">
            {/* Side-by-Side Comparison */}
            <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Detailed Comparison</h2>
                <button
                  onClick={downloadComparisonReport}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg text-white font-semibold flex items-center gap-2"
                >
                  📥 Download Report
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {comparison.resumes.map((resume, idx) => (
                  <div key={idx} className="bg-white/5 border border-white/20 rounded-xl p-6">
                    {/* Candidate Header */}
                    <div className="mb-6">
                      <h3 className="text-2xl font-bold text-white mb-2">{resume.name}</h3>
                      <p className="text-gray-400 text-sm mb-4">{resume.fileName}</p>

                      {/* Match Score Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-gray-400 text-sm">Match Score</p>
                          <p className="text-2xl font-bold text-blue-400">{resume.matchScore}%</p>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-400 to-cyan-400 h-2 rounded-full"
                            style={{ width: `${resume.matchScore}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-white/10">
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Experience</p>
                        <p className="text-xl font-semibold text-white">{resume.experience} years</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Current Rating</p>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <span key={star} className={star <= resume.rating ? '⭐' : '☆'}>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Skills Section */}
                    <div className="mb-6">
                      <p className="text-gray-400 text-sm font-semibold mb-3">Skills ({resume.skills.length})</p>

                      {/* Matching Skills */}
                      {matchingSkills[resume.id]?.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs text-green-400 mb-2">Matching Skills:</p>
                          <div className="flex flex-wrap gap-2">
                            {matchingSkills[resume.id].map((skill, i) => (
                              <span
                                key={i}
                                className="px-2 py-1 bg-green-500/30 text-green-200 text-xs rounded border border-green-500/50"
                              >
                                ✓ {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Unique Skills */}
                      {getDifferentSkills(resume.id).length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs text-blue-400 mb-2">Unique Skills:</p>
                          <div className="flex flex-wrap gap-2">
                            {getDifferentSkills(resume.id).map((skill, i) => (
                              <span
                                key={i}
                                className="px-2 py-1 bg-blue-500/30 text-blue-200 text-xs rounded border border-blue-500/50"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* All Skills */}
                      {resume.skills.length === 0 ? (
                        <p className="text-gray-500 text-sm italic">No skills identified</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {resume.skills.slice(0, 5).map((skill, i) => (
                            <span key={i} className="px-2 py-1 bg-white/10 text-gray-300 text-xs rounded">
                              {skill}
                            </span>
                          ))}
                          {resume.skills.length > 5 && (
                            <span className="px-2 py-1 bg-white/10 text-gray-400 text-xs rounded italic">
                              +{resume.skills.length - 5} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Rating and Notes Section */}
                    <div className="pt-4 border-t border-white/10">
                      <button
                        onClick={() => setShowRatingPanel(showRatingPanel === resume.id ? null : resume.id)}
                        className="w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white font-semibold text-sm mb-3"
                      >
                        {showRatingPanel === resume.id ? '✓ Close' : '✏️ Rate & Add Notes'}
                      </button>

                      {showRatingPanel === resume.id && (
                        <div className="bg-white/5 rounded-lg p-4 space-y-4">
                          {/* Rating Stars */}
                          <div>
                            <p className="text-sm text-gray-300 mb-2">Rating (0-5):</p>
                            <div className="flex gap-2">
                              {[1, 2, 3, 4, 5].map(star => (
                                <button
                                  key={star}
                                  onClick={() => updateRating(resume.id, star)}
                                  className={`text-3xl transition ${
                                    star <= comparison.ratings[resume.id]
                                      ? 'text-yellow-400'
                                      : 'text-gray-500 hover:text-yellow-300'
                                  }`}
                                >
                                  ⭐
                                </button>
                              ))}
                            </div>
                            <p className="text-xs text-gray-400 mt-2">
                              {comparison.ratings[resume.id]} / 5
                            </p>
                          </div>

                          {/* Notes */}
                          <div>
                            <label className="text-sm text-gray-300 mb-2 block">Comparison Notes:</label>
                            <textarea
                              value={comparison.notes[resume.id]}
                              onChange={(e) => updateNotes(resume.id, e.target.value)}
                              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm focus:border-blue-500 focus:outline-none resize-none"
                              rows={3}
                              placeholder="Add your notes about this candidate..."
                            />
                          </div>

                          {/* Save Button */}
                          <button
                            onClick={() => saveRatingAndNotes(resume.id)}
                            className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg text-white font-semibold text-sm"
                          >
                            💾 Save Rating & Notes
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills Matrix */}
            {comparison.resumes.length === 2 && (
              <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-8">
                <h2 className="text-2xl font-bold text-white mb-6">Skills Comparison Matrix</h2>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/20">
                        <th className="text-left py-3 px-4 text-white font-semibold">Skill</th>
                        {comparison.resumes.map((r) => (
                          <th key={r.id} className="text-center py-3 px-4 text-white font-semibold">
                            {r.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from(
                        new Set(comparison.resumes.flatMap((r) => r.skills))
                      ).map((skill) => (
                        <tr key={skill} className="border-b border-white/10 hover:bg-white/5">
                          <td className="py-3 px-4 text-gray-300">{skill}</td>
                          {comparison.resumes.map((r) => (
                            <td key={r.id} className="text-center py-3 px-4">
                              {r.skills.includes(skill) ? (
                                <span className="text-green-400 text-lg">✓</span>
                              ) : (
                                <span className="text-gray-600">—</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Summary Stats */}
            <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Comparison Summary</h2>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white/5 rounded-lg p-6">
                  <p className="text-gray-400 text-sm mb-2">Best Match Score</p>
                  <p className="text-3xl font-bold text-blue-400">
                    {Math.max(...comparison.resumes.map((r) => r.matchScore))}%
                  </p>
                </div>

                <div className="bg-white/5 rounded-lg p-6">
                  <p className="text-gray-400 text-sm mb-2">Average Experience</p>
                  <p className="text-3xl font-bold text-cyan-400">
                    {(comparison.resumes.reduce((sum, r) => sum + r.experience, 0) / comparison.resumes.length).toFixed(1)} yrs
                  </p>
                </div>

                <div className="bg-white/5 rounded-lg p-6">
                  <p className="text-gray-400 text-sm mb-2">Total Unique Skills</p>
                  <p className="text-3xl font-bold text-purple-400">
                    {new Set(comparison.resumes.flatMap((r) => r.skills)).size}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
