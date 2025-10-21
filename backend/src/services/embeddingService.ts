// File: backend/src/services/embeddingService.ts
import { Ollama } from 'ollama';
import { CONFIG, ERROR_CODES } from '../config/constants';
import logger from '../utils/logger';

export class EmbeddingService {
  private ollama: Ollama;

  constructor() {
    this.ollama = new Ollama({
      host: CONFIG.OLLAMA_BASE_URL
    });
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.ollama.embeddings({
        model: CONFIG.EMBEDDING_MODEL,
        prompt: text
      });
      
      return response.embedding;
    } catch (error) {
      logger.error('Embedding generation failed:', error);
      throw new Error(ERROR_CODES.OLLAMA_NOT_RUNNING);
    }
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const embeddings: number[][] = [];
      
      const batchSize = 10;
      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        const batchEmbeddings = await Promise.all(
          batch.map(text => this.generateEmbedding(text))
        );
        embeddings.push(...batchEmbeddings);
        
        logger.debug(`Generated embeddings for batch ${i / batchSize + 1}`);
      }
      
      return embeddings;
    } catch (error) {
      logger.error('Batch embedding generation failed:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.ollama.list();
      return true;
    } catch (error) {
      logger.error('Ollama health check failed:', error);
      return false;
    }
  }
}
