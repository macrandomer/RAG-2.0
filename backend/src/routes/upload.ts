// File: backend/src/routes/upload.ts
import express from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { DocumentProcessor } from '../services/documentProcessor';
import { EmbeddingService } from '../services/embeddingService';
import { VectorStore } from '../services/vectorStore';
import { Document } from '../types';
import { CONFIG, ERROR_CODES } from '../config/constants';
import logger from '../utils/logger';

const router = express.Router();
const upload = multer({ dest: CONFIG.UPLOAD_DIR });

// POST /api/upload
router.post(
  '/',
  upload.single('file'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, error: 'No file uploaded', code: ERROR_CODES.EMPTY_DOCUMENT });
      }

      // Create document record
      const document: Document = {
        id: uuidv4(),
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
        uploadedAt: new Date(),
      };

      // Process document into chunks
      const processor = new DocumentProcessor();
      const chunks = await processor.processDocument(req.file, document);

      // Initialize vector store and add chunks
      const embeddingService = new EmbeddingService();
      const vectorStore = new VectorStore(embeddingService);
      await vectorStore.initialize();
      await vectorStore.addChunks(chunks);

      // Update document metadata
      document.processedAt = new Date();
      document.chunkCount = chunks.length;

      // Clean up uploaded file
      await processor.cleanupFile(req.file.path);

      // Respond with success and document info
      return res.json({ success: true, document, message: 'File processed successfully' });
    } catch (error) {
      logger.error('Upload processing error:', error);
      return next(error);
    }
  }
);

export default router;
