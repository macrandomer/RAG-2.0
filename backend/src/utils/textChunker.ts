// File: backend/src/utils/textChunker.ts
import { CONFIG } from '../config/constants';
import { DocumentChunk, ChunkMetadata } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class TextChunker {
  private chunkSize: number;
  private chunkOverlap: number;

  constructor(
    chunkSize: number = CONFIG.CHUNK_SIZE,
    chunkOverlap: number = CONFIG.CHUNK_OVERLAP
  ) {
    this.chunkSize = chunkSize;
    this.chunkOverlap = chunkOverlap;
  }

  chunkText(
    text: string,
    documentId: string,
    filename: string
  ): DocumentChunk[] {
    if (!text || text.trim().length === 0) {
      throw new Error('Cannot chunk empty text');
    }

    const normalizedText = text.replace(/\s+/g, ' ').trim();
    const sentences = this.splitIntoSentences(normalizedText);
    
    const chunks: DocumentChunk[] = [];
    let currentChunk: string[] = [];
    let currentLength = 0;
    let chunkIndex = 0;

    for (const sentence of sentences) {
      const sentenceLength = this.estimateTokens(sentence);
      
      if (currentLength + sentenceLength > this.chunkSize && currentChunk.length > 0) {
        chunks.push(this.createChunk(
          currentChunk.join(' '),
          documentId,
          filename,
          chunkIndex,
          chunks.length
        ));
        
        const overlapSentences = this.getOverlapSentences(currentChunk, this.chunkOverlap);
        currentChunk = overlapSentences;
        currentLength = this.estimateTokens(currentChunk.join(' '));
        chunkIndex++;
      }
      
      currentChunk.push(sentence);
      currentLength += sentenceLength;
    }

    if (currentChunk.length > 0) {
      chunks.push(this.createChunk(
        currentChunk.join(' '),
        documentId,
        filename,
        chunkIndex,
        chunks.length
      ));
    }

    return chunks;
  }

  private splitIntoSentences(text: string): string[] {
    return text
      .split(/(?<=[.!?])\s+/)
      .filter(s => s.trim().length > 0);
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  private getOverlapSentences(sentences: string[], overlapTokens: number): string[] {
    const overlap: string[] = [];
    let tokenCount = 0;
    
    for (let i = sentences.length - 1; i >= 0; i--) {
      const sentenceTokens = this.estimateTokens(sentences[i]);
      if (tokenCount + sentenceTokens > overlapTokens) break;
      overlap.unshift(sentences[i]);
      tokenCount += sentenceTokens;
    }
    
    return overlap;
  }

  private createChunk(
    content: string,
    documentId: string,
    filename: string,
    chunkIndex: number,
    totalChunks: number
  ): DocumentChunk {
    const metadata: ChunkMetadata = {
      documentId,
      filename,
      chunkIndex,
      timestamp: new Date().toISOString(),
      totalChunks
    };

    return {
      id: uuidv4(),
      documentId,
      content,
      metadata
    };
  }
}
