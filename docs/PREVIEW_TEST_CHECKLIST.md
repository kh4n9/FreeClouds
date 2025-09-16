# 🧪 Preview System Test Checklist

## Overview
This document provides a comprehensive testing checklist for the Free Clouds preview system to ensure all file types and features work correctly.

## 📋 Pre-Test Setup

### Environment Verification
- [ ] Application running on development server
- [ ] MongoDB connected and accessible
- [ ] Email configuration working (.env.local setup)
- [ ] User authenticated and logged in
- [ ] Sample files uploaded for each category

### Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

## 🖼️ Image Files Testing

### Supported Formats
- [ ] **JPEG (.jpg, .jpeg)** - Test with various sizes (small, medium, large)
- [ ] **PNG (.png)** - Test with transparency
- [ ] **GIF (.gif)** - Test animated GIFs
- [ ] **WebP (.webp)** - Modern format support
- [ ] **SVG (.svg)** - Vector graphics
- [ ] **TIFF (.tiff, .tif)** - High-quality images
- [ ] **BMP (.bmp)** - Bitmap images
- [ ] **ICO (.ico)** - Icon files

### Image Features Testing
- [ ] **Thumbnails** appear in file grid
- [ ] **Preview modal** opens on click
- [ ] **Zoom controls** work (25% - 300%)
  - [ ] Zoom in button increases size
  - [ ] Zoom out button decreases size
  - [ ] Zoom percentage displays correctly
- [ ] **Rotation controls** work (90° increments)
  - [ ] Rotate clockwise button
  - [ ] Image orientation changes correctly
- [ ] **Reset view** button restores original zoom/rotation
- [ ] **Download** button works from preview
- [ ] **Large images** (>10MB) load correctly
- [ ] **Preview indicators** show correct status
- [ ] **Mobile touch** zoom and pan work

## 🎥 Video Files Testing

### Supported Formats
- [ ] **MP4 (.mp4)** - Most common format
- [ ] **WebM (.webm)** - Web-optimized format
- [ ] **OGG (.ogv, .ogg)** - Open format
- [ ] **QuickTime (.mov)** - Apple format
- [ ] **AVI (.avi)** - Legacy format
- [ ] **WMV (.wmv)** - Windows format
- [ ] **FLV (.flv)** - Flash video
- [ ] **MKV (.mkv)** - Matroska format

### Video Features Testing
- [ ] **HTML5 player** loads correctly
- [ ] **Play/Pause** controls work
- [ ] **Volume control** and mute work
- [ ] **Fullscreen** mode works
- [ ] **Custom controls** in preview modal work
- [ ] **Seeking** through video timeline
- [ ] **Auto-play** behavior (should not auto-play)
- [ ] **Large videos** (>100MB) stream properly
- [ ] **Mobile playback** works correctly

## 🎵 Audio Files Testing

### Supported Formats
- [ ] **MP3 (.mp3)** - Common compressed format
- [ ] **WAV (.wav)** - Uncompressed format
- [ ] **OGG (.ogg)** - Open format
- [ ] **FLAC (.flac)** - Lossless format
- [ ] **AAC (.aac)** - Advanced Audio Coding
- [ ] **M4A (.m4a)** - Apple format
- [ ] **WMA (.wma)** - Windows format

### Audio Features Testing
- [ ] **Audio player** displays with album art area
- [ ] **Play/Pause** controls work
- [ ] **Volume control** and mute work
- [ ] **Progress bar** shows playback position
- [ ] **Time display** shows current/total time
- [ ] **Audio info** displays (file name, size)
- [ ] **Background playback** continues when scrolling
- [ ] **Mobile audio** controls work

## 📄 Document Files Testing

### PDF Documents
- [ ] **PDF (.pdf)** files open in embedded viewer
- [ ] **Page navigation** controls work
  - [ ] Previous page button
  - [ ] Next page button
  - [ ] Page counter displays correctly
