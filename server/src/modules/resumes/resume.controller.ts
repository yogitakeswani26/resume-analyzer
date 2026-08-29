import { Request, Response } from 'express';
import { resumeService } from './resume.service.js';
import { parseFile } from '../../utils/fileParser.js';

export const resumeController = {
  async upload(req: any, res: Response) {
    try {
      const { fileName, fileUrl, content } = req.body;
      const userId = req.user.userId;

      const resume = await resumeService.uploadResume(
        userId,
        fileName,
        fileUrl,
        content
      );

      res.status(201).json({
        success: true,
        data: resume,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          code: error.code || 'UPLOAD_ERROR',
          message: error.message,
        },
      });
    }
  },

  async uploadFile(req: any, res: Response) {
    try {
      const userId = req.user.userId;
      const file = (req as any).file;
      let content = req.body?.content || '';

      if (!file) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'NO_FILE',
            message: 'No file provided',
          },
        });
      }

      // If no content from frontend, extract from file as fallback
      if (!content || content.length === 0) {
        try {
          // Fallback: parse file content in backend
          const { parseFile } = await import('../../utils/fileParser.js');
          content = await parseFile(file.buffer, file.mimetype);
        } catch (parseError: any) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'PARSE_ERROR',
              message: `Could not parse file: ${parseError.message}`,
            },
          });
        }
      }

      // Validate content
      if (!content || content.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'EMPTY_CONTENT',
            message: 'File contains no readable content',
          },
        });
      }

      // Upload resume with extracted content
      const resume = await resumeService.uploadResume(
        userId,
        file.originalname,
        `uploaded_${Date.now()}_${file.originalname}`,
        content
      );

      res.status(201).json({
        success: true,
        data: resume,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          code: error.code || 'UPLOAD_ERROR',
          message: error.message || 'File upload failed',
        },
      });
    }
  },

  async list(req: any, res: Response) {
    try {
      const userId = req.user.userId;
      const resumes = await resumeService.getUserResumes(userId);

      res.json({
        success: true,
        data: resumes,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          code: error.code || 'FETCH_ERROR',
          message: error.message,
        },
      });
    }
  },

  async get(req: any, res: Response) {
    try {
      const { resumeId } = req.params;
      const userId = req.user.userId;

      const resume = await resumeService.getResume(resumeId, userId);

      res.json({
        success: true,
        data: resume,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          code: error.code || 'FETCH_ERROR',
          message: error.message,
        },
      });
    }
  },

  async delete(req: any, res: Response) {
    try {
      const { resumeId } = req.params;
      const userId = req.user.userId;

      await resumeService.deleteResume(resumeId, userId);

      res.json({
        success: true,
        data: { message: 'Resume deleted successfully' },
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          code: error.code || 'DELETE_ERROR',
          message: error.message,
        },
      });
    }
  },

  async deduplicate(req: any, res: Response) {
    try {
      const result = await resumeService.deduplicateResumes();

      res.json({
        success: true,
        data: {
          message: `Deleted ${result.deleted} duplicate resumes. Remaining: ${result.remaining}`,
          deleted: result.deleted,
          remaining: result.remaining,
          total: result.total,
        },
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          code: error.code || 'DEDUPLICATE_ERROR',
          message: error.message,
        },
      });
    }
  },

  async updateExisting(req: any, res: Response) {
    try {
      const result = await resumeService.updateExistingResumes();

      res.json({
        success: true,
        data: {
          message: `Updated ${result.updated} resumes with extracted data`,
          updated: result.updated,
        },
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          code: error.code || 'UPDATE_ERROR',
          message: error.message,
        },
      });
    }
  },
};
