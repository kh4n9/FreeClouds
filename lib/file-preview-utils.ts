export interface PreviewCapability {
  canPreview: boolean;
  previewType:
    | "image"
    | "video"
    | "audio"
    | "text"
    | "pdf"
    | "office"
    | "archive"
    | "model3d"
    | "font"
    | "executable"
    | "data"
    | "email"
    | "calendar"
    | "cad"
    | "spreadsheet"
    | "unsupported";
  requiresSpecialHandling: boolean;
  maxPreviewSize: number; // in bytes
  description: string;
  recommendations?: string[];
}

export interface FileTypeDetection {
  category: string;
  subCategory: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  preview: PreviewCapability;
}

// Enhanced MIME type to preview capability mapping
const PREVIEW_CAPABILITIES: Record<string, PreviewCapability> = {
  // Images
  "image/jpeg": {
    canPreview: true,
    previewType: "image",
    requiresSpecialHandling: false,
    maxPreviewSize: 50 * 1024 * 1024, // 50MB
    description: "Image preview with zoom and rotation controls",
  },
  "image/png": {
    canPreview: true,
    previewType: "image",
    requiresSpecialHandling: false,
    maxPreviewSize: 50 * 1024 * 1024,
    description: "Image preview with transparency support",
  },
  "image/gif": {
    canPreview: true,
    previewType: "image",
    requiresSpecialHandling: false,
    maxPreviewSize: 50 * 1024 * 1024,
    description: "Animated GIF preview",
  },
  "image/webp": {
    canPreview: true,
    previewType: "image",
    requiresSpecialHandling: false,
    maxPreviewSize: 50 * 1024 * 1024,
    description: "WebP image preview",
  },
  "image/svg+xml": {
    canPreview: true,
    previewType: "image",
    requiresSpecialHandling: false,
    maxPreviewSize: 10 * 1024 * 1024,
    description: "Scalable vector graphics preview",
  },
  "image/tiff": {
    canPreview: true,
    previewType: "image",
    requiresSpecialHandling: false,
    maxPreviewSize: 100 * 1024 * 1024,
    description: "TIFF image preview",
  },
  "image/bmp": {
    canPreview: true,
    previewType: "image",
    requiresSpecialHandling: false,
    maxPreviewSize: 50 * 1024 * 1024,
    description: "Bitmap image preview",
  },

  // Videos
  "video/mp4": {
    canPreview: true,
    previewType: "video",
    requiresSpecialHandling: false,
    maxPreviewSize: 500 * 1024 * 1024, // 500MB
    description: "MP4 video with built-in controls",
  },
  "video/webm": {
    canPreview: true,
    previewType: "video",
    requiresSpecialHandling: false,
    maxPreviewSize: 500 * 1024 * 1024,
    description: "WebM video preview",
  },
  "video/ogg": {
    canPreview: true,
    previewType: "video",
    requiresSpecialHandling: false,
    maxPreviewSize: 500 * 1024 * 1024,
    description: "OGG video preview",
  },
  "video/quicktime": {
    canPreview: true,
    previewType: "video",
    requiresSpecialHandling: false,
    maxPreviewSize: 500 * 1024 * 1024,
    description: "QuickTime video preview",
  },
  "video/x-msvideo": {
    canPreview: true,
    previewType: "video",
    requiresSpecialHandling: false,
    maxPreviewSize: 500 * 1024 * 1024,
    description: "AVI video preview",
  },

  // Audio
  "audio/mpeg": {
    canPreview: true,
    previewType: "audio",
    requiresSpecialHandling: false,
    maxPreviewSize: 100 * 1024 * 1024, // 100MB
    description: "MP3 audio with playback controls",
  },
  "audio/wav": {
    canPreview: true,
    previewType: "audio",
    requiresSpecialHandling: false,
    maxPreviewSize: 100 * 1024 * 1024,
    description: "WAV audio preview",
  },
  "audio/ogg": {
    canPreview: true,
    previewType: "audio",
    requiresSpecialHandling: false,
    maxPreviewSize: 100 * 1024 * 1024,
    description: "OGG audio preview",
  },
  "audio/flac": {
    canPreview: true,
    previewType: "audio",
    requiresSpecialHandling: false,
    maxPreviewSize: 100 * 1024 * 1024,
    description: "FLAC lossless audio preview",
  },
  "audio/aac": {
    canPreview: true,
    previewType: "audio",
    requiresSpecialHandling: false,
    maxPreviewSize: 100 * 1024 * 1024,
    description: "AAC audio preview",
  },

  // Documents
  "application/pdf": {
    canPreview: true,
    previewType: "pdf",
    requiresSpecialHandling: false,
    maxPreviewSize: 50 * 1024 * 1024,
    description: "PDF document with page navigation",
  },
  "text/plain": {
    canPreview: true,
    previewType: "text",
    requiresSpecialHandling: false,
    maxPreviewSize: 5 * 1024 * 1024, // 5MB
    description: "Plain text preview",
  },
  "text/html": {
    canPreview: true,
    previewType: "text",
    requiresSpecialHandling: false,
    maxPreviewSize: 5 * 1024 * 1024,
    description: "HTML source code preview",
  },
  "text/css": {
    canPreview: true,
    previewType: "text",
    requiresSpecialHandling: false,
    maxPreviewSize: 5 * 1024 * 1024,
    description: "CSS stylesheet preview",
  },
  "text/javascript": {
    canPreview: true,
    previewType: "text",
    requiresSpecialHandling: false,
    maxPreviewSize: 5 * 1024 * 1024,
    description: "JavaScript code preview",
  },
  "application/json": {
    canPreview: true,
    previewType: "data",
    requiresSpecialHandling: true,
    maxPreviewSize: 5 * 1024 * 1024,
    description: "JSON data with syntax highlighting",
  },
  "text/csv": {
    canPreview: true,
    previewType: "data",
    requiresSpecialHandling: true,
    maxPreviewSize: 10 * 1024 * 1024,
    description: "CSV data in table format",
  },
  "application/xml": {
    canPreview: true,
    previewType: "data",
    requiresSpecialHandling: true,
    maxPreviewSize: 5 * 1024 * 1024,
    description: "XML data with structure highlighting",
  },

  // Office Documents
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    canPreview: false,
    previewType: "office",
    requiresSpecialHandling: true,
    maxPreviewSize: 0,
    description: "Microsoft Word document",
    recommendations: [
      "Open in Microsoft Word",
      "Open in Google Docs",
      "Download to view",
    ],
  },
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": {
    canPreview: false,
    previewType: "office",
    requiresSpecialHandling: true,
    maxPreviewSize: 0,
    description: "Microsoft PowerPoint presentation",
    recommendations: [
      "Open in Microsoft PowerPoint",
      "Open in Google Slides",
      "Download to view",
    ],
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
    canPreview: false,
    previewType: "spreadsheet",
    requiresSpecialHandling: true,
    maxPreviewSize: 0,
    description: "Microsoft Excel spreadsheet",
    recommendations: [
      "Open in Microsoft Excel",
      "Open in Google Sheets",
      "Download to view",
    ],
  },
  "application/msword": {
    canPreview: false,
    previewType: "office",
    requiresSpecialHandling: true,
    maxPreviewSize: 0,
    description: "Legacy Microsoft Word document",
    recommendations: [
      "Open in Microsoft Word",
      "Convert to newer format",
      "Download to view",
    ],
  },

  // Archives
  "application/zip": {
    canPreview: false,
    previewType: "archive",
    requiresSpecialHandling: true,
    maxPreviewSize: 0,
    description: "ZIP compressed archive",
    recommendations: [
      "Extract with archive software",
      "View contents after extraction",
    ],
  },
  "application/x-rar-compressed": {
    canPreview: false,
    previewType: "archive",
    requiresSpecialHandling: true,
    maxPreviewSize: 0,
    description: "RAR compressed archive",
    recommendations: [
      "Extract with WinRAR or 7-Zip",
      "View contents after extraction",
    ],
  },
  "application/x-7z-compressed": {
    canPreview: false,
    previewType: "archive",
    requiresSpecialHandling: true,
    maxPreviewSize: 0,
    description: "7-Zip compressed archive",
    recommendations: ["Extract with 7-Zip", "View contents after extraction"],
  },

  // 3D Models
  "model/obj": {
    canPreview: false,
    previewType: "model3d",
    requiresSpecialHandling: true,
    maxPreviewSize: 0,
    description: "OBJ 3D model file",
    recommendations: [
      "Open in Blender",
      "Open in MeshLab",
      "Use 3D modeling software",
    ],
  },
  "model/stl": {
    canPreview: false,
    previewType: "model3d",
    requiresSpecialHandling: true,
    maxPreviewSize: 0,
    description: "STL 3D model for 3D printing",
    recommendations: [
      "Open in 3D slicer software",
      "View in Blender",
      "Use for 3D printing",
    ],
  },

  // Fonts
  "font/ttf": {
    canPreview: false,
    previewType: "font",
    requiresSpecialHandling: true,
    maxPreviewSize: 0,
    description: "TrueType font file",
    recommendations: [
      "Install on system",
      "Preview in font manager",
      "Use in design software",
    ],
  },
  "font/otf": {
    canPreview: false,
    previewType: "font",
    requiresSpecialHandling: true,
    maxPreviewSize: 0,
    description: "OpenType font file",
    recommendations: [
      "Install on system",
      "Preview in font manager",
      "Use in design software",
    ],
  },
  "font/woff": {
    canPreview: false,
    previewType: "font",
    requiresSpecialHandling: true,
    maxPreviewSize: 0,
    description: "Web font file",
    recommendations: ["Use in web development", "Convert for system use"],
  },

  // Executables
  "application/x-msdownload": {
    canPreview: false,
    previewType: "executable",
    requiresSpecialHandling: true,
    maxPreviewSize: 0,
    description: "Windows executable file",
    recommendations: [
      "Scan with antivirus",
      "Run only from trusted sources",
      "Check digital signature",
    ],
  },
  "application/x-executable": {
    canPreview: false,
    previewType: "executable",
    requiresSpecialHandling: true,
    maxPreviewSize: 0,
    description: "Linux executable file",
    recommendations: [
      "Verify permissions",
      "Run only from trusted sources",
      "Check file integrity",
    ],
  },

  // Email
  "message/rfc822": {
    canPreview: true,
    previewType: "email",
    requiresSpecialHandling: true,
    maxPreviewSize: 10 * 1024 * 1024,
    description: "Email message with headers and content",
  },

  // CAD
  "application/acad": {
    canPreview: false,
    previewType: "cad",
    requiresSpecialHandling: true,
    maxPreviewSize: 0,
    description: "AutoCAD drawing file",
    recommendations: [
      "Open in AutoCAD",
      "Use DWG viewer",
      "Convert to PDF for sharing",
    ],
  },
  "application/dxf": {
    canPreview: false,
    previewType: "cad",
    requiresSpecialHandling: true,
    maxPreviewSize: 0,
    description: "Drawing Exchange Format file",
    recommendations: [
      "Open in CAD software",
      "Use DXF viewer",
      "Import into design tools",
    ],
  },
};

