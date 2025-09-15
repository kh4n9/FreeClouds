"use client";

import {
  Eye,
  EyeOff,
  AlertTriangle,
  Zap,
  FileText,
  Image,
  Video,
  Music,
  Database,
  Archive,
  Box,
  Palette,
  Calendar,
  Mail,
  BarChart3,
  PenTool,
} from "lucide-react";
import {
  getPreviewCapability,
  canPreviewFile,
  isSecureForPreview,
  formatPreviewSizeLimit,
} from "@/lib/file-preview-utils";

interface PreviewIndicatorProps {
  fileName: string;
  fileSize: number;
  mimeType?: string;
  className?: string;
  showTooltip?: boolean;
}

export default function PreviewIndicator({
  fileName,
  fileSize,
  mimeType,
  className = "",
  showTooltip = true,
}: PreviewIndicatorProps) {
  const previewCapability = getPreviewCapability(fileName, mimeType);
  const canPreview = canPreviewFile(fileName, fileSize, mimeType);
  const isSecure = isSecureForPreview(fileName, mimeType);

  const getPreviewIcon = () => {
    if (!isSecure) {
      return AlertTriangle;
    }

    switch (previewCapability.previewType) {
      case "image":
        return Image;
      case "video":
        return Video;
      case "audio":
        return Music;
      case "text":
      case "pdf":
        return FileText;
      case "data":
        return Database;
      case "archive":
        return Archive;
      case "model3d":
        return Box;
      case "font":
        return Palette;
      case "calendar":
        return Calendar;
      case "email":
        return Mail;
      case "spreadsheet":
        return BarChart3;
      case "cad":
        return PenTool;
      case "executable":
        return AlertTriangle;
      default:
        return canPreview ? Eye : EyeOff;
    }
  };

  const getIndicatorColor = () => {
    if (!isSecure) {
      return "text-red-500 bg-red-50 border-red-200";
    }

    if (!canPreview) {
      return "text-gray-400 bg-gray-50 border-gray-200";
    }

    switch (previewCapability.previewType) {
      case "image":
        return "text-blue-500 bg-blue-50 border-blue-200";
      case "video":
        return "text-purple-500 bg-purple-50 border-purple-200";
      case "audio":
        return "text-pink-500 bg-pink-50 border-pink-200";
      case "text":
      case "pdf":
        return "text-green-500 bg-green-50 border-green-200";
      case "data":
        return "text-indigo-500 bg-indigo-50 border-indigo-200";
      case "archive":
        return "text-yellow-500 bg-yellow-50 border-yellow-200";
      case "model3d":
        return "text-cyan-500 bg-cyan-50 border-cyan-200";
      case "font":
        return "text-violet-500 bg-violet-50 border-violet-200";
      case "calendar":
        return "text-emerald-500 bg-emerald-50 border-emerald-200";
      case "email":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "spreadsheet":
        return "text-green-600 bg-green-50 border-green-200";
      case "cad":
        return "text-orange-500 bg-orange-50 border-orange-200";
      case "executable":
        return "text-red-500 bg-red-50 border-red-200";
      default:
        return "text-gray-500 bg-gray-50 border-gray-200";
    }
  };

  const getTooltipContent = () => {
    if (!isSecure) {
      return "⚠️ Security Risk - Cannot preview executable files";
    }

    if (!canPreview) {
      const reasons = [];

      if (!previewCapability.canPreview) {
        reasons.push("File type not supported");
      }

      if (
        previewCapability.maxPreviewSize > 0 &&
        fileSize > previewCapability.maxPreviewSize
      ) {
        const maxSize = formatPreviewSizeLimit(
          previewCapability.maxPreviewSize,
        );
        reasons.push(`File too large (max: ${maxSize})`);
      }

      return `❌ Cannot preview: ${reasons.join(", ")}`;
    }

    let tooltip = `✅ ${previewCapability.description}`;

    if (previewCapability.requiresSpecialHandling) {
      tooltip += " (Enhanced preview)";
    }

    if (previewCapability.maxPreviewSize > 0) {
      const maxSize = formatPreviewSizeLimit(previewCapability.maxPreviewSize);
      tooltip += ` • Max size: ${maxSize}`;
    }

    return tooltip;
  };

  const IconComponent = getPreviewIcon();
  const colorClasses = getIndicatorColor();

  return (
    <div className={`relative group ${className}`}>
      <div
        className={`w-6 h-6 rounded-full border flex items-center justify-center ${colorClasses} transition-all duration-200 hover:scale-110`}
        title={showTooltip ? getTooltipContent() : undefined}
      >
        <IconComponent className="w-3 h-3" />
      </div>

      {/* Enhanced preview indicator */}
      {canPreview && previewCapability.requiresSpecialHandling && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
          <Zap className="w-2 h-2 text-white" />
        </div>
      )}

      {/* Tooltip on hover */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-10">
          {getTooltipContent()}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
}

// Utility component for preview status in file lists
export function PreviewStatusBadge({
  fileName,
  fileSize,
  mimeType,
  compact = false,
}: PreviewIndicatorProps & { compact?: boolean }) {
  const previewCapability = getPreviewCapability(fileName, mimeType);
  const canPreview = canPreviewFile(fileName, fileSize, mimeType);
  const isSecure = isSecureForPreview(fileName, mimeType);

  if (!isSecure) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
        <AlertTriangle className="w-3 h-3" />
        {!compact && "Risk"}
      </span>
    );
  }

  if (!canPreview) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
        <EyeOff className="w-3 h-3" />
        {!compact && "No Preview"}
      </span>
    );
  }

  type PreviewType =
    | "image"
    | "video"
    | "audio"
    | "text"
    | "pdf"
    | "data"
    | "archive"
    | "model3d"
    | "font"
    | "calendar"
    | "email"
    | "spreadsheet"
    | "cad"
    | "executable"
    | "office"
    | "unsupported";

  const typeColors: Record<PreviewType, string> = {
    image: "bg-blue-100 text-blue-800",
    video: "bg-purple-100 text-purple-800",
    audio: "bg-pink-100 text-pink-800",
    text: "bg-green-100 text-green-800",
    pdf: "bg-green-100 text-green-800",
    data: "bg-indigo-100 text-indigo-800",
    archive: "bg-yellow-100 text-yellow-800",
    model3d: "bg-cyan-100 text-cyan-800",
    font: "bg-violet-100 text-violet-800",
    calendar: "bg-emerald-100 text-emerald-800",
    email: "bg-blue-100 text-blue-800",
    spreadsheet: "bg-green-100 text-green-800",
    cad: "bg-orange-100 text-orange-800",
    executable: "bg-red-100 text-red-800",
    office: "bg-teal-100 text-teal-800",
    unsupported: "bg-gray-100 text-gray-600",
  };

  const colorClass =
    typeColors[previewCapability.previewType as PreviewType] ||
    typeColors.unsupported;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${colorClass}`}
    >
      <Eye className="w-3 h-3" />
      {!compact && (
        <>
          {previewCapability.previewType === "image" && "Image"}
          {previewCapability.previewType === "video" && "Video"}
          {previewCapability.previewType === "audio" && "Audio"}
          {previewCapability.previewType === "text" && "Text"}
          {previewCapability.previewType === "pdf" && "PDF"}
          {previewCapability.previewType === "data" && "Data"}
          {previewCapability.previewType === "archive" && "Archive"}
          {previewCapability.previewType === "model3d" && "3D"}
          {previewCapability.previewType === "font" && "Font"}
          {previewCapability.previewType === "calendar" && "Calendar"}
          {previewCapability.previewType === "email" && "Email"}
          {previewCapability.previewType === "spreadsheet" && "Sheet"}
          {previewCapability.previewType === "cad" && "CAD"}
          {previewCapability.previewType === "executable" && "Exec"}
          {previewCapability.previewType === "office" && "Office"}
          {previewCapability.previewType === "unsupported" && "Preview"}
        </>
      )}
      {previewCapability.requiresSpecialHandling && <Zap className="w-3 h-3" />}
    </span>
  );
}
