"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Download,
  Trash2,
  File,
  Image,
  Video,
  Music,
  Archive,
  FileText,
  MoreVertical,
  Search,
  Grid,
  List,
  Code,
  Database,
  Presentation,
  Sheet,
  BookOpen,
  Eye,
  Filter,
  Box,
  Ruler,
  Palette,
  Type,
  Settings,
  Lock,
  GitBranch,
} from "lucide-react";
import {
  getFileTypeInfo,
  isImageFile,
  formatFileSize,
  formatDate,
  getFileColorClasses
} from "@/lib/file-utils";
import FilePreview from "./FilePreview";
import PreviewIndicator, { PreviewStatusBadge } from "./PreviewIndicator";

interface FileData {
  id: string;
  name: string;
  size: number;
  mime: string;
  folderId: string | null;
  folderName?: string | null;
  createdAt: string;
}

interface FileGridProps {
  files: FileData[];
  loading?: boolean;
  onDownload: (fileId: string, fileName: string) => void;
  onDelete: (fileId: string) => void;
  onSearch?: (query: string) => void;
  searchQuery?: string;
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
}

interface FileItemProps {
  file: FileData;
  viewMode: 'grid' | 'list';
  onDownload: (fileId: string, fileName: string) => void;
  onDelete: (fileId: string) => void;
  onPreview: (file: FileData) => void;
}

function getFileIcon(fileName: string, mimeType: string) {
  const fileInfo = getFileTypeInfo(fileName, mimeType);
  const { color } = getFileColorClasses(fileName, mimeType);

  const iconProps = `w-8 h-8 ${color}`;

  switch (fileInfo.icon) {
    case 'Image': return <Image className={iconProps} />;
    case 'Video': return <Video className={iconProps} />;
    case 'Music': return <Music className={iconProps} />;
    case 'FileText': return <FileText className={iconProps} />;
    case 'Sheet': return <Sheet className={iconProps} />;
    case 'Presentation': return <Presentation className={iconProps} />;
    case 'Code': return <Code className={iconProps} />;
    case 'Database': return <Database className={iconProps} />;
    case 'BookOpen': return <BookOpen className={iconProps} />;
    case 'Archive': return <Archive className={iconProps} />;
    case 'Box': return <Box className={iconProps} />;
    case 'Ruler': return <Ruler className={iconProps} />;
    case 'Palette': return <Palette className={iconProps} />;
    case 'Type': return <Type className={iconProps} />;
    case 'Settings': return <Settings className={iconProps} />;
    case 'Lock': return <Lock className={iconProps} />;
    case 'GitBranch': return <GitBranch className={iconProps} />;
    default: return <File className={iconProps} />;
  }
}

function getFileTypeColorClasses(fileName: string, mimeType: string): string {
  const { bgColor, borderColor } = getFileColorClasses(fileName, mimeType);
  return `${borderColor} ${bgColor}`;
}



