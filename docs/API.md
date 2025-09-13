# 📡 Free Clouds API Documentation

## Overview

Free Clouds provides a comprehensive RESTful API for file management, user authentication, and advanced preview capabilities. All API endpoints are built on Next.js API routes and follow standard HTTP conventions.

**Base URL**: `https://your-domain.com/api`  
**API Version**: 2.0  
**Authentication**: JWT Bearer tokens  
**Content-Type**: `application/json`

---

## 🔐 Authentication

### POST `/api/auth/login`

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "userpassword"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2024-12-01T10:00:00.000Z"
  }
}
```

**Rate Limit**: 5 requests per 5 minutes per IP

---

### POST `/api/auth/register`

Create new user account.

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "securepassword",
  "name": "New User"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account created successfully",
  "user": {
    "id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "email": "newuser@example.com",
    "name": "New User",
    "createdAt": "2024-12-01T10:00:00.000Z"
  }
}
```

**Validation Rules:**
- Email: Valid email format, unique
- Password: Minimum 6 characters
- Name: 2-100 characters

**Rate Limit**: 3 requests per 15 minutes per IP

---

### POST `/api/auth/logout`

Invalidate current session and clear authentication.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### GET `/api/auth/me`

Get current authenticated user information.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2024-12-01T10:00:00.000Z"
  }
}
```

---

### POST `/api/auth/forgot-password`

Request password reset via email verification.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "If this email is registered, you will receive a password reset code shortly."
}
```

**Features:**
- 6-digit verification code
- 15-minute expiration
- Email template with security warnings
- Rate limited to prevent abuse

**Rate Limit**: 5 requests per 15 minutes per IP

---

### POST `/api/auth/reset-password`

Reset password using verification code.

**Request Body:**
```json
{
  "email": "user@example.com",
  "code": "123456",
  "newPassword": "newsecurepassword"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password has been reset successfully. You can now log in with your new password."
}
```

**Rate Limit**: 10 requests per 15 minutes per IP

---

### POST `/api/auth/request-deletion`

Request account deletion with email verification.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "A confirmation code has been sent to your email. Please check your inbox to proceed with account deletion."
}
```

**Rate Limit**: 3 requests per hour per user

---

### POST `/api/auth/confirm-deletion`

Confirm account deletion with verification code.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Your account has been permanently deleted. We're sorry to see you go."
}
```

**Effects:**
- Deletes all user files and folders
- Removes all verification codes
- Permanently deletes user account
- Clears authentication cookies

**Rate Limit**: 5 requests per hour per user

---

## 📁 File Management

### GET `/api/files`

Retrieve user's files with optional filtering.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `folderId` (optional): Filter files by folder ID
- `search` (optional): Search files by name
- `type` (optional): Filter by file type (image, video, audio, document, etc.)
- `limit` (optional): Number of files to return (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "files": [
    {
      "id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "name": "document.pdf",
      "size": 1048576,
      "mime": "application/pdf",
      "folderId": "64f1a2b3c4d5e6f7g8h9i0j2",
      "folderName": "Documents",
      "createdAt": "2024-12-01T10:00:00.000Z",
      "updatedAt": "2024-12-01T10:00:00.000Z"
    }
  ],
  "total": 42,
  "hasMore": true
}
```

---

### POST `/api/upload`

Upload one or more files to cloud storage.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Form Data:**
- `files`: File(s) to upload
- `folderId` (optional): Target folder ID

**Response:**
```json
{
  "success": true,
  "message": "Files uploaded successfully",
  "files": [
    {
      "id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "name": "uploaded-file.jpg",
      "size": 2097152,
      "mime": "image/jpeg",
      "folderId": null,
      "createdAt": "2024-12-01T10:00:00.000Z"
    }
  ]
}
```

**File Constraints:**
- Maximum file size: 50MB per file
- Allowed types: All non-executable files
- Malware scanning: Automatic
- Storage quota: Enforced per user

**Rate Limit**: 10 requests per 5 minutes per user

---

### GET `/api/files/[id]/download`

Download a specific file by ID.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
- **Success**: Binary file content with appropriate headers
- **Headers**: `Content-Type`, `Content-Length`, `Content-Disposition`

**Error Response:**
```json
{
  "error": "File not found",
  "code": "FILE_NOT_FOUND"
}
```

**Features:**
- Secure file access validation
- Ownership verification
- Streaming for large files
- Proper MIME type detection

---

### PUT `/api/files/[id]`

Update file metadata (rename, move to folder).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "name": "new-filename.pdf",
  "folderId": "64f1a2b3c4d5e6f7g8h9i0j2"
}
```

