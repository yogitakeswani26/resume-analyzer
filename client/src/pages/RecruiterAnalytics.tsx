import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, ComposedChart, ScatterChart, Scatter
} from 'recharts';
import { recruiterAPI } from '../services/api';

export const RecruiterAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: '',
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setError('');
    try {
      const params: any = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.status) params.status = filters.status;

      const response = await recruiterAPI.getAnalytics(params);
      if (response.data.success) {
        setAnalytics(response.data.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch analytics:', err);
      setError(err.response?.data?.error?.message || 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    setLoading(true);
    fetchAnalytics();
  };

  const exportToJSON = () => {
    if (!analytics) return;
    const element = document.createElement('a');
    const file = new Blob([JSON.stringify(analytics, null, 2)], { type: 'application/json' });
    element.href = URL.createObjectURL(file);
    element.download = `recruiter-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const exportToCSV = () => {
    if (!analytics) return;

    let csv = 'Recruiter Analytics Report\n';
    csv += `Generated: ${new Date().toISOString()}\n\n`;

    // Summary Metrics
    csv += 'SUMMARY METRICS\n';
    csv += `Total Candidates,${analytics.totalCandidates}\n`;
    csv += `Average Match Score,${analytics.averageScore}%\n`;
    csv += `Time to Hire (Days),${analytics.timeToHire.average}\n\n`;

    // Status Breakdown
    csv += 'PIPELINE STATUS\n';
    csv += 'Status,Count\n';
    Object.entries(analytics.statusBreakdown).forEach(([status, count]) => {
      csv += `${status},${count}\n`;
    });
    csv += '\n';

    // Conversion Rates
    csv += 'CONVERSION RATES\n';
    csv += `Screening,${analytics.conversionRates.screening}%\n`;
    csv += `Interview,${analytics.conversionRates.interview}%\n`;
    csv += `Offer,${analytics.conversionRates.offer}%\n\n`;

    // Top Candidates
    csv += 'TOP CANDIDATES\n';
    csv += 'Name,Email,Match Score,Rating,Status,Experience,Skills\n';
    analytics.topCandidates.forEach((candidate: any) => {
      csv += `"${candidate.name}","${candidate.email}",${candidate.matchScore},${candidate.rating},${candidate.status},${candidate.experience},"${candidate.skills.join('; ')}"\n`;
    });
    csv += '\n';

    // Top Skills
    csv += 'TOP SKILLS IN DEMAND\n';
    csv += 'Skill,Candidates,Avg Score\n';
    analytics.topSkills.forEach((skill: any) => {
      csv += `${skill.skill},${skill.count},${skill.avgScore}\n`;
    });

    const element = document.createElement('a');
    const file = new Blob([csv], { type: 'text/csv' });
    element.href = URL.createObjectURL(file);
    element.download = `recruiter-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
          <p className="text-white text-lg">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Analytics Dashboard</h1>
          </div>
          <div className="p-6 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
            {error || 'Failed to load analytics'}
          </div>
        </div>
      </div>
    );
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Recruiter Analytics Dashboard</h1>
          <p className="text-gray-400">Comprehensive recruitment insights and metrics</p>
        </div>

        {/* Filters */}
        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-6 mb-8">
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="text-gray-400 text-sm mb-2 block">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-2 block">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-2 block">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-blue-400"
              >
                <option value="">All Statuses</option>
                <option value="Applied">Applied</option>
                <option value="Screening">Screening</option>
                <option value="Interview">Interview</option>
                <option value="Offer">Offer</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleApplyFilters}
                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={exportToJSON}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition text-sm"
          >
            Export JSON
          </button>
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition text-sm"
          >
            Export CSV
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 overflow-x-auto">
          {['overview', 'pipeline', 'skills', 'candidates', 'funnel', 'time'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/10 border border-white/20 text-gray-400 hover:bg-white/20'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-6">
            <p className="text-gray-400 text-sm mb-2">Total Candidates</p>
            <p className="text-3xl font-bold text-blue-400">{analytics.totalCandidates}</p>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-6">
            <p className="text-gray-400 text-sm mb-2">Avg Match Score</p>
            <p className="text-3xl font-bold text-green-400">{analytics.averageScore}%</p>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-6">
            <p className="text-gray-400 text-sm mb-2">Time to Hire (Days)</p>
            <p className="text-3xl font-bold text-purple-400">{analytics.timeToHire.average}</p>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-6">
            <p className="text-gray-400 text-sm mb-2">Offer Rate</p>
            <p className="text-3xl font-bold text-yellow-400">{analytics.conversionRates.offer}%</p>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Pipeline Status */}
            <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Pipeline Status</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={Object.entries(analytics.statusBreakdown).map(([status, count]) => ({
                      name: status,
                      value: count as number,
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {COLORS.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.2)' }}
                    labelStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Top Skills */}
            <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Top Skills</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.topSkills}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="skill" stroke="#9ca3af" angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.2)' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Experience Distribution */}
            <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Experience Distribution</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.experienceDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="range" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.2)' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="count" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Rating Distribution */}
            <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Candidate Ratings</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.ratingDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="stars" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.2)' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="count" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Pipeline Tab */}
        {activeTab === 'pipeline' && (
          <div className="grid md:grid-cols-1 gap-8 mb-8">
            <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-6">Pipeline Breakdown</h2>
              <div className="grid md:grid-cols-4 gap-4 mb-8">
                {Object.entries(analytics.statusBreakdown).map(([status, count]) => (
                  <div key={status} className="bg-white/5 rounded-lg p-4 text-center">
                    <p className="text-gray-400 text-sm">{status}</p>
                    <p className="text-3xl font-bold text-white mt-2">{count as number}</p>
                  </div>
                ))}
              </div>

              <h3 className="text-lg font-bold text-white mb-4">Funnel Conversion Rates</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-lg p-4 border border-blue-400/30">
                  <p className="text-gray-300 text-sm mb-2">Applied to Screening</p>
                  <p className="text-3xl font-bold text-blue-300">{analytics.conversionRates.screening}%</p>
                </div>
                <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-lg p-4 border border-green-400/30">
                  <p className="text-gray-300 text-sm mb-2">Screening to Interview</p>
                  <p className="text-3xl font-bold text-green-300">{analytics.conversionRates.interview}%</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-lg p-4 border border-purple-400/30">
                  <p className="text-gray-300 text-sm mb-2">Interview to Offer</p>
                  <p className="text-3xl font-bold text-purple-300">{analytics.conversionRates.offer}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Skills Tab */}
        {activeTab === 'skills' && (
          <div className="grid md:grid-cols-1 gap-8 mb-8">
            <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">ATS Scores by Skill</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold">Skill</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-semibold">Candidates</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-semibold">Avg Score</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-semibold">Min Score</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-semibold">Max Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.atsScoresBySkill.map((item: any, idx: number) => (
                      <tr key={idx} className="border-b border-white/10 hover:bg-white/5 transition">
                        <td className="py-3 px-4 text-white">{item.skill}</td>
                        <td className="text-right py-3 px-4 text-gray-300">{item.count}</td>
                        <td className="text-right py-3 px-4 text-blue-400 font-semibold">{item.avgScore}%</td>
                        <td className="text-right py-3 px-4 text-yellow-400">{item.minScore}%</td>
                        <td className="text-right py-3 px-4 text-green-400">{item.maxScore}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Skill Demand Analysis</h2>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analytics.skillDemandChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="#9ca3af" angle={-45} textAnchor="end" height={100} />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.2)' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Legend />
                  <Bar dataKey="candidates" fill="#3b82f6" name="Candidates with Skill" />
                  <Bar dataKey="quality" fill="#10b981" name="Avg Quality Score" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Candidates Tab */}
        {activeTab === 'candidates' && (
          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Top Candidates Ranking</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Rank</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Name</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Email</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-semibold">Match Score</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-semibold">Rating</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Status</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-semibold">Experience</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Top Skills</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.topCandidates.map((candidate: any, idx: number) => (
                    <tr key={candidate.id} className="border-b border-white/10 hover:bg-white/5 transition">
                      <td className="py-3 px-4 text-white font-bold">#{idx + 1}</td>
                      <td className="py-3 px-4 text-white">{candidate.name}</td>
                      <td className="py-3 px-4 text-gray-400 text-sm">{candidate.email}</td>
                      <td className="text-right py-3 px-4">
                        <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm font-semibold">
                          {candidate.matchScore}%
                        </span>
                      </td>
                      <td className="text-right py-3 px-4">
                        <span className="text-yellow-400 font-semibold">{candidate.rating}/5</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          candidate.status === 'Offer' ? 'bg-green-500/20 text-green-300' :
                          candidate.status === 'Interview' ? 'bg-blue-500/20 text-blue-300' :
                          candidate.status === 'Screening' ? 'bg-yellow-500/20 text-yellow-300' :
                          'bg-gray-500/20 text-gray-300'
                        }`}>
                          {candidate.status}
                        </span>
                      </td>
                      <td className="text-right py-3 px-4 text-gray-300">{candidate.experience} years</td>
                      <td className="py-3 px-4 text-gray-300 text-sm">{candidate.skills.join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Funnel Tab */}
        {activeTab === 'funnel' && (
          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-6">Hiring Funnel Conversion</h2>
            <div className="space-y-4">
              {[
                { stage: 'Applied', count: analytics.statusBreakdown.Applied, color: 'from-blue-500 to-blue-600', width: '100%' },
                { stage: 'Screening', count: analytics.statusBreakdown.Screening, color: 'from-green-500 to-green-600', width: `${analytics.conversionRates.screening}%` },
                { stage: 'Interview', count: analytics.statusBreakdown.Interview, color: 'from-yellow-500 to-yellow-600', width: `${analytics.conversionRates.interview}%` },
                { stage: 'Offer', count: analytics.statusBreakdown.Offer, color: 'from-purple-500 to-purple-600', width: `${analytics.conversionRates.offer}%` },
              ].map(({ stage, count, color, width }) => (
                <div key={stage}>
                  <div className="flex justify-between mb-2">
                    <span className="text-white font-semibold">{stage}</span>
                    <span className="text-gray-400 text-sm">{count} candidates ({width})</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-8 overflow-hidden">
                    <div
                      className={`bg-gradient-to-r ${color} h-full flex items-center justify-end pr-3 transition-all duration-500`}
                      style={{ width }}
                    >
                      {parseFloat(width) > 10 && <span className="text-white font-bold text-sm">{count}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Time to Hire Tab */}
        {activeTab === 'time' && (
          <div className="grid md:grid-cols-1 gap-8 mb-8">
            <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-6">Time-to-Hire Metrics</h2>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-lg p-4 border border-blue-400/30">
                  <p className="text-gray-400 text-sm mb-2">Average</p>
                  <p className="text-3xl font-bold text-blue-300">{analytics.timeToHire.average}</p>
                  <p className="text-gray-500 text-xs mt-2">days</p>
                </div>
                <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-lg p-4 border border-green-400/30">
                  <p className="text-gray-400 text-sm mb-2">Median</p>
                  <p className="text-3xl font-bold text-green-300">{analytics.timeToHire.median}</p>
                  <p className="text-gray-500 text-xs mt-2">days</p>
                </div>
                <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-lg p-4 border border-yellow-400/30">
                  <p className="text-gray-400 text-sm mb-2">Fastest</p>
                  <p className="text-3xl font-bold text-yellow-300">{analytics.timeToHire.fastest}</p>
                  <p className="text-gray-500 text-xs mt-2">days</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-lg p-4 border border-purple-400/30">
                  <p className="text-gray-400 text-sm mb-2">Slowest</p>
                  <p className="text-3xl font-bold text-purple-300">{analytics.timeToHire.slowest}</p>
                  <p className="text-gray-500 text-xs mt-2">days</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
