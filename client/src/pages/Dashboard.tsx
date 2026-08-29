import { useAuth } from '../hooks/useAuth.js';
import { useNavigate } from 'react-router-dom';

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12 px-4">
      {/* Animated background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-black text-white mb-4">Welcome, {user?.name}! 👋</h1>
          <p className="text-xl text-gray-300">Let's get started with your resume analysis</p>
        </div>

        {/* Main Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {/* Upload Card */}
          <button
            onClick={() => navigate('/upload-resume')}
            onKeyPress={(e) => e.key === 'Enter' && navigate('/upload-resume')}
            role="button"
            tabIndex={0}
            aria-label="Go to upload resume page"
            className="group bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-8 hover:bg-white/20 transition cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            <div className="text-6xl mb-4 group-hover:scale-110 transition">📄</div>
            <h3 className="text-2xl font-bold text-white mb-3">Upload Resume</h3>
            <p className="text-gray-300 mb-6">Upload your resume for 100% automatic AI analysis - PDF, DOCX, or TXT</p>
            <button className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg font-bold text-white hover:shadow-lg hover:shadow-blue-500/50 transition" onClick={(e) => { e.stopPropagation(); navigate('/upload-resume'); }}>
              Start Upload →
            </button>
          </button>

          {/* Match Job Card */}
          <button
            onClick={() => navigate('/match-job')}
            onKeyPress={(e) => e.key === 'Enter' && navigate('/match-job')}
            role="button"
            tabIndex={0}
            aria-label="Go to match with job page"
            className="group bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-8 hover:bg-white/20 transition cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            <div className="text-6xl mb-4 group-hover:scale-110 transition">🎯</div>
            <h3 className="text-2xl font-bold text-white mb-3">Match with Job</h3>
            <p className="text-gray-300 mb-6">Compare your resume against job descriptions and get matching score</p>
            <button className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg font-bold text-white hover:shadow-lg hover:shadow-green-500/50 transition" onClick={(e) => { e.stopPropagation(); navigate('/match-job'); }}>
              Match Job →
            </button>
          </button>

          {/* Analytics Card */}
          <button
            onClick={() => navigate('/analytics')}
            onKeyPress={(e) => e.key === 'Enter' && navigate('/analytics')}
            role="button"
            tabIndex={0}
            aria-label="Go to view analytics page"
            className="group bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-8 hover:bg-white/20 transition cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            <div className="text-6xl mb-4 group-hover:scale-110 transition">📊</div>
            <h3 className="text-2xl font-bold text-white mb-3">View Analytics</h3>
            <p className="text-gray-300 mb-6">See your resume health score, improvements, and detailed metrics</p>
            <button className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg font-bold text-white hover:shadow-lg hover:shadow-purple-500/50 transition" onClick={(e) => { e.stopPropagation(); navigate('/analytics'); }}>
              View Analytics →
            </button>
          </button>
        </div>

        {/* Stats Section */}
        <div>
          <h2 className="text-3xl font-bold text-white mb-8">Quick Stats</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Resumes Stat */}
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur border border-blue-500/30 rounded-xl p-6">
              <div className="text-4xl font-bold text-blue-400 mb-2">0</div>
              <p className="text-gray-300">Total Resumes</p>
              <p className="text-sm text-gray-400 mt-2">Uploaded & analyzed</p>
            </div>

            {/* Analyses Stat */}
            <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 backdrop-blur border border-green-500/30 rounded-xl p-6">
              <div className="text-4xl font-bold text-green-400 mb-2">0</div>
              <p className="text-gray-300">Analyses Done</p>
              <p className="text-sm text-gray-400 mt-2">AI deep dives</p>
            </div>

            {/* Average Score Stat */}
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 backdrop-blur border border-purple-500/30 rounded-xl p-6">
              <div className="text-4xl font-bold text-purple-400 mb-2">0%</div>
              <p className="text-gray-300">Avg ATS Score</p>
              <p className="text-sm text-gray-400 mt-2">Resume optimization</p>
            </div>

            {/* Skills Stat */}
            <div className="bg-gradient-to-br from-cyan-500/20 to-blue-600/20 backdrop-blur border border-cyan-500/30 rounded-xl p-6">
              <div className="text-4xl font-bold text-cyan-400 mb-2">0</div>
              <p className="text-gray-300">Skills Found</p>
              <p className="text-sm text-gray-400 mt-2">Across all resumes</p>
            </div>
          </div>
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
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};
