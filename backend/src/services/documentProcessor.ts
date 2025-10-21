// File: backend/src/services/documentProcessor.ts
import fs from 'fs/promises';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import { Document, DocumentChunk } from '../types';
import { TextChunker } from '../utils/textChunker';
import { CONFIG, ERROR_CODES } from '../config/constants';
import logger from '../utils/logger';

export class DocumentProcessor {
  private textChunker: TextChunker;

  constructor() {
    this.textChunker = new TextChunker();
  }

  async processDocument(
    file: Express.Multer.File,
    document: Document
  ): Promise<DocumentChunk[]> {
    try {
      logger.info(`Processing document: ${document.filename}`);
      
      const text = await this.extractText(file);
      
      if (!text || text.trim().length === 0) {
        throw new Error(ERROR_CODES.EMPTY_DOCUMENT);
      }
      
      const chunks = this.textChunker.chunkText(
        text,
        document.id,
        document.originalName
      );
      
      logger.info(`Created ${chunks.length} chunks from ${document.filename}`);
      
      return chunks;
    } catch (error) {
      logger.error(`Error processing document ${document.filename}:`, error);
      throw error;
    }
  }

  private async extractText(file: Express.Multer.File): Promise<string> {
    const buffer = await fs.readFile(file.path);
    
    switch (file.mimetype) {
      case 'application/pdf':
        return await this.extractFromPDF(buffer);
      
      case 'text/plain':
        return buffer.toString('utf-8');
      
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return await this.extractFromDOCX(buffer);
      
      default:
        throw new Error(ERROR_CODES.UNSUPPORTED_FORMAT);
    }
  }

  private async extractFromPDF(buffer: Buffer): Promise<string> {
    try {
      const data = await pdf(buffer);
      return data.text;
    } catch (error) {
      logger.error('PDF extraction failed:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  private async extractFromDOCX(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      logger.error('DOCX extraction failed:', error);
      throw new Error('Failed to extract text from DOCX');
    }
  }

  async cleanupFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
      logger.debug(`Cleaned up file: ${filePath}`);
    } catch (error) {
      logger.warn(`Failed to cleanup file ${filePath}:`, error);
    }
  }
}
