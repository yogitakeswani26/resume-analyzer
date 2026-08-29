import { Request, Response } from 'express';
import { analysisService } from './analysis.service.js';

export const analysisController = {
  async analyze(req: any, res: Response) {
    try {
      const { resumeId, jobDescription } = req.body;
      const userId = req.user.userId;

      if (!resumeId || !jobDescription) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_FIELDS',
            message: 'resumeId and jobDescription are required',
          },
        });
      }

      const analysis = await analysisService.analyzeResume(
        userId,
        resumeId,
        jobDescription
      );

      res.status(201).json({
        success: true,
        data: analysis,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          code: error.code || 'ANALYSIS_ERROR',
          message: error.message,
        },
      });
    }
  },

  async list(req: any, res: Response) {
    try {
      const userId = req.user.userId;
      const analyses = await analysisService.getUserAnalyses(userId);

      res.json({
        success: true,
        data: analyses,
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
      const { analysisId } = req.params;
      const userId = req.user.userId;

      const analysis = await analysisService.getAnalysis(analysisId, userId);

      res.json({
        success: true,
        data: analysis,
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

  async getHealth(req: any, res: Response) {
    try {
      const { resumeId } = req.params;
      const userId = req.user.userId;

      const health = await analysisService.getResumeHealth(userId, resumeId);

      res.json({
        success: true,
        data: health,
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

  async analyzeWithAI(req: any, res: Response) {
    try {
      const { resumeId } = req.params;
      const userId = req.user.userId;

      const aiAnalysis = await analysisService.analyzeWithAI(userId, resumeId);

      res.status(200).json({
        success: true,
        data: aiAnalysis,
      });
    } catch (error: any) {
      console.error('AI analysis error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          code: error.code || 'AI_ANALYSIS_ERROR',
          message: error.message || 'Failed to perform AI analysis',
        },
      });
    }
  },

  async generateEnhancedResume(req: any, res: Response) {
    try {
      const { resumeId } = req.params;
      const userId = req.user.userId;

      const enhancedResume = await analysisService.generateEnhancedResume(userId, resumeId);

      res.status(200).json({
        success: true,
        data: enhancedResume,
      });
    } catch (error: any) {
      console.error('Enhanced resume generation error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          code: error.code || 'ENHANCEMENT_ERROR',
          message: error.message || 'Failed to generate enhanced resume',
        },
      });
    }
  },

  async getRecommendations(req: any, res: Response) {
    try {
      const { resumeId } = req.params;
      const userId = req.user.userId;

      const recommendations = await analysisService.getRecommendations(userId, resumeId);

      res.status(200).json({
        success: true,
        data: recommendations,
      });
    } catch (error: any) {
      console.error('Recommendations generation error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          code: error.code || 'RECOMMENDATIONS_ERROR',
          message: error.message || 'Failed to generate recommendations',
        },
      });
    }
  },

  async getSectionAnalysis(req: any, res: Response) {
    try {
      const { resumeId } = req.params;
      const userId = req.user.userId;

      const sectionAnalysis = await analysisService.getSectionAnalysis(userId, resumeId);

      res.status(200).json({
        success: true,
        data: sectionAnalysis,
      });
    } catch (error: any) {
      console.error('Section analysis error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          code: error.code || 'SECTION_ANALYSIS_ERROR',
          message: error.message || 'Failed to generate section analysis',
        },
      });
    }
  },
};