**Response:**
```json
{
  "success": true,
  "message": "File updated successfully",
  "file": {
    "id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "name": "new-filename.pdf",
    "size": 1048576,
    "mime": "application/pdf",
    "folderId": "64f1a2b3c4d5e6f7g8h9i0j2",
    "updatedAt": "2024-12-01T11:00:00.000Z"
  }
}
```

---

### DELETE `/api/files/[id]`

Delete a file permanently.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

**Effects:**
- Removes file from storage
- Deletes database record
- Cannot be undone

---

## 📂 Folder Management

### GET `/api/folders`

Retrieve user's folder structure.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `parentId` (optional): Get subfolders of specific folder
- `includeEmpty` (optional): Include folders with no files (default: true)

**Response:**
```json
{
  "success": true,
  "folders": [
    {
      "id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "name": "Documents",
      "parentId": null,
      "fileCount": 15,
      "folderCount": 3,
      "createdAt": "2024-12-01T10:00:00.000Z",
      "updatedAt": "2024-12-01T10:00:00.000Z"
    }
  ]
}
```

---

### POST `/api/folders`

Create a new folder.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "name": "New Folder",
  "parentId": "64f1a2b3c4d5e6f7g8h9i0j1"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Folder created successfully",
  "folder": {
    "id": "64f1a2b3c4d5e6f7g8h9i0j2",
    "name": "New Folder",
    "parentId": "64f1a2b3c4d5e6f7g8h9i0j1",
    "fileCount": 0,
    "folderCount": 0,
    "createdAt": "2024-12-01T10:00:00.000Z"
  }
}
```

**Validation:**
- Name: 1-100 characters, no special characters
- Parent: Must be valid folder ID or null
- Uniqueness: Name must be unique within parent

---

### PUT `/api/folders/[id]`

Update folder metadata (rename, move).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "name": "Renamed Folder",
  "parentId": "64f1a2b3c4d5e6f7g8h9i0j3"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Folder updated successfully",
  "folder": {
    "id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "name": "Renamed Folder",
    "parentId": "64f1a2b3c4d5e6f7g8h9i0j3",
    "updatedAt": "2024-12-01T11:00:00.000Z"
  }
}
```

---

### DELETE `/api/folders/[id]`

Delete folder and all contents.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `force` (optional): Force delete non-empty folder (default: false)

**Response:**
```json
{
  "success": true,
  "message": "Folder and all contents deleted successfully",
  "deletedItems": {
    "folders": 5,
    "files": 23
  }
}
```

**Effects:**
- Recursively deletes all subfolders
- Deletes all contained files
- Cannot be undone

---

## 👤 User Management

### GET `/api/user`

Get current user profile and statistics.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2024-12-01T10:00:00.000Z",
    "statistics": {
      "totalFiles": 156,
      "totalFolders": 23,
      "storageUsed": 1073741824,
      "storageQuota": 5368709120,
      "lastLogin": "2024-12-19T14:30:00.000Z"
    }
  }
}
```

---

### PUT `/api/user`

Update user profile information.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "currentPassword": "currentpassword",
  "newPassword": "newpassword"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "email": "user@example.com",
    "name": "Updated Name",
    "updatedAt": "2024-12-01T11:00:00.000Z"
  }
}
```

**Validation:**
- Name: 2-100 characters
- Password: Current password required for changes
- Email: Cannot be changed via this endpoint

---

## 🔍 Preview System API

### GET `/api/preview/capability`

Get preview capabilities for a file type.

**Query Parameters:**
- `filename`: File name with extension
- `mimeType` (optional): MIME type override

**Response:**
```json
{
  "success": true,
  "capability": {
    "canPreview": true,
    "previewType": "image",
    "requiresSpecialHandling": false,
    "maxPreviewSize": 52428800,
    "description": "Image preview with zoom and rotation controls",
    "recommendations": []
  }
}
```

