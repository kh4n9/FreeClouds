# 🔍 Free Clouds Preview System

## Overview

Free Clouds features a comprehensive file preview system that allows users to view and interact with various file types directly in the browser without downloading. The system includes intelligent type detection, security checks, and specialized preview components for different file categories.

## 🎯 Features

### ✅ Supported File Types

#### **Images**
- **Formats**: JPEG, PNG, GIF, WebP, SVG, TIFF, BMP, ICO
- **Features**: 
  - Zoom controls (25% - 300%)
  - Rotation (90° increments)
  - High-quality preview up to 50MB
  - Thumbnail generation in file grid
  - Animated GIF support

#### **Videos**
- **Formats**: MP4, WebM, OGG, QuickTime, AVI, WMV, FLV, MKV
- **Features**:
  - HTML5 video player with controls
  - Play/pause controls
  - Volume control and mute
  - Fullscreen support
  - Preview up to 500MB

#### **Audio**
- **Formats**: MP3, WAV, OGG, FLAC, AAC, M4A, WMA
- **Features**:
  - Audio player with controls
  - Play/pause controls
  - Volume control and mute
  - Waveform-style UI
  - Preview up to 100MB

#### **Documents**
- **PDF**: 
  - Embedded viewer with page navigation
  - Previous/Next page controls
  - Open in new tab option
  - Up to 50MB files
- **Text Files**: 
  - Plain text, HTML, CSS, JavaScript
  - Syntax highlighting for code
  - Up to 5MB files
- **Office Documents**:
  - Word, PowerPoint (external viewer)
  - Google Docs integration
  - Download option

#### **Data Files** ⚡ Enhanced Preview
- **CSV**: Table format with headers and pagination
- **JSON**: Syntax-highlighted structure view
- **XML**: Structured markup display
- **YAML**: Configuration file preview
- **Features**:
  - Switch between formatted and raw view
  - Table rendering for CSV (first 20 rows)
  - Syntax highlighting for JSON/XML
  - Up to 10MB for CSV, 5MB for others

#### **Spreadsheets**
- **Formats**: Excel (.xlsx, .xls), OpenDocument (.ods)
- **Features**:
  - Google Sheets integration
  - Download option
  - External viewer support

#### **Archives** 📦 Info Preview
- **Formats**: ZIP, RAR, 7-Zip, TAR, GZIP, BZIP2
- **Features**:
  - Archive type detection
  - File size information
  - Extraction recommendations
  - Secure handling

#### **3D Models** 🎲 Info Preview
- **Formats**: OBJ, STL, PLY, GLTF, GLB, FBX, DAE, 3DS
- **Features**:
  - Model type identification
  - Software recommendations (Blender, MeshLab, etc.)
  - 3D printing compatibility info

#### **Fonts** 🎨 Preview
- **Formats**: TTF, OTF, WOFF, WOFF2, EOT
- **Features**:
  - Font type identification
  - Sample text preview (system font)
  - Installation instructions
  - Typography showcase

#### **Email Files** 📧 Enhanced Preview
- **Formats**: EML, MSG, MBOX
- **Features**:
  - Header parsing (From, To, Subject, Date)
  - Email body display
  - Formatted email layout
  - Metadata extraction

#### **Calendar Files** 📅 Enhanced Preview
- **Formats**: ICS, VCS, VCF
- **Features**:
  - Event listing with details
  - Date/time formatting
  - Location and organizer info
  - Event description display

#### **CAD Files** 📐 Info Preview
- **Formats**: AutoCAD (DWG, DXF), STEP, IGES
- **Features**:
  - CAD type identification
  - Compatible software recommendations
  - Professional workflow guidance

#### **Code Files** 💻 Text Preview
- **Languages**: TypeScript, JavaScript, Python, Java, C/C++, PHP, Ruby, Go, Rust, Swift, Kotlin, Scala, R, SQL, Shell scripts
- **Features**:
  - Syntax highlighting
  - Language detection
  - File structure display
  - Up to 5MB files

#### **Executable Files** ⚠️ Security Preview
- **Formats**: EXE, MSI, DEB, RPM, DMG, PKG, JAR, APP
- **Features**:
  - Security warnings
  - File type identification
  - Antivirus recommendations
  - Cautious download options

## 🛡️ Security Features

### File Type Validation
- MIME type verification
- Extension-based detection
- Malicious file blocking

### Size Limits
- **Images**: 50MB maximum
- **Videos**: 500MB maximum
- **Audio**: 100MB maximum
- **Documents**: 50MB for PDF, 5MB for text
- **Data**: 10MB for CSV, 5MB for JSON/XML

### Executable Protection
- Automatic blocking of executable files
- Security warnings for risky file types
- No preview for potentially dangerous files

### Rate Limiting
- Preview request throttling
- Download rate limiting
- API endpoint protection

## 🎨 User Interface

### Preview Modal
- **Full-screen overlay** with dark backdrop
- **Responsive design** for mobile and desktop
- **Keyboard shortcuts** (ESC to close)
- **Touch gestures** for mobile devices

### Control Bar
- **File information** (name, size, date, type)
- **Action buttons** (download, external links)
- **Type-specific controls** (zoom, rotate, play/pause)
- **Preview status indicators**

### Preview Indicators
- **Color-coded badges** for file types
- **Preview capability icons**:
  - 🟦 Blue: Images
  - 🟣 Purple: Videos
  - 🟢 Pink: Audio
  - 🟢 Green: Text/PDF
  - 🟡 Yellow: Archives
  - 🔵 Cyan: 3D Models
  - 🟠 Orange: CAD files
  - ⚠️ Red: Security risks
