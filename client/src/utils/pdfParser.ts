// PDF Parser - Exact copy from Project 1 but ALSO extract text
let pdfjsLib: any = null;
let isLoading = false;
let loadPromise: Promise<any> | null = null;

async function loadPdfJs(): Promise<any> {
  if (pdfjsLib) return pdfjsLib;
  if (loadPromise) return loadPromise;

  isLoading = true;
  // @ts-expect-error - pdfjs-dist/build/pdf.mjs is not a module
  loadPromise = import('pdfjs-dist/build/pdf.mjs').then((lib: any) => {
    // Set the worker source to use local file (like Project 1!)
    lib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    pdfjsLib = lib;
    isLoading = false;
    return lib;
  });

  return loadPromise;
}

export async function extractTextFromFile(file: File): Promise<string> {
  try {
    console.log(`[PDF Parser] Starting to parse file: ${file.name} (${file.type})`);

    let result: string;

    if (file.type === 'application/pdf') {
      console.log('[PDF Parser] Extracting text from PDF...');
      result = await extractTextFromPDF(file);
    } else if (file.type === 'text/plain') {
      console.log('[PDF Parser] Reading text file...');
      result = await file.text();
    } else if (
      file.type === 'application/msword' ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      console.log('[PDF Parser] Extracting text from DOCX...');
      result = await extractTextFromDOCX(file);
    } else {
      throw new Error(`Unsupported file type: ${file.type}`);
    }

    console.log(`[PDF Parser] Successfully extracted ${result.length} characters`);
    return result;
  } catch (error: any) {
    console.error('[PDF Parser] Error:', error);
    // If frontend parsing fails, send empty string so backend can parse
    // This makes the flow more resilient
    console.warn('[PDF Parser] Frontend parsing failed, backend will attempt to parse');
    return '';
  }
}

async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const lib = await loadPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await lib.getDocument({ data: arrayBuffer }).promise;

    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();

      // Group text items by Y position to preserve line structure
      const itemsByY: { [key: number]: Array<{ str: string; x: number }> } = {};

      textContent.items.forEach((item: any) => {
        if (item.str && item.str.trim()) {
          const y = Math.round(item.y);
          if (!itemsByY[y]) {
            itemsByY[y] = [];
          }
          itemsByY[y].push({
            str: item.str,
            x: item.x || 0
          });
        }
      });

      // Sort by Y position (descending) to maintain document order
      const sortedYPositions = Object.keys(itemsByY)
        .map(Number)
        .sort((a, b) => b - a);

      // Join text items on same line, and lines with proper spacing
      const pageText = sortedYPositions
        .map(y => {
          const lineItems = itemsByY[y]
            .sort((a, b) => a.x - b.x)
            .map(item => item.str)
            .join(' ');
          return lineItems.trim();
        })
        .filter(line => line.length > 0)
        .join('\n');

      fullText += pageText;

      // Add spacing between pages
      if (i < pdf.numPages) {
        fullText += '\n\n';
      }
    }

    const text = fullText
      .trim()
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0)
      .join('\n');

    if (!text || text.length < 10) {
      throw new Error('PDF contains no readable text');
    }

    console.log(`[PDF Parser] Successfully extracted ${text.length} characters from ${pdf.numPages} page(s)`);
    return text;
  } catch (error: any) {
    throw new Error(`Failed to parse PDF: ${error.message}`);
  }
}

async function extractTextFromDOCX(file: File): Promise<string> {
  try {
    const { default: mammoth } = await import('mammoth');
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });

    const text = (result.value || '')
      .trim()
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0)
      .join('\n');

    // Validate we have meaningful content (consistent with PDF parsing)
    if (!text || text.length < 10) {
      throw new Error('Document contains no readable text');
    }

    console.log(`[DOCX Parser] Successfully extracted ${text.length} characters from document`);
    return text;
  } catch (error: any) {
    throw new Error(`Failed to parse DOCX: ${error.message}`);
  }
}
