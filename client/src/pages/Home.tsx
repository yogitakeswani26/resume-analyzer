import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex justify-between items-center px-6 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-lg flex items-center justify-center font-bold text-lg">
            RA
          </div>
          <span className="text-2xl font-bold">Resume Analyzer</span>
        </div>
        <div className="flex gap-4">
          {user ? (
            <>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition backdrop-blur"
              >
                Dashboard
              </button>
              <button
                onClick={() => navigate('/upload-resume')}
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition"
              >
                Upload Resume
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition backdrop-blur"
              >
                Login
              </button>
              <button
                onClick={() => navigate('/register')}
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition"
              >
                Get Started
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20 text-center">
        <h1 className="text-6xl md:text-7xl font-black mb-6 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent leading-tight">
          Transform Your Resume Into Success
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
          Get AI-powered insights, ATS optimization tips, and personalized recommendations to land your dream job
        </p>

        <div className="flex gap-6 justify-center flex-wrap mb-16">
          <button
            onClick={() => navigate(user ? '/upload-resume' : '/register')}
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-blue-500/50 hover:scale-105 transition transform"
          >
            🚀 Start Analyzing
          </button>
          <button
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-8 py-4 bg-white/10 backdrop-blur border border-white/20 rounded-xl font-bold text-lg hover:bg-white/20 transition"
          >
            Learn More
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 mt-20 mb-20">
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
            <div className="text-4xl font-bold text-cyan-400 mb-2">500+</div>
            <div className="text-gray-400">Resumes Analyzed</div>
          </div>
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
            <div className="text-4xl font-bold text-blue-400 mb-2">92%</div>
            <div className="text-gray-400">Success Rate</div>
          </div>
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
            <div className="text-4xl font-bold text-purple-400 mb-2">24/7</div>
            <div className="text-gray-400">AI Analysis</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-center mb-16">Powerful Features</h2>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: '🤖',
              title: 'AI-Powered Analysis',
              desc: 'Claude AI analyzes your resume deeply for real insights',
            },
            {
              icon: '📊',
              title: 'ATS Optimization',
              desc: 'Get your resume ATS-friendly with actionable tips',
            },
            {
              icon: '🎯',
              title: 'Job Matching',
              desc: 'Match your resume with job descriptions instantly',
            },
            {
              icon: '💡',
              title: 'Smart Recommendations',
              desc: 'Get personalized advice for career growth',
            },
            {
              icon: '⚡',
              title: 'Instant Results',
              desc: 'See detailed analysis in seconds, not hours',
            },
            {
              icon: '🔒',
              title: '100% Private',
              desc: 'Your data is never stored or shared',
            },
          ].map((feature, idx) => (
            <div
              key={idx}
              className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-8 hover:bg-white/10 transition group"
            >
              <div className="text-5xl mb-4 group-hover:scale-110 transition">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-gray-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-12 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Resume?</h2>
          <p className="text-lg mb-8 text-blue-100">Join 500+ professionals who improved their resumes with AI</p>
          <button
            onClick={() => navigate(user ? '/upload-resume' : '/register')}
            className="px-8 py-4 bg-white text-blue-600 rounded-xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition transform"
          >
            Get Started Free →
          </button>
        </div>
      </section>

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
