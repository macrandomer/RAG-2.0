// File: backend/src/config/constants.ts

export const CONFIG = {
  // Server
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // File Upload
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_MIME_TYPES: [
    'application/pdf',
    'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  UPLOAD_DIR: './uploads',

  // RAG Pipeline (tuned for 1B demo model)
  CHUNK_SIZE: 600,            // smaller chunks help smaller models focus
  CHUNK_OVERLAP: 120,         // retain context continuity
  TOP_K_RETRIEVAL: 3,         // fewer, stronger chunks reduce prompt size
  MIN_SIMILARITY: 0.75,       // stricter to reduce noisy context

  // LLM
  OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  LLM_MODEL: 'llama3.2:1b',   // demo-friendly 1B model
  EMBEDDING_MODEL: 'nomic-embed-text',
  LLM_TEMPERATURE: 0.3,
  MAX_TOKENS: 350,            // tighter budget -> faster responses
  LLM_TIMEOUT: 30000,         // 30 seconds

  // ChromaDB
  CHROMA_PATH: process.env.CHROMA_PATH || './chroma_db',
  COLLECTION_NAME: 'documents',
  DISTANCE_METRIC: 'cosine',

  // Rate Limiting
  RATE_LIMIT_WINDOW: 15 * 60 * 1000,
  RATE_LIMIT_MAX_REQUESTS: 100,
};

export const ERROR_CODES = {
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  UNSUPPORTED_FORMAT: 'UNSUPPORTED_FORMAT',
  EMPTY_DOCUMENT: 'EMPTY_DOCUMENT',
  INVALID_INPUT: 'INVALID_INPUT',
  OLLAMA_NOT_RUNNING: 'OLLAMA_NOT_RUNNING',
  CHROMADB_ERROR: 'CHROMADB_ERROR',
  NO_RELEVANT_CONTEXT: 'NO_RELEVANT_CONTEXT',
  LLM_TIMEOUT: 'LLM_TIMEOUT',
  PROCESSING_ERROR: 'PROCESSING_ERROR',
};
