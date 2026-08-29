import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React vendors
          'react-vendors': ['react', 'react-dom', 'react-router-dom'],

          // State management
          'zustand': ['zustand'],

          // HTTP client
          'axios': ['axios'],

          // PDF handling - heavy library
          'pdf-chunk': ['pdfjs-dist'],

          // Document generation
          'document-utils': ['jspdf', 'html2canvas', 'docx', 'mammoth'],

          // Charts & visualization
          'charts': ['chart.js', 'react-chartjs-2', 'recharts'],

          // Form handling
          'form-utils': ['react-hook-form', '@hookform/resolvers', 'zod'],

          // Auth-related pages
          'auth-routes': ['./src/pages/Login.tsx', './src/pages/Register.tsx', './src/pages/ForgotPassword.tsx', './src/pages/ResetPassword.tsx'],

          // Candidate pages
          'candidate-routes': ['./src/pages/Dashboard.tsx', './src/pages/UploadResume.tsx', './src/pages/MatchJob.tsx', './src/pages/ViewAnalytics.tsx', './src/pages/Profile.tsx'],

          // Recruiter pages
          'recruiter-routes': ['./src/pages/CandidateDatabase.tsx', './src/pages/CompareResumes.tsx', './src/pages/JobMatchingRecruiter.tsx', './src/pages/RecruiterAnalytics.tsx', './src/pages/CandidatePipeline.tsx'],

          // Settings page
          'settings-route': ['./src/pages/Settings.tsx'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