- [ ] **Open in new tab** button works
- [ ] **Large PDFs** (>20MB) load progressively
- [ ] **Protected PDFs** show appropriate message
- [ ] **Mobile PDF** viewing is responsive

### Text Files
- [ ] **Plain text (.txt)** displays with formatting
- [ ] **HTML (.html, .htm)** shows source code
- [ ] **CSS (.css)** shows with syntax highlighting
- [ ] **JavaScript (.js)** shows with syntax highlighting
- [ ] **JSON (.json)** shows formatted structure
- [ ] **XML (.xml)** shows with proper formatting
- [ ] **Markdown (.md)** displays as text
- [ ] **Large text files** (>1MB) handle correctly

### Code Files
- [ ] **TypeScript (.ts, .tsx)** with syntax highlighting
- [ ] **JavaScript (.js, .jsx)** with syntax highlighting
- [ ] **Python (.py)** with syntax highlighting
- [ ] **Java (.java)** with syntax highlighting
- [ ] **C/C++ (.c, .cpp, .h)** with syntax highlighting
- [ ] **PHP (.php)** with syntax highlighting
- [ ] **Ruby (.rb)** with syntax highlighting
- [ ] **Go (.go)** with syntax highlighting
- [ ] **Rust (.rs)** with syntax highlighting
- [ ] **SQL (.sql)** with syntax highlighting

## 💾 Data Files Testing

### CSV Files
- [ ] **CSV (.csv)** displays as formatted table
- [ ] **Headers** are properly identified
- [ ] **Data rows** display correctly
- [ ] **Large CSV** files show pagination message
- [ ] **Raw/Formatted** view toggle works
- [ ] **Special characters** in CSV handled correctly

### JSON Files
- [ ] **JSON (.json)** displays with syntax highlighting
- [ ] **Nested objects** are properly formatted
- [ ] **Arrays** display correctly
- [ ] **Invalid JSON** shows error message
- [ ] **Large JSON** files (>1MB) load correctly

### XML Files
- [ ] **XML (.xml)** displays with structure
- [ ] **Nested elements** show hierarchy
- [ ] **Attributes** are visible
- [ ] **Malformed XML** shows error message

## 📊 Office Documents Testing

### Microsoft Office
- [ ] **Word (.doc, .docx)** shows info preview
- [ ] **Excel (.xls, .xlsx)** shows spreadsheet options
- [ ] **PowerPoint (.ppt, .pptx)** shows presentation info
- [ ] **Google Docs** integration link works
- [ ] **Google Sheets** integration link works
- [ ] **Download** option available
- [ ] **File info** displays correctly

### OpenDocument
- [ ] **ODT (.odt)** text documents
- [ ] **ODS (.ods)** spreadsheets
- [ ] **ODP (.odp)** presentations

## 📦 Archive Files Testing

### Archive Formats
- [ ] **ZIP (.zip)** shows archive info
- [ ] **RAR (.rar)** shows archive info
- [ ] **7-Zip (.7z)** shows archive info
- [ ] **TAR (.tar)** shows archive info
- [ ] **GZIP (.gz)** shows archive info
- [ ] **BZIP2 (.bz2)** shows archive info

### Archive Features
- [ ] **Archive type** correctly identified
- [ ] **File size** information shown
- [ ] **Extraction recommendations** displayed
- [ ] **Security warnings** for executable archives
- [ ] **Download** option available

## 🎲 3D Model Files Testing

### 3D Formats
- [ ] **OBJ (.obj)** shows 3D model info
- [ ] **STL (.stl)** shows 3D printing info
- [ ] **PLY (.ply)** polygon format
- [ ] **GLTF (.gltf, .glb)** web 3D format
- [ ] **FBX (.fbx)** Autodesk format
- [ ] **DAE (.dae)** COLLADA format
- [ ] **3DS (.3ds)** 3D Studio format

### 3D Model Features
- [ ] **Model type** correctly identified
- [ ] **Software recommendations** displayed
- [ ] **3D printing** compatibility noted (for STL)
- [ ] **File size** and complexity info shown

