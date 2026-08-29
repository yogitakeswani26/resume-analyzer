import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { recruiterAPI } from '../services/api';
import { ICandidate } from '../types/index';

interface FilterOptions {
  search: string;
  status: string;
  minScore: string;
  maxScore: string;
  minRating: string;
  location: string;
  dateFrom: string;
  dateTo: string;
}

interface BulkAction {
  type: 'status' | 'notes' | 'email';
  data?: any;
}

interface SelectedCandidates {
  [key: string]: boolean;
}

// ============================================================================
// MEMOIZED SUBCOMPONENTS
// ============================================================================

interface CandidateRowProps {
  candidate: ICandidate;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onOpenNotes: (candidate: ICandidate) => void;
  onStatusChange: (id: string, status: string) => void;
  searchTerm: string;
}

const CandidateRow = memo<CandidateRowProps>(({
  candidate,
  isSelected,
  onToggleSelect,
  onOpenNotes,
  onStatusChange,
  searchTerm,
}) => {
  const getStatusColor = useCallback((status: string) => {
    const colors: { [key: string]: string } = {
      'Applied': 'bg-blue-500/20 text-blue-300 border-blue-500/50',
      'Screening': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
      'Interview': 'bg-purple-500/20 text-purple-300 border-purple-500/50',
      'Offer': 'bg-green-500/20 text-green-300 border-green-500/50',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-300 border-gray-500/50';
  }, []);

  const getScoreBg = useCallback((score: number) => {
    if (score >= 80) return 'bg-green-500/20 text-green-300';
    if (score >= 60) return 'bg-yellow-500/20 text-yellow-300';
    if (score >= 40) return 'bg-orange-500/20 text-orange-300';
    return 'bg-red-500/20 text-red-300';
  }, []);

  const highlightText = useCallback((text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return parts.map((part, idx) =>
      part.toLowerCase() === highlight.toLowerCase() ? (
        <mark key={idx} className="bg-yellow-400/50 font-semibold">{part}</mark>
      ) : (
        part
      )
    );
  }, []);

  const handleSelectChange = useCallback(() => {
    onToggleSelect(candidate._id);
  }, [candidate._id, onToggleSelect]);

  const handleStatusChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onStatusChange(candidate._id, e.target.value);
  }, [candidate._id, onStatusChange]);

  const handleNotesClick = useCallback(() => {
    onOpenNotes(candidate);
  }, [candidate, onOpenNotes]);

  return (
    <tr className="border-b border-white/10 hover:bg-white/5 transition">
      <td className="px-4 py-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={handleSelectChange}
          className="rounded border-gray-300 cursor-pointer"
        />
      </td>
      <td className="px-4 py-4 text-white font-medium">
        {highlightText(candidate.candidateName || 'Unknown', searchTerm)}
      </td>
      <td className="px-4 py-4 text-gray-300 text-xs">
        {highlightText(candidate.candidateEmail || '-', searchTerm)}
      </td>
      <td className="px-4 py-4 text-gray-300 text-xs">
        {highlightText(candidate.location || '-', searchTerm)}
      </td>
      <td className="px-4 py-4">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(candidate.status)}`}>
          {candidate.status}
        </span>
      </td>
      <td className="px-4 py-4">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getScoreBg(candidate.matchScore)}`}>
          {candidate.matchScore}%
        </span>
      </td>
      <td className="px-4 py-4 text-gray-300 text-xs">
        <div className="flex items-center gap-1">
          <span>⭐</span>
          <span>{(candidate.rating || 0).toFixed(1)}/5</span>
        </div>
      </td>
      <td className="px-4 py-4 text-gray-300 text-xs">
        {candidate.skills?.length || 0} skills
      </td>
      <td className="px-4 py-4 text-xs">
        <button
          onClick={handleNotesClick}
          aria-label={`View or edit notes for ${candidate.candidateName}`}
          className="px-2 py-1 bg-yellow-500/30 hover:bg-yellow-500/50 text-yellow-200 rounded transition mr-2"
          title="View/Edit Notes"
        >
          📝
        </button>
        <select
          value={candidate.status}
          onChange={handleStatusChange}
          className="px-2 py-1 bg-blue-500/30 text-blue-200 rounded text-xs focus:outline-none cursor-pointer"
        >
          <option value="Applied">Applied</option>
          <option value="Screening">Screening</option>
          <option value="Interview">Interview</option>
          <option value="Offer">Offer</option>
        </select>
      </td>
    </tr>
  );
}, (prev, next) => {
  return (
    prev.candidate._id === next.candidate._id &&
    prev.candidate.candidateName === next.candidate.candidateName &&
    prev.candidate.matchScore === next.candidate.matchScore &&
    prev.candidate.status === next.candidate.status &&
    prev.candidate.rating === next.candidate.rating &&
    prev.isSelected === next.isSelected &&
    prev.searchTerm === next.searchTerm
  );
});

