# Changelog

All notable changes to **Free Clouds** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2024-12-19

### 🎉 Major Release - Complete Preview System

#### Added
- **🔍 Comprehensive File Preview System**
  - Support for 14+ file categories with 50+ file formats
  - Real-time preview without downloading
  - Security scanning and malware protection
  - Interactive controls (zoom, rotate, play/pause)
  - Mobile-optimized touch controls

- **🖼️ Image Preview Features**
  - High-resolution preview up to 50MB
  - Zoom controls (25% - 300%)
  - Rotation in 90° increments
  - Thumbnail generation in file grid
  - Support: JPEG, PNG, GIF, WebP, SVG, TIFF, BMP, ICO

- **🎥 Video & Audio Preview**
  - HTML5 video player with full controls
  - Custom audio player with waveform UI
  - Fullscreen video support
  - Volume control and mute functionality
  - Support: MP4, WebM, AVI, MOV, MP3, WAV, FLAC, AAC

- **📄 Document Preview**
  - PDF viewer with page navigation
  - Syntax highlighting for code files
  - Text file preview up to 5MB
  - Office document integration with Google Docs/Sheets
  - Support: PDF, TXT, HTML, CSS, JS, TS, Python, Java, C++, PHP, etc.

- **💾 Enhanced Data File Preview**
  - CSV files displayed as formatted tables
  - JSON with syntax highlighting and structure view
  - XML with proper formatting and hierarchy
  - YAML configuration file preview
  - Raw/formatted view toggle

- **📧 Email & Calendar Preview**
  - EML/MSG email parsing with headers
  - Email body display with safe HTML rendering
  - ICS calendar events with detailed information
  - vCard contact preview
  - Date/time formatting and event descriptions

- **📦 Specialized File Type Support**
  - Archive info (ZIP, RAR, 7Z) with extraction guidance
  - 3D model info (OBJ, STL, GLTF) with software recommendations
  - Font preview (TTF, OTF, WOFF) with typography samples
  - CAD file info (DWG, DXF, STEP) with professional workflow guidance
  - Spreadsheet integration with Google Sheets

- **🛡️ Advanced Security Features**
  - Executable file detection and blocking
  - MIME type verification and validation
  - File size limits per category
  - Security warnings for potentially dangerous files
  - Safe preview environment with sandboxing

- **🎯 Preview Indicators System**
  - Color-coded file type badges
  - Preview capability indicators
  - Enhanced preview badges (⚡ icon)
  - Hover tooltips with detailed information
  - Compact mode for mobile devices

#### Enhanced
- **📱 Mobile Experience**
  - Touch-friendly preview controls
  - Pinch-to-zoom for images
  - Swipe gestures for navigation
  - Responsive modal layouts
  - Mobile-optimized file grid

- **🚀 Performance Optimizations**
  - Progressive loading for large files
  - Memory leak prevention
  - Blob URL cleanup automation
  - Request cancellation on component unmount
  - Optimized re-render prevention

- **🎨 UI/UX Improvements**
  - Full-screen preview modals
  - Consistent design system
  - Loading states and progress indicators
  - Error handling with user-friendly messages
  - Accessibility improvements (ARIA labels, keyboard navigation)

#### Fixed
- **🔄 Preview System Stability**
  - Fixed infinite re-render loops in FilePreview
  - Resolved memory leaks in blob URL handling
  - Prevented multiple simultaneous file loads
  - Optimized useEffect dependency arrays
  - Stable component keys for better performance

- **🛠️ Technical Improvements**
  - Enhanced file type detection accuracy
  - Better error handling and user feedback
  - Improved cleanup functions
  - Optimized state management
  - Performance monitoring and debugging tools

### Documentation
- **📚 Comprehensive Documentation**
  - `PREVIEW_SYSTEM.md` - Complete preview system guide
  - `PREVIEW_TEST_CHECKLIST.md` - Testing procedures and quality assurance
  - `EMAIL_SETUP.md` - Email configuration guide
  - Updated README with preview features
  - Component documentation and usage examples

---

## [1.5.0] - 2024-12-15

### Added
- **🔐 Enhanced Security Features**
  - Forgot password functionality with email verification
  - Account deletion with Gmail verification codes
  - Rate limiting on sensitive endpoints
  - Email verification with TTL and usage tracking

- **📧 Email Integration**
  - Nodemailer integration for Gmail
  - Styled email templates (Vietnamese localization)
  - Environment variable configuration
  - Professional email layouts with branding

- **🎨 Branding Updates**
  - Rebranded from "Free Cloud" to "Free Clouds"
  - Updated all UI components and documentation
  - Consistent branding across application
  - Professional logo and styling