## 🎨 Font Files Testing

### Font Formats
- [ ] **TrueType (.ttf)** font info
- [ ] **OpenType (.otf)** font info
- [ ] **Web fonts (.woff, .woff2)** info
- [ ] **EOT (.eot)** embedded fonts

### Font Features
- [ ] **Font type** correctly identified
- [ ] **Sample text** preview shown
- [ ] **Typography showcase** displayed
- [ ] **Installation instructions** provided

## 📧 Email Files Testing

### Email Formats
- [ ] **EML (.eml)** email messages
- [ ] **MSG (.msg)** Outlook messages
- [ ] **MBOX (.mbox)** mailbox files

### Email Features
- [ ] **Headers parsed** correctly (From, To, Subject, Date)
- [ ] **Email body** displays properly
- [ ] **HTML emails** render safely
- [ ] **Attachments** are noted (if present)
- [ ] **Large emails** load correctly

## 📅 Calendar Files Testing

### Calendar Formats
- [ ] **ICS (.ics)** calendar events
- [ ] **VCS (.vcs)** vCalendar format
- [ ] **VCF (.vcf)** vCard contacts

### Calendar Features
- [ ] **Events listed** with details
- [ ] **Date/time** formatting correct
- [ ] **Event descriptions** show properly
- [ ] **Location and organizer** info displayed
- [ ] **Multiple events** in single file handled

## 📐 CAD Files Testing

### CAD Formats
- [ ] **AutoCAD (.dwg, .dxf)** files
- [ ] **STEP (.step, .stp)** files
- [ ] **IGES (.iges, .igs)** files

### CAD Features
- [ ] **CAD type** correctly identified
- [ ] **Software recommendations** provided
- [ ] **Professional workflow** guidance shown
- [ ] **Technical specifications** noted

## ⚠️ Security & Executable Testing

### Executable Files
- [ ] **Windows (.exe, .msi)** blocked from preview
- [ ] **Linux (.deb, .rpm)** blocked from preview
- [ ] **Java (.jar)** shows security warning
- [ ] **Scripts (.bat, .sh, .ps1)** blocked appropriately
- [ ] **Security warnings** display prominently
- [ ] **Download with caution** option available

### Security Features
- [ ] **File type validation** works correctly
- [ ] **MIME type verification** functions
- [ ] **Extension-based blocking** active
- [ ] **Size limits** enforced per file type
- [ ] **Rate limiting** prevents abuse

## 🎯 Preview Indicators Testing

### Indicator Types
- [ ] **Blue indicators** for images
- [ ] **Purple indicators** for videos
- [ ] **Pink indicators** for audio
- [ ] **Green indicators** for text/PDF
- [ ] **Yellow indicators** for archives
- [ ] **Red indicators** for security risks
- [ ] **Enhanced preview badges** (⚡ icon) show correctly

### Indicator Features
- [ ] **Hover tooltips** show capability info
- [ ] **File grid integration** works
- [ ] **List view integration** works
- [ ] **Compact mode** displays correctly
- [ ] **Status badges** are accurate

## 📱 Mobile & Responsive Testing

### Mobile Preview
- [ ] **Touch controls** work on mobile
- [ ] **Pinch-to-zoom** for images
- [ ] **Swipe gestures** for navigation
- [ ] **Mobile modal** sizing correct
- [ ] **Landscape/portrait** modes work
- [ ] **Mobile performance** acceptable

### Responsive Design
- [ ] **Small screens** (320px+) work
- [ ] **Tablet screens** (768px+) work
- [ ] **Desktop screens** (1024px+) work
- [ ] **Large screens** (1440px+) work
- [ ] **Controls** remain accessible at all sizes

## 🚀 Performance Testing

### Load Times
- [ ] **Small files** (<1MB) load instantly
- [ ] **Medium files** (1-10MB) load within 3 seconds
- [ ] **Large files** (10-50MB) show progress indicator
- [ ] **Very large files** (>50MB) handled gracefully (show clear error or fallback)

