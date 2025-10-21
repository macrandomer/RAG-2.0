// File: backend/src/types/index.ts

export interface Document {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
  processedAt?: Date;
  chunkCount?: number;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  metadata: ChunkMetadata;
  embedding?: number[];
}

export interface ChunkMetadata {
  documentId: string;
  filename: string;
  chunkIndex: number;
  pageNumber?: number;
  timestamp: string;
  totalChunks: number;
}

export interface QueryRequest {
  question: string;
  topK?: number;
  minSimilarity?: number;
}

export interface QueryResponse {
  answer: string;
  sources: SourceCitation[];
  processingTime: number;
}

export interface SourceCitation {
  documentId: string;
  filename: string;
  chunkIndex: number;
  pageNumber?: number;
  similarity: number;
  excerpt: string;
}

export interface UploadResponse {
  success: boolean;
  document: Document;
  message: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  code: string;
  details?: any;
}
