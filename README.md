# 🌟 Free Clouds - Next.js 14

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4-38B2AC)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.5-green)](https://www.mongodb.com/)
[![Telegram Bot API](https://img.shields.io/badge/Telegram%20Bot%20API-Latest-2CA5E0)](https://core.telegram.org/bots/api)

A modern, secure cloud storage application built with Next.js 14, TypeScript, and Telegram Bot API. Store, organize, and access your files securely with enterprise-grade authentication, advanced folder management, and comprehensive user profile controls.

## ✨ Features

### 🌍 SEO & Multilingual Support
- **Bilingual Support** - Full English and Vietnamese language support
- **Advanced SEO** - Dynamic metadata, structured data (JSON-LD), Open Graph
- **International SEO** - Hreflang tags, multilingual sitemaps, canonical URLs
- **Performance Optimized** - Core Web Vitals optimization, image optimization
- **PWA Ready** - Progressive Web App with offline support and app-like experience
- **Analytics Ready** - Google Analytics 4 integration and Search Console setup

### 🔐 Authentication & Security
- **Secure Authentication** - JWT-based auth with HTTP-only cookies
- **Password Security** - bcryptjs hashing with salt rounds
- **Session Management** - Automatic session handling and secure logout
- **CSRF Protection** - Origin validation and secure headers
- **Rate Limiting** - API abuse prevention with IP-based limits

### 📁 Advanced Folder Management
- **Hierarchical Folders** - Create unlimited nested folder structures
- **Recursive Operations** - Delete folders with all contents automatically
- **Folder Statistics** - Real-time folder and file counts
- **Folder Tree Navigation** - Interactive sidebar with expand/collapse
- **Bulk Operations** - Multi-level folder deletion with progress tracking

### 📤 File Upload & Management
- **Drag & Drop Upload** - Modern file upload with progress tracking
- **Multiple File Upload** - Upload several files simultaneously
- **File Organization** - Upload directly to specific folders
- **File Preview** - Grid and list view with detailed metadata
- **Download Management** - Direct file downloads from Telegram storage

### 🔍 Search & Navigation
- **Global Search** - Find files across all folders instantly
- **Advanced Filtering** - Filter by file type, size, and date
- **All Files View** - See all files regardless of folder location
- **Smart Navigation** - Breadcrumb navigation and folder shortcuts

### 👤 User Profile Management
- **Profile Editing** - Update name and email with validation
- **Password Changes** - Secure password updates with current password verification
- **Storage Statistics** - Real-time storage usage with visual progress bars
- **Account Overview** - Detailed account information and creation history
- **Usage Tracking** - Monitor files, folders, and storage consumption

### 📱 Modern UI/UX
- **Responsive Design** - Perfect experience on all devices
- **Dark Mode Ready** - Modern interface with clean design
- **Loading States** - Smooth animations and progress indicators
- **Language Switcher** - Easy switching between English and Vietnamese
- **Accessibility** - ARIA labels, semantic HTML, keyboard navigation
- **Cross-browser Compatible** - Works on all modern browsers
- **Error Handling** - User-friendly error messages and recovery
- **Accessibility** - WCAG compliant interface design

### ⚡ Performance & Scalability
- **Optimized Queries** - Efficient database operations with proper indexing
- **Lazy Loading** - Components and data loaded on demand
- **Caching Strategy** - Smart caching for improved performance
- **Connection Pooling** - Efficient database connection management

## 🏗️ Architecture

### Technology Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js runtime
- **Database**: MongoDB with Mongoose ODM
- **File Storage**: Telegram Bot API (50MB per file, unlimited storage)
- **Authentication**: JWT with bcryptjs password hashing
- **Validation**: Zod for comprehensive schema validation
- **Icons**: Lucide React for consistent iconography

### Project Structure

```
free-clouds/
├── app/                          # Next.js 14 App Router
│   ├── (auth)/                   # Auth route group
│   │   ├── login/page.tsx        # Login page
│   │   └── register/page.tsx     # Registration page
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   │   ├── login/route.ts    # User login
│   │   │   ├── logout/route.ts   # User logout
│   │   │   ├── me/route.ts       # Current user info
│   │   │   └── register/route.ts # User registration
│   │   ├── files/                # File management endpoints
│   │   │   ├── route.ts          # List files
│   │   │   └── [id]/             # File operations
│   │   │       ├── route.ts      # Get/Delete file
│   │   │       └── download/route.ts # Download file
│   │   ├── folders/              # Folder management endpoints
│   │   │   ├── route.ts          # List/Create folders
│   │   │   └── [id]/route.ts     # Folder operations
│   │   ├── upload/route.ts       # File upload endpoint
│   │   ├── user/route.ts         # User profile management
│   │   └── debug/route.ts        # Development diagnostics
│   ├── dashboard/page.tsx        # Main dashboard
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
├── components/                   # Reusable UI components
│   ├── FileGrid.tsx              # File display with grid/list views
│   ├── FolderTree.tsx            # Interactive folder navigation
│   ├── Navbar.tsx                # Navigation with user menu
│   ├── UploadDropzone.tsx        # Advanced file upload interface
│   └── UserProfile.tsx           # User settings modal
├── lib/                          # Utility libraries
│   ├── auth.ts                   # Authentication helpers
│   ├── db.ts                     # Database connection
│   ├── env.ts                    # Environment validation
│   ├── jwt.ts                    # JWT utilities
│   ├── ratelimit.ts              # Rate limiting implementation
│   └── telegram.ts               # Telegram Bot API integration
├── models/                       # Database models
│   ├── File.ts                   # File schema with metadata
│   ├── Folder.ts                 # Folder schema with hierarchy
│   └── User.ts                   # User schema with statistics
├── docs/                         # Documentation
│   └── USER_PROFILE.md           # User profile guide
└── styles/                       # Global styles
    └── globals.css               # Tailwind CSS configuration
```

## 🔍 Preview System Features

### Supported File Types
- **🖼️ Images** - JPEG, PNG, GIF, WebP, SVG, TIFF, BMP with zoom/rotate
- **🎥 Videos** - MP4, WebM, AVI, MOV with HTML5 player controls
- **🎵 Audio** - MP3, WAV, FLAC, AAC with custom audio player
- **📄 Documents** - PDF with page navigation, text files with syntax highlighting
- **💾 Data Files** - CSV tables, JSON/XML with syntax highlighting, YAML
- **📊 Spreadsheets** - Excel integration with Google Sheets
- **📧 Email Files** - EML, MSG with parsed headers and content
- **📅 Calendar Files** - ICS, VCS with event listing
- **📦 Archives** - ZIP, RAR, 7Z with extraction info
- **🎲 3D Models** - OBJ, STL, GLTF with software recommendations
- **🎨 Fonts** - TTF, OTF, WOFF with typography preview
- **📐 CAD Files** - DWG, DXF, STEP with professional guidance
- **⚠️ Security** - Executable file warnings and safe handling

### Preview Features
- 🔍 **Intelligent Type Detection** - MIME type + extension validation
- 🛡️ **Security Scanning** - Automatic malware and executable blocking
- 📏 **Size Limits** - Per-file-type size restrictions for optimal performance
- 🎛️ **Interactive Controls** - Zoom, rotate, play/pause, page navigation
- 📱 **Mobile Optimized** - Touch gestures and responsive layouts
- 🚀 **Performance** - Progressive loading and memory leak prevention

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- MongoDB (local or cloud)
- Telegram Bot Token
- Private Telegram Channel/Group

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd free-clouds-nextjs
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

4. **Configure your environment**
   ```env
   NODE_ENV=development
   BASE_URL=http://localhost:3001

   # Database
   DATABASE_URL=mongodb://localhost:27017/freeclouds

   # Auth (JWT) - Generate a secure 32+ character secret
   JWT_SECRET=your_super_secure_jwt_secret_key_at_least_32_characters_long

   # Telegram Configuration
   TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOPqrsTUVwxyz
   TELEGRAM_CHAT_ID=-1001234567890
   TELEGRAM_API_BASE=https://api.telegram.org

   # Security
   ALLOWED_ORIGIN=http://localhost:3001
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3001](http://localhost:3001)

## ⚙️ Configuration

### 1. Create Telegram Bot

1. Open Telegram and search for `@BotFather`
2. Send `/newbot` and follow the instructions
3. Choose a name and username for your bot
4. Save the bot token to your `.env.local` file
5. Send `/setprivacy` to BotFather and set privacy to disabled

### 2. Set Up Telegram Storage

**Option A: Private Channel (Recommended)**
1. Create a new private channel in Telegram
2. Add your bot as an administrator with "Post Messages" permission
3. Get the channel ID using `https://api.telegram.org/bot<BOT_TOKEN>/getUpdates`
4. Save the channel ID (should be negative) to your `.env.local` file

**Option B: Private Group**
1. Create a new private group in Telegram
2. Add your bot to the group
3. Make the bot an admin with necessary permissions
4. Get the group ID and save to `.env.local`

### 3. Database Setup

**Local MongoDB:**
```bash
# Install MongoDB Community Edition
# macOS
brew tap mongodb/brew
brew install mongodb-community

# Ubuntu/Debian
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
brew services start mongodb/brew/mongodb-community  # macOS
sudo systemctl start mongod  # Linux
```

**MongoDB Atlas (Cloud):**
1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (free tier available)
3. Configure network access (allow your IP)
4. Create database user
5. Get connection string and update `DATABASE_URL` in `.env.local`

## 🔌 API Documentation

### Authentication Endpoints

#### POST `/api/auth/register`
Register a new user account with email verification.

**Request Body:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "name": "John Doe",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

#### POST `/api/auth/login`
Authenticate user and create secure session.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

#### GET `/api/auth/me`
Get current authenticated user information.

**Response:**
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "name": "John Doe"
}
```

#### POST `/api/auth/logout`
Logout user and clear session cookies.

### User Profile Endpoints

#### GET `/api/user`
Get comprehensive user profile with statistics.

**Response:**
```json
{
  "id": "user_id",
  "name": "John Doe",
  "email": "user@example.com",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "stats": {
    "totalFiles": 25,
    "totalSize": 52428800,
    "totalFolders": 8
  }
}
```

#### PATCH `/api/user`
Update user profile or change password.

**Update Profile:**
```json
{
  "action": "update-profile",
  "name": "New Name",
  "email": "newemail@example.com"
}
```

**Change Password:**
```json
{
  "action": "change-password",
  "currentPassword": "currentPassword123",
  "newPassword": "newSecurePassword456",
  "confirmPassword": "newSecurePassword456"
}
```

### Folder Management Endpoints

#### GET `/api/folders`
List all folders for building complete folder tree.

**Response:**
```json
[
  {
    "id": "folder_id",
    "name": "Documents",
    "parent": null,
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  {
    "id": "subfolder_id",
    "name": "Projects",
    "parent": "folder_id",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### GET `/api/folders?parent=<id>`
List folders by specific parent ID.

#### POST `/api/folders`
Create a new folder with optional parent.

**Request Body:**
```json
{
  "name": "My New Folder",
  "parent": "parent_folder_id"  // optional, null for root
}
```

#### PATCH `/api/folders/[id]`
Rename an existing folder.

**Request Body:**
```json
{
  "name": "Renamed Folder"
}
```

#### DELETE `/api/folders/[id]`
Recursively delete folder and all contents.

**Response:**
```json
{
  "message": "Folder deleted successfully",
  "stats": {
    "foldersDeleted": 3,
    "filesDeleted": 12,
    "errors": []
  }
}
```

### File Management Endpoints

#### GET `/api/files`
List all files for "All Files" view.

#### GET `/api/files?folderId=<id>`
List files in specific folder.

#### GET `/api/files?q=<search>`
Search files by name across all folders.

**Query Parameters:**
- `folderId`: Filter by folder ID
- `q`: Search query string
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50, max: 100)

**Response:**
```json
{
  "files": [
    {
      "id": "file_id",
      "name": "document.pdf",
      "size": 1048576,
      "mime": "application/pdf",
      "folderId": "folder_id",
      "folderName": "Documents",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 50,
  "totalPages": 1
}
```

#### GET `/api/files/[id]`
Get specific file metadata.

#### DELETE `/api/files/[id]`
Soft delete a file (marks as deleted, doesn't remove from Telegram).

#### GET `/api/files/[id]/download`
Download file content directly from Telegram storage.

#### POST `/api/files/bulk-download`
Create a ZIP archive containing multiple files on the server and stream it to the client.

- Request (JSON):
  ```
  {
    "fileIds": ["<fileId1>", "<fileId2>", "..."]
  }
  ```
- Response:
  - Success: `200` with `Content-Type: application/zip` and a streamed ZIP attachment (server-side archive).
  - Error: JSON `{ error: string }` with appropriate 4xx/5xx status codes.
- Notes:
  - Authentication is required. The server verifies ownership for each requested file.
  - If an individual file cannot be fetched from Telegram, a small text file describing the error will be included in the ZIP instead of failing the whole archive.
  - The endpoint is implemented at `/api/files/bulk-download` and is intended for bulk download use (select multiple files in the UI and request a single ZIP).

### Upload Endpoint

#### POST `/api/upload`
Upload files to Telegram storage with metadata.

**Request:** `multipart/form-data`
- `file`: File to upload (max 50MB)
- `folderId`: Target folder ID (optional)

**Response:**
```json
{
  "id": "file_id",
  "name": "uploaded-file.pdf",
  "size": 1048576,
  "mime": "application/pdf",
  "folderId": "folder_id",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

## 🛡️ Security Features

### Authentication & Authorization
- **JWT Tokens** - Secure tokens with HTTP-only cookies
- **Password Hashing** - bcryptjs with 12 salt rounds
- **Session Management** - Automatic session expiration
- **Route Protection** - API routes require authentication
- **Owner Verification** - Users can only access their own data

### CSRF Protection
- **Origin Validation** - Check request origin/referer headers
- **SameSite Cookies** - Prevent cross-site request forgery
- **CORS Configuration** - Strict cross-origin policies

### Rate Limiting (Requests per Time Window)
- **Authentication**: 5 requests per 5 minutes (per IP)
- **File Upload**: 10 requests per 5 minutes (per IP)
- **General API**: 100 requests per 5 minutes (per IP)
- **User Profile**: 20 requests per 5 minutes (per IP)

### File Security
- **File Type Validation** - Block dangerous file types (.exe, .bat, etc.)
- **File Size Limits** - Maximum 50MB per file (Telegram limit)
- **Filename Sanitization** - Remove dangerous characters
- **MIME Type Verification** - Validate file content type

### Data Protection
- **Input Validation** - Zod schemas for all inputs
- **SQL Injection Prevention** - MongoDB with Mongoose ODM
- **XSS Protection** - Content Security Policy headers
- **Sensitive Data** - Never expose passwords or tokens

## 🧪 Testing

### Manual Testing Checklist

#### Authentication Flow
- [ ] Register new account with valid data
- [ ] Register with duplicate email (should fail)
- [ ] Login with valid credentials
- [ ] Login with invalid credentials (should fail)
- [ ] Access protected routes without authentication
- [ ] Session persistence after browser refresh
- [ ] Logout functionality and session clearing

#### User Profile Management
- [ ] View user profile with statistics
- [ ] Update name and email successfully
- [ ] Try updating to existing email (should fail)
- [ ] Change password with correct current password
- [ ] Try changing password with wrong current password
- [ ] View storage statistics and usage progress

#### Folder Management
- [ ] Create folder in root directory
- [ ] Create nested folders (multiple levels)
- [ ] Rename folders with valid names
- [ ] Delete empty folders
- [ ] Delete folders with contents (recursive deletion)
- [ ] Folder tree navigation and expansion
- [ ] Folder statistics and content counting

#### File Operations
- [ ] Upload single file to root
- [ ] Upload multiple files simultaneously
- [ ] Upload files to specific folders
- [ ] Download files successfully
- [ ] Delete individual files
- [ ] Search files across all folders
- [ ] View files in grid and list modes

#### UI/UX Testing
- [ ] Responsive design on mobile devices
- [ ] Drag and drop file upload
- [ ] Upload progress indicators
- [ ] Loading states for all operations
- [ ] Error message display and handling
- [ ] Success notifications

### API Testing Examples

```bash
# Test user registration
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User","password":"securePassword123"}'

# Test file upload with authentication
curl -X POST http://localhost:3001/api/upload \
  -H "Cookie: auth-token=<your-jwt-token>" \
  -F "file=@/path/to/test-file.pdf" \
  -F "folderId=optional_folder_id"

# Test folder creation
curl -X POST http://localhost:3001/api/folders \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=<your-jwt-token>" \
  -d '{"name":"Test Folder","parent":null}'

# Test user profile update
curl -X PATCH http://localhost:3001/api/user \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=<your-jwt-token>" \
  -d '{"action":"update-profile","name":"Updated Name","email":"updated@example.com"}'
```

## 📚 Documentation

### 📖 Complete Documentation Suite

- **📋 [Features Guide](docs/FEATURES.md)** - Comprehensive feature documentation
- **🏗️ [Architecture](docs/ARCHITECTURE.md)** - Technical architecture and design patterns
- **📡 [API Reference](docs/API.md)** - Complete API documentation with examples
- **🚀 [Deployment Guide](docs/DEPLOYMENT.md)** - Detailed deployment instructions for all platforms
- **🔍 [Preview System](docs/PREVIEW_SYSTEM.md)** - File preview system documentation
- **📧 [Email Setup](docs/EMAIL_SETUP.md)** - Email service configuration guide
- **🌍 [SEO Setup](docs/SEO_SETUP.md)** - SEO optimization and multilingual configuration
- **🧪 [Testing Checklist](docs/PREVIEW_TEST_CHECKLIST.md)** - Quality assurance procedures
- **📝 [Changelog](CHANGELOG.md)** - Version history and release notes

### 🎯 Quick Links

#### For Users
- **🚀 [Quick Start](#-quick-start)** - Get started in 5 minutes
- **🔍 [Preview Features](#-preview-system-features)** - File preview capabilities
- **🛡️ [Security Features](#-security-features)** - Security and privacy information
- **🌍 [Language Support](#-seo--multilingual-support)** - English/Vietnamese bilingual interface

#### For Developers
- **📡 [API Documentation](docs/API.md)** - RESTful API reference
- **🏗️ [Architecture Guide](docs/ARCHITECTURE.md)** - System design and patterns
- **🔧 [Development Setup](#-development)** - Local development environment
- **🌍 [SEO Implementation](docs/SEO_SETUP.md)** - SEO and multilingual development guide

#### For DevOps
- **🚀 [Deployment Options](docs/DEPLOYMENT.md)** - Vercel, Docker, VPS deployment
- **📊 [Monitoring Setup](docs/DEPLOYMENT.md#-health-checks--monitoring)** - Health checks and monitoring
- **🔐 [Security Configuration](docs/DEPLOYMENT.md#-ssltls-configuration)** - SSL/TLS and security hardening

### 📱 Mobile & Desktop
- **📱 Mobile-Optimized** - Touch gestures, responsive design, offline support
- **🖥️ Desktop Experience** - Keyboard shortcuts, drag & drop, multi-file operations
- **🌐 Cross-Platform** - Works on all modern browsers and devices

## 📦 Deployment

### Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy to Vercel**
   ```bash
   vercel
   ```

3. **Set environment variables in Vercel dashboard**
   - `DATABASE_URL`: Your MongoDB connection string
   - `JWT_SECRET`: Secure JWT secret (32+ characters)
   - `TELEGRAM_BOT_TOKEN`: Your Telegram bot token
   - `TELEGRAM_CHAT_ID`: Your Telegram channel/group ID
   - `ALLOWED_ORIGIN`: Your production domain

4. **Deploy to production**
   ```bash
   vercel --prod
   ```

### Docker Deployment

1. **Create Dockerfile**
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   RUN npm run build
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. **Build and run**
   ```bash
   docker build -t free-clouds .
   docker run -p 3000:3000 \
     -e DATABASE_URL="mongodb://..." \
     -e JWT_SECRET="your-secret" \
     -e TELEGRAM_BOT_TOKEN="your-token" \
     -e TELEGRAM_CHAT_ID="your-chat-id" \
     free-clouds
   ```

### Traditional Server

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Configure environment**
   ```bash
   export NODE_ENV=production
   export DATABASE_URL="your-mongodb-url"
   export JWT_SECRET="your-jwt-secret"
   # ... other environment variables
   ```

3. **Start production server**
   ```bash
   npm start
   ```

## ⚠️ Limitations & Considerations

### Telegram API Constraints
- **File Size Limit**: 50MB maximum per file
- **API Rate Limits**: 30 requests per second per bot
- **Storage**: Unlimited file storage (files stored in Telegram)
- **Bandwidth**: Subject to Telegram's fair usage policies
- **File Retention**: Files stored permanently unless manually deleted

### Performance Considerations
- **Database Optimization**: Proper indexing for efficient queries
- **Connection Pooling**: MongoDB connection reuse
- **Lazy Loading**: Components and data loaded on demand
- **Caching Strategy**: Client-side caching for better performance
- **Rate Limiting**: Prevents API abuse and ensures fair usage

### Data Persistence & Backup
- **File Storage**: Files permanently stored in Telegram
- **Metadata**: User data, folders, and file metadata in MongoDB
- **Backup Strategy**: Regular MongoDB backups recommended
- **Recovery**: Files recoverable through Telegram file_id
- **Data Export**: Users can download all their files

### Security Considerations
- **File Scanning**: No built-in virus scanning (implement if needed)
- **Content Filtering**: No automatic content moderation
- **User Privacy**: Files stored in your Telegram channel
- **Data Encryption**: Files not encrypted at rest in Telegram
- **Access Control**: Strong authentication but no file-level permissions

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](docs/CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Standards
- **TypeScript** - Strict mode enabled
- **ESLint** - Code quality enforcement
- **Prettier** - Code formatting
- **Testing** - Unit and integration tests required

## 📞 Support & Community

### Getting Help
- **📖 [Documentation](docs/)** - Comprehensive guides and references
- **🐛 [Issues](https://github.com/hoangminhkhang/free-clouds/issues)** - Bug reports and feature requests
- **💬 [Discussions](https://github.com/hoangminhkhang/free-clouds/discussions)** - Community Q&A and feedback
- **📧 Email** - Direct support for complex issues

### Community
- **⭐ Star the project** - Show your support
- **🍴 Fork and contribute** - Help improve Free Clouds
- **📢 Share with others** - Spread the word about Free Clouds
- **💡 Suggest features** - Your ideas make us better

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Project Status

- **✅ Stable Release** - Version 2.0.0 with comprehensive preview system
- **🔄 Active Development** - Regular updates and new features
- **🛡️ Security Focused** - Regular security updates and best practices
- **📈 Growing Community** - Welcome new contributors and users

## 🏆 Acknowledgments

### Special Thanks
- **Next.js Team** - Amazing React framework
- **MongoDB** - Flexible and powerful database
- **Telegram** - Reliable file storage API
- **Vercel** - Seamless deployment platform
- **Open Source Community** - Inspiration and support

### Built With Love
- **🇻🇳 Made in Vietnam** - With passion for open source
- **💻 Modern Tech Stack** - Latest web technologies
- **🎨 User-Centered Design** - Focus on user experience
- **🔐 Security First** - Privacy and security by design

---

**Free Clouds** - *Your secure, feature-rich cloud storage solution*

*Built with ❤️ by [Hoàng Minh Khang](https://github.com/hoangminhkhang)*

## 🔧 Development

### Development Environment

**Required Tools:**
- Node.js 18+ with npm
- MongoDB (local or cloud)
- Git for version control
- Code editor (VS Code recommended)

**Recommended VS Code Extensions:**
- TypeScript and JavaScript Language Features
- Tailwind CSS IntelliSense
- MongoDB for VS Code
- Thunder Client (API testing)

### Code Quality & Standards

**Linting & Formatting:**
```bash
# Code linting
npm run lint

# Type checking
npm run type-check

# Format code (if Prettier is configured)
npm run format
```

**Code Style Guidelines:**
- Use TypeScript strict mode
- Follow Next.js 14 conventions
- Implement proper error handling
- Add comprehensive logging
- Write self-documenting code

### Development Commands

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run type checking
npm run type-check

# Run linting
npm run lint

# Clear Next.js cache
rm -rf .next
```

### Database Management

**Connect to local MongoDB:**
```bash
mongosh "mongodb://localhost:27017/freeclouds"
```

**Essential indexes (auto-created by models):**
```javascript
// Users collection
db.users.createIndex({ email: 1 }, { unique: true })

// Folders collection
db.folders.createIndex({ owner: 1, parent: 1 })
db.folders.createIndex({ owner: 1, name: 1 })

// Files collection
db.files.createIndex({ owner: 1, folder: 1, deletedAt: 1 })
db.files.createIndex({ owner: 1, name: 1, deletedAt: 1 })
db.files.createIndex({ fileId: 1 }, { unique: true })
```

### Environment Configuration

**Development (.env.local):**
```env
NODE_ENV=development
BASE_URL=http://localhost:3001
DATABASE_URL=mongodb://localhost:27017/freeclouds
JWT_SECRET=development_secret_at_least_32_characters_long
TELEGRAM_BOT_TOKEN=your_dev_bot_token
TELEGRAM_CHAT_ID=your_dev_chat_id
ALLOWED_ORIGIN=http://localhost:3001
```

**Production (.env.production):**
```env
NODE_ENV=production
BASE_URL=https://your-domain.com
DATABASE_URL=mongodb+srv://user:pass@cluster.mongodb.net/freeclouds
JWT_SECRET=super_secure_production_secret_key_32_plus_characters
TELEGRAM_BOT_TOKEN=production_bot_token
TELEGRAM_CHAT_ID=production_chat_id
ALLOWED_ORIGIN=https://your-domain.com
```

## 🤝 Contributing

### Getting Started
1. Fork the repository on GitHub
2. Clone your fork locally
3. Create a feature branch (`git checkout -b feature/amazing-feature`)
4. Make your changes following the coding standards
5. Test thoroughly
6. Commit with descriptive messages
7. Push to your fork (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Development Guidelines

**Code Standards:**
- Use TypeScript with strict typing
- Follow the existing project structure
- Implement comprehensive error handling
- Add appropriate logging for debugging
- Write clean, self-documenting code

**Testing Requirements:**
- Test new features manually
- Verify existing functionality still works
- Test edge cases and error conditions
- Ensure responsive design works

**Documentation:**
- Update README for new features
- Add code comments for complex logic
- Update API documentation if needed
- Include setup instructions for new dependencies

### Pull Request Process
1. Ensure your code follows the project standards
2. Update documentation as needed
3. Add a clear description of changes
4. Link to any relevant issues
5. Request review from maintainers

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### MIT License Summary
- ✅ Commercial use allowed
- ✅ Modification allowed
- ✅ Distribution allowed
- ✅ Private use allowed
- ❌ No warranty provided
- ❌ No liability accepted

## 🆘 Troubleshooting

### Common Issues & Solutions

#### Database Connection Issues

**"Failed to connect to MongoDB"**
- **Check MongoDB Status**: Ensure MongoDB is running
  ```bash
  # Check if MongoDB is running
  brew services list | grep mongodb  # macOS
  sudo systemctl status mongod       # Linux
  ```
- **Verify Connection String**: Check `DATABASE_URL` format
- **Network Issues**: Ensure firewall allows MongoDB port (27017)
- **Authentication**: Verify username/password for cloud MongoDB

#### Telegram Integration Issues

**"Telegram API error: Unauthorized"**
- **Bot Token**: Verify `TELEGRAM_BOT_TOKEN` is correct
- **Bot Status**: Ensure bot is active (message @BotFather)
- **Token Format**: Should be `123456789:ABCdef...`

**"Bad Request: chat not found"**
- **Chat ID**: Verify `TELEGRAM_CHAT_ID` is correct
- **Bot Access**: Ensure bot is added to the channel/group
- **Admin Rights**: Bot needs admin permissions for channels
- **ID Format**: Group/channel IDs should be negative

#### Authentication Problems

**"JWT token invalid"**
- **Secret**: Verify `JWT_SECRET` is set (32+ characters)
- **Cookies**: Check if cookies are enabled in browser
- **Domain**: Ensure `ALLOWED_ORIGIN` matches your domain
- **Clear Cache**: Clear browser cookies and try again

#### File Upload Issues

**"File upload fails"**
- **File Size**: Check if file exceeds 50MB limit
- **File Type**: Verify file type is allowed
- **Network**: Check internet connection stability
- **Rate Limits**: Ensure you're not hitting API limits

#### Performance Issues

**"Application is slow"**
- **Database**: Check MongoDB performance and indexes
- **Connection Pool**: Monitor database connections
- **File Size**: Large files may take time to upload
- **Network**: Check bandwidth and latency

### Debug Mode

**Enable detailed logging:**
```bash
NODE_ENV=development DEBUG=* npm run dev
```

**Check application logs:**
```bash
# View Next.js logs
tail -f .next/trace

# Check MongoDB logs
tail -f /var/log/mongodb/mongod.log
```

### Health Checks

**Test API endpoints:**
```bash
# Check API health
curl http://localhost:3001/api/auth/me

# Test file upload
curl -X POST http://localhost:3001/api/upload \
  -F "file=@test.txt"

# Test Telegram connection
curl http://localhost:3001/api/telegram-test
```

### Getting Help

**Documentation:**
- [User Profile Guide](docs/USER_PROFILE.md)
- [API Documentation](#-api-documentation)
- [Next.js 14 Documentation](https://nextjs.org/docs)

**Community Support:**
- 💬 GitHub Discussions: Ask questions and share ideas
- 🐛 GitHub Issues: Report bugs and request features
- 📧 Email Support: contact@freeclouds.example.com

**Professional Support:**
- 🏢 Enterprise Support: Available for business users
- 🛠️ Custom Development: Tailored solutions available
- 📞 Priority Support: Dedicated support channels

---

**Built with ❤️ using Next.js 14, TypeScript, and Modern Web Technologies**

*Free Clouds - Your files, your control, unlimited possibilities.*

---

## 📧 Email Configuration

### Quick Setup
1. Enable 2FA on Gmail account
2. Generate App Password for "Free Clouds"
3. Add to `.env.local`:
   ```env
   EMAIL_USER=your-gmail@gmail.com
   EMAIL_PASS=your-16-char-app-password
   ```

### Features Enabled
- ✅ Password reset via email
- ✅ Account deletion confirmation
- ✅ Professional email templates
- ✅ Rate limiting and security
- ✅ Vietnamese language support

📖 **Full Setup Guide:** [docs/EMAIL_SETUP.md](./docs/EMAIL_SETUP.md)

---

## 🎯 File Management Features

### Smart File Categorization
- **🖼️ Images** - Auto thumbnails, zoom, rotate preview
- **🎥 Videos** - Native video player in preview modal
- **🎵 Audio** - Audio player with professional UI
- **💻 Code** - Syntax highlighting for 50+ languages
- **📄 Documents** - PDF and Office file support
- **🎨 Design** - Photoshop, Illustrator, Figma files
- **🎯 3D & CAD** - Blender, AutoCAD, STEP files
- **📊 Data** - JSON, XML, CSV with structured preview

### Advanced Preview System
- **Full-screen modal** with dark overlay
- **Zoom controls** (25% - 300%) for images
- **Image rotation** (90° increments)
- **Video/Audio players** with native controls
- **Text file viewer** with syntax highlighting
- **Download directly** from preview
- **File metadata** display (size, date, location)

### Organization Tools
- **Smart filtering** by file type categories
- **Live search** with debounced input
- **Grid/List views** with user preference
- **Drag & drop** file upload
- **Nested folder** structure support
- **Recursive operations** (delete folders with contents)