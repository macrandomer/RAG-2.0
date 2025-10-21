/// <reference path="./global.d.ts" />
// File: backend/src/server.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { CONFIG } from './config/constants';
import logger from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { limiter } from './middleware/rateLimiter';
import { validateQuery } from './middleware/validator';

// Import routes
import uploadRouter from './routes/upload';
import queryRouter from './routes/query';
import documentsRouter from './routes/documents';

dotenv.config();

const app = express();
const PORT = CONFIG.PORT;

// Narrow globalThis to include our documents map (resolves TS7017)
type DocType = import('./types').Document;
const globalWithDocs = globalThis as typeof globalThis & {
  documents?: Map<string, DocType>;
};

// Ensure required directories exist
const dirs = [CONFIG.UPLOAD_DIR, CONFIG.CHROMA_PATH, 'logs'];
dirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    logger.info(`Created directory: ${dir}`);
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(limiter);

// Health check route
app.get('/api/health', async (req, res) => {
  try {
    // Check Ollama connection
    const { EmbeddingService } = await import('./services/embeddingService');
    const { LLMService } = await import('./services/llmService');

    const embeddingService = new EmbeddingService();
    const llmService = new LLMService();

    const ollamaHealthy = await embeddingService.healthCheck();
    const llmHealthy = await llmService.healthCheck();

    const documents = globalWithDocs.documents || new Map<string, DocType>();

    res.json({
      status: ollamaHealthy && llmHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      service: 'ai-document-qa-backend',
      checks: {
        ollama: ollamaHealthy ? 'connected' : 'disconnected',
        llm: llmHealthy ? 'ready' : 'not ready',
        documents: documents.size,
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Service check failed',
    });
  }
});

// API Routes
app.use('/api/upload', uploadRouter);
app.use('/api/query', validateQuery, queryRouter);
app.use('/api/documents', documentsRouter);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'AI Document QA API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/health',
      upload: 'POST /api/upload',
      query: 'POST /api/query',
      documents: 'GET /api/documents',
      deleteDocument: 'DELETE /api/documents/:id',
    },
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📊 Health check: http://localhost:${PORT}/api/health`);
  logger.info(`🔧 Environment: ${CONFIG.NODE_ENV}`);
  logger.info(`🤖 LLM Model: ${CONFIG.LLM_MODEL}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});
