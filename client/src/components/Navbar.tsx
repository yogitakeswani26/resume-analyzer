import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useState, useRef, useEffect } from 'react';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [showRecruiterMenu, setShowRecruiterMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleLogoutAllDevices = async () => {
    await logout();
    navigate('/login');
  };

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowRecruiterMenu(!showRecruiterMenu);
  };

  const toggleProfileMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowProfileMenu(!showProfileMenu);
  };

  const closeMenu = () => {
    setShowRecruiterMenu(false);
  };

  const closeProfileMenu = () => {
    setShowProfileMenu(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeMenu();
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        closeProfileMenu();
      }
    };

    if (showRecruiterMenu || showProfileMenu) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showRecruiterMenu, showProfileMenu]);

  return (
    <nav className="bg-gradient-to-r from-slate-900 to-blue-900 shadow-lg border-b border-blue-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2" aria-label="Resume Analyzer home">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">RA</span>
            </div>
            <span className="font-bold text-lg text-white">Resume Analyzer</span>
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center space-x-6">
              <Link to="/dashboard" className="text-gray-300 hover:text-blue-300 font-medium">Dashboard</Link>
              <Link to="/upload-resume" className="text-gray-300 hover:text-blue-300 font-medium">Upload</Link>

              {/* Recruiter Dropdown */}
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={toggleMenu}
                  aria-expanded={showRecruiterMenu}
                  aria-label="Open recruiter tools menu"
                  className="text-gray-300 hover:text-blue-300 font-medium cursor-pointer px-2 py-1 rounded hover:bg-blue-900/30 transition"
                >
                  Recruiter Tools ▼
                </button>
                {showRecruiterMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-lg z-50 border border-blue-700">
                    <Link to="/recruiter/candidates" onClick={closeMenu} className="block px-4 py-2 text-gray-300 hover:bg-blue-900 hover:text-white transition">Candidate Database</Link>
                    <Link to="/recruiter/compare" onClick={closeMenu} className="block px-4 py-2 text-gray-300 hover:bg-blue-900 hover:text-white transition">Compare Resumes</Link>
                    <Link to="/recruiter/match-job" onClick={closeMenu} className="block px-4 py-2 text-gray-300 hover:bg-blue-900 hover:text-white transition">Job Matching</Link>
                    <Link to="/recruiter/pipeline" onClick={closeMenu} className="block px-4 py-2 text-gray-300 hover:bg-blue-900 hover:text-white transition">Pipeline</Link>
                    <Link to="/recruiter/analytics" onClick={closeMenu} className="block px-4 py-2 text-gray-300 hover:bg-blue-900 hover:text-white transition">Analytics</Link>
                  </div>
                )}
              </div>

              {/* User Profile Dropdown */}
              <div className="relative" ref={profileMenuRef}>
                <button
                  type="button"
                  onClick={toggleProfileMenu}
                  aria-expanded={showProfileMenu}
                  aria-label={`Open profile menu for ${user?.name}`}
                  className="flex items-center space-x-2 text-gray-300 hover:text-blue-300 font-medium cursor-pointer px-3 py-1 rounded hover:bg-blue-900/30 transition"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <span>{user?.name}</span>
                  <span className="text-xs">▼</span>
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-slate-800 rounded-lg shadow-xl z-50 border border-blue-700 overflow-hidden">
                    {/* Profile Header */}
                    <div className="px-4 py-3 bg-gradient-to-r from-slate-700 to-blue-800 border-b border-blue-700">
                      <p className="text-white font-semibold">{user?.name}</p>
                      <p className="text-xs text-gray-400">{user?.email}</p>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <Link
                        to="/profile"
                        onClick={closeProfileMenu}
                        className="block px-4 py-2 text-gray-300 hover:bg-blue-900 hover:text-white transition flex items-center space-x-2"
                      >
                        <span>👤</span>
                        <span>View Profile</span>
                      </Link>
                      <Link
                        to="/settings"
                        onClick={closeProfileMenu}
                        className="block px-4 py-2 text-gray-300 hover:bg-blue-900 hover:text-white transition flex items-center space-x-2"
                      >
                        <span>⚙️</span>
                        <span>Settings</span>
                      </Link>

                      {/* Divider */}
                      <div className="h-px bg-blue-700 my-2"></div>

                      {/* Logout Options */}
                      <button
                        onClick={() => {
                          handleLogout();
                          closeProfileMenu();
                        }}
                        aria-label="Logout from current device"
                        className="w-full text-left px-4 py-2 text-gray-300 hover:bg-orange-900/40 hover:text-orange-300 transition flex items-center space-x-2"
                      >
                        <span>🚪</span>
                        <span>Logout</span>
                      </button>
                      <button
                        onClick={() => {
                          handleLogoutAllDevices();
                          closeProfileMenu();
                        }}
                        aria-label="Logout from all devices"
                        className="w-full text-left px-4 py-2 text-gray-300 hover:bg-red-900/40 hover:text-red-300 transition flex items-center space-x-2"
                      >
                        <span>🔐</span>
                        <span>Logout from all devices</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-blue-300"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
