// File: backend/src/middleware/validator.ts
import { Request, Response, NextFunction } from 'express';

export const validateQuery = (req: Request, res: Response, next: NextFunction) => {
  const { question } = req.body;

  if (!question || typeof question !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Question must be a non-empty string',
      code: 'INVALID_QUESTION'
    });
  }

  if (question.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Question cannot be empty',
      code: 'EMPTY_QUESTION'
    });
  }

  if (question.length > 1000) {
    return res.status(400).json({
      success: false,
      error: 'Question is too long (max 1000 characters)',
      code: 'QUESTION_TOO_LONG'
    });
  }

  next();
};
