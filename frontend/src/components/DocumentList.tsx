// File: frontend/src/components/DocumentList.tsx
import React from 'react';
import { Document } from '../types';

interface DocumentListProps {
  documents: Document[];
  onDelete: (id: string) => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({ documents, onDelete }) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p>No documents uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-gray-700 mb-3">
        Uploaded Documents ({documents.length})
      </h3>
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {doc.originalName}
            </p>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-xs text-gray-500">
                {formatFileSize(doc.size)}
              </p>
              {doc.chunkCount && (
                <p className="text-xs text-gray-500">
                  {doc.chunkCount} chunks
                </p>
              )}
              {doc.processedAt ? (
                <span className="text-xs text-green-600">✓ Processed</span>
              ) : (
                <span className="text-xs text-yellow-600">⏳ Processing...</span>
              )}
            </div>
          </div>
          <button
            onClick={() => onDelete(doc.id)}
            className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded"
            title="Delete document"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
};
