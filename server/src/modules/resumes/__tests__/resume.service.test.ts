import { resumeService } from '../resume.service';

describe('ResumeService', () => {
  describe('uploadResume', () => {
    it('should be defined', () => {
      expect(resumeService.uploadResume).toBeDefined();
      expect(typeof resumeService.uploadResume).toBe('function');
    });
  });

  describe('getUserResumes', () => {
    it('should be defined', () => {
      expect(resumeService.getUserResumes).toBeDefined();
      expect(typeof resumeService.getUserResumes).toBe('function');
    });
  });

  describe('getResume', () => {
    it('should be defined', () => {
      expect(resumeService.getResume).toBeDefined();
      expect(typeof resumeService.getResume).toBe('function');
    });
  });

  describe('deleteResume', () => {
    it('should be defined', () => {
      expect(resumeService.deleteResume).toBeDefined();
      expect(typeof resumeService.deleteResume).toBe('function');
    });
  });
});
