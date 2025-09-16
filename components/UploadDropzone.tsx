"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, File, AlertCircle, CheckCircle } from "lucide-react";
import { useTranslation, commonTranslations } from "./LanguageSwitcher";

interface UploadFile {
  file: File;
  id: string;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  error?: string | null;
}

interface UploadDropzoneProps {
  onUpload: (files: File[], folderId?: string | null) => Promise<void>;
  folderId?: string | null;
  maxFileSize?: number; // in bytes
  acceptedFileTypes?: string[];
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
}

function formatFileSize(bytes: number): string {
  const sizes = ["Bytes", "KB", "MB", "GB"];
  if (bytes === 0) return "0 Bytes";

  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
}

function validateFile(
  file: File,
  maxFileSize: number,
  acceptedTypes: string[],
): string | null {
  // Check file size
  if (file.size > maxFileSize) {
    return `File size exceeds ${formatFileSize(maxFileSize)}`;
  }

  // Check file type if restrictions are set
  if (acceptedTypes.length > 0) {
    const isAccepted = acceptedTypes.some((type) => {
      if (type.endsWith("/*")) {
        return file.type.startsWith(type.slice(0, -1));
      }
      return file.type === type;
    });

    if (!isAccepted) {
      return "File type not supported";
    }
  }

  // Check for potentially dangerous files
  const dangerousExtensions = [
    ".exe",
    ".bat",
    ".cmd",
    ".com",
    ".pif",
    ".scr",
    ".vbs",
    ".js",
    ".jar",
    ".ws",
    ".wsf",
    ".wsc",
    ".msi",
    ".msp",
    ".dll",
    ".sys",
    ".scf",
  ];

  const fileName = file.name.toLowerCase();
  const isDangerous = dangerousExtensions.some((ext) => fileName.endsWith(ext));

  if (isDangerous) {
    return "File type blocked for security reasons";
  }

  return null;
}