// File extension to MIME type mapping for better detection
const EXTENSION_TO_MIME: Record<string, string> = {
  // Images
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  tiff: "image/tiff",
  tif: "image/tiff",
  bmp: "image/bmp",
  ico: "image/x-icon",

  // Videos
  mp4: "video/mp4",
  webm: "video/webm",
  ogv: "video/ogg",
  mov: "video/quicktime",
  avi: "video/x-msvideo",
  wmv: "video/x-ms-wmv",
  flv: "video/x-flv",
  mkv: "video/x-matroska",

  // Audio
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  flac: "audio/flac",
  aac: "audio/aac",
  m4a: "audio/mp4",
  wma: "audio/x-ms-wma",

  // Documents
  pdf: "application/pdf",
  txt: "text/plain",
  html: "text/html",
  htm: "text/html",
  css: "text/css",
  js: "text/javascript",
  json: "application/json",
  xml: "application/xml",
  csv: "text/csv",
  yaml: "application/x-yaml",
  yml: "application/x-yaml",

  // Office
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  odt: "application/vnd.oasis.opendocument.text",
  ods: "application/vnd.oasis.opendocument.spreadsheet",
  odp: "application/vnd.oasis.opendocument.presentation",

  // Archives
  zip: "application/zip",
  rar: "application/x-rar-compressed",
  "7z": "application/x-7z-compressed",
  tar: "application/x-tar",
  gz: "application/gzip",
  bz2: "application/x-bzip2",

  // 3D Models
  obj: "model/obj",
  stl: "model/stl",
  ply: "model/ply",
  gltf: "model/gltf+json",
  glb: "model/gltf-binary",
  fbx: "model/fbx",
  dae: "model/vnd.collada+xml",
  "3ds": "model/3ds",

  // Fonts
  ttf: "font/ttf",
  otf: "font/otf",
  woff: "font/woff",
  woff2: "font/woff2",
  eot: "application/vnd.ms-fontobject",

  // Executables
  exe: "application/x-msdownload",
  msi: "application/x-msdownload",
  deb: "application/x-deb",
  rpm: "application/x-rpm",
  dmg: "application/x-apple-diskimage",
  pkg: "application/x-newton-compatible-pkg",
  jar: "application/java-archive",
  app: "application/x-executable",

  // Email
  eml: "message/rfc822",
  msg: "application/vnd.ms-outlook",
  mbox: "application/mbox",

  // Calendar
  ics: "text/calendar",
  vcs: "text/x-vcalendar",
  vcf: "text/vcard",

  // CAD
  dwg: "application/acad",
  dxf: "application/dxf",
  step: "application/step",
  stp: "application/step",
  iges: "application/iges",
  igs: "application/iges",

  // Code files
  ts: "text/typescript",
  tsx: "text/typescript",
  jsx: "text/javascript",
  py: "text/x-python",
  java: "text/x-java-source",
  cpp: "text/x-c++src",
  c: "text/x-csrc",
  h: "text/x-chdr",
  php: "text/x-php",
  rb: "text/x-ruby",
  go: "text/x-go",
  rs: "text/x-rust",
  swift: "text/x-swift",
  kt: "text/x-kotlin",
  scala: "text/x-scala",
  r: "text/x-r",
  sql: "text/x-sql",
  sh: "text/x-shellscript",
  bat: "text/x-msdos-batch",
  ps1: "text/x-powershell",

  // Configuration files
  ini: "text/plain",
  conf: "text/plain",
  cfg: "text/plain",
  toml: "text/plain",
  env: "text/plain",
  gitignore: "text/plain",
  dockerignore: "text/plain",
  editorconfig: "text/plain",

  // Data formats
  sqlite: "application/x-sqlite3",
  db: "application/x-sqlite3",
};

