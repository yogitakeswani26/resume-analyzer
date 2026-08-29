import { Router } from 'express';
import { analysisController } from './analysis.controller.js';
import { authenticateToken } from '../../middleware/auth.middleware.js';
import { validateObjectId } from '../../middleware/validation.middleware.js';
import { apiLimiter } from '../../middleware/security.middleware.js';

const router = Router();

// Standard endpoints (no rate limit)
router.get('/', authenticateToken, analysisController.list);
router.get('/:analysisId', authenticateToken, validateObjectId('analysisId'), analysisController.get);

// AI-powered endpoints - rate limited to prevent abuse
// Limit: 100 requests per minute per user IP
router.post('/analyze', authenticateToken, apiLimiter, analysisController.analyze);
router.post('/ai/:resumeId', authenticateToken, apiLimiter, validateObjectId('resumeId'), analysisController.analyzeWithAI);
router.post('/enhance/:resumeId', authenticateToken, apiLimiter, validateObjectId('resumeId'), analysisController.generateEnhancedResume);
router.post('/recommendations/:resumeId', authenticateToken, apiLimiter, validateObjectId('resumeId'), analysisController.getRecommendations);
router.post('/sections/:resumeId', authenticateToken, apiLimiter, validateObjectId('resumeId'), analysisController.getSectionAnalysis);
router.post('/health/:resumeId', authenticateToken, apiLimiter, validateObjectId('resumeId'), analysisController.getHealth);

export default router;
