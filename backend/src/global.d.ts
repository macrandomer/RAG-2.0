// File: backend/src/global.d.ts
import { Document } from './types';

declare global {
  var documents: Map<string, Document>;
}

export {};
