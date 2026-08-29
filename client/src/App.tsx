import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, Suspense, lazy } from 'react';
import { useAuth } from './hooks/useAuth.js';
import { ErrorBoundary } from './components/ErrorBoundary.js';
import { Navbar } from './components/Navbar.js';
import { LoadingSpinner } from './components/LoadingSpinner.js';

// Eager load Home (critical path - displayed immediately on load)
import { Home } from './pages/Home.js';

// Lazy load auth pages
const Login = lazy(() => import('./pages/Login.js').then(m => ({ default: m.Login })));
const Register = lazy(() => import('./pages/Register.js').then(m => ({ default: m.Register })));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword.js').then(m => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import('./pages/ResetPassword.js').then(m => ({ default: m.ResetPassword })));

// Lazy load candidate pages
const Dashboard = lazy(() => import('./pages/Dashboard.js').then(m => ({ default: m.Dashboard })));
const UploadResume = lazy(() => import('./pages/UploadResume.js').then(m => ({ default: m.UploadResume })));
const MatchJob = lazy(() => import('./pages/MatchJob.js').then(m => ({ default: m.MatchJob })));
const ViewAnalytics = lazy(() => import('./pages/ViewAnalytics.js').then(m => ({ default: m.ViewAnalytics })));
const Profile = lazy(() => import('./pages/Profile.js').then(m => ({ default: m.Profile })));

// Lazy load recruiter pages
const CandidateDatabase = lazy(() => import('./pages/CandidateDatabase.js').then(m => ({ default: m.CandidateDatabase })));
const CompareResumes = lazy(() => import('./pages/CompareResumes.js').then(m => ({ default: m.CompareResumes })));
const JobMatchingRecruiter = lazy(() => import('./pages/JobMatchingRecruiter.js').then(m => ({ default: m.JobMatchingRecruiter })));
const RecruiterAnalytics = lazy(() => import('./pages/RecruiterAnalytics.js').then(m => ({ default: m.RecruiterAnalytics })));
const CandidatePipeline = lazy(() => import('./pages/CandidatePipeline.js').then(m => ({ default: m.CandidatePipeline })));

// Lazy load settings page
const Settings = lazy(() => import('./pages/Settings.js').then(m => ({ default: m.Settings })));

// Loading fallback component for route transitions
const RouteLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <LoadingSpinner size="lg" />
      <p className="text-gray-600 mt-4 font-medium">Loading page...</p>
    </div>
  </div>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? (
    <ErrorBoundary fallbackTitle="Page Error">
      <Suspense fallback={<RouteLoader />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  ) : (
    <Navigate to="/login" />
  );
};

function App() {
  const { restore } = useAuth();

  useEffect(() => {
    restore();
  }, [restore]);

  return (
    <ErrorBoundary>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={
            <ErrorBoundary fallbackTitle="Home Page Error">
              <Home />
            </ErrorBoundary>
          } />
          <Route path="/login" element={
            <ErrorBoundary fallbackTitle="Login Error">
              <Suspense fallback={<RouteLoader />}>
                <Login />
              </Suspense>
            </ErrorBoundary>
          } />
          <Route path="/register" element={
            <ErrorBoundary fallbackTitle="Registration Error">
              <Suspense fallback={<RouteLoader />}>
                <Register />
              </Suspense>
            </ErrorBoundary>
          } />
          <Route path="/forgot-password" element={
            <ErrorBoundary fallbackTitle="Password Recovery Error">
              <Suspense fallback={<RouteLoader />}>
                <ForgotPassword />
              </Suspense>
            </ErrorBoundary>
          } />
          <Route path="/reset-password/:token" element={
            <ErrorBoundary fallbackTitle="Password Reset Error">
              <Suspense fallback={<RouteLoader />}>
                <ResetPassword />
              </Suspense>
            </ErrorBoundary>
          } />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/upload-resume"
          element={
            <ProtectedRoute>
              <UploadResume />
            </ProtectedRoute>
          }
        />
        <Route
          path="/match-job"
          element={
            <ProtectedRoute>
              <MatchJob />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <ViewAnalytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruiter/candidates"
          element={
            <ProtectedRoute>
              <CandidateDatabase />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruiter/compare"
          element={
            <ProtectedRoute>
              <CompareResumes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruiter/match-job"
          element={
            <ProtectedRoute>
              <JobMatchingRecruiter />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruiter/analytics"
          element={
            <ProtectedRoute>
              <RecruiterAnalytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruiter/pipeline"
          element={
            <ProtectedRoute>
              <CandidatePipeline />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
      </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