- **🏗️ Infrastructure Improvements**
  - MongoDB TTL indexes for automatic cleanup
  - Enhanced error handling and logging
  - Improved API response structures
  - Better validation and security checks

### Enhanced
- **🖼️ File Visualization**
  - Enhanced FileGrid with file type differentiation
  - Image thumbnails and preview capabilities
  - File type badges and filtering
  - Improved file organization and display

- **👤 User Experience**
  - Responsive footer with attribution
  - Better mobile experience
  - Improved navigation and accessibility
  - Enhanced error messages and user feedback

### Fixed
- **🐛 Bug Fixes**
  - Import/export issues with rate limiting
  - User model consistency
  - Authentication token handling
  - Database connection stability

---

## [1.0.0] - 2024-12-01

### 🎉 Initial Release

#### Core Features
- **☁️ Cloud Storage**
  - File upload and download
  - Folder organization
  - File management (rename, delete, move)
  - Storage quota tracking

- **🔐 Authentication & Security**
  - JWT-based authentication
  - Secure password hashing with bcrypt
  - Session management
  - CSRF protection

- **🗂️ File Management**
  - Drag and drop file upload
  - Multiple file selection
  - File type validation
  - Size limit enforcement

- **📁 Folder System**
  - Create, rename, delete folders
  - Nested folder structure
  - Folder navigation breadcrumbs
  - Move files between folders

- **🎨 User Interface**
  - Modern, responsive design
  - Dark/light theme support
  - Mobile-friendly interface
  - Intuitive navigation

- **⚡ Performance**
  - Optimized file handling
  - Progressive loading
  - Efficient database queries
  - Caching strategies

#### Technical Stack
- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT tokens, bcrypt
- **File Storage**: Telegram Bot API integration
- **Deployment**: Vercel-ready configuration

#### Development Tools
- **Code Quality**: ESLint, TypeScript strict mode
- **Styling**: Tailwind CSS with custom components
- **Icons**: Lucide React icon library
- **Forms**: Zod validation
- **Email**: Nodemailer integration

---

## Development Roadmap

### 🔮 Upcoming Features (v2.1.0)
- **🎮 Real-time Collaboration**
  - Live file sharing
  - Collaborative editing
  - Real-time notifications
  - User presence indicators

- **🔍 Advanced Search**
  - Full-text search in documents
  - Metadata search
  - Filter combinations
  - Search history

- **📊 Analytics Dashboard**
  - Storage usage analytics
  - File access patterns
  - User activity tracking
  - Performance metrics

- **🤖 AI Integration**
  - Smart file organization
  - Content analysis
  - Automatic tagging
  - Image recognition

### 🎯 Long-term Goals (v3.0.0)
- **🌐 Multi-tenant Support**
  - Organization accounts
  - Team collaboration
  - Permission management
  - Workspace isolation

- **🔌 Third-party Integrations**
  - Google Drive sync
  - Dropbox integration
  - OneDrive compatibility
  - API for external apps

- **🛡️ Enterprise Security**
  - Two-factor authentication
  - Single sign-on (SSO)
  - Audit logs
  - Compliance features

---

## Migration Guides

### Upgrading from v1.x to v2.0
1. **Database Updates**
   - Run migration scripts for new preview system
   - Update MongoDB indexes
   - Configure TTL collections

2. **Environment Variables**
   - Add email configuration variables
   - Update JWT secrets
   - Configure preview system limits

3. **Dependencies**
   - Update to latest Next.js 14
   - Install new preview dependencies
   - Update TypeScript types

### Breaking Changes
- **v2.0.0**: Preview system requires new MongoDB collections
- **v1.5.0**: Branding changes require UI updates
- **v1.0.0**: Initial release baseline

---

## Contributors

### Core Team
- **Hoàng Minh Khang** - *Lead Developer & Project Creator*
  - Full-stack development
  - System architecture
  - UI/UX design
  - Documentation

### Special Thanks
- MongoDB community for database solutions
- Next.js team for the amazing framework
- Tailwind CSS for styling system
- Open source community for inspiration

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Support

### Getting Help
- **📖 Documentation**: Check our comprehensive docs
- **🐛 Bug Reports**: Create GitHub issues
- **💡 Feature Requests**: Submit enhancement proposals
- **💬 Community**: Join our discussions

### Contact
- **Email**: support@freeclouds.dev
- **Website**: https://freeclouds.dev
- **GitHub**: https://github.com/hoangminhkhang/free-clouds

---

**Free Clouds** - *Your secure, feature-rich cloud storage solution*

*Built with ❤️ by Hoàng Minh Khang*