import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { extractErrorMessage } from '../types/index.js';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => Promise<void>;
  isLoading?: boolean;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'warning' | 'confirmation' | 'final'>('warning');
  const [confirmationText, setConfirmationText] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!isOpen) {
    return null;
  }

  const handleReset = () => {
    setPassword('');
    setConfirmationText('');
    setError('');
    setStep('warning');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleProceedToConfirmation = () => {
    setStep('confirmation');
  };

  const handleConfirmation = () => {
    const confirmText = 'DELETE MY ACCOUNT';
    if (confirmationText !== confirmText) {
      setError(`Please type exactly: "${confirmText}"`);
      return;
    }
    setStep('final');
  };

  const handleFinalConfirm = async (): Promise<void> => {
    if (!password) {
      setError('Password is required');
      return;
    }

    try {
      setError('');
      await onConfirm(password);
      // If deletion is successful, the user will be logged out
      // and navigated to login/home
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(err);
      setError(errorMessage);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl shadow-2xl max-w-md w-full border border-red-700/30" role="alertdialog" aria-labelledby="delete-account-title" aria-describedby="delete-account-desc">
        {/* Warning Step */}
        {step === 'warning' && (
          <div className="p-6">
            <div className="mb-4 flex justify-center">
              <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center">
                <span className="text-3xl">⚠️</span>
              </div>
            </div>

            <h2 id="delete-account-title" className="text-2xl font-bold text-white mb-2 text-center">Delete Account</h2>
            <p id="delete-account-desc" className="text-gray-400 text-center mb-6">
              This action cannot be undone. Please read carefully.
            </p>

            <div className="space-y-3 mb-6 p-4 bg-red-900/20 rounded-lg border border-red-700/30">
              <p className="text-red-300 text-sm font-medium">This will permanently:</p>
              <ul className="text-red-400 text-sm space-y-2 ml-4">
                <li>✓ Delete your account ({user?.email})</li>
                <li>✓ Remove all your resumes</li>
                <li>✓ Delete all analysis records</li>
                <li>✓ Erase all stored data</li>
              </ul>
            </div>

            <p className="text-yellow-300 text-sm mb-6 flex items-start gap-2">
              <span>!</span>
              <span>We cannot recover your account or data after deletion. Consider downloading your data first.</span>
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleClose}
                aria-label="Cancel account deletion"
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleProceedToConfirmation}
                aria-label="Proceed to account deletion confirmation"
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
              >
                I Understand, Continue
              </button>
            </div>
          </div>
        )}

        {/* Confirmation Step */}
        {step === 'confirmation' && (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-white mb-2">Final Confirmation</h2>
            <p className="text-gray-400 mb-6">
              To proceed, please type the exact phrase below to confirm deletion:
            </p>

            <div className="mb-6 p-4 bg-blue-900/20 rounded-lg border border-blue-700/30">
              <p className="text-blue-300 font-mono text-center font-bold text-lg">
                DELETE MY ACCOUNT
              </p>
            </div>

            <label htmlFor="confirmation-text" className="sr-only">Type the phrase to confirm deletion</label>
            <input
              id="confirmation-text"
              type="text"
              value={confirmationText}
              onChange={(e) => {
                setConfirmationText(e.target.value);
                setError('');
              }}
              placeholder="Type the phrase exactly as shown"
              className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-blue-700/50 focus:outline-none focus:ring-2 focus:ring-blue-600 mb-4"
              aria-label="Confirmation text input"
            />

            {error && (
              <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <p className="text-gray-400 text-xs mb-6">
              This is to prevent accidental deletion. Type carefully.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('warning')}
                aria-label="Go back to warning step"
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition"
              >
                Back
              </button>
              <button
                onClick={handleConfirmation}
                disabled={confirmationText !== 'DELETE MY ACCOUNT'}
                aria-label="Confirm text entry to proceed with deletion"
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Text
              </button>
            </div>
          </div>
        )}

        {/* Password Step */}
        {step === 'final' && (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-white mb-2">Enter Your Password</h2>
            <p className="text-gray-400 mb-6">
              Please enter your password to confirm account deletion:
            </p>

            <div className="mb-6">
              <label htmlFor="delete-password" className="block text-sm text-gray-300 mb-2">Password</label>
              <div className="relative">
                <input
                  id="delete-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter your password"
                  className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-blue-700/50 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  aria-label="Enter your password to confirm deletion"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <p className="text-yellow-300 text-xs mb-6 flex items-start gap-2">
              <span>!</span>
              <span>We will delete your account and all related data immediately upon confirmation.</span>
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setPassword('');
                  setConfirmationText('');
                  setError('');
                  setStep('confirmation');
                }}
                disabled={isLoading}
                aria-label="Go back to confirmation step"
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={handleFinalConfirm}
                disabled={isLoading || !password}
                aria-label="Confirm password and permanently delete account"
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
