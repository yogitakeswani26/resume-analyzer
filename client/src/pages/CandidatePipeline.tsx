import React, { useState, useEffect } from 'react';
import { recruiterAPI } from '../services/api';
import { useAuthStore } from '../stores/authStore';

interface Candidate {
  id: string;
  name: string;
  fileName: string;
  rating: number;
  matchScore: number;
  notes?: string;
}

interface PipelineData {
  [key: string]: Candidate[];
}

interface HoverCandidate extends Candidate {
  stage: string;
}

interface FilterState {
  minRating: number;
  minScore: number;
  dateFrom: string;
  dateTo: string;
}

interface StageMetrics {
  totalCandidates: number;
  avgScore: number;
  avgRating: number;
}

export const CandidatePipeline: React.FC = () => {
  const [pipeline, setPipeline] = useState<PipelineData>({
    Applied: [],
    Screening: [],
    Interview: [],
    Offer: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draggedCard, setDraggedCard] = useState<any>(null);
  const [hoveredCandidate, setHoveredCandidate] = useState<HoverCandidate | null>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  const [bulkActionStage, setBulkActionStage] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    minRating: 0,
    minScore: 0,
    dateFrom: '',
    dateTo: '',
  });
  const [editingNote, setEditingNote] = useState<{ id: string; stage: string } | null>(null);
  const [noteText, setNoteText] = useState('');
  const [ratingCandidate, setRatingCandidate] = useState<{ id: string; stage: string } | null>(null);
  const [ratingValue, setRatingValue] = useState(0);

  const token = useAuthStore(state => state.token);
  const stages = ['Applied', 'Screening', 'Interview', 'Offer'];

  useEffect(() => {
    if (!token) {
      setError('Authentication required. Please log in.');
      setLoading(false);
      return;
    }
    fetchPipeline();
  }, [token]);

  const fetchPipeline = async () => {
    setError('');
    try {
      const response = await recruiterAPI.getCandidatePipeline();
      if (response.data.success) {
        setPipeline(response.data.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch pipeline:', err);
      const errorMsg = err.response?.data?.error?.message || 'Failed to fetch pipeline';
      setError(errorMsg);

      // If 401, token might be invalid
      if (err.response?.status === 401) {
        console.warn('Unauthorized - token may have expired');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, card: Candidate, status: string) => {
    setDraggedCard({ card, fromStatus: status });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, toStatus: string) => {
    e.preventDefault();
    if (!draggedCard) return;

    const { card, fromStatus } = draggedCard;

    if (fromStatus === toStatus) {
      setDraggedCard(null);
      return;
    }

    try {
      await recruiterAPI.moveCandidateStatus(card.id, toStatus);

      setPipeline(prev => ({
        ...prev,
        [fromStatus]: prev[fromStatus].filter(c => c.id !== card.id),
        [toStatus]: [...prev[toStatus], { ...card }],
      }));
    } catch (error) {
      console.error('Failed to move candidate:', error);
      setError('Failed to move candidate to new stage');
    }

    setDraggedCard(null);
  };

  const handleBulkMove = async (toStatus: string) => {
    if (selectedCandidates.size === 0) {
      setError('Please select candidates to move');
      return;
    }

    try {
      const resumeIds = Array.from(selectedCandidates);
      await recruiterAPI.bulkUpdateStatus(resumeIds, toStatus);

      // Update local state
      setPipeline(prev => {
        const newPipeline = { ...prev };
        const movedCandidates: Candidate[] = [];

        // Collect all selected candidates from all stages
        for (const stage of stages) {
          newPipeline[stage] = newPipeline[stage].filter(c => {
            if (selectedCandidates.has(c.id)) {
              movedCandidates.push(c);
              return false;
            }
            return true;
          });
        }

        // Add them to the target stage
        newPipeline[toStatus] = [...newPipeline[toStatus], ...movedCandidates];

        return newPipeline;
      });

      setSelectedCandidates(new Set());
      setBulkActionStage(null);
    } catch (error) {
      console.error('Failed to bulk move candidates:', error);
      setError('Failed to move candidates');
    }
  };

  const handleAddNote = async (candidateId: string, stage: string) => {
    if (!noteText.trim()) return;

    try {
      await recruiterAPI.addNote(candidateId, noteText);

      // Update local state
      setPipeline(prev => ({
        ...prev,
        [stage]: prev[stage].map(c =>
          c.id === candidateId ? { ...c, notes: noteText } : c
        ),
      }));

      setEditingNote(null);
      setNoteText('');
    } catch (error) {
      console.error('Failed to add note:', error);
      setError('Failed to add note');
    }
  };

  const handleRating = async (candidateId: string, stage: string, rating: number) => {
    try {
      await recruiterAPI.updateCandidateInfo(candidateId, { rating });

      // Update local state
      setPipeline(prev => ({
        ...prev,
        [stage]: prev[stage].map(c =>
          c.id === candidateId ? { ...c, rating } : c
        ),
      }));

      setRatingCandidate(null);
      setRatingValue(0);
    } catch (error) {
      console.error('Failed to update rating:', error);
      setError('Failed to update rating');
    }
  };

  const handleSelectCandidate = (candidateId: string) => {
    const newSelected = new Set(selectedCandidates);
    if (newSelected.has(candidateId)) {
      newSelected.delete(candidateId);
    } else {
      newSelected.add(candidateId);
    }
    setSelectedCandidates(newSelected);
  };

  const handleSelectAll = () => {
    const allIds = new Set<string>();
    stages.forEach(stage => {
      pipeline[stage]?.forEach(c => allIds.add(c.id));
    });
    setSelectedCandidates(allIds.size === selectedCandidates.size ? new Set() : allIds);
  };

  const getFilteredCandidates = (stage: string): Candidate[] => {
    const candidates = pipeline[stage] || [];
    return candidates.filter(c => {
      if (c.rating < filters.minRating) return false;
      if (c.matchScore < filters.minScore) return false;
      return true;
    });
  };

  const getStageMetrics = (stage: string): StageMetrics => {
    const candidates = getFilteredCandidates(stage);
    if (candidates.length === 0) {
      return { totalCandidates: 0, avgScore: 0, avgRating: 0 };
    }

    const avgScore = Math.round(
      candidates.reduce((sum, c) => sum + c.matchScore, 0) / candidates.length
    );
    const avgRating = (
      candidates.reduce((sum, c) => sum + c.rating, 0) / candidates.length
    ).toFixed(1);

    return {
      totalCandidates: candidates.length,
      avgScore,
      avgRating: parseFloat(avgRating),
    };
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: { bg: string; text: string; border: string } } = {
      'Applied': { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
      'Screening': { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
      'Interview': { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
      'Offer': { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
    };
    return colors[status];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12 px-4 flex items-center justify-center">
        <p className="text-white text-lg">Loading pipeline...</p>
      </div>
    );
  }

  const totalSelected = selectedCandidates.size;
  const totalCandidates = Object.values(pipeline).flat().length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">📊 Candidate Pipeline</h1>
          <p className="text-gray-400">Drag candidates between stages or use bulk actions</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm flex justify-between items-center">
            <span>❌ {error}</span>
            <button onClick={() => setError('')} className="text-red-200 hover:text-red-100">✕</button>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4">
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Min Match Score</label>
              <input
                type="range"
                min="0"
                max="100"
                value={filters.minScore}
                onChange={(e) => setFilters({ ...filters, minScore: parseInt(e.target.value) })}
                className="w-full"
              />
              <span className="text-xs text-gray-400">{filters.minScore}%</span>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Min Rating</label>
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={filters.minRating}
                onChange={(e) => setFilters({ ...filters, minRating: parseFloat(e.target.value) })}
                className="w-full"
              />
              <span className="text-xs text-gray-400">{filters.minRating} stars</span>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Date From</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Date To</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm"
              />
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {totalSelected > 0 && (
          <div className="mb-6 p-4 bg-blue-500/20 border border-blue-500/50 rounded-xl">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <p className="text-blue-200 font-semibold">{totalSelected} candidate(s) selected</p>
                <button
                  onClick={handleSelectAll}
                  className="text-xs text-blue-300 hover:text-blue-200 mt-1"
                >
                  Deselect All
                </button>
              </div>
              <div className="flex gap-2 flex-wrap">
                {stages.map(stage => (
                  <button
                    key={stage}
                    onClick={() => handleBulkMove(stage)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition"
                  >
                    Move to {stage}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Select All Checkbox */}
        {totalCandidates > 0 && (
          <div className="mb-4 flex items-center gap-2">
            <input
              type="checkbox"
              id="select-all"
              checked={selectedCandidates.size > 0 && selectedCandidates.size === totalCandidates}
              onChange={handleSelectAll}
              className="w-4 h-4 rounded"
            />
            <label htmlFor="select-all" className="text-sm text-gray-400">
              Select All ({totalCandidates} candidates)
            </label>
          </div>
        )}

        {/* Pipeline Board */}
        <div className="grid md:grid-cols-4 gap-6">
          {stages.map(stage => {
            const color = getStatusColor(stage);
            const candidates = getFilteredCandidates(stage);
            const metrics = getStageMetrics(stage);

            return (
              <div
                key={stage}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage)}
                className={`bg-white/10 backdrop-blur border ${color.border} rounded-xl p-4 min-h-96 transition hover:bg-white/15`}
              >
                {/* Stage Header with Metrics */}
                <div className={`px-3 py-3 rounded-lg mb-4 ${color.bg}`}>
                  <h2 className={`font-bold text-lg ${color.text}`}>{stage}</h2>
                  <div className="text-xs text-gray-400 mt-2 space-y-1">
                    <p>Candidates: {metrics.totalCandidates}</p>
                    <p>Avg Score: {metrics.avgScore}%</p>
                    <p>Avg Rating: {'⭐'.repeat(Math.round(metrics.avgRating))} ({metrics.avgRating.toFixed(1)})</p>
                  </div>
                </div>

                {/* Candidates */}
                <div className="space-y-3">
                  {candidates.map(candidate => (
                    <div
                      key={candidate.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, candidate, stage)}
                      className="bg-white/10 border border-white/20 rounded-lg p-3 cursor-grab hover:bg-white/15 transition hover:shadow-lg relative"
                    >
                      {/* Checkbox */}
                      <div className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          checked={selectedCandidates.has(candidate.id)}
                          onChange={() => handleSelectCandidate(candidate.id)}
                          className="w-4 h-4 rounded mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <p
                            className="font-semibold text-white truncate hover:text-blue-300 cursor-pointer"
                            onMouseEnter={(e) => {
                              setHoveredCandidate({ ...candidate, stage });
                              setHoverPosition({ x: e.clientX, y: e.clientY });
                            }}
                            onMouseLeave={() => setHoveredCandidate(null)}
                          >
                            {candidate.name}
                          </p>
                          <p className="text-gray-400 text-xs truncate">{candidate.fileName}</p>

                          <div className="mt-2 flex justify-between items-center gap-1">
                            <span className="text-blue-400 text-xs font-semibold">
                              {candidate.matchScore}%
                            </span>
                            <span className="text-yellow-400 text-xs">
                              {'⭐'.repeat(Math.round(candidate.rating))}
                            </span>
                          </div>

                          {candidate.notes && (
                            <p className="text-gray-400 text-xs mt-2 italic truncate">
                              "{candidate.notes}"
                            </p>
                          )}

                          {/* Quick Actions */}
                          <div className="mt-2 flex gap-1 flex-wrap">
                            <button
                              onClick={() => {
                                setRatingCandidate({ id: candidate.id, stage });
                                setRatingValue(candidate.rating);
                              }}
                              className="text-xs px-2 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 rounded transition border border-yellow-500/30"
                              title="Rate candidate"
                            >
                              ⭐ Rate
                            </button>
                            <button
                              onClick={() => {
                                setEditingNote({ id: candidate.id, stage });
                                setNoteText(candidate.notes || '');
                              }}
                              className="text-xs px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded transition border border-blue-500/30"
                              title="Add/edit note"
                            >
                              📝 Note
                            </button>
                            {stage !== 'Offer' && (
                              <button
                                onClick={() => {
                                  const nextStage = stages[stages.indexOf(stage) + 1];
                                  if (nextStage) {
                                    handleDrop(
                                      { preventDefault: () => {} } as React.DragEvent,
                                      nextStage
                                    );
                                    setDraggedCard({ card: candidate, fromStatus: stage });
                                  }
                                }}
                                className="text-xs px-2 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded transition border border-green-500/30"
                                title="Move to next stage"
                              >
                                → Next
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {candidates.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <p>No candidates match filters</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Candidate Details Hover Card */}
        {hoveredCandidate && (
          <div
            className="fixed bg-white/95 border border-white/20 rounded-lg shadow-2xl p-4 max-w-xs z-50"
            style={{
              left: `${hoverPosition.x + 10}px`,
              top: `${hoverPosition.y + 10}px`,
              pointerEvents: 'none',
            }}
          >
            <p className="font-bold text-gray-900 mb-2">{hoveredCandidate.name}</p>
            <div className="space-y-1 text-sm text-gray-700">
              <p><span className="font-semibold">File:</span> {hoveredCandidate.fileName}</p>
              <p><span className="font-semibold">Match:</span> {hoveredCandidate.matchScore}%</p>
              <p><span className="font-semibold">Rating:</span> {'⭐'.repeat(Math.round(hoveredCandidate.rating))}</p>
              <p><span className="font-semibold">Stage:</span> {hoveredCandidate.stage}</p>
              {hoveredCandidate.notes && (
                <p className="text-gray-600 italic mt-2">Note: "{hoveredCandidate.notes}"</p>
              )}
            </div>
          </div>
        )}

        {/* Rating Modal */}
        {ratingCandidate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-white/20 rounded-lg p-6 max-w-sm">
              <h3 className="text-lg font-bold text-white mb-4">Rate Candidate</h3>
              <div className="flex justify-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setRatingValue(star)}
                    className={`text-3xl transition ${
                      star <= ratingValue ? 'text-yellow-400' : 'text-gray-400'
                    }`}
                  >
                    ⭐
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    handleRating(ratingCandidate.id, ratingCandidate.stage, ratingValue);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
                >
                  Save
                </button>
                <button
                  onClick={() => setRatingCandidate(null)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Note Modal */}
        {editingNote && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-white/20 rounded-lg p-6 max-w-md">
              <h3 className="text-lg font-bold text-white mb-4">Add Note</h3>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-gray-500 mb-4 resize-none"
                rows={4}
                placeholder="Add your notes here..."
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    handleAddNote(editingNote.id, editingNote.stage);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
                >
                  Save Note
                </button>
                <button
                  onClick={() => setEditingNote(null)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Total Candidates */}
        <div className="mt-8 text-center">
          <p className="text-gray-400">
            Total: {Object.values(pipeline).flat().length} candidates in pipeline
            {totalSelected > 0 && ` | ${totalSelected} selected`}
          </p>
        </div>
      </div>
    </div>
  );
};