export function getPreviewCapability(
  fileName: string,
  mimeType?: string,
): PreviewCapability {
  // Try to get MIME type from extension if not provided
  const extension = fileName.split(".").pop()?.toLowerCase();
  const detectedMime =
    mimeType || (extension ? EXTENSION_TO_MIME[extension] : undefined);

  // Check direct MIME type mapping
  if (detectedMime && PREVIEW_CAPABILITIES[detectedMime]) {
    return PREVIEW_CAPABILITIES[detectedMime];
  }

  // Check by extension for special cases
  if (extension) {
    // Code files (treat as text)
    if (
      [
        "ts",
        "tsx",
        "jsx",
        "py",
        "java",
        "cpp",
        "c",
        "h",
        "php",
        "rb",
        "go",
        "rs",
        "swift",
        "kt",
        "scala",
        "r",
        "sql",
        "sh",
        "bat",
        "ps1",
      ].includes(extension)
    ) {
      return {
        canPreview: true,
        previewType: "text",
        requiresSpecialHandling: false,
        maxPreviewSize: 5 * 1024 * 1024,
        description: `${extension.toUpperCase()} source code preview`,
      };
    }

    // Configuration files (treat as text)
    if (
      [
        "ini",
        "conf",
        "cfg",
        "toml",
        "env",
        "gitignore",
        "dockerignore",
        "editorconfig",
      ].includes(extension)
    ) {
      return {
        canPreview: true,
        previewType: "text",
        requiresSpecialHandling: false,
        maxPreviewSize: 1 * 1024 * 1024,
        description: "Configuration file preview",
      };
    }

    // Calendar files
    if (["ics", "vcs", "vcf"].includes(extension)) {
      return {
        canPreview: true,
        previewType: "calendar",
        requiresSpecialHandling: true,
        maxPreviewSize: 5 * 1024 * 1024,
        description: "Calendar events preview",
      };
    }
  }

  // Default fallback
  return {
    canPreview: false,
    previewType: "unsupported",
    requiresSpecialHandling: false,
    maxPreviewSize: 0,
    description: "File type not supported for preview",
    recommendations: ["Download to view with appropriate software"],
  };
}

