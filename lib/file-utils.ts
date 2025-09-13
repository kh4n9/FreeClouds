export interface FileTypeInfo {
  category: 'image' | 'video' | 'audio' | 'document' | 'code' | 'archive' | '3d' | 'design' | 'font' | 'data' | 'system' | 'other';
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
}

export const FILE_TYPE_MAP: Record<string, FileTypeInfo> = {
  // Images
  'jpg': { category: 'image', icon: 'Image', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200', description: 'JPEG Image' },
  'jpeg': { category: 'image', icon: 'Image', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200', description: 'JPEG Image' },
  'png': { category: 'image', icon: 'Image', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200', description: 'PNG Image' },
  'gif': { category: 'image', icon: 'Image', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200', description: 'GIF Image' },
  'svg': { category: 'image', icon: 'Image', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200', description: 'SVG Vector' },
  'webp': { category: 'image', icon: 'Image', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200', description: 'WebP Image' },
  'bmp': { category: 'image', icon: 'Image', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200', description: 'Bitmap Image' },
  'ico': { category: 'image', icon: 'Image', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200', description: 'Icon File' },

  // Videos
  'mp4': { category: 'video', icon: 'Video', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200', description: 'MP4 Video' },
  'avi': { category: 'video', icon: 'Video', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200', description: 'AVI Video' },
  'mov': { category: 'video', icon: 'Video', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200', description: 'QuickTime Video' },
  'wmv': { category: 'video', icon: 'Video', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200', description: 'Windows Media Video' },
  'flv': { category: 'video', icon: 'Video', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200', description: 'Flash Video' },
  'webm': { category: 'video', icon: 'Video', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200', description: 'WebM Video' },
  'mkv': { category: 'video', icon: 'Video', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200', description: 'Matroska Video' },

  // Audio
  'mp3': { category: 'audio', icon: 'Music', color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', description: 'MP3 Audio' },
  'wav': { category: 'audio', icon: 'Music', color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', description: 'WAV Audio' },
  'flac': { category: 'audio', icon: 'Music', color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', description: 'FLAC Audio' },
  'ogg': { category: 'audio', icon: 'Music', color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', description: 'OGG Audio' },
  'aac': { category: 'audio', icon: 'Music', color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', description: 'AAC Audio' },
  'm4a': { category: 'audio', icon: 'Music', color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', description: 'M4A Audio' },

  // Documents
  'pdf': { category: 'document', icon: 'FileText', color: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-200', description: 'PDF Document' },
  'doc': { category: 'document', icon: 'FileText', color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', description: 'Word Document' },
  'docx': { category: 'document', icon: 'FileText', color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', description: 'Word Document' },
  'xls': { category: 'document', icon: 'Sheet', color: 'text-green-700', bgColor: 'bg-green-50', borderColor: 'border-green-200', description: 'Excel Spreadsheet' },
  'xlsx': { category: 'document', icon: 'Sheet', color: 'text-green-700', bgColor: 'bg-green-50', borderColor: 'border-green-200', description: 'Excel Spreadsheet' },
  'ppt': { category: 'document', icon: 'Presentation', color: 'text-orange-700', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', description: 'PowerPoint Presentation' },
  'pptx': { category: 'document', icon: 'Presentation', color: 'text-orange-700', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', description: 'PowerPoint Presentation' },
  'txt': { category: 'document', icon: 'FileText', color: 'text-gray-600', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', description: 'Text File' },
  'rtf': { category: 'document', icon: 'FileText', color: 'text-gray-600', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', description: 'Rich Text Format' },
  'csv': { category: 'data', icon: 'Database', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200', description: 'CSV Data' },

  // Code files
  'js': { category: 'code', icon: 'Code', color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200', description: 'JavaScript' },
  'jsx': { category: 'code', icon: 'Code', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', description: 'React JSX' },
  'ts': { category: 'code', icon: 'Code', color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', description: 'TypeScript' },
  'tsx': { category: 'code', icon: 'Code', color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', description: 'React TSX' },
  'html': { category: 'code', icon: 'Code', color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', description: 'HTML' },
  'css': { category: 'code', icon: 'Code', color: 'text-blue-500', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', description: 'CSS' },
  'scss': { category: 'code', icon: 'Code', color: 'text-pink-600', bgColor: 'bg-pink-50', borderColor: 'border-pink-200', description: 'SCSS' },
  'sass': { category: 'code', icon: 'Code', color: 'text-pink-600', bgColor: 'bg-pink-50', borderColor: 'border-pink-200', description: 'Sass' },
  'php': { category: 'code', icon: 'Code', color: 'text-purple-700', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', description: 'PHP' },
  'py': { category: 'code', icon: 'Code', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200', description: 'Python' },
  'java': { category: 'code', icon: 'Code', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200', description: 'Java' },
  'cpp': { category: 'code', icon: 'Code', color: 'text-blue-800', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', description: 'C++' },
  'c': { category: 'code', icon: 'Code', color: 'text-blue-800', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', description: 'C' },
  'h': { category: 'code', icon: 'Code', color: 'text-blue-800', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', description: 'C Header' },
  'cs': { category: 'code', icon: 'Code', color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', description: 'C#' },
  'rb': { category: 'code', icon: 'Code', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200', description: 'Ruby' },
  'go': { category: 'code', icon: 'Code', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', description: 'Go' },
  'rs': { category: 'code', icon: 'Code', color: 'text-orange-700', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', description: 'Rust' },
  'swift': { category: 'code', icon: 'Code', color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', description: 'Swift' },
  'kt': { category: 'code', icon: 'Code', color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', description: 'Kotlin' },
  'dart': { category: 'code', icon: 'Code', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', description: 'Dart' },
  'vue': { category: 'code', icon: 'Code', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200', description: 'Vue.js' },
  'svelte': { category: 'code', icon: 'Code', color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', description: 'Svelte' },

  'md': { category: 'document', icon: 'FileText', color: 'text-gray-700', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', description: 'Markdown' },
  'sql': { category: 'code', icon: 'Database', color: 'text-teal-600', bgColor: 'bg-teal-50', borderColor: 'border-teal-200', description: 'SQL' },
  'sh': { category: 'code', icon: 'Code', color: 'text-gray-700', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', description: 'Shell Script' },
  'bash': { category: 'code', icon: 'Code', color: 'text-gray-700', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', description: 'Bash Script' },
  'bat': { category: 'code', icon: 'Code', color: 'text-gray-700', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', description: 'Batch File' },
  'ps1': { category: 'code', icon: 'Code', color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', description: 'PowerShell' },
  'dockerfile': { category: 'code', icon: 'Code', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', description: 'Dockerfile' },
  'gradle': { category: 'code', icon: 'Code', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200', description: 'Gradle Build' },
  'makefile': { category: 'code', icon: 'Code', color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', description: 'Makefile' },
  'cmake': { category: 'code', icon: 'Code', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200', description: 'CMake' },
  'r': { category: 'code', icon: 'Code', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', description: 'R Script' },
  'scala': { category: 'code', icon: 'Code', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200', description: 'Scala' },
  'clj': { category: 'code', icon: 'Code', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200', description: 'Clojure' },
  'elm': { category: 'code', icon: 'Code', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', description: 'Elm' },
  'haskell': { category: 'code', icon: 'Code', color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', description: 'Haskell' },
  'hs': { category: 'code', icon: 'Code', color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', description: 'Haskell' },
  'erl': { category: 'code', icon: 'Code', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200', description: 'Erlang' },
  'ex': { category: 'code', icon: 'Code', color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', description: 'Elixir' },
  'nim': { category: 'code', icon: 'Code', color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200', description: 'Nim' },
  'zig': { category: 'code', icon: 'Code', color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', description: 'Zig' },

  // 3D and CAD Files
  'obj': { category: '3d', icon: 'Box', color: 'text-violet-600', bgColor: 'bg-violet-50', borderColor: 'border-violet-200', description: '3D Object' },
  'fbx': { category: '3d', icon: 'Box', color: 'text-violet-600', bgColor: 'bg-violet-50', borderColor: 'border-violet-200', description: '3D Model' },
  'dae': { category: '3d', icon: 'Box', color: 'text-violet-600', bgColor: 'bg-violet-50', borderColor: 'border-violet-200', description: 'Collada 3D' },
  'blend': { category: '3d', icon: 'Box', color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', description: 'Blender File' },
  '3ds': { category: '3d', icon: 'Box', color: 'text-violet-600', bgColor: 'bg-violet-50', borderColor: 'border-violet-200', description: '3DS Model' },
  'max': { category: '3d', icon: 'Box', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', description: '3ds Max' },
  'maya': { category: '3d', icon: 'Box', color: 'text-teal-600', bgColor: 'bg-teal-50', borderColor: 'border-teal-200', description: 'Maya Scene' },
  'mb': { category: '3d', icon: 'Box', color: 'text-teal-600', bgColor: 'bg-teal-50', borderColor: 'border-teal-200', description: 'Maya Binary' },
  'ma': { category: '3d', icon: 'Box', color: 'text-teal-600', bgColor: 'bg-teal-50', borderColor: 'border-teal-200', description: 'Maya ASCII' },
  'c4d': { category: '3d', icon: 'Box', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200', description: 'Cinema 4D' },
  'skp': { category: '3d', icon: 'Box', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200', description: 'SketchUp' },
  'ply': { category: '3d', icon: 'Box', color: 'text-violet-600', bgColor: 'bg-violet-50', borderColor: 'border-violet-200', description: 'Polygon File' },
  'stl': { category: '3d', icon: 'Box', color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', description: 'Stereolithography' },
  'gltf': { category: '3d', icon: 'Box', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200', description: 'glTF 3D' },
  'glb': { category: '3d', icon: 'Box', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200', description: 'glTF Binary' },

  // CAD Files
  'dwg': { category: '3d', icon: 'Ruler', color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', description: 'AutoCAD Drawing' },
  'dxf': { category: '3d', icon: 'Ruler', color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', description: 'CAD Exchange' },
  'step': { category: '3d', icon: 'Ruler', color: 'text-green-700', bgColor: 'bg-green-50', borderColor: 'border-green-200', description: 'STEP CAD' },
  'stp': { category: '3d', icon: 'Ruler', color: 'text-green-700', bgColor: 'bg-green-50', borderColor: 'border-green-200', description: 'STEP CAD' },
  'iges': { category: '3d', icon: 'Ruler', color: 'text-purple-700', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', description: 'IGES CAD' },
  'igs': { category: '3d', icon: 'Ruler', color: 'text-purple-700', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', description: 'IGES CAD' },

  // Design Files
  'psd': { category: 'design', icon: 'Palette', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', description: 'Photoshop' },
  'ai': { category: 'design', icon: 'Palette', color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', description: 'Illustrator' },
  'indd': { category: 'design', icon: 'Palette', color: 'text-pink-600', bgColor: 'bg-pink-50', borderColor: 'border-pink-200', description: 'InDesign' },
  'sketch': { category: 'design', icon: 'Palette', color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200', description: 'Sketch' },
  'fig': { category: 'design', icon: 'Palette', color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', description: 'Figma' },
  'figma': { category: 'design', icon: 'Palette', color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', description: 'Figma' },
  'xd': { category: 'design', icon: 'Palette', color: 'text-pink-600', bgColor: 'bg-pink-50', borderColor: 'border-pink-200', description: 'Adobe XD' },
  'afdesign': { category: 'design', icon: 'Palette', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', description: 'Affinity Designer' },
  'afphoto': { category: 'design', icon: 'Palette', color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', description: 'Affinity Photo' },

  // Font Files
  'ttf': { category: 'font', icon: 'Type', color: 'text-gray-700', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', description: 'TrueType Font' },
  'otf': { category: 'font', icon: 'Type', color: 'text-gray-700', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', description: 'OpenType Font' },
  'woff': { category: 'font', icon: 'Type', color: 'text-gray-700', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', description: 'Web Font' },
  'woff2': { category: 'font', icon: 'Type', color: 'text-gray-700', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', description: 'Web Font 2' },
  'eot': { category: 'font', icon: 'Type', color: 'text-gray-700', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', description: 'Embedded Font' },

  // Data Files
  'json': { category: 'data', icon: 'Database', color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200', description: 'JSON Data' },
  'xml': { category: 'data', icon: 'Database', color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', description: 'XML Data' },
  'tsv': { category: 'data', icon: 'Database', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200', description: 'TSV Data' },
  'yaml': { category: 'data', icon: 'Database', color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', description: 'YAML Data' },
  'toml': { category: 'data', icon: 'Database', color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', description: 'TOML Config' },
  'ini': { category: 'data', icon: 'Database', color: 'text-gray-600', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', description: 'INI Config' },
  'conf': { category: 'data', icon: 'Database', color: 'text-gray-600', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', description: 'Config File' },
  'config': { category: 'data', icon: 'Database', color: 'text-gray-600', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', description: 'Config File' },

  // System Files
  'log': { category: 'system', icon: 'FileText', color: 'text-gray-600', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', description: 'Log File' },
  'tmp': { category: 'system', icon: 'File', color: 'text-gray-500', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', description: 'Temporary File' },
  'cache': { category: 'system', icon: 'File', color: 'text-gray-500', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', description: 'Cache File' },
  'lock': { category: 'system', icon: 'Lock', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200', description: 'Lock File' },
  'env': { category: 'system', icon: 'Settings', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200', description: 'Environment' },
  'gitignore': { category: 'system', icon: 'GitBranch', color: 'text-gray-600', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', description: 'Git Ignore' },

  // Archives
  'zip': { category: 'archive', icon: 'Archive', color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', description: 'ZIP Archive' },
  'rar': { category: 'archive', icon: 'Archive', color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', description: 'RAR Archive' },
  '7z': { category: 'archive', icon: 'Archive', color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', description: '7-Zip Archive' },
  'tar': { category: 'archive', icon: 'Archive', color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', description: 'TAR Archive' },
  'gz': { category: 'archive', icon: 'Archive', color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', description: 'GZIP Archive' },
  'bz2': { category: 'archive', icon: 'Archive', color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', description: 'BZ2 Archive' },
  'xz': { category: 'archive', icon: 'Archive', color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', description: 'XZ Archive' },

  // Database
  'db': { category: 'other', icon: 'Database', color: 'text-teal-600', bgColor: 'bg-teal-50', borderColor: 'border-teal-200', description: 'Database File' },
  'sqlite': { category: 'other', icon: 'Database', color: 'text-teal-600', bgColor: 'bg-teal-50', borderColor: 'border-teal-200', description: 'SQLite Database' },
  'mdb': { category: 'other', icon: 'Database', color: 'text-teal-600', bgColor: 'bg-teal-50', borderColor: 'border-teal-200', description: 'Access Database' },

  // E-books
  'epub': { category: 'document', icon: 'BookOpen', color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', description: 'EPUB E-book' },
  'mobi': { category: 'document', icon: 'BookOpen', color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', description: 'Kindle E-book' },
  'azw': { category: 'document', icon: 'BookOpen', color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', description: 'Kindle E-book' },
  'azw3': { category: 'document', icon: 'BookOpen', color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', description: 'Kindle E-book' },

  // System files
  'exe': { category: 'other', icon: 'File', color: 'text-gray-700', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', description: 'Executable' },
  'msi': { category: 'other', icon: 'File', color: 'text-gray-700', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', description: 'Windows Installer' },
  'dmg': { category: 'archive', icon: 'Archive', color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', description: 'macOS Disk Image' },
  'iso': { category: 'archive', icon: 'Archive', color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', description: 'ISO Disk Image' },
};

export function getFileExtension(fileName: string): string {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
}

export function getFileTypeInfo(fileName: string, mimeType?: string): FileTypeInfo {
  const extension = getFileExtension(fileName);

  // Try to get info from extension first
  if (FILE_TYPE_MAP[extension]) {
    return FILE_TYPE_MAP[extension];
  }

  // Fall back to MIME type detection
  if (mimeType) {
    if (mimeType.startsWith('image/')) {
      return { category: 'image', icon: 'Image', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200', description: 'Image File' };
    }
    if (mimeType.startsWith('video/')) {
      return { category: 'video', icon: 'Video', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200', description: 'Video File' };
    }
    if (mimeType.startsWith('audio/')) {
      return { category: 'audio', icon: 'Music', color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', description: 'Audio File' };
    }
    if (mimeType.includes('text/') || mimeType.includes('document')) {
      return { category: 'document', icon: 'FileText', color: 'text-gray-600', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', description: 'Text Document' };
    }
    if (mimeType.includes('archive') || mimeType.includes('zip')) {
      return { category: 'archive', icon: 'Archive', color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', description: 'Archive File' };
    }
  }

  // Default fallback
  return { category: 'other', icon: 'File', color: 'text-gray-500', bgColor: 'bg-white', borderColor: 'border-gray-200', description: 'File' };
}

export function isImageFile(fileName: string, mimeType?: string): boolean {
  const fileInfo = getFileTypeInfo(fileName, mimeType);
  return fileInfo.category === 'image' || (mimeType?.startsWith('image/') ?? false);
}

export function isVideoFile(fileName: string, mimeType?: string): boolean {
  const fileInfo = getFileTypeInfo(fileName, mimeType);
  return fileInfo.category === 'video' || (mimeType?.startsWith('video/') ?? false);
}

export function isAudioFile(fileName: string, mimeType?: string): boolean {
  const fileInfo = getFileTypeInfo(fileName, mimeType);
  return fileInfo.category === 'audio' || (mimeType?.startsWith('audio/') ?? false);
}

export function isCodeFile(fileName: string): boolean {
  const fileInfo = getFileTypeInfo(fileName);
  return fileInfo.category === 'code';
}

export function isDocumentFile(fileName: string, mimeType?: string): boolean {
  const fileInfo = getFileTypeInfo(fileName, mimeType);
  return fileInfo.category === 'document';
}

export function isArchiveFile(fileName: string, mimeType?: string): boolean {
  const fileInfo = getFileTypeInfo(fileName, mimeType);
  return fileInfo.category === 'archive';
}

export function is3DFile(fileName: string, mimeType?: string): boolean {
  const fileInfo = getFileTypeInfo(fileName, mimeType);
  return fileInfo.category === '3d';
}

export function isDesignFile(fileName: string, mimeType?: string): boolean {
  const fileInfo = getFileTypeInfo(fileName, mimeType);
  return fileInfo.category === 'design';
}

export function isFontFile(fileName: string, mimeType?: string): boolean {
  const fileInfo = getFileTypeInfo(fileName, mimeType);
  return fileInfo.category === 'font';
}

export function isDataFile(fileName: string, mimeType?: string): boolean {
  const fileInfo = getFileTypeInfo(fileName, mimeType);
  return fileInfo.category === 'data';
}

export function isSystemFile(fileName: string, mimeType?: string): boolean {
  const fileInfo = getFileTypeInfo(fileName, mimeType);
  return fileInfo.category === 'system';
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    return 'Today';
  } else if (diffDays === 2) {
    return 'Yesterday';
  } else if (diffDays <= 7) {
    return `${diffDays - 1} days ago`;
  } else {
    return date.toLocaleDateString();
  }
}

export function getFileIcon(fileName: string, mimeType?: string): string {
  return getFileTypeInfo(fileName, mimeType).icon;
}

export function getFileColorClasses(fileName: string, mimeType?: string): {
  color: string;
  bgColor: string;
  borderColor: string;
} {
  const fileInfo = getFileTypeInfo(fileName, mimeType);
  return {
    color: fileInfo.color,
    bgColor: fileInfo.bgColor,
    borderColor: fileInfo.borderColor,
  };
}