CandidateRow.displayName = 'CandidateRow';

export const CandidateDatabase: React.FC = () => {
  // State Management
  const [candidates, setCandidates] = useState<ICandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter State
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    status: '',
    minScore: '',
    maxScore: '',
    minRating: '',
    location: '',
    dateFrom: '',
    dateTo: '',
  });

  // Bulk Action State
  const [selectedCandidates, setSelectedCandidates] = useState<SelectedCandidates>({});
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<'status' | 'notes' | 'email'>('status');
  const [bulkStatusValue, setBulkStatusValue] = useState('Interview');
  const [bulkNotesValue, setBulkNotesValue] = useState('');

  // Modal State
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<ICandidate | null>(null);
  const [candidateNotes, setCandidateNotes] = useState('');
  const [loadingNotes, setLoadingNotes] = useState(false);

  // Email Modal State
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  // Sorting
  const [sortField, setSortField] = useState<keyof ICandidate>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Real-time updates - polling interval
  const [pollingInterval] = useState(30000); // 30 seconds
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const isMountedRef = useRef(true);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch candidates with filters
  const fetchCandidates = useCallback(async () => {
    if (!isMountedRef.current) return;

    setLoading(true);
    setError('');
    try {
      const filterParams: any = {};
      if (filters.search) filterParams.search = filters.search;
      if (filters.status) filterParams.status = filters.status;
      if (filters.minScore) filterParams.minScore = filters.minScore;
      if (filters.maxScore) filterParams.maxScore = filters.maxScore;
      if (filters.minRating) filterParams.minRating = filters.minRating;
      if (filters.location) filterParams.location = filters.location;
      if (filters.dateFrom) filterParams.dateFrom = filters.dateFrom;
      if (filters.dateTo) filterParams.dateTo = filters.dateTo;

      const response = await recruiterAPI.getCandidates(filterParams);

      if (isMountedRef.current && response.data.success && Array.isArray(response.data.data)) {
        setCandidates(response.data.data);
        setLastUpdate(new Date());
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        const errorMessage =
          err.response?.data?.error?.message ||
          err.message ||
          'Failed to fetch candidates';
        setError(errorMessage);
        setCandidates([]);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [filters]);

  // Load candidate notes
  const loadCandidateNotes = useCallback(async (resumeId: string) => {
    setLoadingNotes(true);
    try {
      const response = await recruiterAPI.getNotes(resumeId);
      if (isMountedRef.current && response.data.success) {
        const notes = response.data.data;
        setCandidateNotes(Array.isArray(notes) ? notes.map(n => n.note).join('\n\n') : notes?.note || '');
      }
    } catch (err) {
      if (isMountedRef.current) {
        setCandidateNotes('');
      }
    } finally {
      if (isMountedRef.current) {
        setLoadingNotes(false);
      }
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    isMountedRef.current = true;
    fetchCandidates();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchCandidates]);

  // Real-time polling - improved to only recreate interval when pollingInterval changes
  useEffect(() => {
    pollIntervalRef.current = setInterval(() => {
      if (isMountedRef.current) {
        fetchCandidates();
      }
    }, pollingInterval);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [pollingInterval, fetchCandidates]);

  // Handle filter change
  const handleFilterChange = useCallback((key: keyof FilterOptions, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  }, []);

  // Handle candidate selection
  const toggleCandidateSelection = useCallback((candidateId: string) => {
    setSelectedCandidates(prev => ({
      ...prev,
      [candidateId]: !prev[candidateId],
    }));
  }, []);

  // Select all candidates
  const toggleSelectAll = useCallback(() => {
    const allSelected = Object.keys(selectedCandidates).length === candidates.length;
    if (allSelected) {
      setSelectedCandidates({});
    } else {
      const newSelected: SelectedCandidates = {};
      candidates.forEach(c => {
        newSelected[c._id] = true;
      });
      setSelectedCandidates(newSelected);
    }
  }, [selectedCandidates, candidates]);

  // Get selected candidate IDs - memoized
  const getSelectedIds = useCallback(() =>
    Object.keys(selectedCandidates).filter(id => selectedCandidates[id]),
    [selectedCandidates]
  );

  // Memoize selected IDs
  const selectedIds = useMemo(() => getSelectedIds(), [getSelectedIds]);

  // Bulk update status
  const handleBulkStatusUpdate = useCallback(async () => {
    if (selectedIds.length === 0) {
      setError('Please select at least one candidate');
      return;
    }

    setLoading(true);
    try {
      await recruiterAPI.bulkUpdateStatus(selectedIds, bulkStatusValue);
      setSuccess(`Updated ${selectedIds.length} candidates to ${bulkStatusValue}`);
      setSelectedCandidates({});
      setShowBulkActions(false);
      setTimeout(() => fetchCandidates(), 500);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to update candidates');
    } finally {
      setLoading(false);
    }
  }, [selectedIds, bulkStatusValue, fetchCandidates]);

  // Bulk add notes
  const handleBulkNotesUpdate = useCallback(async () => {
    if (selectedIds.length === 0) {
      setError('Please select at least one candidate');
      return;
    }

    if (!bulkNotesValue.trim()) {
      setError('Please enter a note');
      return;
    }

    setLoading(true);
    try {
      await recruiterAPI.bulkAddNotes(selectedIds, bulkNotesValue);
      setSuccess(`Added notes to ${selectedIds.length} candidates`);
      setSelectedCandidates({});
      setShowBulkActions(false);
      setBulkNotesValue('');
      setTimeout(() => fetchCandidates(), 500);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to add notes');
    } finally {
      setLoading(false);
    }
  }, [selectedIds, bulkNotesValue, fetchCandidates]);

  // Bulk send email
  const handleBulkEmail = useCallback(async () => {
    if (selectedIds.length === 0) {
      setError('Please select at least one candidate');
      return;
    }

    if (!emailSubject.trim() || !emailMessage.trim()) {
      setError('Please enter both subject and message');
      return;
    }

    setLoading(true);
    try {
      await recruiterAPI.bulkSendEmail(selectedIds, emailSubject, emailMessage);
      setSuccess(`Email sent to ${selectedIds.length} candidates`);
      setSelectedCandidates({});
      setShowEmailModal(false);
      setEmailSubject('');
      setEmailMessage('');
      setTimeout(() => fetchCandidates(), 500);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to send emails');
    } finally {
      setLoading(false);
    }
  }, [selectedIds, emailSubject, emailMessage, fetchCandidates]);

  // Update single candidate notes
  const handleSaveNotes = useCallback(async () => {
    if (!selectedCandidate) return;

    setLoadingNotes(true);
    try {
      await recruiterAPI.updateCandidateInfo(selectedCandidate._id, {
        notes: candidateNotes,
      });
      setSuccess('Notes updated successfully');
      setShowNotesModal(false);
      setTimeout(() => fetchCandidates(), 500);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to save notes');
    } finally {
      setLoadingNotes(false);
    }
  }, [selectedCandidate, candidateNotes, fetchCandidates]);

  // Open notes modal
  const openNotesModal = useCallback(async (candidate: ICandidate) => {
    setSelectedCandidate(candidate);
    setShowNotesModal(true);
    await loadCandidateNotes(candidate._id);
  }, [loadCandidateNotes]);

  // Export to CSV
  const handleExportToCSV = useCallback(() => {
    const headers = [
      'Name',
      'Email',
      'Location',
      'Status',
      'Match Score',
      'Rating',
      'Skills',
      'Experience (Years)',
      'Added Date',
      'Notes',
    ];

    const rows = candidates.map(c => [
      c.candidateName || 'Unknown',
      c.candidateEmail || '',
      c.location || '',
      c.status,
      c.matchScore || 0,
      c.rating || 0,
      (c.skills || []).join('; '),
      c.experience || 0,
      new Date(c.createdAt).toLocaleDateString(),
      (c.notes || '').replace(/"/g, '""'),
    ]);

    const csv = [
      [headers.join(',')],
      ...rows.map(row =>
        row
          .map(cell =>
            typeof cell === 'string' && cell.includes(',')
              ? `"${cell}"`
              : cell
          )
          .join(',')
      ),
    ].join('\n');

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    element.setAttribute('download', `candidates_${new Date().toISOString().split('T')[0]}.csv`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    setSuccess('Exported to CSV successfully');
  }, [candidates]);

  // Sorted and paginated candidates
  const processedCandidates = useMemo(() => {
    let result = [...candidates];

    // Sort
    result.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;

      if (typeof aVal === 'string') {
        return sortOrder === 'asc'
          ? aVal.localeCompare(String(bVal))
          : String(bVal).localeCompare(aVal);
      }

      return sortOrder === 'asc'
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });

    // Paginate
    const startIdx = (page - 1) * pageSize;
    return result.slice(startIdx, startIdx + pageSize);
  }, [candidates, sortField, sortOrder, page, pageSize]);

  // Clear filters
  const handleClearFilters = useCallback(() => {
    setFilters({
      search: '',
      status: '',
      minScore: '',
      maxScore: '',
      minRating: '',
      location: '',
      dateFrom: '',
      dateTo: '',
    });
    setPage(1);
  }, []);

  // Handler for status change on individual candidate
  const handleStatusChange = useCallback((candidateId: string, newStatus: string) => {
    recruiterAPI.moveCandidateStatus(candidateId, newStatus)
      .then(() => {
        const candidate = candidates.find(c => c._id === candidateId);
        setSuccess(`Moved ${candidate?.candidateName} to ${newStatus}`);
        setTimeout(() => fetchCandidates(), 300);
      })
      .catch(() => setError('Failed to update status'));
  }, [candidates, fetchCandidates]);

  const selectedCount = selectedIds.length;
  const totalPages = Math.ceil(candidates.length / pageSize);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">👥 Candidate Database</h1>
          <p className="text-gray-400">
            {candidates.length} candidates • Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm flex justify-between items-center" role="alert" aria-live="polite">
            <span>❌ {error}</span>
            <button
              onClick={() => setError('')}
              aria-label="Close error message"
              className="text-red-300 hover:text-red-100"
            >
              ✕
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-200 text-sm flex justify-between items-center" role="alert" aria-live="polite">
            <span>✅ {success}</span>
            <button
              onClick={() => setSuccess('')}
              aria-label="Close success message"
              className="text-green-300 hover:text-green-100"
            >
              ✕
            </button>
          </div>
        )}

        {/* Filters Section */}
        <div className="mb-8 bg-white/5 backdrop-blur border border-white/20 rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4 text-lg">🔍 Filters & Search</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div>
              <label htmlFor="filter-search" className="text-gray-300 text-sm block mb-2">Search</label>
              <input
                id="filter-search"
                type="text"
                placeholder="Name, email, skills..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            {/* Status */}
            <div>
              <label htmlFor="filter-status" className="text-gray-300 text-sm block mb-2">Status</label>
              <select
                id="filter-status"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500 transition"
              >
                <option value="">All Statuses</option>
                <option value="Applied">Applied</option>
                <option value="Screening">Screening</option>
                <option value="Interview">Interview</option>
                <option value="Offer">Offer</option>
              </select>
            </div>

            {/* Min Score */}
            <div>
              <label htmlFor="filter-min-score" className="text-gray-300 text-sm block mb-2">Min Score (%)</label>
              <input
                id="filter-min-score"
                type="number"
                placeholder="0"
                min="0"
                max="100"
                value={filters.minScore}
                onChange={(e) => handleFilterChange('minScore', e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            {/* Max Score */}
            <div>
              <label htmlFor="filter-max-score" className="text-gray-300 text-sm block mb-2">Max Score (%)</label>
              <input
                id="filter-max-score"
                type="number"
                placeholder="100"
                min="0"
                max="100"
                value={filters.maxScore}
                onChange={(e) => handleFilterChange('maxScore', e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            {/* Min Rating */}
            <div>
              <label htmlFor="filter-min-rating" className="text-gray-300 text-sm block mb-2">Min Rating</label>
              <input
                id="filter-min-rating"
                type="number"
                placeholder="0"
                min="0"
                max="5"
                step="0.5"
                value={filters.minRating}
                onChange={(e) => handleFilterChange('minRating', e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            {/* Location */}
            <div>
              <label htmlFor="filter-location" className="text-gray-300 text-sm block mb-2">Location</label>
              <input
                id="filter-location"
                type="text"
                placeholder="City, Country..."
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            {/* Date From */}
            <div>
              <label htmlFor="filter-date-from" className="text-gray-300 text-sm block mb-2">Added After</label>
              <input
                id="filter-date-from"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            {/* Date To */}
            <div>
              <label htmlFor="filter-date-to" className="text-gray-300 text-sm block mb-2">Added Before</label>
              <input
                id="filter-date-to"
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleClearFilters}
              aria-label="Clear all filters"
              className="px-4 py-2 bg-gray-500/30 hover:bg-gray-500/50 text-gray-200 rounded-lg transition"
            >
              Clear Filters
            </button>
            <button
              onClick={handleExportToCSV}
              aria-label="Export candidates to CSV file"
              className="px-4 py-2 bg-green-500/30 hover:bg-green-500/50 text-green-200 rounded-lg transition"
            >
              📥 Export to CSV
            </button>
            <button
              onClick={() => fetchCandidates()}
              aria-label="Refresh candidate list"
              className="px-4 py-2 bg-blue-500/30 hover:bg-blue-500/50 text-blue-200 rounded-lg transition"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Bulk Actions Toolbar */}
        {selectedCount > 0 && (
          <div className="mb-8 p-4 bg-blue-500/20 border border-blue-500/50 rounded-lg">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <p className="text-blue-200 font-semibold">
                🎯 {selectedCount} candidate{selectedCount !== 1 ? 's' : ''} selected
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setBulkActionType('status');
                    setShowBulkActions(true);
                  }}
                  className="px-4 py-2 bg-purple-500/50 hover:bg-purple-500/70 text-white rounded-lg transition"
                >
                  📋 Move to Status
                </button>
                <button
                  onClick={() => {
                    setBulkActionType('notes');
                    setShowBulkActions(true);
                  }}
                  className="px-4 py-2 bg-yellow-500/50 hover:bg-yellow-500/70 text-white rounded-lg transition"
                >
                  📝 Add Notes
                </button>
                <button
                  onClick={() => {
                    setShowEmailModal(true);
                  }}
                  className="px-4 py-2 bg-cyan-500/50 hover:bg-cyan-500/70 text-white rounded-lg transition"
                >
                  📧 Send Email
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Table Section */}
        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl overflow-hidden">
          {loading && candidates.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-400 mb-4">⏳ Loading candidates...</p>
              <div className="inline-block">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            </div>
          ) : processedCandidates.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <p className="text-lg">😕 No candidates found</p>
              <p className="text-sm mt-2">Try adjusting your filters or add resumes first</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white/5 border-b border-white/20">
                  <tr>
                    <th className="px-4 py-4 text-left text-white font-semibold">
                      <input
                        type="checkbox"
                        checked={
                          candidates.length > 0 &&
                          selectedCount === candidates.length
                        }
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 cursor-pointer"
                      />
                    </th>
                    <th
                      className="px-4 py-4 text-left text-white font-semibold cursor-pointer hover:bg-white/10"
                      onClick={() => {
                        if (sortField === 'candidateName') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortField('candidateName');
                          setSortOrder('asc');
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          if (sortField === 'candidateName') {
                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                          } else {
                            setSortField('candidateName');
                            setSortOrder('asc');
                          }
                        }
                      }}
                      aria-label={`Sort by name ${sortField === 'candidateName' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'ascending'}`}
                    >
                      Name {sortField === 'candidateName' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-4 py-4 text-left text-white font-semibold">Email</th>
                    <th className="px-4 py-4 text-left text-white font-semibold">Location</th>
                    <th
                      className="px-4 py-4 text-left text-white font-semibold cursor-pointer hover:bg-white/10"
                      onClick={() => {
                        if (sortField === 'status') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortField('status');
                          setSortOrder('asc');
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          if (sortField === 'status') {
                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                          } else {
                            setSortField('status');
                            setSortOrder('asc');
                          }
                        }
                      }}
                      aria-label={`Sort by status ${sortField === 'status' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'ascending'}`}
                    >
                      Status {sortField === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="px-4 py-4 text-left text-white font-semibold cursor-pointer hover:bg-white/10"
                      onClick={() => {
                        if (sortField === 'matchScore') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortField('matchScore');
                          setSortOrder('desc');
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          if (sortField === 'matchScore') {
                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                          } else {
                            setSortField('matchScore');
                            setSortOrder('desc');
                          }
                        }
                      }}
                      aria-label={`Sort by score ${sortField === 'matchScore' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'descending'}`}
                    >
                      Score {sortField === 'matchScore' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-4 py-4 text-left text-white font-semibold">Rating</th>
                    <th className="px-4 py-4 text-left text-white font-semibold">Skills</th>
                    <th className="px-4 py-4 text-left text-white font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {processedCandidates.map((candidate) => (
                    <CandidateRow
                      key={candidate._id}
                      candidate={candidate}
                      isSelected={!!selectedCandidates[candidate._id]}
                      onToggleSelect={toggleCandidateSelection}
                      onOpenNotes={openNotesModal}
                      onStatusChange={handleStatusChange}
                      searchTerm={filters.search}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center items-center gap-4">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-blue-500/30 hover:bg-blue-500/50 disabled:opacity-50 text-blue-200 rounded-lg transition"
            >
              ← Previous
            </button>
            <span className="text-gray-300">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-blue-500/30 hover:bg-blue-500/50 disabled:opacity-50 text-blue-200 rounded-lg transition"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Bulk Actions Modal */}
      {showBulkActions && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-white/20 rounded-xl p-6 max-w-md w-full" role="dialog" aria-labelledby="bulk-action-title" aria-modal="true">
            <h2 id="bulk-action-title" className="text-xl font-bold text-white mb-4">
              {bulkActionType === 'status' && '📋 Change Status'}
              {bulkActionType === 'notes' && '📝 Add Notes'}
            </h2>

            {bulkActionType === 'status' && (
              <div>
                <label htmlFor="bulk-status-select" className="text-gray-300 block mb-2">New Status</label>
                <select
                  id="bulk-status-select"
                  value={bulkStatusValue}
                  onChange={(e) => setBulkStatusValue(e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500 mb-4"
                >
                  <option value="Applied">Applied</option>
                  <option value="Screening">Screening</option>
                  <option value="Interview">Interview</option>
                  <option value="Offer">Offer</option>
                </select>
              </div>
            )}

            {bulkActionType === 'notes' && (
              <div>
                <label htmlFor="bulk-notes-textarea" className="text-gray-300 block mb-2">Notes</label>
                <textarea
                  id="bulk-notes-textarea"
                  value={bulkNotesValue}
                  onChange={(e) => setBulkNotesValue(e.target.value)}
                  placeholder="Enter notes to add to all selected candidates..."
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 mb-4 h-32 resize-none"
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowBulkActions(false);
                  setBulkNotesValue('');
                }}
                aria-label="Cancel bulk action"
                className="flex-1 px-4 py-2 bg-gray-500/30 hover:bg-gray-500/50 text-gray-200 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (bulkActionType === 'status') {
                    handleBulkStatusUpdate();
                  } else if (bulkActionType === 'notes') {
                    handleBulkNotesUpdate();
                  }
                }}
                disabled={loading}
                aria-label={`Apply bulk ${bulkActionType} action`}
                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg transition"
              >
                {loading ? '⏳ Processing...' : 'Apply'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-white/20 rounded-xl p-6 max-w-md w-full" role="dialog" aria-labelledby="email-modal-title" aria-modal="true">
            <h2 id="email-modal-title" className="text-xl font-bold text-white mb-4">📧 Send Email</h2>

            <label htmlFor="email-subject" className="text-gray-300 block mb-2">Subject</label>
            <input
              id="email-subject"
              type="text"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              placeholder="Email subject..."
              className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 mb-4"
            />

            <label htmlFor="email-message" className="text-gray-300 block mb-2">Message</label>
            <textarea
              id="email-message"
              value={emailMessage}
              onChange={(e) => setEmailMessage(e.target.value)}
              placeholder="Email message..."
              className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 mb-4 h-32 resize-none"
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowEmailModal(false);
                  setEmailSubject('');
                  setEmailMessage('');
                }}
                aria-label="Cancel sending email"
                className="flex-1 px-4 py-2 bg-gray-500/30 hover:bg-gray-500/50 text-gray-200 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkEmail}
                disabled={loading}
                aria-label="Send email to selected candidates"
                className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white rounded-lg transition"
              >
                {loading ? '⏳ Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes Modal */}
      {showNotesModal && selectedCandidate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-white/20 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto" role="dialog" aria-labelledby="notes-modal-title" aria-modal="true">
            <h2 id="notes-modal-title" className="text-xl font-bold text-white mb-2">
              📝 Notes - {selectedCandidate.candidateName}
            </h2>
            <p className="text-gray-400 text-sm mb-4">{selectedCandidate.candidateEmail}</p>

            {/* Candidate Info */}
            <div className="grid md:grid-cols-2 gap-4 mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
              <div>
                <p className="text-gray-400 text-xs">Status</p>
                <p className="text-white font-semibold">{selectedCandidate.status}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Match Score</p>
                <p className="text-white font-semibold">{selectedCandidate.matchScore}%</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Rating</p>
                <p className="text-white font-semibold">⭐ {selectedCandidate.rating}/5</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Experience</p>
                <p className="text-white font-semibold">{selectedCandidate.experience || 0} years</p>
              </div>
            </div>

            <label htmlFor="candidate-notes-textarea" className="text-gray-300 block mb-2 font-semibold">Notes & Comments</label>
            <textarea
              id="candidate-notes-textarea"
              value={candidateNotes}
              onChange={(e) => setCandidateNotes(e.target.value)}
              placeholder="Add or edit notes about this candidate..."
              disabled={loadingNotes}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 mb-4 h-48 resize-none"
            />

            <p className="text-gray-400 text-xs mb-4">
              Added: {new Date(selectedCandidate.createdAt).toLocaleString()}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowNotesModal(false)}
                aria-label="Close notes dialog"
                className="flex-1 px-4 py-2 bg-gray-500/30 hover:bg-gray-500/50 text-gray-200 rounded-lg transition"
              >
                Close
              </button>
              <button
                onClick={handleSaveNotes}
                disabled={loadingNotes}
                aria-label="Save notes for candidate"
                className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white rounded-lg transition"
              >
                {loadingNotes ? '⏳ Saving...' : '💾 Save Notes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
