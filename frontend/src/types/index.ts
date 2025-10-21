// File: frontend/src/types/index.ts

export interface Document {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  uploadedAt: string;
  processedAt?: string;
  chunkCount?: number;
}

export interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: Source[];
  isLoading?: boolean;
}

export interface Source {
  documentId: string;
  filename: string;
  chunkIndex: number;
  pageNumber?: number;
  similarity: number;
  excerpt: string;
}

export interface QueryResponse {
  success: boolean;
  answer: string;
  sources: Source[];
  processingTime: number;
}

export interface UploadResponse {
  success: boolean;
  document: Document;
  message: string;
}

export interface DocumentsResponse {
  success: boolean;
  documents: Document[];
  count: number;
}
