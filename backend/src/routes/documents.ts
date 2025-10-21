// File: backend/src/routes/documents.ts
import express from 'express';
import { Document } from '../types';
import { EmbeddingService } from '../services/embeddingService';
import { VectorStore } from '../services/vectorStore';
import logger from '../utils/logger';

const router = express.Router();

// GET /api/documents - List all documents
router.get('/', (req, res) => {
  const documents = global.documents || new Map();
  const docArray = Array.from(documents.values());
  
  res.json({
    success: true,
    documents: docArray,
    count: docArray.length
  });
});

// DELETE /api/documents/:id - Delete a document
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const documents = global.documents || new Map();

    if (!documents.has(id)) {
      return res.status(404).json({
        success: false,
        error: 'Document not found',
        code: 'DOCUMENT_NOT_FOUND'
      });
    }

    // Delete from vector store
    const embeddingService = new EmbeddingService();
    const vectorStore = new VectorStore(embeddingService);
    await vectorStore.initialize();
    await vectorStore.deleteChunksByDocumentId(id);

    // Delete from memory
    documents.delete(id);

    logger.info(`Document deleted: ${id}`);

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    next(error);
  }
});

export default router;
