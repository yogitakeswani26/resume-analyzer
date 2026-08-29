import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { resumeAPI, analysisAPI } from '../services/api';
import { AIAnalysisDisplay } from '../components/AIAnalysisDisplay';
import { SectionAnalysis } from '../components/SectionAnalysis';
import { analyzeResumeCompleteness } from '../utils/resumeAnalyzer';
import { extractErrorMessage } from '../types/index';

interface SectionCheckItem {
  name: string;
  found: boolean;
  score: number;
  details: string;
  suggestions: string[];
  icon: string;
}

interface DetailedRecommendations {
  summary?: string;
  experience?: string;
  skills?: string;
  education?: string;
  projects?: string;
  format?: string;
}

interface AnalysisData {
  atsScore?: number;
  score?: number;
  skillCount?: number;
  recommendations?: string[];
}

interface SectionAnalysisData {
  sections: SectionCheckItem[];
  overallScore: number;
}

interface AIAnalysisData {
  overallAssessment: string;
  strengths: string[];
  weaknesses: string[];
  detailedRecommendations: DetailedRecommendations;
  atsScore: number;
  careerAdvice: string;
  nextSteps: string[];
  improvementPriority: 'critical' | 'high' | 'medium' | 'low';
}

export const UploadResume: React.FC = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploadedResumeId, setUploadedResumeId] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [sectionAnalysis, setSectionAnalysis] = useState<SectionAnalysisData | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisData | null>(null);
  const [showAI, setShowAI] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (success && content) {
      const analysis = analyzeResumeCompleteness(content);
      setSectionAnalysis(analysis);
    }
  }, [success, content]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFileName(selectedFile.name);
    setFile(selectedFile);
    setError('');

    if (selectedFile.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setContent(text);
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleAnalyze = async (e?: React.FormEvent): Promise<void> => {
    if (e) e.preventDefault();

    if (!content) {
      setError('Please paste your resume content');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const uploadResponse = await resumeAPI.upload({
        fileName: fileName || 'resume.txt',
        fileUrl: `resume_${Date.now()}`,
        content,
      });

      const resumeId = uploadResponse.data.data._id;
      setUploadedResumeId(resumeId);

      const healthResponse = await analysisAPI.getHealth(resumeId);
      setAnalysis(healthResponse.data.data);

      setSuccess(true);
      setFileName('');
      setContent('');
      setFile(null);
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAIAnalysis = async (): Promise<void> => {
    if (!uploadedResumeId) return;

    setAiLoading(true);
    try {
      const response = await analysisAPI.analyzeWithAI(uploadedResumeId);
      if (response.data.success && response.data.data) {
        setAiAnalysis(response.data.data);
        setShowAI(true);
      }
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(err);
      setError(errorMessage);
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
              <h3 className="text-2xl font-bold text-white mb-4">Get AI-Powered Deep Analysis</h3>
              <p className="text-gray-300 mb-6">Let Claude AI provide personalized recommendations</p>
              <button
                onClick={handleAIAnalysis}
                disabled={aiLoading}
                className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-bold text-white hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2 mx-auto"
              >
                {aiLoading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Analyzing...
                  </>
                ) : (
                  <>
                    🤖 Get AI Analysis
                  </>
                )}
              </button>
            </div>
          )}

          {/* AI Analysis Results */}
          {showAI && aiAnalysis && (
            <div className="mb-12">
              <AIAnalysisDisplay analysis={aiAnalysis} />
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
                setFile(null);
                setFileName('');
                setContent('');
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
          <h1 className="text-4xl font-bold text-white mb-3">Upload & Analyze Your Resume</h1>
          <p className="text-lg text-gray-300">Get instant ATS score, section analysis, and AI recommendations</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
            {error}
          </div>
        )}

        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-8 space-y-8">
          {/* Info Box */}
          <div className="p-6 bg-blue-500/20 border border-blue-500/50 rounded-xl">
            <p className="text-lg text-blue-200 mb-3">⚡ What You'll Get:</p>
            <div className="grid grid-cols-2 gap-4 text-sm text-blue-100">
              <div>✓ ATS Compatibility Score</div>
              <div>✓ Section-by-Section Analysis</div>
              <div>✓ Mistakes & Improvements</div>
              <div>✓ AI Recommendations</div>
            </div>
          </div>

          {/* Upload Area */}
          <div>
            <label className="block text-lg font-bold text-white mb-4">Select Resume</label>
            <div className="relative p-8 border-2 border-dashed border-white/30 rounded-xl text-center hover:border-blue-500 transition">
              <input
                type="file"
                accept=".pdf,.docx,.txt,.doc"
                onChange={handleFileChange}
                disabled={loading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div>
                <p className="text-4xl mb-3">📁</p>
                <p className="text-white font-semibold">Click to upload or drag and drop</p>
                <p className="text-gray-400 text-sm">PDF, DOCX, or TXT (Max 5MB)</p>
                {fileName && (
                  <p className="text-green-400 font-semibold mt-3">✓ {fileName}</p>
                )}
              </div>
            </div>
          </div>

          {/* Content Area */}
          {fileName && file && (file.type === 'application/pdf' || file.type.includes('document') || file.type === 'text/plain') && (
            <div>
              <label className="block text-lg font-bold text-white mb-4">📋 Paste Resume Content</label>
              <p className="text-gray-400 text-sm mb-3">Copy your resume text and paste below:</p>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste your complete resume text here..."
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 h-48 resize-none"
              />
              <button
                onClick={handleAnalyze}
                disabled={!content || loading}
                className="w-full mt-4 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg font-bold text-white hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Analyzing...
                  </>
                ) : (
                  <>
                    🚀 Analyze Resume
                  </>
                )}
              </button>
            </div>
          )}

          <div className="text-center text-sm text-gray-400">
            Your resume is analyzed locally and never stored permanently
          </div>
        </div>
      </div>
    </div>
  );
};
