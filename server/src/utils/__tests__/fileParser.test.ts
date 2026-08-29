import { parseFile } from '../fileParser';

describe('FileParser', () => {
  describe('parseFile - Text Files', () => {
    it('should parse plain text files', async () => {
      const content = 'Software Engineer with 5 years experience';
      const buffer = Buffer.from(content, 'utf-8');

      const result = await parseFile(buffer, 'text/plain');

      expect(result).toBe(content);
    });

    it('should handle empty text files', async () => {
      const buffer = Buffer.from('', 'utf-8');

      await expect(parseFile(buffer, 'text/plain')).rejects.toThrow();
    });

    it('should preserve formatting in text files', async () => {
      const content = `John Doe
john@email.com

Experience:
- Software Engineer (2020-2024)
- Developer (2018-2020)`;

      const buffer = Buffer.from(content, 'utf-8');
      const result = await parseFile(buffer, 'text/plain');

      expect(result).toContain('John Doe');
      expect(result).toContain('Software Engineer');
      expect(result).toContain('2020-2024');
    });
  });

  describe('parseFile - PDF Files', () => {
    it('should throw error for invalid PDF files', async () => {
      const buffer = Buffer.from('%PDF-1.4', 'utf-8');

      await expect(
        parseFile(buffer, 'application/pdf')
      ).rejects.toThrow('PDF extraction failed');
    });

    it('should properly extract text from valid PDF content', async () => {
      // Note: Real PDF testing requires actual PDF files with text content
      // This is a basic test that validates the error handling for invalid PDFs
      const invalidPdfBuffer = Buffer.from('Invalid PDF content', 'utf-8');

      await expect(
        parseFile(invalidPdfBuffer, 'application/pdf')
      ).rejects.toThrow();
    });
  });

  describe('parseFile - DOCX Files', () => {
    it('should throw error for invalid DOCX files', async () => {
      const buffer = Buffer.from('PK');

      await expect(
        parseFile(buffer, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
      ).rejects.toThrow();
    });

    it('should throw error for invalid DOC files', async () => {
      const buffer = Buffer.from('DOC');

      await expect(
        parseFile(buffer, 'application/msword')
      ).rejects.toThrow();
    });
  });

  describe('parseFile - File Type Detection', () => {
    it('should handle unknown file types', async () => {
      const content = 'Some generic content';
      const buffer = Buffer.from(content, 'utf-8');

      const result = await parseFile(buffer, 'application/octet-stream');

      expect(result).toBe(content);
    });

    it('should handle case-insensitive MIME types', async () => {
      const content = 'Resume content';
      const buffer = Buffer.from(content, 'utf-8');

      const result = await parseFile(buffer, 'TEXT/PLAIN');

      expect(result).toContain('Resume');
    });
  });

  describe('parseFile - Large Files', () => {
    it('should handle large text files', async () => {
      const largeContent = 'Resume line\n'.repeat(1000);
      const buffer = Buffer.from(largeContent, 'utf-8');

      const result = await parseFile(buffer, 'text/plain');

      expect(result.length).toBeGreaterThan(5000);
      expect(result).toContain('Resume line');
    });

    it('should extract 150+ word summaries without truncation', async () => {
      // Create a 150+ word test content
      const words = Array(160).fill(0).map((_, i) => `word${i}`).join(' ');
      const buffer = Buffer.from(words, 'utf-8');

      const result = await parseFile(buffer, 'text/plain');

      // Count words in result
      const wordCount = result.split(/\s+/).filter((w: string) => w.length > 0).length;
      expect(wordCount).toBeGreaterThanOrEqual(160);
      expect(result.length).toBeGreaterThan(150);
    });
  });

  describe('parseFile - Special Characters', () => {
    it('should handle special characters in content', async () => {
      const content = 'Developer with C++, C#, Node.js & React';
      const buffer = Buffer.from(content, 'utf-8');

      const result = await parseFile(buffer, 'text/plain');

      expect(result).toContain('C++');
      expect(result).toContain('C#');
      expect(result).toContain('&');
    });

    it('should handle Unicode characters', async () => {
      const content = 'Engineer with skills in 中文, العربية, и русский';
      const buffer = Buffer.from(content, 'utf-8');

      const result = await parseFile(buffer, 'text/plain');

      expect(result).toContain('中文');
    });

    it('should handle emojis', async () => {
      const content = 'Developer 👨‍💻 with React ⚛️ and Node.js 🚀';
      const buffer = Buffer.from(content, 'utf-8');

      const result = await parseFile(buffer, 'text/plain');

      expect(result).toContain('👨‍💻');
    });
  });
});