export function canPreviewFile(
  fileName: string,
  fileSize: number,
  mimeType?: string,
): boolean {
  const capability = getPreviewCapability(fileName, mimeType);

  if (!capability.canPreview) {
    return false;
  }

  if (capability.maxPreviewSize > 0 && fileSize > capability.maxPreviewSize) {
    return false;
  }

  return true;
}

export function getPreviewRecommendations(
  fileName: string,
  mimeType?: string,
): string[] {
  const capability = getPreviewCapability(fileName, mimeType);
  return capability.recommendations || [];
}

export function isPreviewSizeLimitExceeded(
  fileName: string,
  fileSize: number,
  mimeType?: string,
): boolean {
  const capability = getPreviewCapability(fileName, mimeType);
  return capability.maxPreviewSize > 0 && fileSize > capability.maxPreviewSize;
}

export function getMaxPreviewSize(fileName: string, mimeType?: string): number {
  const capability = getPreviewCapability(fileName, mimeType);
  return capability.maxPreviewSize;
}

export function formatPreviewSizeLimit(maxSize: number): string {
  if (maxSize === 0) return "No limit";

  const units = ["B", "KB", "MB", "GB"];
  let size = maxSize;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${Math.round(size * 10) / 10} ${units[unitIndex]}`;
}

// Security check for file types
export function isSecureForPreview(
  fileName: string,
  mimeType?: string,
): boolean {
  const extension = fileName.split(".").pop()?.toLowerCase();
  const capability = getPreviewCapability(fileName, mimeType);

  // Never preview executable files
  if (capability.previewType === "executable") {
    return false;
  }

  // Be careful with certain extensions
  const dangerousExtensions = [
    "exe",
    "scr",
    "bat",
    "cmd",
    "com",
    "pif",
    "vbs",
    "js",
    "jar",
    "app",
    "deb",
    "rpm",
    "msi",
  ];
  if (extension && dangerousExtensions.includes(extension)) {
    return false;
  }

  return true;
}

// Get appropriate icon for preview type
export function getPreviewIcon(
  previewType: PreviewCapability["previewType"],
): string {
  const iconMap = {
    image: "Image",
    video: "Video",
    audio: "Music",
    text: "FileText",
    pdf: "FileText",
    office: "FileText",
    archive: "Archive",
    model3d: "Box",
    font: "Type",
    executable: "AlertTriangle",
    data: "Database",
    email: "Mail",
    calendar: "Calendar",
    cad: "PenTool",
    spreadsheet: "BarChart3",
    unsupported: "File",
  };

  return iconMap[previewType] || "File";
}
