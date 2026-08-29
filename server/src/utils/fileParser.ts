// FALLBACK: Backend file parser - used if frontend parsing fails
import { PDFParse } from 'pdf-parse';

export const parseFile = async (fileBuffer: Buffer, fileType: string): Promise<string> => {
  try {
    // Normalize MIME type to lowercase
    const normalizedType = (fileType || '').toLowerCase();

    if (normalizedType === 'application/pdf') {
      return await parsePDF(fileBuffer);
    } else if (normalizedType === 'text/plain') {
      const text = fileBuffer.toString('utf-8').trim();
      if (!text || text.length === 0) {
        throw new Error('Text file is empty');
      }
      return text;
    } else if (
      normalizedType === 'application/msword' ||
      normalizedType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      return await parseDOCX(fileBuffer);
    } else {
      // Fallback: treat unknown types as plain text
      const text = fileBuffer.toString('utf-8').trim();
      if (!text || text.length === 0) {
        throw new Error('File is empty or unreadable');
      }
      return text;
    }
  } catch (err: any) {
    throw new Error(`Cannot parse file: ${err.message}`);
  }
};

/**
 * Extract text from PDF with proper structure preservation
 * Captures: headers, body paragraphs, bullet points, and all content
 */
async function parsePDF(fileBuffer: Buffer): Promise<string> {
  try {
    // Create a new PDF parser instance with the buffer
    const parser = new PDFParse({ data: fileBuffer });

    // Call getText() to extract all text content from the PDF
    const result = await parser.getText();

    if (!result || !result.text) {
      throw new Error('PDF contains no readable text');
    }

    // Extract and clean text while preserving structure
    const text = result.text
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0)
      .join('\n')
      .trim();

    // Validate we have meaningful content
    if (!text || text.length < 10) {
      throw new Error('PDF contains no readable text - please ensure the PDF has extractable text content');
    }

    console.log(`[PDF Parser] Extracted ${text.length} characters from ${result.total} pages`);
    return text;
  } catch (err: any) {
    const errorMsg = err.message || 'PDF extraction failed';
    throw new Error(`PDF extraction failed: ${errorMsg}`);
  }
}

async function parseDOCX(fileBuffer: Buffer): Promise<string> {
  try {
    const mammothMod = await import('mammoth');
    const mammoth = (mammothMod as any).default || mammothMod;

    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    const text = (result.value || '')
      .trim()
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0)
      .join('\n');

    // Validate we have meaningful content (consistent with PDF parsing)
    if (!text || text.length < 10) {
      throw new Error('Document contains no readable text - please ensure the document has extractable text content');
    }

    console.log(`[DOCX Parser] Extracted ${text.length} characters from document`);
    return text;
  } catch (err: any) {
    throw new Error(`DOCX extraction failed: ${err.message}`);
  }
}
