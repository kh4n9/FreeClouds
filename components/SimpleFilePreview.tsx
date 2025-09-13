"use client";

import { useState, useEffect } from "react";
import { X, Download, Eye } from "lucide-react";
import { formatFileSize, formatDate } from "@/lib/file-utils";

interface FileData {
  id: string;
  name: string;
  size: number;
  mime: string;
  folderId: string | null;
  folderName?: string | null;
  createdAt: string;
}

interface SimpleFilePreviewProps {
  file: FileData | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (fileId: string, fileName: string) => void;
}

export default function SimpleFilePreview({ file, isOpen, onClose, onDownload }: SimpleFilePreviewProps) {
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  console.log('SimpleFilePreview render:', {
    fileId: file?.id,
    isOpen,
    loading,
    hasContent: !!fileContent
  });

  useEffect(() => {
    console.log('Effect triggered:', { fileId: file?.id, isOpen });

    if (!file || !isOpen) {
      console.log('Resetting state');
      setFileContent(null);
      setError(null);
      setLoading(false);
      return;
    }

    let isCancelled = false;

    const loadFile = async () => {
      console.log('Starting to load file:', file.name);
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/files/${file.id}/download`);
        if (!response.ok) {
          throw new Error('Failed to load file');
        }

        if (isCancelled) return;

        if (file.mime.startsWith('image/')) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          console.log('Created image blob URL:', url);
          setFileContent(url);
        } else if (file.mime.startsWith('text/') && file.size < 1024 * 1024) {
          const text = await response.text();
          console.log('Loaded text content');
          setFileContent(text);
        } else {
          console.log('File type not supported for preview');
          setFileContent(null);
        }
      } catch (err) {
        console.error('Error loading file:', err);
        if (!isCancelled) {
          setError('Failed to load file');
        }
      } finally {
        if (!isCancelled) {
          console.log('Loading completed');
          setLoading(false);
        }
      }
    };

    loadFile();

    return () => {
      console.log('Cleanup triggered');
      isCancelled = true;
    };
  }, [file?.id, isOpen]);

  // Cleanup blob URLs
  useEffect(() => {
    return () => {
      if (fileContent && typeof fileContent === 'string' && fileContent.startsWith('blob:')) {
        console.log('Cleaning up blob URL:', fileContent);
        URL.revokeObjectURL(fileContent);
      }
    };
  }, [fileContent]);

  const handleDownload = () => {
    if (file) {
      onDownload(file.id, file.name);
    }
  };

  if (!isOpen || !file) {
    return null;
  }

  const isImage = file.mime.startsWith('image/');
  const isText = file.mime.startsWith('text/');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="relative w-full h-full max-w-4xl max-h-full bg-white rounded-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold text-gray-900 truncate" title={file.name}>
                {file.name}
              </h3>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>{file.mime}</span>
                <span>{formatFileSize(file.size)}</span>
                <span>{formatDate(file.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-gray-100">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading file content...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-red-600">
                <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Preview not available</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && fileContent && isImage && (
            <div className="flex items-center justify-center h-full p-4">
              <img
                src={fileContent}
                alt={file.name}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          )}

          {!loading && !error && fileContent && isText && (
            <div className="h-full">
              <pre className="h-full p-6 text-sm text-gray-800 bg-white font-mono whitespace-pre-wrap overflow-auto">
                {fileContent}
              </pre>
            </div>
          )}

          {!loading && !error && !fileContent && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <Eye className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Preview not available</p>
                <p className="text-sm mb-4">
                  This file type cannot be previewed in the browser
                </p>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
                >
                  <Download className="w-4 h-4" />
                  Download to view
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {file.folderName && (
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Location: <span className="font-medium">{file.folderName}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
