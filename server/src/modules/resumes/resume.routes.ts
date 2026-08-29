import { Router } from 'express';
import multer from 'multer';
import { resumeController } from './resume.controller.js';
import { authenticateToken } from '../../middleware/auth.middleware.js';
import { uploadLimiter } from '../../middleware/security.middleware.js';
import { validateObjectId } from '../../middleware/validation.middleware.js';

const router = Router();

// Multer configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'text/plain', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, and TXT are allowed.'));
    }
  },
});

router.post('/upload', authenticateToken, uploadLimiter, resumeController.upload);
router.post('/upload-file', authenticateToken, uploadLimiter, upload.single('file'), resumeController.uploadFile);
router.post('/deduplicate', authenticateToken, resumeController.deduplicate);
router.post('/update-existing', authenticateToken, resumeController.updateExisting);
router.get('/', authenticateToken, resumeController.list);
router.get('/:resumeId', authenticateToken, validateObjectId('resumeId'), resumeController.get);
router.delete('/:resumeId', authenticateToken, validateObjectId('resumeId'), resumeController.delete);

export default router;
