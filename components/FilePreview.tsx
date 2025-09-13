"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Eye,
  FileText,
  Code,
  Music,
  Video,
  Image as ImageIcon,
  File,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  ExternalLink,
} from "lucide-react";
import { getFileTypeInfo, formatFileSize, formatDate } from "@/lib/file-utils";
import { getPreviewCapability, canPreviewFile, isSecureForPreview, isPreviewSizeLimitExceeded, formatPreviewSizeLimit } from "@/lib/file-preview-utils";
import {
  ArchivePreview,
  Model3DPreview,
  DataPreview,
  FontPreview,
  ExecutablePreview,
  SpreadsheetPreview,
  CADPreview,
  EmailPreview,
  CalendarPreview,
} from "./preview/SpecializedPreviews";

interface FileData {
  id: string;
  name: string;
  size: number;
  mime: string;
  folderId: string | null;
  folderName?: string | null;
  createdAt: string;
}

interface FilePreviewProps {
  file: FileData | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (fileId: string, fileName: string) => void;
}

export default function FilePreview({ file, isOpen, onClose, onDownload }: FilePreviewProps) {
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [pdfPage, setPdfPage] = useState(1);
  const [pdfTotalPages, setPdfTotalPages] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [securityWarning, setSecurityWarning] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const pdfViewerRef = useRef<HTMLIFrameElement>(null);

  const fileInfo = useMemo(() =>
    file ? getFileTypeInfo(file.name, file.mime) : null,
    [file?.name, file?.mime]
  );

  const previewCapability = useMemo(() =>
    file ? getPreviewCapability(file.name, file.mime) : null,
    [file?.name, file?.mime]
  );

  const isImage = useMemo(() => file?.mime.startsWith('image/') || false, [file?.mime]);
  const isText = useMemo(() => file?.mime.startsWith('text/') || fileInfo?.category === 'code' || fileInfo?.category === 'data' || false, [file?.mime, fileInfo?.category]);
  const isVideo = useMemo(() => file?.mime.startsWith('video/') || false, [file?.mime]);
  const isAudio = useMemo(() => file?.mime.startsWith('audio/') || false, [file?.mime]);
  const isPDF = useMemo(() => file?.mime.includes('pdf') || false, [file?.mime]);
  const isOffice = useMemo(() => file?.mime.includes('word') || file?.mime.includes('powerpoint') || file?.mime.includes('presentation') || false, [file?.mime]);
  const isSpreadsheet = useMemo(() => file?.mime.includes('excel') || file?.mime.includes('sheet') || file?.name.toLowerCase().match(/\.(xlsx|xls|ods)$/) || false, [file?.mime, file?.name]);
  const isArchive = useMemo(() => file?.mime.includes('zip') || file?.mime.includes('rar') || file?.mime.includes('7z') || file?.mime.includes('tar') || file?.mime.includes('gzip') || file?.name.toLowerCase().match(/\.(zip|rar|7z|tar|gz|bz2)$/) || false, [file?.mime, file?.name]);
  const is3DModel = useMemo(() => file?.mime.includes('model/') || file?.name.toLowerCase().match(/\.(obj|stl|ply|gltf|glb|fbx|dae|3ds)$/) || false, [file?.mime, file?.name]);
  const isFont = useMemo(() => file?.mime.includes('font/') || file?.name.toLowerCase().match(/\.(ttf|otf|woff|woff2|eot)$/) || false, [file?.mime, file?.name]);
  const isExecutable = useMemo(() => file?.mime.includes('application/x-msdownload') || file?.mime.includes('application/x-executable') || file?.mime.includes('application/java-archive') || file?.name.toLowerCase().match(/\.(exe|msi|deb|rpm|dmg|pkg|jar|app)$/) || false, [file?.mime, file?.name]);
  const isCAD = useMemo(() => file?.mime.includes('application/acad') || file?.mime.includes('application/dxf') || file?.mime.includes('application/step') || file?.name.toLowerCase().match(/\.(dwg|dxf|step|stp|iges|igs)$/) || false, [file?.mime, file?.name]);
  const isData = useMemo(() => (file?.mime.includes('csv') || file?.mime.includes('json') || file?.mime.includes('xml') || file?.name.toLowerCase().match(/\.(csv|json|xml|yaml|yml)$/)) && !isText || false, [file?.mime, file?.name, isText]);
  const isEmail = useMemo(() => file?.mime.includes('message/') || file?.name.toLowerCase().match(/\.(eml|msg|mbox)$/) || false, [file?.mime, file?.name]);
  const isCalendar = useMemo(() => file?.name.toLowerCase().match(/\.(ics|vcs|vcf)$/) || false, [file?.name]);

  useEffect(() => {
    if (!file || !isOpen) {
      setFileContent(null);
      setError(null);
      setZoom(100);
      setRotation(0);
      setPdfPage(1);
      setPdfTotalPages(1);
      setIsFullscreen(false);
      setIsPlaying(false);
      setIsMuted(false);
      setSecurityWarning(null);
      return;
    }

    if (loading) return; // Prevent multiple simultaneous loads

    let isCancelled = false;

    const loadFileContent = async () => {
      setLoading(true);
      setError(null);
      setSecurityWarning(null);

      // Security check
      if (!isSecureForPreview(file.name, file.mime)) {
        if (!isCancelled) {
          setSecurityWarning('This file type may contain executable code and cannot be previewed for security reasons.');
          setLoading(false);
        }
        return;
      }

      // Size check
      if (isPreviewSizeLimitExceeded(file.name, file.size, file.mime)) {
        if (!isCancelled) {
          const maxSize = formatPreviewSizeLimit(previewCapability?.maxPreviewSize || 0);
          setError(`File is too large for preview. Maximum size: ${maxSize}`);
          setLoading(false);
        }
        return;
      }

      // Preview capability check
      if (!canPreviewFile(file.name, file.size, file.mime)) {
        if (!isCancelled) {
          setError('This file type cannot be previewed');
          setLoading(false);
        }
        return;
      }

      try {
        const response = await fetch(`/api/files/${file.id}/download`);
        if (!response.ok) {
          throw new Error('Failed to load file');
        }

        if (isCancelled) return;

        if (isImage || isVideo || isAudio || isPDF) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          if (!isCancelled) {
            setFileContent(url);
          } else {
            URL.revokeObjectURL(url);
          }
        } else if ((isText || isData || isEmail || isCalendar) && file.size < 5 * 1024 * 1024) {
          const text = await response.text();
          if (!isCancelled) {
            setFileContent(text);
          }
        } else {
          if (!isCancelled) {
            setFileContent(null);
          }
        }
      } catch (err) {
        console.error('Error loading file content:', err);
        if (!isCancelled) {
          setError('Failed to load file content');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadFileContent();

    return () => {
      isCancelled = true;
      // Cleanup any existing blob URLs
      if (fileContent && typeof fileContent === 'string' && fileContent.startsWith('blob:')) {
        URL.revokeObjectURL(fileContent);
      }
    };
  }, [file?.id, isOpen]);

  const handleDownload = useCallback(() => {
    if (file) {
      onDownload(file.id, file.name);
    }
  }, [file?.id, file?.name, onDownload]);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 25, 300));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 25, 25));
  }, []);

  const handleRotate = useCallback(() => {
    setRotation(prev => (prev + 90) % 360);
  }, []);

  const resetView = useCallback(() => {
    setZoom(100);
    setRotation(0);
  }, []);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  const togglePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
    if (audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play();
        setIsPlaying(true);
      } else {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
      setIsMuted(audioRef.current.muted);
    }
  }, []);

  const handlePdfPageChange = useCallback((direction: 'prev' | 'next') => {
    if (direction === 'prev' && pdfPage > 1) {
      setPdfPage(pdfPage - 1);
    } else if (direction === 'next' && pdfPage < pdfTotalPages) {
      setPdfPage(pdfPage + 1);
    }
  }, [pdfPage, pdfTotalPages]);

  const openInNewTab = useCallback(() => {
    if (file && fileContent) {
      window.open(fileContent, '_blank');
    }
  }, [file, fileContent]);

  if (!isOpen || !file) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="relative w-full h-full max-w-6xl max-h-full bg-white rounded-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex-shrink-0">
              {fileInfo && (
                <div className={`p-2 rounded-lg ${fileInfo.bgColor} ${fileInfo.borderColor} border`}>
                  {isImage && <ImageIcon className={`w-5 h-5 ${fileInfo.color}`} />}
                  {isVideo && <Video className={`w-5 h-5 ${fileInfo.color}`} />}
                  {isAudio && <Music className={`w-5 h-5 ${fileInfo.color}`} />}
                  {isText && <Code className={`w-5 h-5 ${fileInfo.color}`} />}
                  {isPDF && <FileText className={`w-5 h-5 ${fileInfo.color}`} />}
                  {!isImage && !isVideo && !isAudio && !isText && !isPDF && (
                    <File className={`w-5 h-5 ${fileInfo.color}`} />
                  )}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold text-gray-900 truncate" title={file.name}>
                {file.name}
              </h3>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>{fileInfo?.description}</span>
                <span>{formatFileSize(file.size)}</span>
                <span>{formatDate(file.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Image Controls */}
            {isImage && (
              <>
                <button
                  onClick={handleZoomOut}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-600 min-w-[3rem] text-center">
                  {zoom}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-5 h-5" />
                </button>
                <button
                  onClick={handleRotate}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
                  title="Rotate"
                >
                  <RotateCw className="w-5 h-5" />
                </button>
                <button
                  onClick={resetView}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Reset
                </button>
              </>
            )}

            {/* PDF Controls */}
            {isPDF && fileContent && (
              <>
                <button
                  onClick={() => handlePdfPageChange('prev')}
                  disabled={pdfPage <= 1}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-600 min-w-[4rem] text-center">
                  {pdfPage} / {pdfTotalPages}
                </span>
                <button
                  onClick={() => handlePdfPageChange('next')}
                  disabled={pdfPage >= pdfTotalPages}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Next Page"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button
                  onClick={openInNewTab}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
                  title="Open in New Tab"
                >
                  <ExternalLink className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Video/Audio Controls */}
            {(isVideo || isAudio) && (
              <>
                <button
                  onClick={togglePlayPause}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
                <button
                  onClick={toggleMute}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                {isVideo && (
                  <button
                    onClick={toggleFullscreen}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
                    title="Fullscreen"
                  >
                    <Maximize className="w-5 h-5" />
                  </button>
                )}
              </>
            )}

            {/* Common Controls */}
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

          {securityWarning && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-orange-600 max-w-md">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ExternalLink className="w-8 h-8" />
                </div>
                <p className="text-lg font-medium mb-2">Security Warning</p>
                <p className="text-sm mb-4">{securityWarning}</p>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors mx-auto"
                >
                  <Download className="w-4 h-4" />
                  Download (Use Caution)
                </button>
              </div>
            </div>
          )}

          {error && !securityWarning && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-red-600">
                <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Preview not available</p>
                <p className="text-sm mb-4">{error}</p>
                {previewCapability?.recommendations && previewCapability.recommendations.length > 0 && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg text-left">
                    <p className="text-sm font-medium text-gray-700 mb-2">Recommendations:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {previewCapability.recommendations.map((rec, index) => (
                        <li key={index}>• {rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {!loading && !error && !securityWarning && fileContent && isImage && (
            <div className="flex items-center justify-center h-full p-4">
              <img
                src={fileContent}
                alt={file.name}
                className="max-w-full max-h-full object-contain transition-transform duration-200"
                style={{
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                }}
              />
            </div>
          )}

          {!loading && !error && !securityWarning && fileContent && isVideo && (
            <div className="flex items-center justify-center h-full p-4">
              <video
                ref={videoRef}
                src={fileContent}
                controls
                className={`max-w-full max-h-full ${isFullscreen ? 'w-full h-full object-contain' : ''}`}
                preload="metadata"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onVolumeChange={(e) => setIsMuted((e.target as HTMLVideoElement).muted)}
              >
                Your browser does not support video playback.
              </video>
            </div>
          )}

          {!loading && !error && !securityWarning && fileContent && isAudio && (
            <div className="flex items-center justify-center h-full p-4">
              <div className="bg-white rounded-lg p-8 shadow-lg max-w-md w-full">
                <div className="text-center mb-6">
                  <Music className="w-16 h-16 text-purple-600 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 truncate" title={file.name}>
                    {file.name}
                  </h4>
                  <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                </div>
                <audio
                  ref={audioRef}
                  src={fileContent}
                  controls
                  className="w-full"
                  preload="metadata"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onVolumeChange={(e) => setIsMuted((e.target as HTMLAudioElement).muted)}
                >
                  Your browser does not support audio playback.
                </audio>
              </div>
            </div>
          )}

          {!loading && !error && !securityWarning && fileContent && isPDF && (
            <div className="h-full">
              <iframe
                ref={pdfViewerRef}
                src={`${fileContent}#page=${pdfPage}&view=FitH`}
                className="w-full h-full border-0"
                title={`PDF Viewer - ${file.name}`}
              />
            </div>
          )}

          {!loading && !error && !securityWarning && fileContent && isText && (
            <div className="h-full">
              <pre className="h-full p-6 text-sm text-gray-800 bg-white font-mono whitespace-pre-wrap overflow-auto">
                {fileContent}
              </pre>
            </div>
          )}

          {!loading && !error && !securityWarning && isArchive && (
            <ArchivePreview
              file={file}
              fileContent={fileContent}
              onDownload={handleDownload}
            />
          )}

          {!loading && !error && !securityWarning && is3DModel && (
            <Model3DPreview
              file={file}
              fileContent={fileContent}
              onDownload={handleDownload}
            />
          )}

          {!loading && !error && !securityWarning && isFont && (
            <FontPreview
              file={file}
              fileContent={fileContent}
              onDownload={handleDownload}
            />
          )}

          {!loading && !error && !securityWarning && isExecutable && (
            <ExecutablePreview
              file={file}
              fileContent={fileContent}
              onDownload={handleDownload}
            />
          )}

          {!loading && !error && !securityWarning && isSpreadsheet && (
            <SpreadsheetPreview
              file={file}
              fileContent={fileContent}
              onDownload={handleDownload}
            />
          )}

          {!loading && !error && !securityWarning && isCAD && (
            <CADPreview
              file={file}
              fileContent={fileContent}
              onDownload={handleDownload}
            />
          )}

          {!loading && !error && !securityWarning && fileContent && isData && (
            <DataPreview
              file={file}
              fileContent={fileContent}
              onDownload={handleDownload}
            />
          )}

          {!loading && !error && !securityWarning && fileContent && isEmail && (
            <EmailPreview
              file={file}
              fileContent={fileContent}
              onDownload={handleDownload}
            />
          )}

          {!loading && !error && !securityWarning && fileContent && isCalendar && (
            <CalendarPreview
              file={file}
              fileContent={fileContent}
              onDownload={handleDownload}
            />
          )}

          {!loading && !error && !securityWarning && !fileContent && isOffice && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500 max-w-md">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Office Document</p>
                <p className="text-sm mb-4">
                  Microsoft Office documents can be viewed by downloading or opening in Google Docs.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  <a
                    href={`https://docs.google.com/viewer?url=${encodeURIComponent(window.location.origin + '/api/files/' + file.id + '/download')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open in Google Docs
                  </a>
                </div>
              </div>
            </div>
          )}

          {!loading && !error && !securityWarning && !fileContent && !isOffice && !isArchive && !is3DModel && !isFont && !isExecutable && !isSpreadsheet && !isCAD && !isData && !isEmail && !isCalendar && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <File className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Preview not available</p>
                <p className="text-sm mb-4">
                  {file.size > 1024 * 1024
                    ? 'File is too large for preview'
                    : 'This file type cannot be previewed in the browser'}
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

        {/* Footer with file info */}
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
