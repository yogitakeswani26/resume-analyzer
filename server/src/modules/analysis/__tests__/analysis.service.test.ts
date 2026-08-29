import { analysisService } from '../analysis.service';

describe('AnalysisService', () => {
  describe('analyzeResume', () => {
    it('should be defined', () => {
      expect(analysisService.analyzeResume).toBeDefined();
      expect(typeof analysisService.analyzeResume).toBe('function');
    });
  });

  describe('getUserAnalyses', () => {
    it('should be defined', () => {
      expect(analysisService.getUserAnalyses).toBeDefined();
      expect(typeof analysisService.getUserAnalyses).toBe('function');
    });
  });

  describe('getAnalysis', () => {
    it('should be defined', () => {
      expect(analysisService.getAnalysis).toBeDefined();
      expect(typeof analysisService.getAnalysis).toBe('function');
    });
  });

  describe('getResumeHealth', () => {
    it('should be defined', () => {
      expect(analysisService.getResumeHealth).toBeDefined();
      expect(typeof analysisService.getResumeHealth).toBe('function');
    });
  });
});
