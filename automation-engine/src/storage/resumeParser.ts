/**
 * resumeParser.ts — server-side text extraction for uploaded resume files.
 *
 * Supports: PDF (.pdf) via pdf-parse, DOCX (.docx) via mammoth.
 * Returns plain text suitable for passing to the brain-engine as resume_content.
 */

import { createRequire } from 'module';
import path from 'path';
import mammoth from 'mammoth';

const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

export async function extractResumeText(buffer: Buffer, filename: string): Promise<string> {
  const ext = path.extname(filename).toLowerCase();

  if (ext === '.pdf') {
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result.text.trim();
    } finally {
      await parser.destroy();
    }
  }

  if (ext === '.docx') {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  }

  throw new Error(`Unsupported file type "${ext}". Please upload a PDF or DOCX file.`);
}
