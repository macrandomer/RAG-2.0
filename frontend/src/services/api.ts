// File: frontend/src/services/api.ts
import axios from 'axios';
import { Document, QueryResponse, UploadResponse, DocumentsResponse } from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const uploadDocument = async (file: File): Promise<Document> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post<UploadResponse>('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  
  return response.data.document;
};

export const getDocuments = async (): Promise<Document[]> => {
  const response = await api.get<DocumentsResponse>('/documents');
  return response.data.documents;
};

export const deleteDocument = async (documentId: string): Promise<void> => {
  await api.delete(`/documents/${documentId}`);
};

export const queryDocuments = async (question: string): Promise<QueryResponse> => {
  const response = await api.post<QueryResponse>('/query', { question });
  return response.data;
};

export const healthCheck = async (): Promise<{ status: string; checks?: any }> => {
  const response = await api.get<{ status: string; checks?: any }>('/health');
  return response.data;
};