**Preview Types:**
- `image` - Images with zoom/rotate
- `video` - HTML5 video player
- `audio` - Custom audio player
- `text` - Syntax-highlighted text
- `pdf` - Embedded PDF viewer
- `data` - Structured data display
- `archive` - Archive information
- `model3d` - 3D model info
- `font` - Typography preview
- `email` - Email parsing
- `calendar` - Event listing
- `cad` - CAD file info
- `spreadsheet` - Spreadsheet integration
- `executable` - Security warnings
- `unsupported` - No preview available

---

### GET `/api/preview/security`

Check if file is safe for preview.

**Query Parameters:**
- `filename`: File name with extension
- `mimeType` (optional): MIME type

**Response:**
```json
{
  "success": true,
  "secure": true,
  "reasons": [],
  "recommendations": [
    "File is safe for preview",
    "No security concerns detected"
  ]
}
```

**Security Checks:**
- Executable file detection
- MIME type validation
- Extension-based blocking
- Known malware signatures

---

## 📊 Analytics API

### GET `/api/analytics/storage`

Get storage usage analytics.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `period`: Time period (day, week, month, year)
- `startDate`: Start date (ISO 8601)
- `endDate`: End date (ISO 8601)

**Response:**
```json
{
  "success": true,
  "analytics": {
    "totalStorage": 1073741824,
    "storageQuota": 5368709120,
    "usagePercentage": 20.0,
    "breakdown": {
      "images": 536870912,
      "videos": 268435456,
      "documents": 134217728,
      "other": 134217728
    },
    "trend": {
      "lastWeek": 1024000000,
      "growth": 4.9
    }
  }
}
```

---

### GET `/api/analytics/files`

Get file activity analytics.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "analytics": {
    "totalFiles": 156,
    "recentUploads": 12,
    "recentDownloads": 34,
    "previewActivity": {
      "totalPreviews": 1250,
      "popularTypes": [
        {"type": "image", "count": 450},
        {"type": "pdf", "count": 320},
        {"type": "video", "count": 280}
      ]
    },
    "fileTypes": {
      "image": 45,
      "document": 38,
      "video": 23,
      "audio": 15,
      "other": 35
    }
  }
}
```

---

## 🚨 Error Handling

### Standard Error Response

All API endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": "Additional error details (optional)",
  "timestamp": "2024-12-01T10:00:00.000Z"
}
```

### Common Error Codes

#### Authentication Errors (401)
- `INVALID_TOKEN` - JWT token is invalid or expired
- `TOKEN_REQUIRED` - Authorization header missing
- `INVALID_CREDENTIALS` - Wrong email/password combination
- `ACCOUNT_LOCKED` - Account temporarily locked due to failed attempts

#### Authorization Errors (403)
- `INSUFFICIENT_PERMISSIONS` - User lacks required permissions
- `RESOURCE_FORBIDDEN` - Access to resource denied
- `RATE_LIMITED` - Too many requests, rate limit exceeded

#### Resource Errors (404)
- `FILE_NOT_FOUND` - Requested file does not exist
- `FOLDER_NOT_FOUND` - Requested folder does not exist
- `USER_NOT_FOUND` - User account not found
- `ENDPOINT_NOT_FOUND` - API endpoint does not exist

#### Validation Errors (400)
- `INVALID_INPUT` - Request data validation failed
- `MISSING_REQUIRED_FIELD` - Required field missing from request
- `INVALID_FILE_TYPE` - File type not allowed
- `FILE_TOO_LARGE` - File exceeds size limit
- `INVALID_EMAIL_FORMAT` - Email address format invalid

#### Server Errors (500)
- `INTERNAL_SERVER_ERROR` - Unexpected server error
- `DATABASE_ERROR` - Database operation failed
- `STORAGE_ERROR` - File storage operation failed
- `EMAIL_SERVICE_ERROR` - Email delivery failed

#### Storage Errors (413, 507)
- `QUOTA_EXCEEDED` - User storage quota exceeded
- `STORAGE_FULL` - Server storage capacity reached
- `UPLOAD_FAILED` - File upload operation failed

---

## 🔒 Rate Limiting

Rate limits are applied per IP address and per user account:

### Global Limits (per IP)
- **Authentication**: 10 requests per 15 minutes
- **File Upload**: 20 requests per hour
- **Download**: 100 requests per hour
- **API General**: 1000 requests per hour