export default function UploadDropzone({
  onUpload,
  folderId = null,
  // Default client-side max file size (50MB)
  maxFileSize = 50 * 1024 * 1024, // 50MB default
  acceptedFileTypes = [],
  multiple = true,
  disabled = false,
  className = "",
}: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const { t } = useTranslation();
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
    async (files: File[]) => {
      setIsUploading(true);

      try {
        // Update status to uploading
        setUploadFiles((prev) =>
          prev.map((uf) =>
            files.some((f) => f === uf.file)
              ? { ...uf, status: "uploading" as const }
              : uf,
          ),
        );

        await onUpload(files, folderId);

        // Update status to success
        setUploadFiles((prev) =>
          prev.map((uf) =>
            files.some((f) => f === uf.file)
              ? { ...uf, status: "success" as const, progress: 100 }
              : uf,
          ),
        );

        // Clear successful uploads after a delay
        setTimeout(() => {
          setUploadFiles((prev) =>
            prev.filter((uf) => uf.status !== "success"),
          );
        }, 2000);
      } catch (error) {
        console.error("Upload failed:", error);

        // Update status to error
        setUploadFiles((prev) =>
          prev.map((uf) =>
            files.some((f) => f === uf.file)
              ? {
                  ...uf,
                  status: "error" as const,
                  error:
                    error instanceof Error ? error.message : "Upload failed",
                }
              : uf,
          ),
        );
      } finally {
        setIsUploading(false);
      }
    },
    [onUpload, folderId],
  );

  const handleFiles = useCallback(
    (files: File[]) => {
      let filesToProcess = files;
      if (!multiple && files.length > 1) {
        const firstFile = files[0];
        if (firstFile) {
          filesToProcess = [firstFile];
        }
      }

      const newUploadFiles: UploadFile[] = filesToProcess.map((file) => {
        const error = validateFile(file, maxFileSize, acceptedFileTypes);
        return {
          file,
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          status: error ? "error" : "pending",
          progress: 0,
          error,
        };
      });

      setUploadFiles(newUploadFiles);

      // Auto-upload valid files
      const validFiles = newUploadFiles
        .filter((uf) => uf.status === "pending")
        .map((uf) => uf.file);

      if (validFiles.length > 0) {
        handleUpload(validFiles);
      }
    },
    [multiple, maxFileSize, acceptedFileTypes, handleUpload],
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Only set dragging to false if we're leaving the dropzone entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      handleFiles(files);
    },
    [disabled, handleFiles],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const files = Array.from(e.target.files);
        handleFiles(files);
      }
    },
    [handleFiles],
  );

  const removeFile = useCallback((id: string) => {
    setUploadFiles((prev) => prev.filter((uf) => uf.id !== id));
  }, []);

  const retry = useCallback(
    (uploadFile: UploadFile) => {
      if (uploadFile.status === "error") {
        handleUpload([uploadFile.file]);
      }
    },
    [handleUpload],
  );

  const openFileDialog = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Dropzone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={openFileDialog}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${
            isDragging
              ? "border-blue-400 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          onChange={handleFileSelect}
          accept={acceptedFileTypes.join(",")}
          className="hidden"
          disabled={disabled}
        />

        <Upload
          className={`mx-auto h-12 w-12 mb-4 ${
            isDragging ? "text-blue-500" : "text-gray-400"
          }`}
        />

        <div className="space-y-2">
          <p className="text-lg font-medium text-gray-900">
            {isDragging
              ? t("dropFilesHere", {
                  en: "Drop files here",
                  vi: "Thả tệp vào đây",
                })
              : t("upload", commonTranslations.upload)}
          </p>
          <p className="text-sm text-gray-500">
            {isDragging
              ? t("releaseToUpload", {
                  en: "Release to upload",
                  vi: "Thả để tải lên",
                })
              : `${t("dragDropClick", { en: "Drag and drop files here, or click to select", vi: "Kéo thả tệp vào đây, hoặc nhấp để chọn" })}${multiple ? " " + t("files", commonTranslations.files) : " " + t("files", commonTranslations.files)}`}
          </p>

          {maxFileSize && (
            <p className="text-xs text-gray-400">
              {t("maxFileSize", {
                en: "Maximum file size:",
                vi: "Kích thước tối đa:",
              })}{" "}
              {formatFileSize(maxFileSize)}
            </p>
          )}

          {acceptedFileTypes.length > 0 && (
            <p className="text-xs text-gray-400">
              {t("acceptedTypes", {
                en: "Accepted types:",
                vi: "Loại được chấp nhận:",
              })}{" "}
              {acceptedFileTypes.join(", ")}
            </p>
          )}
        </div>
      </div>

      {/* Upload Queue */}
      {uploadFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">
            {t("uploadQueue", { en: "Upload Queue", vi: "Hàng đợi tải lên" })} (
            {uploadFiles.length})
          </h4>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {uploadFiles.map((uploadFile) => (
              <div
                key={uploadFile.id}
                className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg"
              >
                {/* File Icon */}
                <File className="w-5 h-5 text-gray-400 flex-shrink-0" />

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {uploadFile.file.name}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{formatFileSize(uploadFile.file.size)}</span>

                    {uploadFile.status === "uploading" && (
                      <span className="text-blue-600">
                        {t("uploading", {
                          en: "Uploading...",
                          vi: "Đang tải...",
                        })}
                      </span>
                    )}

                    {uploadFile.status === "success" && (
                      <span className="text-green-600">
                        {t("uploaded", { en: "Uploaded", vi: "Đã tải lên" })}
                      </span>
                    )}

                    {uploadFile.status === "error" && (
                      <span className="text-red-600">
                        {uploadFile.error ||
                          t("uploadFailed", {
                            en: "Upload failed",
                            vi: "Tải lên thất bại",
                          })}
                      </span>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {uploadFile.status === "uploading" && (
                    <div className="mt-1 w-full bg-gray-200 rounded-full h-1">
                      <div
                        className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                        style={{ width: `${uploadFile.progress}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Status Icon */}
                <div className="flex-shrink-0">
                  {uploadFile.status === "uploading" && (
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  )}

                  {uploadFile.status === "success" && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}

                  {uploadFile.status === "error" && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => retry(uploadFile)}
                        className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded"
                        disabled={isUploading}
                      >
                        {t("retry", { en: "Retry", vi: "Thử lại" })}
                      </button>
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    </div>
                  )}
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeFile(uploadFile.id)}
                  className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 rounded"
                  disabled={uploadFile.status === "uploading"}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
