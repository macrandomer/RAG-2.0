// File: frontend/src/App.tsx
import React, { useState, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { ChatInterface } from './components/ChatInterface';
import { MessageList } from './components/MessageList';
import { DocumentList } from './components/DocumentList';
import { Document, Message } from './types';
import { getDocuments, deleteDocument, queryDocuments } from './services/api';

function App() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isQuerying, setIsQuerying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const docs = await getDocuments();
      setDocuments(docs);
    } catch (err) {
      console.error('Failed to load documents:', err);
    }
  };

  const handleUploadSuccess = (document: Document) => {
    setDocuments((prev) => [...prev, document]);
    setSuccess(`Document "${document.originalName}" uploaded successfully!`);
    setTimeout(() => setSuccess(null), 3000);
    
    // Reload documents after 2 seconds to get processed status
    setTimeout(loadDocuments, 2000);
  };

  const handleUploadError = (errorMessage: string) => {
    setError(errorMessage);
    setTimeout(() => setError(null), 5000);
  };

  const handleDeleteDocument = async (id: string) => {
    try {
      await deleteDocument(id);
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
      setSuccess('Document deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to delete document');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleSendMessage = async (question: string) => {
    if (documents.length === 0) {
      setError('Please upload a document first');
      setTimeout(() => setError(null), 3000);
      return;
    }

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: question,
      timestamp: new Date()
    };
    setMessages((prev) => [...prev, userMessage]);

    // Add loading message
    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true
    };
    setMessages((prev) => [...prev, loadingMessage]);

    setIsQuerying(true);

    try {
      const response = await queryDocuments(question);
      
      // Remove loading message and add real response
      setMessages((prev) =>
        prev.filter((msg) => !msg.isLoading).concat({
          id: (Date.now() + 2).toString(),
          type: 'assistant',
          content: response.answer,
          timestamp: new Date(),
          sources: response.sources
        })
      );
    } catch (err: any) {
      // Remove loading message and show error
      setMessages((prev) => prev.filter((msg) => !msg.isLoading));
      setError(err.response?.data?.error || 'Failed to get answer');
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsQuerying(false);
    }
  };

  const handleClearConversation = () => {
    setMessages([]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            🤖 AI Document Q&A System
          </h1>
          <p className="text-gray-600 mt-1">
            Upload documents and ask questions powered by local RAG
          </p>
        </div>
      </header>

      {/* Notifications */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      )}
      {success && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Upload & Documents */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Upload Document</h2>
              <FileUpload
                onUploadSuccess={handleUploadSuccess}
                onUploadError={handleUploadError}
              />
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <DocumentList
                documents={documents}
                onDelete={handleDeleteDocument}
              />
            </div>
          </div>

          {/* Right Column - Chat */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Chat</h2>
                {messages.length > 0 && (
                  <button
                    onClick={handleClearConversation}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Clear conversation
                  </button>
                )}
              </div>

              <MessageList messages={messages} />

              <div className="mt-6 pt-6 border-t border-gray-200">
                <ChatInterface
                  onSendMessage={handleSendMessage}
                  disabled={isQuerying || documents.length === 0}
                />
                {documents.length === 0 && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Upload a document to start asking questions
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