- **Enhanced preview indicators** (⚡ icon for special handling)

### File Grid Integration
- **Thumbnail previews** for images
- **Preview status badges** in compact mode
- **Hover tooltips** with capability info
- **Quick preview buttons** on hover

## 🔧 Technical Implementation

### Architecture
```
components/
├── FilePreview.tsx              # Main preview modal
├── preview/
│   └── SpecializedPreviews.tsx  # Type-specific components
├── PreviewIndicator.tsx         # Status indicators
└── FileGrid.tsx                 # Grid integration

lib/
├── file-utils.ts                # Basic file utilities
└── file-preview-utils.ts        # Enhanced preview logic
```

### Type Detection
1. **Primary**: MIME type from server
2. **Secondary**: File extension mapping
3. **Fallback**: Content analysis

### Preview Capability Detection
```typescript
interface PreviewCapability {
  canPreview: boolean;
  previewType: string;
  requiresSpecialHandling: boolean;
  maxPreviewSize: number;
  description: string;
  recommendations?: string[];
}
```

### Security Implementation
- File type validation before preview
- Size limit enforcement
- Content security policy
- Safe iframe handling for PDFs

## 📱 Mobile Experience

### Responsive Design
- **Touch-friendly controls** with larger buttons
- **Swipe gestures** for navigation
- **Pinch-to-zoom** for images
- **Mobile-optimized layouts**

### Performance Optimization
- **Lazy loading** for large files
- **Progressive image loading**
- **Thumbnail caching**
- **Bandwidth-aware quality adjustment**

## 🚀 Performance Features

### Caching
- **Browser caching** for frequently accessed files
- **Thumbnail cache** with cleanup
- **Preview state persistence**

### Loading Optimization
- **Progressive loading** for large files
- **Background prefetch** for next/prev files
- **Compression** for text-based previews
- **Streaming** for video content

### Memory Management
- **Automatic cleanup** of blob URLs
- **Image compression** for previews
- **Garbage collection** for large objects

## 🔍 Usage Examples

### Basic Preview
```typescript
// Open preview modal
<FilePreview
  file={fileData}
  isOpen={showPreview}
  onClose={() => setShowPreview(false)}
  onDownload={handleDownload}
/>
```

### Preview Indicators
```typescript
// Show preview capability
<PreviewIndicator
  fileName="document.pdf"
  fileSize={1024000}
  mimeType="application/pdf"
/>

// Compact status badge
<PreviewStatusBadge
  fileName="image.jpg"
  fileSize={2048000}
  mimeType="image/jpeg"
  compact={true}
/>
```

### Capability Check
```typescript
import { canPreviewFile, getPreviewCapability } from '@/lib/file-preview-utils';

// Check if file can be previewed
const canPreview = canPreviewFile('document.pdf', 1024000, 'application/pdf');

// Get detailed capability info
const capability = getPreviewCapability('image.jpg', 'image/jpeg');
console.log(capability.description); // "Image preview with zoom and rotation controls"
```

## 📊 Analytics & Monitoring

### Usage Metrics
- Preview open rates by file type
- Most previewed file formats
- Preview session duration
- Error rates and types

### Performance Monitoring
- Preview load times
- Memory usage patterns
- Bandwidth consumption
- Cache hit rates

## 🔮 Future Enhancements

### Planned Features
- **Real 3D model viewer** with WebGL
- **PDF annotation tools**
- **Video thumbnails** and chapter support
- **Audio waveform visualization**
- **Collaborative preview** with comments
- **AI-powered content analysis**

### Extended Format Support
- **DICOM medical images**
- **GIS map files** (KML, GPX)
- **Scientific data** (HDF5, NetCDF)
- **Vector graphics** (AI, EPS)
- **eBook formats** (EPUB, MOBI)

## 🛠️ Development Guidelines

### Adding New File Types
1. Update `EXTENSION_TO_MIME` mapping
2. Add `PreviewCapability` configuration
3. Create specialized preview component if needed
4. Update security checks
5. Add UI indicators and icons
6. Test with various file sizes
7. Update documentation

### Security Considerations
- Always validate file types
- Implement size limits
- Use sandboxed iframes for untrusted content
- Never execute or directly render executable content
- Implement CSP headers
- Regular security audits

### Performance Best Practices
- Implement progressive loading
- Use efficient image formats
- Cache aggressively but clean up
- Monitor memory usage
- Optimize for mobile networks
- Compress preview data

## 🐛 Troubleshooting

### Common Issues

**Preview not loading**
- Check file size limits
- Verify MIME type detection
- Ensure network connectivity
- Check browser compatibility

**Security warnings**
- Review file extension
- Check if file type is blocked
- Verify file integrity
- Use antivirus scan

**Performance issues**
- Monitor file sizes
- Check cache status
- Review memory usage
- Optimize network conditions

### Debug Commands
```bash
# Check file type detection
console.log(getPreviewCapability('file.pdf'));

# Test preview capability
console.log(canPreviewFile('image.jpg', 2000000));

# Monitor performance
console.time('preview-load');
// ... preview operations
console.timeEnd('preview-load');
```

## 📞 Support & Feedback

For technical issues or feature requests related to the preview system:

1. **Check this documentation** for implementation details
2. **Review browser console** for error messages
3. **Test with different file types** to isolate issues
4. **Check file size limits** and format support
5. **Report bugs** with file type and browser info

---

**Free Clouds Preview System** - Comprehensive file viewing without downloads
*Built with security, performance, and user experience in mind*

**Version**: 2.0.0  
**Last Updated**: December 2024  
**Maintainer**: Hoàng Minh Khang