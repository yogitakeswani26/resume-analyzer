import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { userAPI } from '../services/api.js';

interface EditFormData {
  name: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  expertise: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface NotificationPreferences {
  emailNotifications: boolean;
  analysisNotifications: boolean;
  resumeUpdateNotifications: boolean;
  marketingEmails: boolean;
}

export const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [profilePicture, setProfilePicture] = useState<string>('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resumeCount, setResumeCount] = useState(0);
  const [analysisCount, setAnalysisCount] = useState(0);
  const [lastLogin, setLastLogin] = useState<string | null>(null);

  const [editFormData, setEditFormData] = useState<EditFormData>({
    name: user?.name || '',
    email: user?.email || '',
    phone: localStorage.getItem('userPhone') || '',
    location: localStorage.getItem('userLocation') || '',
    bio: localStorage.getItem('userBio') || '',
    expertise: localStorage.getItem('userExpertise') || '',
  });

  const [passwordFormData, setPasswordFormData] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>({
    emailNotifications: JSON.parse(localStorage.getItem('emailNotifications') || 'true'),
    analysisNotifications: JSON.parse(localStorage.getItem('analysisNotifications') || 'true'),
    resumeUpdateNotifications: JSON.parse(localStorage.getItem('resumeUpdateNotifications') || 'true'),
    marketingEmails: JSON.parse(localStorage.getItem('marketingEmails') || 'false'),
  });

  // Load profile data on mount
  useEffect(() => {
    const savedAvatar = localStorage.getItem('profilePicture');
    if (savedAvatar) {
      setProfilePicture(savedAvatar);
    }

    const savedResumeCount = localStorage.getItem('resumeUploadCount');
    if (savedResumeCount) {
      setResumeCount(parseInt(savedResumeCount));
    }

    const savedAnalysisCount = localStorage.getItem('analysisCount');
    if (savedAnalysisCount) {
      setAnalysisCount(parseInt(savedAnalysisCount));
    }

    const savedLastLogin = localStorage.getItem('lastLogin');
    if (savedLastLogin) {
      setLastLogin(new Date(savedLastLogin).toLocaleDateString());
    }

    // Theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setIsDarkTheme(false);
    }
  }, []);

