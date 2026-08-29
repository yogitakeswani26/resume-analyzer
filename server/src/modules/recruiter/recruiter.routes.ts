import { Router } from 'express';
import { recruiterController } from './recruiter.controller.js';
import { authenticateToken } from '../../middleware/auth.middleware.js';
import { validateObjectId, validateObjectIdArray } from '../../middleware/validation.middleware.js';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Candidate Database
router.get('/candidates', recruiterController.getCandidateDatabase);

// Resume Comparison
router.post('/compare', recruiterController.compareResumes);

// Job Matching
router.post('/match-job', recruiterController.matchJobDescription);

// Candidate Info
router.patch('/candidate/:resumeId', validateObjectId('resumeId'), recruiterController.updateCandidateInfo);

// Analytics
router.get('/analytics', recruiterController.getAnalytics);

// Candidate Pipeline
router.get('/pipeline', recruiterController.getCandidatePipeline);
router.post('/pipeline/:resumeId/move', validateObjectId('resumeId'), recruiterController.moveCandidateStatus);

// Bulk Actions
router.put('/bulk/status', validateObjectIdArray('resumeIds'), recruiterController.bulkUpdateStatus);
router.put('/bulk/notes', validateObjectIdArray('resumeIds'), recruiterController.bulkAddNotes);
router.post('/bulk/email', validateObjectIdArray('resumeIds'), recruiterController.bulkSendEmail);

// Candidate Details
router.get('/candidate/:resumeId/details', validateObjectId('resumeId'), recruiterController.getCandidateDetails);

// Candidate Notes
router.post('/note/:resumeId/add', validateObjectId('resumeId'), recruiterController.addNote);
router.get('/notes/:resumeId', validateObjectId('resumeId'), recruiterController.getNotes);

export default router;
