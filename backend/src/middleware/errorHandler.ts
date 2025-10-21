// File: backend/src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { ERROR_CODES } from '../config/constants';
import logger from '../utils/logger';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Error:', err);

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error: 'File size exceeds 10MB limit',
      code: ERROR_CODES.FILE_TOO_LARGE
    });
  }

  // Custom error codes
  if (Object.values(ERROR_CODES).includes(err.message)) {
    const statusCode = err.message === ERROR_CODES.NO_RELEVANT_CONTEXT ? 404 : 500;
    return res.status(statusCode).json({
      success: false,
      error: getErrorMessage(err.message),
      code: err.message
    });
  }

  // Default error
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    code: ERROR_CODES.PROCESSING_ERROR,
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

function getErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    [ERROR_CODES.FILE_TOO_LARGE]: 'File size exceeds 10MB limit',
    [ERROR_CODES.UNSUPPORTED_FORMAT]: 'File format not supported. Use PDF, TXT, or DOCX',
    [ERROR_CODES.EMPTY_DOCUMENT]: 'Document contains no text',
    [ERROR_CODES.OLLAMA_NOT_RUNNING]: 'AI service is not available',
    [ERROR_CODES.CHROMADB_ERROR]: 'Vector database error',
    [ERROR_CODES.NO_RELEVANT_CONTEXT]: 'No relevant information found',
    [ERROR_CODES.LLM_TIMEOUT]: 'AI processing timeout',
    [ERROR_CODES.PROCESSING_ERROR]: 'Processing error'
  };
  return messages[code] || 'Unknown error';
}
