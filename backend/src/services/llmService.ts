// File: backend/src/services/llmService.ts
import { Ollama } from 'ollama';
import { QueryResponse, SourceCitation } from '../types';
import { CONFIG, ERROR_CODES } from '../config/constants';
import logger from '../utils/logger';

export class LLMService {
  private ollama: Ollama;

  constructor() {
    this.ollama = new Ollama({
      host: CONFIG.OLLAMA_BASE_URL
    });
  }

  async generateAnswer(
    question: string,
    sources: SourceCitation[]
  ): Promise<QueryResponse> {
    const startTime = Date.now();
    
    try {
      const context = this.buildContext(sources);
      const prompt = this.buildPrompt(question, context);
      
      logger.debug('Generating answer with LLM');
      
      const response = await Promise.race([
        this.callLLM(prompt),
        this.timeoutPromise(CONFIG.LLM_TIMEOUT)
      ]);
      
      const processingTime = Date.now() - startTime;
      
      logger.info(`Generated answer in ${processingTime}ms`);
      
      return {
        answer: response,
        sources,
        processingTime
      };
    } catch (error) {
      logger.error('LLM generation failed:', error);
      
      if (error instanceof Error && error.message === 'LLM_TIMEOUT') {
        throw new Error(ERROR_CODES.LLM_TIMEOUT);
      }
      
      throw error;
    }
  }

  private buildContext(sources: SourceCitation[]): string {
    return sources
      .map((source, index) => {
        return `[Source ${index + 1}] (${source.filename}, similarity: ${source.similarity.toFixed(2)})\n${source.excerpt}`;
      })
      .join('\n\n');
  }

  private buildPrompt(question: string, context: string): string {
    return `You are a helpful AI assistant that answers questions based on provided document context. Use ONLY the information in the context to answer the question. If the context doesn't contain enough information, say so.

Context:
${context}

Question: ${question}

Provide a detailed, accurate answer based on the context. Include specific references to sources when appropriate (e.g., "According to Source 1..."). Keep your answer concise but informative (max 3-4 paragraphs).

Answer:`;
  }

  private async callLLM(prompt: string): Promise<string> {
    const response = await this.ollama.generate({
      model: CONFIG.LLM_MODEL,
      prompt,
      options: {
        temperature: CONFIG.LLM_TEMPERATURE,
        num_predict: CONFIG.MAX_TOKENS
      },
      stream: false
    });
    
    return response.response;
  }

  private timeoutPromise(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('LLM_TIMEOUT')), ms);
    });
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.ollama.generate({
        model: CONFIG.LLM_MODEL,
        prompt: 'Test',
        options: { num_predict: 5 },
        stream: false
      });
      
      return !!response.response;
    } catch (error) {
      logger.error('LLM health check failed:', error);
      return false;
    }
  }
}
