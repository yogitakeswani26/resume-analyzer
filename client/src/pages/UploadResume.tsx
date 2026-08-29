import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { resumeAPI, analysisAPI } from '../services/api';
import { SectionAnalysis } from '../components/SectionAnalysis';
import { analyzeResumeCompleteness } from '../utils/resumeAnalyzer';

interface CompletAnalysis {
  health: any;
  recommendations: any;
  sectionAnalysis: any;
  localAnalysis: any;
}

export const UploadResume: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [analysisPhase, setAnalysisPhase] = useState<string>('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [uploadedResumeId, setUploadedResumeId] = useState('');
  const [completeAnalysis, setCompleteAnalysis] = useState<CompletAnalysis | null>(null);
  const [resumeContent, setResumeContent] = useState('');
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (success && resumeContent && completeAnalysis) {
      const localAnalysis = analyzeResumeCompleteness(resumeContent);
      setCompleteAnalysis(prev => prev ? { ...prev, localAnalysis } : null);
    }
  }, [success, resumeContent]);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Please upload PDF, DOCX, DOC, or TXT files only.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds 5MB limit.');
      return;
    }

    setLoading(true);
    setError('');
    setAnalysisPhase('Parsing resume...');

    try {
      // Step 0: Parse file in FRONTEND (like Project 1)
      const { extractTextFromFile } = await import('../utils/pdfParser');
      const extractedContent = await extractTextFromFile(file);

      // Step 1: Upload extracted content to backend
      setAnalysisPhase('Uploading to server...');
      const uploadResponse = await resumeAPI.uploadFile(file, extractedContent);
      const resumeId = uploadResponse.data.data._id;

      setUploadedResumeId(resumeId);
      setResumeContent(extractedContent);

      // Step 2: Get health check
      setAnalysisPhase('Running health check...');
      const healthResponse = await analysisAPI.getHealth(resumeId);
      const healthData = healthResponse.data.data;

      // Step 3: Get recommendations
      setAnalysisPhase('Generating recommendations...');
      const recommendationsResponse = await analysisAPI.getRecommendations(resumeId);
      const recommendationsData = recommendationsResponse.data.data;

      // Step 4: Get section analysis
      setAnalysisPhase('Analyzing sections...');
      const sectionAnalysisResponse = await analysisAPI.getSectionAnalysis(resumeId);
      const sectionAnalysisData = sectionAnalysisResponse.data.data;

      // Step 5: Local analysis
      setAnalysisPhase('Finalizing analysis...');
      const localAnalysis = analyzeResumeCompleteness(extractedContent);

      setCompleteAnalysis({
        health: healthData,
        recommendations: recommendationsData,
        sectionAnalysis: sectionAnalysisData,
        localAnalysis: localAnalysis
      });

      setSuccess(true);
      setAnalysisPhase('');
    } catch (err: any) {
      console.error('Upload/Analysis error:', err);
      setError(
        err.response?.data?.error?.message ||
        err.message ||
        'Failed to upload and parse file. Please check the file format.'
      );
      setAnalysisPhase('');
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files?.[0]) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files?.[0]) {
      handleFileUpload(files[0]);
    }
  };


  if (success && completeAnalysis) {
    const { health, recommendations, sectionAnalysis, localAnalysis } = completeAnalysis;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-12">
            <div className="text-7xl mb-4 animate-bounce">✅</div>
            <h1 className="text-4xl font-bold text-white mb-2">Resume Analyzed!</h1>
            <p className="text-lg text-gray-300">Complete analysis report with health check, recommendations, and section breakdown</p>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {/* ATS Score */}
            <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-8">
              <p className="text-gray-400 mb-2">ATS Score</p>
              <div className="text-5xl font-bold text-blue-400 mb-4">
                {health?.atsScore || 0}%
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full"
                  style={{ width: `${health?.atsScore || 0}%` }}
                />
              </div>
              <p className="text-sm text-gray-400 mt-3">
                {health?.atsScore >= 80
                  ? '✅ Excellent'
                  : health?.atsScore >= 60
                  ? '⚠️ Good'
                  : '🔴 Needs work'}
              </p>
            </div>

            {/* Health Score */}
            <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-8">
              <p className="text-gray-400 mb-2">Resume Health</p>
              <div className="text-5xl font-bold text-green-400 mb-4">
                {health?.score || 0}%
              </div>
              <p className="text-sm text-gray-400">Overall completeness</p>
            </div>

            {/* Skills */}
            <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-8">
              <p className="text-gray-400 mb-2">Skills Found</p>
              <div className="text-5xl font-bold text-purple-400">
                {health?.skillCount || 0}
              </div>
              <p className="text-sm text-gray-400">Technical skills detected</p>
            </div>
          </div>

          {/* Experience & Metrics */}
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <div className="bg-white/5 backdrop-blur border border-white/20 rounded-xl p-6">
              <p className="text-gray-400 text-sm mb-2">Years Experience</p>
              <div className="text-3xl font-bold text-cyan-400">{health?.experienceYears || 0}</div>
            </div>
            <div className="bg-white/5 backdrop-blur border border-white/20 rounded-xl p-6">
              <p className="text-gray-400 text-sm mb-2">Keyword Density</p>
              <div className="text-3xl font-bold text-orange-400">{health?.keywordDensity || 0}%</div>
            </div>
            <div className="bg-white/5 backdrop-blur border border-white/20 rounded-xl p-6">
              <p className="text-gray-400 text-sm mb-2">Complete Sections</p>
              <div className="text-3xl font-bold text-green-400">
                {health?.completeSections}/{health?.totalSections}
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur border border-white/20 rounded-xl p-6">
              <p className="text-gray-400 text-sm mb-2">Section Score</p>
              <div className="text-3xl font-bold text-pink-400">{health?.overallSectionScore || 0}%</div>
            </div>
          </div>

          {/* Section Analysis */}
          {localAnalysis && (
            <div className="bg-white/5 backdrop-blur border border-white/20 rounded-xl p-8 mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">Section Analysis</h2>
              <SectionAnalysis
                sections={localAnalysis.sections}
                overallScore={localAnalysis.overallScore}
              />
            </div>
          )}

          {/* Detailed Recommendations */}
          <div className="bg-white/5 backdrop-blur border border-white/20 rounded-xl p-8 mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">📋 Recommendations for Improvement</h2>
            <div className="space-y-3">
              {health?.recommendations?.map((rec: string, idx: number) => (
                <div
                  key={idx}
                  className="p-4 bg-blue-500/20 border-l-4 border-blue-500 rounded text-gray-200"
                >
                  💡 {rec}
                </div>
              ))}
            </div>
          </div>

          {/* API Recommendations (if available) */}
          {recommendations?.recommendations && (
            <div className="bg-white/5 backdrop-blur border border-white/20 rounded-xl p-8 mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">🎯 AI-Generated Insights</h2>
              <div className="space-y-4">
                {Array.isArray(recommendations.recommendations) && recommendations.recommendations.map((insight: any, idx: number) => (
                  <div key={idx} className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                    <h3 className="font-bold text-purple-300 mb-2">{insight.category || 'Insight'}</h3>
                    <p className="text-gray-300">{insight.suggestion || insight}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Formatted Text Recommendations */}
          {recommendations?.formattedText && (
            <div className="bg-white/5 backdrop-blur border border-white/20 rounded-xl p-8 mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">📝 Detailed Analysis</h2>
              <div className="prose prose-invert max-w-none">
                <p className="text-gray-300 whitespace-pre-wrap">{recommendations.formattedText}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid md:grid-cols-3 gap-6">
            <button
              onClick={() => navigate('/match-job')}
              className="py-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg font-bold text-white hover:shadow-lg transition"
            >
              🎯 Match with Jobs
            </button>
            <button
              onClick={() => navigate('/analytics')}
              className="py-4 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg font-bold text-white hover:shadow-lg transition"
            >
              📊 Full Analytics
            </button>
            <button
              onClick={() => {
                setSuccess(false);
                setError('');
                setCompleteAnalysis(null);
              }}
              className="py-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg font-bold text-white hover:shadow-lg transition"
            >
              📄 Upload Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-3">Upload Your Resume</h1>
          <p className="text-lg text-gray-300">100% Automatic Parsing - PDF, DOCX, or TXT</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
            {error}
          </div>
        )}

        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-8">
          {/* Upload Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative p-12 border-2 border-dashed rounded-xl text-center transition cursor-pointer ${
              dragActive
                ? 'border-blue-400 bg-blue-500/20'
                : 'border-white/30 hover:border-blue-500 hover:bg-white/5'
            }`}
          >
            <input
              type="file"
              accept=".pdf,.docx,.doc,.txt"
              onChange={handleFileChange}
              disabled={loading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />

            <div>
              <div className="text-6xl mb-4">
                {loading ? '⏳' : '📄'}
              </div>
              <p className="text-xl font-bold text-white mb-2">
                {loading ? (analysisPhase || 'Processing...') : 'Click or Drag & Drop'}
              </p>
              <p className="text-gray-400 mb-3">
                {loading ? 'Please wait while we analyze your resume' : 'Supported: PDF, DOCX, DOC, TXT (Max 5MB)'}
              </p>

              {loading && (
                <div className="mt-6">
                  <div className="inline-block mb-4">
                    <div className="animate-spin text-2xl">⏳</div>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1 mb-4">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 h-1 rounded-full animate-pulse"
                      style={{ width: '60%' }}
                    />
                  </div>
                  <p className="text-xs text-gray-400">{analysisPhase}</p>
                </div>
              )}
            </div>
          </div>

          {/* Features */}
          <div className="mt-8 grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-white/5 rounded-lg">
              <p className="text-green-400 font-semibold">✓ Automatic Parsing</p>
              <p className="text-gray-400">No copy-paste needed</p>
            </div>
            <div className="p-3 bg-white/5 rounded-lg">
              <p className="text-green-400 font-semibold">✓ Instant Analysis</p>
              <p className="text-gray-400">Results in seconds</p>
            </div>
            <div className="p-3 bg-white/5 rounded-lg">
              <p className="text-green-400 font-semibold">✓ 100% Secure</p>
              <p className="text-gray-400">Never stored permanently</p>
            </div>
            <div className="p-3 bg-white/5 rounded-lg">
              <p className="text-green-400 font-semibold">✓ AI Powered</p>
              <p className="text-gray-400">Claude deep analysis</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
