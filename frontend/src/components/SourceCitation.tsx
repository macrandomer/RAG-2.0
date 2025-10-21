// File: frontend/src/components/SourceCitation.tsx
import React, { useState } from 'react';
import { Source } from '../types';

interface SourceCitationProps {
  source: Source;
  index: number;
}

export const SourceCitation: React.FC<SourceCitationProps> = ({ source, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded border border-gray-200 p-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left flex items-center justify-between hover:bg-gray-50 p-1 rounded"
      >
        <div className="flex items-center gap-2">
          <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded">
            [{index}]
          </span>
          <span className="text-sm font-medium text-gray-700 truncate">
            {source.filename}
          </span>
          <span className="text-xs text-gray-500">
            ({Math.round(source.similarity * 100)}% match)
          </span>
        </div>
        <svg
          className={`h-4 w-4 text-gray-400 transition-transform ${
            isExpanded ? 'transform rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      
      {isExpanded && (
        <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
          <p className="italic">"{source.excerpt}"</p>
          <p className="mt-1 text-gray-500">
            Chunk {source.chunkIndex + 1}
            {source.pageNumber && ` • Page ${source.pageNumber}`}
          </p>
        </div>
      )}
    </div>
  );
};
