// File: backend/src/routes/query.ts
import express from 'express';
import { QueryRequest, QueryResponse } from '../types';
import { EmbeddingService } from '../services/embeddingService';
import { VectorStore } from '../services/vectorStore';
import { LLMService } from '../services/llmService';
import logger from '../utils/logger';

const router = express.Router();

// POST /api/query - Ask a question
router.post('/', async (req, res, next) => {
  const startTime = Date.now();

  try {
    const { question, topK, minSimilarity }: QueryRequest = req.body;

    if (!question || question.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Question is required',
        code: 'MISSING_QUESTION'
      });
    }

    logger.info(`Query received: "${question}"`);

    // Initialize services
    const embeddingService = new EmbeddingService();
    const vectorStore = new VectorStore(embeddingService);
    const llmService = new LLMService();

    await vectorStore.initialize();

    // Search for relevant chunks
    const sources = await vectorStore.querySimilar(question, topK);

    if (sources.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No relevant context found in uploaded documents',
        code: 'NO_RELEVANT_CONTEXT'
      });
    }

    // Generate answer using LLM
    const response: QueryResponse = await llmService.generateAnswer(question, sources);

    logger.info(`Query answered in ${response.processingTime}ms`);

    res.json({
      success: true,
      ...response
    });

  } catch (error: any) {
    logger.error('Query failed:', error);
    next(error);
  }
});

export default router;