### User Limits (per authenticated user)
- **File Operations**: 200 requests per hour
- **Folder Operations**: 50 requests per hour
- **Profile Updates**: 10 requests per hour

### Rate Limit Headers

All responses include rate limit information:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1703001600
Retry-After: 3600
```

### Rate Limit Response (429)

When rate limit is exceeded:

```json
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMITED",
  "retryAfter": 3600,
  "limit": 100,
  "remaining": 0,
  "resetTime": 1703001600
}
```

---

## 📈 Pagination

### Query Parameters

List endpoints support pagination:

- `limit`: Number of items per page (1-100, default: 50)
- `offset`: Number of items to skip (default: 0)
- `sort`: Sort field (name, size, createdAt, updatedAt)
- `order`: Sort order (asc, desc, default: desc)

### Pagination Response

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 250,
    "limit": 50,
    "offset": 0,
    "hasMore": true,
    "page": 1,
    "totalPages": 5
  }
}
```

---

## 🔍 Search & Filtering

### Search Parameters

- `q`: Search query (minimum 2 characters)
- `type`: File type filter (image, video, audio, document, etc.)
- `size`: Size range filter (small, medium, large)
- `date`: Date range filter (today, week, month, year)

### Search Response

```json
{
  "success": true,
  "results": [...],
  "query": "document",
  "filters": {
    "type": "document",
    "size": "medium"
  },
  "stats": {
    "totalResults": 42,
    "searchTime": 0.125
  }
}
```

---

## 🛠️ Development & Testing

### API Testing

Use the following tools for API testing:

#### cURL Examples

**Login:**
```bash
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

**Upload File:**
```bash
curl -X POST https://your-domain.com/api/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "files=@/path/to/file.jpg"
```

**Get Files:**
```bash
curl -X GET "https://your-domain.com/api/files?limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Postman Collection

Import the Free Clouds Postman collection for comprehensive API testing:

```json
{
  "info": {
    "name": "Free Clouds API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "https://your-domain.com/api"
    },
    {
      "key": "authToken",
      "value": "{{jwt_token}}"
    }
  ]
}
```

---

## 📚 SDK & Libraries

### JavaScript/TypeScript SDK

```typescript
import { FreeCloudsAPI } from '@freeclouds/sdk';

const api = new FreeCloudsAPI({
  baseURL: 'https://your-domain.com/api',
  apiKey: 'your-api-key'
});

// Upload file
const result = await api.files.upload(file, {
  folderId: 'folder-id'
});

// Get preview capability
const capability = await api.preview.getCapability('document.pdf');
```

### Python SDK

```python
from freeclouds import FreeCloudsClient

client = FreeCloudsClient(
    base_url='https://your-domain.com/api',
    api_key='your-api-key'
)

# Upload file
result = client.files.upload('path/to/file.jpg')

# Download file
client.files.download('file-id', 'local-path.jpg')
```

---

## 🔐 Security Best Practices

### API Key Management
- Never expose API keys in client-side code
- Use environment variables for sensitive data
- Rotate keys regularly
- Implement key scoping and permissions

### Request Security
- Always use HTTPS in production
- Validate all input data
- Implement proper CORS policies
- Use secure headers (HSTS, CSP, etc.)

### Authentication Security
- Use strong JWT secrets
- Implement token expiration
- Consider refresh token patterns
- Monitor for suspicious activity

---

## 📞 Support & Resources

### API Support
- **Documentation**: https://docs.freeclouds.dev
- **Status Page**: https://status.freeclouds.dev
- **Support Email**: api-support@freeclouds.dev
- **Community Forum**: https://community.freeclouds.dev

### Developer Resources
- **GitHub Repository**: https://github.com/hoangminhkhang/free-clouds
- **API Changelog**: https://github.com/hoangminhkhang/free-clouds/blob/main/CHANGELOG.md
- **Issue Tracker**: https://github.com/hoangminhkhang/free-clouds/issues
- **Contributing Guide**: https://github.com/hoangminhkhang/free-clouds/blob/main/CONTRIBUTING.md

---

**Free Clouds API** - *Powerful, secure, and developer-friendly cloud storage API*

**Version**: 2.0.0  
**Last Updated**: December 2024  
**Maintainer**: Hoàng Minh Khang