### Memory Usage
- [ ] **Multiple previews** don't cause memory leaks
- [ ] **Large images** are compressed for preview
- [ ] **Video streaming** doesn't buffer excessively
- [ ] **Browser tab** doesn't crash with large files

### Network Optimization
- [ ] **Progressive loading** for large files
- [ ] **Caching** works for frequently accessed files
- [ ] **Bandwidth adaptation** for slow connections
- [ ] **Offline behavior** handles gracefully

## 🔧 Error Handling Testing

### Error Scenarios
- [ ] **Corrupted files** show appropriate error
- [ ] **Network failures** display retry option
- [ ] **Unsupported formats** show clear message
- [ ] **File too large** displays size limit info
- [ ] **Permission denied** shows access error
- [ ] **Server errors** handled gracefully

### User Experience
- [ ] **Error messages** are user-friendly
- [ ] **Recommendations** provided for alternatives
- [ ] **Fallback options** always available
- [ ] **Loading states** show appropriate feedback

## 🎨 UI/UX Testing

### Visual Design
- [ ] **Modal appearance** matches design system
- [ ] **Loading animations** are smooth
- [ ] **Button states** (hover, active, disabled) work
- [ ] **Color coding** is consistent
- [ ] **Typography** is readable at all sizes

### User Interaction
- [ ] **Keyboard shortcuts** work (ESC to close)
- [ ] **Focus management** for accessibility
- [ ] **Mouse interactions** are intuitive
- [ ] **Touch interactions** feel natural

## 🧪 Integration Testing

### API Integration
- [ ] **File download API** works correctly
- [ ] **Authentication** required for private files
- [ ] **Rate limiting** functions properly
- [ ] **Error responses** handled correctly

### Component Integration
- [ ] **FileGrid** integration seamless
- [ ] **Preview indicators** sync with capabilities
- [ ] **File type detection** consistent across components
- [ ] **State management** works correctly

## 🔍 Accessibility Testing

### Screen Reader Support
- [ ] **Alt text** for images
- [ ] **ARIA labels** for controls
- [ ] **Focus indicators** visible
- [ ] **Keyboard navigation** works

### Color & Contrast
- [ ] **Color blind** users can distinguish indicators
- [ ] **High contrast** mode supported
- [ ] **Text readability** meets WCAG standards

## 📊 Test Results Documentation

### Test Execution
- [ ] **Date tested**: ___________
- [ ] **Browser**: ___________
- [ ] **Operating System**: ___________
- [ ] **Screen Resolution**: ___________
- [ ] **Network Speed**: ___________

### Issues Found
| Issue | Severity | File Type | Description | Status |
|-------|----------|-----------|-------------|--------|
|       |          |           |             |        |

### Performance Metrics
| File Type | Size | Load Time | Memory Usage | Notes |
|-----------|------|-----------|--------------|-------|
|           |      |           |              |       |

## ✅ Sign-off

### Test Completion
- [ ] All critical features tested
- [ ] Major issues resolved
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Mobile experience tested
- [ ] Documentation updated

**Tester Name**: ___________  
**Date**: ___________  
**Signature**: ___________

---

## 📞 Reporting Issues

When reporting issues, include:
1. **Browser and version**
2. **Operating system**
3. **File type and size**
4. **Steps to reproduce**
5. **Expected vs actual behavior**
6. **Screenshots or recordings**
7. **Console error messages**

## 🔄 Continuous Testing

This checklist should be run:
- [ ] **Before each release**
- [ ] **After adding new file types**
- [ ] **When updating preview components**
- [ ] **Monthly for regression testing**
- [ ] **After security updates**

---

**Free Clouds Preview System Test Checklist**  
*Ensuring quality file preview experience*

**Version**: 1.0.0  
**Last Updated**: December 2024  
**Maintainer**: Hoàng Minh Khang