// File: backend/src/services/vectorStore.ts
import { ChromaClient, Collection } from 'chromadb';
import { DocumentChunk, SourceCitation } from '../types';
import { CONFIG, ERROR_CODES } from '../config/constants';
import { EmbeddingService } from './embeddingService';
import logger from '../utils/logger';

export class VectorStore {
  private client: ChromaClient;
  private collection: Collection | null = null;

  constructor(private embeddingService: EmbeddingService) {
    // Use HTTP endpoint for Chroma client-server mode (e.g., http://chroma:8000)
    // Do not pass a filesystem path to the JS client.
    const baseUrl = process.env.CHROMA_URL || 'http://localhost:8000';
    this.client = new ChromaClient({ path: baseUrl });
  }

  async initialize(): Promise<void> {
    try {
      this.collection = await this.client.getOrCreateCollection({
        name: CONFIG.COLLECTION_NAME,
        metadata: { 'hnsw:space': CONFIG.DISTANCE_METRIC }
      });
      logger.info('ChromaDB collection initialized');
    } catch (error) {
      logger.error('ChromaDB initialization failed:', error);
      throw new Error(ERROR_CODES.CHROMADB_ERROR);
    }
  }

  async addChunks(chunks: DocumentChunk[]): Promise<void> {
    if (!this.collection) throw new Error('Collection not initialized');

    try {
      const texts = chunks.map((c) => c.content);
      const embeddings = await this.embeddingService.generateEmbeddings(texts);

      const ids = chunks.map((c) => c.id);
      const metadatas = chunks.map((c) => ({
        documentId: c.metadata.documentId,
        filename: c.metadata.filename,
        chunkIndex: c.metadata.chunkIndex,
        pageNumber: c.metadata.pageNumber ?? 0,
        timestamp: c.metadata.timestamp
      }));

      await this.collection.add({
        ids,
        embeddings,
        documents: texts,
        metadatas
      });

      logger.info(`Added ${chunks.length} chunks to vector store`);
    } catch (error) {
      logger.error('Failed to add chunks to vector store:', error);
      throw error;
    }
  }

  async querySimilar(
    queryText: string,
    topK: number = CONFIG.TOP_K_RETRIEVAL
  ): Promise<SourceCitation[]> {
    if (!this.collection) throw new Error('Collection not initialized');

    try {
      const queryEmbedding = await this.embeddingService.generateEmbedding(queryText);

      const results = await this.collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: topK
      });

      const citations: SourceCitation[] = [];

      if (results.documents && results.documents[0]) {
        for (let i = 0; i < results.documents[0].length; i++) {
          const distance = Number(results.distances?.[0]?.[i]) || 1;
          const similarity = 1 - distance;

          if (similarity >= CONFIG.MIN_SIMILARITY) {
            const metadata = (results.metadatas?.[0]?.[i] as any) || {};

            const documentId = String(metadata.documentId ?? '');
            const filename = String(metadata.filename ?? '');
            const chunkIndex = Number(metadata.chunkIndex ?? 0);
            const pageNumber =
              metadata.pageNumber !== undefined && metadata.pageNumber !== null
                ? Number(metadata.pageNumber)
                : undefined;

            const excerpt = String(results.documents[0][i] ?? '');

            citations.push({
              documentId,
              filename,
              chunkIndex,
              pageNumber,
              similarity,
              excerpt
            });
          }
        }
      }

      if (citations.length === 0) {
        throw new Error(ERROR_CODES.NO_RELEVANT_CONTEXT);
      }

      logger.info(`Found ${citations.length} relevant chunks for query`);
      return citations;
    } catch (error) {
      logger.error('Vector store query failed:', error);
      throw error;
    }
  }

  async deleteChunksByDocumentId(documentId: string): Promise<void> {
    if (!this.collection) throw new Error('Collection not initialized');

    try {
      await this.collection.delete({ where: { documentId } });
      logger.info(`Deleted chunks for document ${documentId}`);
    } catch (error) {
      logger.error(`Failed to delete chunks for document ${documentId}:`, error);
      throw error;
    }
  }

  async getCount(): Promise<number> {
    if (!this.collection) throw new Error('Collection not initialized');

    try {
      return await this.collection.count();
    } catch (error) {
      logger.error('Failed to get collection count:', error);
      return 0;
    }
  }
}