  // Handle avatar upload
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target?.result as string;
        setProfilePicture(imageData);
        localStorage.setItem('profilePicture', imageData);
        setSuccess('Profile picture updated successfully');
        setTimeout(() => setSuccess(''), 3000);
      };
      reader.readAsDataURL(file);
    } else {
      setError('Please select a valid image file');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Handle edit profile
  const handleEditProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!user?._id) {
        throw new Error('User ID not found');
      }

      const response = await userAPI.updateProfile(user._id, {
        name: editFormData.name,
        email: editFormData.email,
        phone: editFormData.phone,
        location: editFormData.location,
        bio: editFormData.bio,
        expertise: editFormData.expertise,
      });

      if (response.data.success && response.data.data?.user) {
        setSuccess('Profile updated successfully');
        setIsEditModalOpen(false);

        // Update local form data with the response
        setEditFormData({
          name: response.data.data.user.name || '',
          email: response.data.data.user.email || '',
          phone: response.data.data.user.phone || '',
          location: response.data.data.user.location || '',
          bio: response.data.data.user.bio || '',
          expertise: response.data.data.user.expertise || '',
        });

        // Also update localStorage for backup
        localStorage.setItem('userPhone', response.data.data.user.phone || '');
        localStorage.setItem('userLocation', response.data.data.user.location || '');
        localStorage.setItem('userBio', response.data.data.user.bio || '');
        localStorage.setItem('userExpertise', response.data.data.user.expertise || '');

        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      console.error('Profile update error:', err);
      setError(err.message || 'Failed to update profile');
      setTimeout(() => setError(''), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      setError('New passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      if (!user?._id) {
        throw new Error('User ID not found');
      }

      await userAPI.changePassword(user._id, {
        currentPassword: passwordFormData.currentPassword,
        newPassword: passwordFormData.newPassword,
      });

      setSuccess('Password changed successfully');
      setPasswordFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setIsPasswordModalOpen(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Password change error:', err);
      setError(err.message || 'Failed to change password');
      setTimeout(() => setError(''), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle notification preferences
  const handleNotificationChange = (key: keyof NotificationPreferences) => {
    const updated = { ...notificationPreferences, [key]: !notificationPreferences[key] };
    setNotificationPreferences(updated);
    localStorage.setItem(key, JSON.stringify(!notificationPreferences[key]));
  };

  // Handle theme toggle
  const handleThemeToggle = () => {
    setIsDarkTheme(!isDarkTheme);
    localStorage.setItem('theme', isDarkTheme ? 'light' : 'dark');
    document.documentElement.classList.toggle('dark', !isDarkTheme);
  };

  // Handle logout from all devices
  const handleLogoutAllDevices = async () => {
    if (window.confirm('Are you sure you want to logout from all devices?')) {
      try {
        setIsLoading(true);
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 800));
        setSuccess('Logged out from all devices');
        setTimeout(() => {
          logout();
          navigate('/login');
        }, 2000);
      } catch (err) {
        setError('Failed to logout from all devices');
        setIsLoading(false);
      }
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you absolutely sure? This action cannot be undone.')) {
      return;
    }

    const password = window.prompt('Enter your password to confirm account deletion:');
    if (!password) {
      return;
    }

    try {
      setIsLoading(true);

      if (!user?._id) {
        throw new Error('User ID not found');
      }

      await userAPI.deleteAccount(user._id, { password });

      setSuccess('Account deleted successfully');
      setTimeout(() => {
        logout();
        navigate('/');
      }, 2000);
    } catch (err: any) {
      console.error('Account deletion error:', err);
      setError(err.message || 'Failed to delete account');
      setIsLoading(false);
      setTimeout(() => setError(''), 5000);
    }
  };

  const bgGradient = isDarkTheme
    ? 'from-slate-900 via-blue-900 to-slate-900'
    : 'from-slate-100 via-blue-50 to-slate-100';

  const cardBg = isDarkTheme
    ? 'bg-white/10 border-white/20'
    : 'bg-white/40 border-white/60';

  const textPrimary = isDarkTheme ? 'text-white' : 'text-gray-900';
  const textSecondary = isDarkTheme ? 'text-gray-300' : 'text-gray-700';
  const inputBg = isDarkTheme
    ? 'bg-white/10 border-white/20 text-white placeholder-gray-500'
    : 'bg-white/60 border-white/80 text-gray-900 placeholder-gray-400';

  return (
    <div className={`min-h-screen bg-gradient-to-br ${bgGradient} py-12 px-4`}>
      {/* Background animation blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-200">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {/* Header Section */}
        <div className={`backdrop-blur border ${cardBg} rounded-2xl p-8 mb-8`}>
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Avatar Section */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center overflow-hidden border-4 border-white/30">
                {profilePicture ? (
                  <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-5xl">👤</span>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                aria-label="Upload new profile picture"
                className="absolute bottom-0 right-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full p-3 hover:scale-110 transition"
                title="Upload profile picture"
              >
                📷
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>

            {/* User Info */}
            <div className="flex-1">
              <h1 className={`text-4xl font-bold ${textPrimary} mb-2`}>{user?.name || 'User'}</h1>
              <p className={`${textSecondary} mb-4`}>{user?.email}</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className={`text-sm ${textSecondary}`}>Account Created</p>
                  <p className={`font-semibold ${textPrimary}`}>
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className={`text-sm ${textSecondary}`}>Last Login</p>
                  <p className={`font-semibold ${textPrimary}`}>{lastLogin || 'Today'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Resumes Stat */}
          <div className={`backdrop-blur border ${cardBg} rounded-xl p-6`}>
            <div className="text-4xl font-bold text-blue-400 mb-2">{resumeCount}</div>
            <p className={`${textSecondary}`}>Resumes Uploaded</p>
            <p className={`text-sm ${textSecondary} mt-2`}>Total documents processed</p>
          </div>

          {/* Analyses Stat */}
          <div className={`backdrop-blur border ${cardBg} rounded-xl p-6`}>
            <div className="text-4xl font-bold text-green-400 mb-2">{analysisCount}</div>
            <p className={`${textSecondary}`}>Analyses Completed</p>
            <p className={`text-sm ${textSecondary} mt-2`}>AI evaluations performed</p>
          </div>

          {/* Account Status Stat */}
          <div className={`backdrop-blur border ${cardBg} rounded-xl p-6`}>
            <div className="text-4xl font-bold text-purple-400 mb-2">Active</div>
            <p className={`${textSecondary}`}>Account Status</p>
            <p className={`text-sm ${textSecondary} mt-2`}>Premium member</p>
          </div>
        </div>

        {/* Profile Information Section */}
        <div className={`backdrop-blur border ${cardBg} rounded-2xl p-8 mb-8`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-2xl font-bold ${textPrimary}`}>Profile Information</h2>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg font-semibold text-white hover:shadow-lg hover:shadow-blue-500/50 transition"
            >
              Edit Profile
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <p className={`text-sm ${textSecondary} mb-1`}>Full Name</p>
              <p className={`font-semibold ${textPrimary}`}>{editFormData.name || 'Not provided'}</p>
            </div>

            {/* Email */}
            <div>
              <p className={`text-sm ${textSecondary} mb-1`}>Email</p>
              <p className={`font-semibold ${textPrimary}`}>{editFormData.email || 'Not provided'}</p>
            </div>

            {/* Phone */}
            <div>
              <p className={`text-sm ${textSecondary} mb-1`}>Phone</p>
              <p className={`font-semibold ${textPrimary}`}>{editFormData.phone || 'Not provided'}</p>
            </div>

            {/* Location */}
            <div>
              <p className={`text-sm ${textSecondary} mb-1`}>Location</p>
              <p className={`font-semibold ${textPrimary}`}>{editFormData.location || 'Not provided'}</p>
            </div>

            {/* Bio */}
            <div className="md:col-span-2">
              <p className={`text-sm ${textSecondary} mb-1`}>Bio</p>
              <p className={`font-semibold ${textPrimary}`}>{editFormData.bio || 'Not provided'}</p>
            </div>

            {/* Expertise */}
            <div className="md:col-span-2">
              <p className={`text-sm ${textSecondary} mb-1`}>Expertise</p>
              <p className={`font-semibold ${textPrimary}`}>{editFormData.expertise || 'Not provided'}</p>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className={`backdrop-blur border ${cardBg} rounded-2xl p-8 mb-8`}>
          <h2 className={`text-2xl font-bold ${textPrimary} mb-6`}>Security & Settings</h2>

          <div className="space-y-4">
            {/* Change Password */}
            <button
              onClick={() => setIsPasswordModalOpen(true)}
              aria-label="Open change password dialog"
              className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-lg transition border border-white/10"
            >
              <div className="text-left">
                <p className={`font-semibold ${textPrimary}`}>Change Password</p>
                <p className={`text-sm ${textSecondary}`}>Update your password to keep your account secure</p>
              </div>
              <span className="text-xl">🔐</span>
            </button>

            {/* Theme Toggle */}
            <div className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-lg transition border border-white/10">
              <div className="text-left">
                <p className={`font-semibold ${textPrimary}`}>Dark Theme</p>
                <p className={`text-sm ${textSecondary}`}>Toggle between dark and light theme</p>
              </div>
              <button
                onClick={handleThemeToggle}
                aria-label={`Switch to ${isDarkTheme ? 'light' : 'dark'} theme`}
                aria-pressed={isDarkTheme}
                className={`relative w-14 h-8 rounded-full transition ${
                  isDarkTheme ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition transform ${
                    isDarkTheme ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Notification Preferences */}
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              aria-label="Open notification preferences dialog"
              className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-lg transition border border-white/10"
            >
              <div className="text-left">
                <p className={`font-semibold ${textPrimary}`}>Notification Preferences</p>
                <p className={`text-sm ${textSecondary}`}>Manage your email notification settings</p>
              </div>
              <span className="text-xl">🔔</span>
            </button>

            {/* Logout All Devices */}
            <button
              onClick={handleLogoutAllDevices}
              disabled={isLoading}
              aria-label="Logout from all devices"
              className="w-full flex items-center justify-between p-4 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg transition border border-amber-500/20 disabled:opacity-50"
            >
              <div className="text-left">
                <p className={`font-semibold ${textPrimary}`}>Logout from All Devices</p>
                <p className={`text-sm ${textSecondary}`}>Sign out from all active sessions</p>
              </div>
              <span className="text-xl">🚪</span>
            </button>

            {/* Delete Account */}
            <button
              onClick={handleDeleteAccount}
              disabled={isLoading}
              aria-label="Delete account permanently"
              className="w-full flex items-center justify-between p-4 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition border border-red-500/20 disabled:opacity-50"
            >
              <div className="text-left">
                <p className={`font-semibold text-red-400`}>Delete Account</p>
                <p className={`text-sm text-red-300`}>Permanently delete your account and all data</p>
              </div>
              <span className="text-xl">⚠️</span>
            </button>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg font-bold text-white hover:shadow-lg hover:shadow-blue-500/50 transition"
        >
          Logout
        </button>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`backdrop-blur border ${cardBg} rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto`} role="dialog" aria-labelledby="edit-profile-title" aria-modal="true">
            <h2 id="edit-profile-title" className={`text-2xl font-bold ${textPrimary} mb-6`}>Edit Profile</h2>

            <form onSubmit={handleEditProfile} className="space-y-4">
              {/* Name */}
              <div>
                <label htmlFor="edit-name" className={`block text-sm font-medium ${textSecondary} mb-2`}>
                  Full Name
                </label>
                <input
                  id="edit-name"
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${inputBg}`}
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="edit-email" className={`block text-sm font-medium ${textSecondary} mb-2`}>
                  Email
                </label>
                <input
                  id="edit-email"
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${inputBg}`}
                />
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="edit-phone" className={`block text-sm font-medium ${textSecondary} mb-2`}>
                  Phone
                </label>
                <input
                  id="edit-phone"
                  type="tel"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${inputBg}`}
                />
              </div>

              {/* Location */}
              <div>
                <label htmlFor="edit-location" className={`block text-sm font-medium ${textSecondary} mb-2`}>
                  Location
                </label>
                <input
                  id="edit-location"
                  type="text"
                  value={editFormData.location}
                  onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${inputBg}`}
                />
              </div>

              {/* Bio */}
              <div>
                <label htmlFor="edit-bio" className={`block text-sm font-medium ${textSecondary} mb-2`}>
                  Bio
                </label>
                <textarea
                  id="edit-bio"
                  value={editFormData.bio}
                  onChange={(e) => setEditFormData({ ...editFormData, bio: e.target.value })}
                  rows={3}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${inputBg}`}
                />
              </div>

              {/* Expertise */}
              <div>
                <label htmlFor="edit-expertise" className={`block text-sm font-medium ${textSecondary} mb-2`}>
                  Expertise
                </label>
                <input
                  id="edit-expertise"
                  type="text"
                  value={editFormData.expertise}
                  onChange={(e) => setEditFormData({ ...editFormData, expertise: e.target.value })}
                  placeholder="e.g., React, Node.js, AWS"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${inputBg}`}
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  aria-label="Cancel editing profile"
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  aria-label="Save profile changes"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`backdrop-blur border ${cardBg} rounded-2xl p-8 max-w-md w-full`} role="dialog" aria-labelledby="change-password-title" aria-modal="true">
            <h2 id="change-password-title" className={`text-2xl font-bold ${textPrimary} mb-6`}>Change Password</h2>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              {/* Current Password */}
              <div>
                <label htmlFor="current-password" className={`block text-sm font-medium ${textSecondary} mb-2`}>
                  Current Password
                </label>
                <input
                  id="current-password"
                  type="password"
                  value={passwordFormData.currentPassword}
                  onChange={(e) => setPasswordFormData({ ...passwordFormData, currentPassword: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${inputBg}`}
                  required
                />
              </div>

              {/* New Password */}
              <div>
                <label htmlFor="new-password" className={`block text-sm font-medium ${textSecondary} mb-2`}>
                  New Password
                </label>
                <input
                  id="new-password"
                  type="password"
                  value={passwordFormData.newPassword}
                  onChange={(e) => setPasswordFormData({ ...passwordFormData, newPassword: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${inputBg}`}
                  required
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirm-new-password" className={`block text-sm font-medium ${textSecondary} mb-2`}>
                  Confirm Password
                </label>
                <input
                  id="confirm-new-password"
                  type="password"
                  value={passwordFormData.confirmPassword}
                  onChange={(e) => setPasswordFormData({ ...passwordFormData, confirmPassword: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${inputBg}`}
                  required
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  aria-label="Cancel changing password"
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  aria-label="Update password"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Updating...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notification Settings Modal */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`backdrop-blur border ${cardBg} rounded-2xl p-8 max-w-md w-full`} role="dialog" aria-labelledby="notification-settings-title" aria-modal="true">
            <h2 id="notification-settings-title" className={`text-2xl font-bold ${textPrimary} mb-6`}>Notification Preferences</h2>

            <div className="space-y-4">
              {/* Email Notifications */}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <p className={`font-semibold ${textPrimary}`}>Email Notifications</p>
                  <p className={`text-sm ${textSecondary}`}>Receive email updates</p>
                </div>
                <button
                  onClick={() => handleNotificationChange('emailNotifications')}
                  aria-label={`Toggle email notifications ${notificationPreferences.emailNotifications ? 'off' : 'on'}`}
                  aria-pressed={notificationPreferences.emailNotifications}
                  className={`relative w-12 h-6 rounded-full transition ${
                    notificationPreferences.emailNotifications ? 'bg-blue-600' : 'bg-gray-400'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition transform ${
                      notificationPreferences.emailNotifications ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Analysis Notifications */}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <p className={`font-semibold ${textPrimary}`}>Analysis Notifications</p>
                  <p className={`text-sm ${textSecondary}`}>Get notified when analysis completes</p>
                </div>
                <button
                  onClick={() => handleNotificationChange('analysisNotifications')}
                  aria-label={`Toggle analysis notifications ${notificationPreferences.analysisNotifications ? 'off' : 'on'}`}
                  aria-pressed={notificationPreferences.analysisNotifications}
                  className={`relative w-12 h-6 rounded-full transition ${
                    notificationPreferences.analysisNotifications ? 'bg-blue-600' : 'bg-gray-400'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition transform ${
                      notificationPreferences.analysisNotifications ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Resume Update Notifications */}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <p className={`font-semibold ${textPrimary}`}>Resume Updates</p>
                  <p className={`text-sm ${textSecondary}`}>Notifications on resume uploads</p>
                </div>
                <button
                  onClick={() => handleNotificationChange('resumeUpdateNotifications')}
                  aria-label={`Toggle resume update notifications ${notificationPreferences.resumeUpdateNotifications ? 'off' : 'on'}`}
                  aria-pressed={notificationPreferences.resumeUpdateNotifications}
                  className={`relative w-12 h-6 rounded-full transition ${
                    notificationPreferences.resumeUpdateNotifications ? 'bg-blue-600' : 'bg-gray-400'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition transform ${
                      notificationPreferences.resumeUpdateNotifications ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Marketing Emails */}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <p className={`font-semibold ${textPrimary}`}>Marketing Emails</p>
                  <p className={`text-sm ${textSecondary}`}>Receive promotional content</p>
                </div>
                <button
                  onClick={() => handleNotificationChange('marketingEmails')}
                  aria-label={`Toggle marketing emails ${notificationPreferences.marketingEmails ? 'off' : 'on'}`}
                  aria-pressed={notificationPreferences.marketingEmails}
                  className={`relative w-12 h-6 rounded-full transition ${
                    notificationPreferences.marketingEmails ? 'bg-blue-600' : 'bg-gray-400'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition transform ${
                      notificationPreferences.marketingEmails ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setIsSettingsModalOpen(false)}
              aria-label="Close notification preferences dialog"
              className="w-full mt-6 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:shadow-lg transition"
            >
              Done
            </button>
          </div>
        </div>
      )}

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
