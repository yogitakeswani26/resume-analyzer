import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { authAPI } from '../services/api';

interface PasswordRequirements {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [validatingToken, setValidatingToken] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [requirements, setRequirements] = useState<PasswordRequirements>({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError('Invalid reset link. Token is missing.');
        setValidatingToken(false);
        return;
      }

      try {
        const response = await authAPI.validateResetToken(token);
        if (!response.data.data.valid) {
          setError('This password reset link has expired or is invalid. Please request a new one.');
        }
      } catch (err: any) {
        setError('Failed to validate reset token. Please request a new reset link.');
      } finally {
        setValidatingToken(false);
      }
    };

    validateToken();
  }, [token]);

  // Check password requirements as user types
  useEffect(() => {
    setRequirements({
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[@$!%*?&]/.test(password),
    });
  }, [password]);

  const allRequirementsMet =
    Object.values(requirements).every((req) => req) && password === confirmPassword && password.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('Invalid reset token');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!allRequirementsMet) {
      setError('Please meet all password requirements');
      return;
    }

    setLoading(true);

    try {
      await authAPI.resetPassword({
        token,
        password,
        confirmPassword,
      });

      setSuccess('Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
        err.message ||
        'Failed to reset password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (validatingToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="relative z-10 w-full max-w-md">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl text-center">
            <div className="animate-spin inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
            <p className="text-white">Validating reset token...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && error.includes('expired') || error && error.includes('invalid')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="relative z-10 w-full max-w-md">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">❌</div>
              <h1 className="text-2xl font-bold text-white mb-4">Reset Link Invalid</h1>
              <p className="text-gray-400 mb-6">{error}</p>
            </div>
            <Link
              to="/forgot-password"
              className="block w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg font-bold text-white hover:shadow-lg hover:shadow-blue-500/50 transition text-center"
            >
              Request New Reset Link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-xl flex items-center justify-center font-bold text-2xl mx-auto mb-4">
              RA
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Create New Password</h1>
            <p className="text-gray-400">Make sure it's strong and secure</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-200 text-sm">
              {success}
            </div>
          )}

          {/* Form */}
          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>

                {/* Password Requirements */}
                <div className="mt-4 space-y-2">
                  <p className="text-xs text-gray-400 font-medium">Password must have:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <RequirementCheck
                      met={requirements.minLength}
                      label="At least 8 characters"
                    />
                    <RequirementCheck
                      met={requirements.hasUppercase}
                      label="One uppercase letter"
                    />
                    <RequirementCheck
                      met={requirements.hasLowercase}
                      label="One lowercase letter"
                    />
                    <RequirementCheck
                      met={requirements.hasNumber}
                      label="One number"
                    />
                    <RequirementCheck
                      met={requirements.hasSpecialChar}
                      label="One special character (@$!%*?&)"
                    />
                  </div>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition pr-12 ${
                      confirmPassword && password === confirmPassword
                        ? 'border-green-500/50 focus:ring-green-500'
                        : 'border-white/20 focus:ring-blue-500'
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-red-400 text-sm mt-2">Passwords do not match</p>
                )}
                {confirmPassword && password === confirmPassword && (
                  <p className="text-green-400 text-sm mt-2">✓ Passwords match</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !allRequirementsMet}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg font-bold text-white hover:shadow-lg hover:shadow-blue-500/50 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Resetting Password...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>
          ) : (
            <div className="text-center">
              <div className="text-5xl mb-4">✅</div>
              <p className="text-gray-300 mb-4">
                Your password has been reset successfully.
              </p>
              <p className="text-gray-400 mb-6">
                Redirecting to login in a few seconds...
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-gray-400">
              <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">
                Back to Login
              </Link>
            </p>
          </div>
        </div>
      </div>

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
      `}</style>
    </div>
  );
};

interface RequirementCheckProps {
  met: boolean;
  label: string;
}

const RequirementCheck: React.FC<RequirementCheckProps> = ({ met, label }) => (
  <div className={`text-xs flex items-center gap-2 p-2 rounded ${met ? 'text-green-400 bg-green-500/10' : 'text-gray-500 bg-white/5'}`}>
    <span>{met ? '✓' : '○'}</span>
    <span>{label}</span>
  </div>
);
