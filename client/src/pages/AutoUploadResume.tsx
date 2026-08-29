import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { resumeAPI, analysisAPI } from '../services/api';
import { AIAnalysisDisplay } from '../components/AIAnalysisDisplay';
import { SectionAnalysis } from '../components/SectionAnalysis';
import { analyzeResumeCompleteness } from '../utils/resumeAnalyzer';

export const UploadResume: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [uploadedResumeId, setUploadedResumeId] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [sectionAnalysis, setSectionAnalysis] = useState<any>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [showAI, setShowAI] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [resumeContent, setResumeContent] = useState('');
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (success && resumeContent) {
      const analysis = analyzeResumeCompleteness(resumeContent);
      setSectionAnalysis(analysis);
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

    try {
      // Upload file using FormData
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await resumeAPI.uploadFile(file);
      const resumeId = uploadResponse.data.data._id;
      const extractedContent = uploadResponse.data.data.content;

      setUploadedResumeId(resumeId);
      setResumeContent(extractedContent);

      // Get analysis immediately
      const healthResponse = await analysisAPI.getHealth(resumeId);
      setAnalysis(healthResponse.data.data);

      setSuccess(true);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(
        err.response?.data?.error?.message ||
        err.message ||
        'Failed to upload and parse file. Please check the file format.'
      );
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

  const handleAIAnalysis = async () => {
    if (!uploadedResumeId) return;

    setAiLoading(true);
    try {
      const response = await analysisAPI.analyzeWithAI(uploadedResumeId);
      if (response.data.success && response.data.data) {
        setAiAnalysis(response.data.data);
        setShowAI(true);
      }
    } catch (err: any) {
      setError('AI analysis failed. Please try again.');
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-12">
            <div className="text-7xl mb-4 animate-bounce">✅</div>
            <h1 className="text-4xl font-bold text-white mb-2">Resume Analyzed!</h1>
            <p className="text-lg text-gray-300">Here's your detailed analysis:</p>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {/* ATS Score */}
            <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-8">
              <p className="text-gray-400 mb-2">ATS Score</p>
              <div className="text-5xl font-bold text-blue-400 mb-4">
                {analysis?.atsScore || 0}%
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full"
                  style={{ width: `${analysis?.atsScore || 0}%` }}
                />
              </div>
              <p className="text-sm text-gray-400 mt-3">
                {analysis?.atsScore >= 80
                  ? '✅ Excellent'
                  : analysis?.atsScore >= 60
                  ? '⚠️ Good'
                  : '🔴 Needs work'}
              </p>
            </div>

            {/* Health Score */}
            <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-8">
              <p className="text-gray-400 mb-2">Resume Health</p>
              <div className="text-5xl font-bold text-green-400 mb-4">
                {analysis?.score || 0}%
              </div>
              <p className="text-sm text-gray-400">Overall completeness</p>
            </div>

            {/* Skills */}
            <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-8">
              <p className="text-gray-400 mb-2">Skills Found</p>
              <div className="text-5xl font-bold text-purple-400">
                {analysis?.skillCount || 0}
              </div>
              <p className="text-sm text-gray-400">Technical skills detected</p>
            </div>
          </div>

          {/* Section Analysis */}
          {sectionAnalysis && (
            <div className="bg-white/5 backdrop-blur border border-white/20 rounded-xl p-8 mb-12">
              <SectionAnalysis
                sections={sectionAnalysis.sections}
                overallScore={sectionAnalysis.overallScore}
              />
            </div>
          )}

          {/* Recommendations */}
          <div className="bg-white/5 backdrop-blur border border-white/20 rounded-xl p-8 mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">Recommendations</h2>
            <div className="space-y-3">
              {analysis?.recommendations?.map((rec: string, idx: number) => (
                <div
                  key={idx}
                  className="p-4 bg-blue-500/20 border-l-4 border-blue-500 rounded text-gray-200"
                >
                  💡 {rec}
                </div>
              ))}
            </div>
          </div>

          {/* AI Analysis Button */}
          {!showAI && (
            <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/50 rounded-xl p-8 text-center mb-12">
              <h3 className="text-2xl font-bold text-white mb-4">🤖 Get AI Deep Analysis</h3>
              <p className="text-gray-300 mb-6">Let Claude AI analyze your resume and provide personalized recommendations</p>
              <button
                onClick={handleAIAnalysis}
                disabled={aiLoading}
                className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-bold text-white hover:shadow-lg transition disabled:opacity-50"
              >
                {aiLoading ? '⏳ Analyzing...' : '🚀 Generate AI Analysis'}
              </button>
            </div>
          )}

          {/* AI Analysis Results */}
          {showAI && aiAnalysis && <AIAnalysisDisplay analysis={aiAnalysis} />}

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
                setAnalysis(null);
                setSectionAnalysis(null);
                setAiAnalysis(null);
                setShowAI(false);
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
                {loading ? 'Parsing Your Resume...' : 'Click or Drag & Drop'}
              </p>
              <p className="text-gray-400 mb-3">
                {loading ? 'Extracting text and analyzing...' : 'Supported: PDF, DOCX, DOC, TXT (Max 5MB)'}
              </p>

              {loading && (
                <div className="inline-block mt-4">
                  <div className="animate-spin text-2xl">⏳</div>
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
