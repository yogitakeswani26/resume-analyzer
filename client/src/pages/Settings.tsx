import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

interface SettingsData {
  emailNotifications: boolean;
  analysisNotifications: boolean;
  resumeUpdateNotifications: boolean;
  marketingEmails: boolean;
  twoFactorEnabled: boolean;
  theme: 'dark' | 'light';
  language: string;
}

type SettingsKey = keyof SettingsData;
type SettingsValue = SettingsData[SettingsKey];

export const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'notifications' | 'security' | 'privacy' | 'general'>('notifications');
  const [isSaving, setIsSaving] = useState(false);

  const [settings, setSettings] = useState<SettingsData>({
    emailNotifications: true,
    analysisNotifications: true,
    resumeUpdateNotifications: true,
    marketingEmails: false,
    twoFactorEnabled: false,
    theme: 'dark',
    language: 'en',
  });

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleSettingChange = (key: SettingsKey, value: SettingsValue): void => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSaveSettings = async (): Promise<void> => {
    setIsSaving(true);
    setError('');
    setSuccess('');
    try {
      // Save to localStorage (in a real app, this would hit an API)
      localStorage.setItem('userSettings', JSON.stringify(settings));
      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(`Failed to save settings: ${err.message}`);
      } else {
        setError('Failed to save settings. Please try again.');
      }
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-lg mb-4">Please log in to access settings.</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 pt-8 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400">Manage your account preferences and security settings</p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-900/30 border border-green-700 rounded-lg">
            <p className="text-green-300">{success}</p>
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Settings Container */}
        <div className="bg-slate-800 rounded-xl border border-blue-700/50 shadow-xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-blue-700/50">
            <button
              onClick={() => setActiveTab('notifications')}
              className={`flex-1 px-6 py-4 font-medium transition ${
                activeTab === 'notifications'
                  ? 'bg-blue-600/20 text-blue-300 border-b-2 border-blue-600'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              🔔 Notifications
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`flex-1 px-6 py-4 font-medium transition ${
                activeTab === 'security'
                  ? 'bg-blue-600/20 text-blue-300 border-b-2 border-blue-600'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              🔒 Security
            </button>
            <button
              onClick={() => setActiveTab('privacy')}
              className={`flex-1 px-6 py-4 font-medium transition ${
                activeTab === 'privacy'
                  ? 'bg-blue-600/20 text-blue-300 border-b-2 border-blue-600'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              👁️ Privacy
            </button>
            <button
              onClick={() => setActiveTab('general')}
              className={`flex-1 px-6 py-4 font-medium transition ${
                activeTab === 'general'
                  ? 'bg-blue-600/20 text-blue-300 border-b-2 border-blue-600'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              ⚙️ General
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-6">Notification Preferences</h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-blue-700/30">
                    <div>
                      <p className="text-white font-medium">Email Notifications</p>
                      <p className="text-sm text-gray-400">Receive email updates about your account</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.emailNotifications}
                        onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-blue-700/30">
                    <div>
                      <p className="text-white font-medium">Analysis Notifications</p>
                      <p className="text-sm text-gray-400">Get notified when resume analysis is complete</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.analysisNotifications}
                        onChange={(e) => handleSettingChange('analysisNotifications', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-blue-700/30">
                    <div>
                      <p className="text-white font-medium">Resume Update Notifications</p>
                      <p className="text-sm text-gray-400">Get notified about resume updates and feedback</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.resumeUpdateNotifications}
                        onChange={(e) => handleSettingChange('resumeUpdateNotifications', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-blue-700/30">
                    <div>
                      <p className="text-white font-medium">Marketing Emails</p>
                      <p className="text-sm text-gray-400">Receive promotional emails and offers</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.marketingEmails}
                        onChange={(e) => handleSettingChange('marketingEmails', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-6">Security Settings</h2>

                <div className="space-y-4">
                  <div className="p-4 bg-slate-700/30 rounded-lg border border-blue-700/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">Two-Factor Authentication</p>
                        <p className="text-sm text-gray-400">Add an extra layer of security to your account</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.twoFactorEnabled}
                          onChange={(e) => handleSettingChange('twoFactorEnabled', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-700/30 rounded-lg border border-blue-700/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">Change Password</p>
                        <p className="text-sm text-gray-400">Update your account password</p>
                      </div>
                      <button
                        onClick={() => navigate('/profile')}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
                      >
                        Update
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-700/30 rounded-lg border border-blue-700/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">Active Sessions</p>
                        <p className="text-sm text-gray-400">Manage your active login sessions</p>
                      </div>
                      <button
                        onClick={() => navigate('/profile')}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-6">Privacy Settings</h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-blue-700/30">
                    <div>
                      <p className="text-white font-medium">Profile Visibility</p>
                      <p className="text-sm text-gray-400">Let recruiters see your profile</p>
                    </div>
                    <select className="px-3 py-2 bg-slate-700 text-white rounded-lg border border-blue-700/50 focus:outline-none focus:ring-2 focus:ring-blue-600">
                      <option>Public</option>
                      <option>Private</option>
                      <option>Recruiters Only</option>
                    </select>
                  </div>

                  <div className="p-4 bg-slate-700/30 rounded-lg border border-blue-700/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">Data Collection</p>
                        <p className="text-sm text-gray-400">Allow us to analyze usage patterns</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>

                  <div className="p-4 bg-red-900/20 rounded-lg border border-red-700/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-red-300 font-medium">Download Your Data</p>
                        <p className="text-sm text-red-400">Export all your personal data</p>
                      </div>
                      <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition">
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* General Tab */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-6">General Settings</h2>

                <div className="space-y-4">
                  <div className="p-4 bg-slate-700/30 rounded-lg border border-blue-700/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">Theme</p>
                        <p className="text-sm text-gray-400">Choose your preferred theme</p>
                      </div>
                      <select
                        value={settings.theme}
                        onChange={(e) => handleSettingChange('theme', e.target.value as 'dark' | 'light')}
                        className="px-3 py-2 bg-slate-700 text-white rounded-lg border border-blue-700/50 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        <option value="dark">Dark</option>
                        <option value="light">Light</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-700/30 rounded-lg border border-blue-700/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">Language</p>
                        <p className="text-sm text-gray-400">Select your preferred language</p>
                      </div>
                      <select
                        value={settings.language}
                        onChange={(e) => handleSettingChange('language', e.target.value)}
                        className="px-3 py-2 bg-slate-700 text-white rounded-lg border border-blue-700/50 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        <option value="en">English</option>
                        <option value="es">Español</option>
                        <option value="fr">Français</option>
                        <option value="de">Deutsch</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="mt-8 flex justify-between">
              <button
                onClick={() => navigate('/profile')}
                className="px-6 py-2 text-gray-300 hover:text-gray-200 font-medium transition"
              >
                Back to Profile
              </button>
              <button
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
