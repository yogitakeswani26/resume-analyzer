import { Request, Response, NextFunction } from 'express';
import { recruiterService } from './recruiter.service.js';
import { AppError } from '../../middleware/error.middleware.js';

interface AuthRequest extends Request {
  user?: { userId: string; email: string; role: string };
}

const sendResponse = (res: Response, statusCode: number, data: any) => {
  res.status(statusCode).json({
    success: statusCode < 400,
    data: statusCode < 400 ? data : undefined,
    error: statusCode >= 400 ? data : undefined,
  });
};

export const recruiterController = {
  // 1. Get Candidate Database with Filters
  async getCandidateDatabase(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
      }

      const filters = req.query;
      const candidates = await recruiterService.getCandidateDatabase(userId, filters);

      sendResponse(res, 200, candidates);
    } catch (error) {
      next(error);
    }
  },

  // 2. Compare Resumes
  async compareResumes(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
      }

      const { resumeIds } = req.body;

      // Validation
      if (!Array.isArray(resumeIds)) {
        throw new AppError('INVALID_INPUT', 'resumeIds must be an array', 400);
      }
      if (resumeIds.length < 2 || resumeIds.length > 3) {
        throw new AppError('INVALID_INPUT', 'Select 2-3 resumes for comparison', 400);
      }

      const comparison = await recruiterService.compareResumes(userId, resumeIds);
      sendResponse(res, 200, comparison);
    } catch (error) {
      next(error);
    }
  },

  // 3. Match Job Description
  async matchJobDescription(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
      }

      const { jobDescription } = req.body;

      // Validation
      if (!jobDescription || typeof jobDescription !== 'string') {
        throw new AppError('INVALID_INPUT', 'Job description must be a string', 400);
      }
      if (jobDescription.trim().length < 20) {
        throw new AppError('INVALID_INPUT', 'Job description must be at least 20 characters', 400);
      }

      const matches = await recruiterService.matchJobDescription(userId, jobDescription.trim());
      sendResponse(res, 200, matches);
    } catch (error) {
      next(error);
    }
  },

  // 4. Update Candidate Info
  async updateCandidateInfo(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
      }

      const { resumeId } = req.params;
      const { rating, notes, status, candidateName, location } = req.body;

      // Validation
      if (rating !== undefined && (typeof rating !== 'number' || rating < 0 || rating > 5)) {
        throw new AppError('INVALID_INPUT', 'Rating must be between 0-5', 400);
      }

      if (status !== undefined) {
        const validStatuses = ['Applied', 'Screening', 'Interview', 'Offer'];
        if (!validStatuses.includes(status)) {
          throw new AppError('INVALID_INPUT', `Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
        }
      }

      const updated = await recruiterService.updateCandidateInfo(userId, resumeId, {
        rating,
        notes: notes?.trim(),
        status,
        candidateName: candidateName?.trim(),
        location: location?.trim(),
      });

      sendResponse(res, 200, updated);
    } catch (error) {
      next(error);
    }
  },

  // 5. Get Analytics
  async getAnalytics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
      }

      const analytics = await recruiterService.getAnalytics(userId);
      sendResponse(res, 200, analytics);
    } catch (error) {
      next(error);
    }
  },

  // 6. Get Candidate Pipeline
  async getCandidatePipeline(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
      }

      const pipeline = await recruiterService.getCandidatePipeline(userId);
      sendResponse(res, 200, pipeline);
    } catch (error) {
      next(error);
    }
  },

  // 7. Move Candidate Status
  async moveCandidateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
      }

      const { resumeId } = req.params;
      const { newStatus } = req.body;

      // Validation
      const validStatuses = ['Applied', 'Screening', 'Interview', 'Offer'];
      if (!newStatus || !validStatuses.includes(newStatus)) {
        throw new AppError('INVALID_INPUT', `Status must be one of: ${validStatuses.join(', ')}`, 400);
      }

      const updated = await recruiterService.moveCandidateStatus(userId, resumeId, newStatus);
      sendResponse(res, 200, updated);
    } catch (error) {
      next(error);
    }
  },

  // 8. Bulk Update Status
  async bulkUpdateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
      }

      const { resumeIds, status } = req.body;

      // Validation
      if (!Array.isArray(resumeIds) || resumeIds.length === 0) {
        throw new AppError('INVALID_INPUT', 'resumeIds must be a non-empty array', 400);
      }
      // Security: Prevent bulk operations on unlimited records
      if (resumeIds.length > 100) {
        throw new AppError('INVALID_INPUT', 'Maximum 100 resumes can be updated at once', 400);
      }
      if (!status || typeof status !== 'string' || status.trim().length === 0) {
        throw new AppError('INVALID_INPUT', 'Status cannot be empty', 400);
      }

      const result = await recruiterService.bulkUpdateStatus(userId, resumeIds, status.trim());
      sendResponse(res, 200, result);
    } catch (error) {
      next(error);
    }
  },

  // 9. Bulk Add Notes
  async bulkAddNotes(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
      }

      const { resumeIds, notes } = req.body;

      // Validation
      if (!Array.isArray(resumeIds) || resumeIds.length === 0) {
        throw new AppError('INVALID_INPUT', 'resumeIds must be a non-empty array', 400);
      }
      // Security: Prevent bulk operations on unlimited records
      if (resumeIds.length > 100) {
        throw new AppError('INVALID_INPUT', 'Maximum 100 resumes can be updated at once', 400);
      }
      if (!notes || typeof notes !== 'string' || notes.trim().length === 0) {
        throw new AppError('INVALID_INPUT', 'Notes cannot be empty', 400);
      }

      const result = await recruiterService.bulkAddNotes(userId, resumeIds, notes.trim());
      sendResponse(res, 200, result);
    } catch (error) {
      next(error);
    }
  },

  // 10. Bulk Send Email
  async bulkSendEmail(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
      }

      const { resumeIds, subject, message } = req.body;

      // Validation
      if (!Array.isArray(resumeIds) || resumeIds.length === 0) {
        throw new AppError('INVALID_INPUT', 'resumeIds must be a non-empty array', 400);
      }
      // Security: Prevent bulk operations on unlimited records
      if (resumeIds.length > 100) {
        throw new AppError('INVALID_INPUT', 'Maximum 100 resumes can be emailed at once', 400);
      }
      if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
        throw new AppError('INVALID_INPUT', 'Email subject cannot be empty', 400);
      }
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        throw new AppError('INVALID_INPUT', 'Email message cannot be empty', 400);
      }

      const result = await recruiterService.bulkSendEmail(
        userId,
        resumeIds,
        subject.trim(),
        message.trim()
      );
      sendResponse(res, 200, result);
    } catch (error) {
      next(error);
    }
  },

  // 11. Get Candidate Details
  async getCandidateDetails(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
      }

      const { resumeId } = req.params;

      const details = await recruiterService.getCandidateDetails(userId, resumeId);
      sendResponse(res, 200, details);
    } catch (error) {
      next(error);
    }
  },

  // 12. Add Note to Candidate
  async addNote(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
      }

      const { resumeId } = req.params;
      const { note } = req.body;

      // Validation
      if (!note || typeof note !== 'string' || note.trim().length === 0) {
        throw new AppError('INVALID_INPUT', 'Note cannot be empty', 400);
      }

      const result = await recruiterService.addNote(userId, resumeId, note.trim());
      sendResponse(res, 200, result);
    } catch (error) {
      next(error);
    }
  },

  // 13. Get Notes for Candidate
  async getNotes(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
      }

      const { resumeId } = req.params;

      const notes = await recruiterService.getNotes(userId, resumeId);
      sendResponse(res, 200, notes);
    } catch (error) {
      next(error);
    }
  },
};