function FileItem({ file, viewMode, onDownload, onDelete, onPreview }: FileItemProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  const isImage = isImageFile(file.name, file.mime);
  const fileInfo = getFileTypeInfo(file.name, file.mime);

  const handleDownload = () => {
    onDownload(file.id, file.name);
    setIsMenuOpen(false);
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${file.name}"?`)) {
      onDelete(file.id);
    }
    setIsMenuOpen(false);
  };

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  const handlePreview = () => {
    onPreview(file);
  };

  // Load image thumbnail automatically for images
  useEffect(() => {
    if (isImage && !imageUrl && !imageLoading) {
      const loadImageThumbnail = async () => {
        setImageLoading(true);
        try {
          const response = await fetch(`/api/files/${file.id}/download`);
          if (response.ok) {
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setImageUrl(url);
          }
        } catch (error) {
          console.error('Failed to load image thumbnail:', error);
        } finally {
          setImageLoading(false);
        }
      };

      // Small delay to avoid loading all images at once
      const timer = setTimeout(loadImageThumbnail, Math.random() * 1000);
      return () => clearTimeout(timer);
    }
  }, [file.id, isImage, imageUrl, imageLoading]);

  // Cleanup blob URL when component unmounts
  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  if (viewMode === 'grid') {
    return (
      <>
        <div className={`group relative border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${getFileTypeColorClasses(file.name, file.mime)}`} onClick={handlePreview}>
          {/* File Icon or Image Preview */}
          <div className="flex justify-center mb-3 relative">
            {isImage && imageUrl ? (
              <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                <img
                  src={imageUrl}
                  alt={file.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : isImage ? (
              <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center">
                {imageLoading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                ) : (
                  <Image className="w-8 h-8 text-green-500" />
                )}
              </div>
            ) : (
              getFileIcon(file.name, file.mime)
            )}
          </div>

          {/* File Type Badge */}
          <div className="absolute top-2 left-2">
            <span className="text-xs px-2 py-1 bg-white bg-opacity-80 backdrop-blur-sm rounded-full font-medium">
              {fileInfo.description}
            </span>
          </div>

          {/* Preview Indicator */}
          <div className="absolute top-2 right-12">
            <PreviewIndicator
              fileName={file.name}
              fileSize={file.size}
              mimeType={file.mime}
              className="opacity-70 group-hover:opacity-100 transition-opacity"
            />
          </div>

          {/* Preview Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePreview();
            }}
            className="absolute top-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 p-1 bg-white bg-opacity-80 backdrop-blur-sm rounded-full hover:bg-opacity-100 transition-all"
            title="Preview file"
          >
            <Eye className="w-4 h-4 text-gray-700" />
          </button>

          {/* File Name */}
          <h3 className="text-sm font-medium text-gray-900 truncate mb-1" title={file.name}>
            {file.name}
          </h3>

          {/* File Info */}
          <div className="text-xs text-gray-500 space-y-1">
            <div className="flex items-center justify-between">
              <span>{formatFileSize(file.size)}</span>
              <PreviewStatusBadge
                fileName={file.name}
                fileSize={file.size}
                mimeType={file.mime}
                compact={true}
              />
            </div>
            <div>{formatDate(file.createdAt)}</div>
          </div>

          {/* Actions Menu */}
          <div className="absolute top-2 right-2">
            <button
              onClick={handleMenuToggle}
              className="opacity-0 group-hover:opacity-100 p-1 bg-white bg-opacity-80 backdrop-blur-sm rounded hover:bg-opacity-100 transition-all"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreview();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 first:rounded-t-md"
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </button>
                <button
                  onClick={handleDownload}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 last:rounded-b-md"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>


      </>
    );
  }

  // List view
  return (
    <>
      <div className={`group flex items-center gap-3 p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer`} onClick={handlePreview}>
        {/* File Icon or Image Thumbnail */}
        <div className="flex-shrink-0 relative">
          {isImage && imageUrl ? (
            <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200">
              <img
                src={imageUrl}
                alt={file.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : isImage ? (
            <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center">
              {imageLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
              ) : (
                <Image className="w-6 h-6 text-green-500" />
              )}
            </div>
          ) : (
            getFileIcon(file.name, file.mime)
          )}

          {/* File Type Badge */}
          <span className="absolute -top-1 -right-1 text-xs px-1 py-0.5 bg-white border border-gray-200 rounded text-gray-600 font-medium">
            {fileInfo.description.split(' ')[0]}
          </span>
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-gray-900 truncate flex-1" title={file.name}>
              {file.name}
            </h3>
            <PreviewIndicator
              fileName={file.name}
              fileSize={file.size}
              mimeType={file.mime}
              className="opacity-70 group-hover:opacity-100 transition-opacity"
              showTooltip={false}
            />
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
            <span>{formatFileSize(file.size)}</span>
            <span>{formatDate(file.createdAt)}</span>
            {file.folderName && (
              <span className="text-blue-600">📁 {file.folderName}</span>
            )}
            <PreviewStatusBadge
              fileName={file.name}
              fileSize={file.size}
              mimeType={file.mime}
              compact={true}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePreview();
            }}
            className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-all"
            title="Preview"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload(file.id, file.name);
            }}
            className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Are you sure you want to delete "${file.name}"?`)) {
                onDelete(file.id);
              }
            }}
            className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-all"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}

export default function FileGrid({
  files,
  loading = false,
  onDownload,
  onDelete,
  onSearch,
  searchQuery = '',
  viewMode = 'grid',
  onViewModeChange,
}: FileGridProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileData | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onSearch) {
        onSearch(localSearchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearchQuery, onSearch]);

  // Filter files by type
  const filteredFiles = files.filter(file => {
    if (selectedFilter === 'all') return true;
    const fileInfo = getFileTypeInfo(file.name, file.mime);
    return fileInfo.category === selectedFilter;
  });

  // Get file type counts
  const fileTypeCounts = files.reduce((acc, file) => {
    const fileInfo = getFileTypeInfo(file.name, file.mime);
    acc[fileInfo.category] = (acc[fileInfo.category] || 0) + 1;
    acc.all = (acc.all || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const filterOptions = [
    { value: 'all', label: 'All Files', count: fileTypeCounts.all || 0 },
    { value: 'image', label: 'Images', count: fileTypeCounts.image || 0 },
    { value: 'video', label: 'Videos', count: fileTypeCounts.video || 0 },
    { value: 'audio', label: 'Audio', count: fileTypeCounts.audio || 0 },
    { value: 'document', label: 'Documents', count: fileTypeCounts.document || 0 },
    { value: 'code', label: 'Code', count: fileTypeCounts.code || 0 },
    { value: '3d', label: '3D & CAD', count: fileTypeCounts['3d'] || 0 },
    { value: 'design', label: 'Design', count: fileTypeCounts.design || 0 },
    { value: 'font', label: 'Fonts', count: fileTypeCounts.font || 0 },
    { value: 'data', label: 'Data', count: fileTypeCounts.data || 0 },
    { value: 'archive', label: 'Archives', count: fileTypeCounts.archive || 0 },
    { value: 'system', label: 'System', count: fileTypeCounts.system || 0 },
    { value: 'other', label: 'Other', count: fileTypeCounts.other || 0 },
  ].filter(option => option.count > 0);

  const handleFilePreview = useCallback((file: FileData) => {
    setPreviewFile(file);
    setShowPreview(true);
  }, []);

  const closePreview = useCallback(() => {
    setShowPreview(false);
    setPreviewFile(null);
  }, []);

  // Close all menus when clicking outside
  useEffect(() => {
    const handleClick = () => {
      // This will trigger a re-render and close menus
      // In a real implementation, you might want to use a more sophisticated state management
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  if (loading) {
    return (
      <div className="flex-1 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'space-y-1'}>
            {[...Array(8)].map((_, i) => (
              <div key={i} className={viewMode === 'grid' ? 'h-32 bg-gray-200 rounded-lg' : 'h-16 bg-gray-200 rounded'}>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between gap-4">
          {/* Search */}
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search files..."
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">
                {filterOptions.find(opt => opt.value === selectedFilter)?.label || 'All Files'}
              </span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showFilterDropdown && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSelectedFilter(option.value);
                      setShowFilterDropdown(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                      selectedFilter === option.value ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    <span>{option.label}</span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      {option.count}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* View Mode Toggle */}
          {onViewModeChange && (
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => onViewModeChange('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                title="Grid view"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => onViewModeChange('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-auto">
        {filteredFiles.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <div className="text-center">
              <File className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No files found</h3>
              <p className="text-gray-500">
                {localSearchQuery
                  ? `No files match "${localSearchQuery}"`
                  : selectedFilter !== 'all'
                  ? `No ${filterOptions.find(opt => opt.value === selectedFilter)?.label.toLowerCase()} found`
                  : 'Upload some files to get started'}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-6">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredFiles.map((file) => (
                  <FileItem
                    key={file.id}
                    file={file}
                    viewMode={viewMode}
                    onDownload={onDownload}
                    onDelete={onDelete}
                    onPreview={handleFilePreview}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                {filteredFiles.map((file) => (
                  <FileItem
                    key={file.id}
                    file={file}
                    viewMode={viewMode}
                    onDownload={onDownload}
                    onDelete={onDelete}
                    onPreview={handleFilePreview}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* File Preview Modal */}
      <FilePreview
        key={previewFile?.id || 'no-file'}
        file={previewFile}
        isOpen={showPreview}
        onClose={closePreview}
        onDownload={onDownload}
      />
    </div>
  );
}
