# Hệ Thống Quản Trị Free Clouds

## Tổng Quan

Hệ thống quản trị Free Clouds cung cấp một bảng điều khiển quản lý toàn diện cho các quản trị viên để giám sát và quản lý nền tảng lưu trữ đám mây. Hệ thống bao gồm quản lý người dùng, thống kê hệ thống, và các công cụ phân tích chi tiết.

## Tính Năng Chính

### 1. Dashboard Tổng Quan 📊
- **Thống kê thời gian thực**: Số lượng người dùng, file, thư mục, dung lượng sử dụng
- **Biểu đồ tăng trưởng**: Theo dõi xu hướng phát triển của hệ thống
- **Hoạt động gần đây**: Người dùng mới và file upload mới nhất
- **Trạng thái hệ thống**: Giám sát tình trạng database, API services, và file storage
- **Top người dùng**: Xếp hạng theo dung lượng sử dụng và số lượng file

### 2. Quản Lý Người Dùng 👥
- **Danh sách người dùng**: Hiển thị với phân trang và tìm kiếm nâng cao
- **Lọc và sắp xếp**: Theo vai trò, trạng thái, dung lượng, số file
- **Thao tác hàng loạt**: Chọn nhiều người dùng cùng lúc
- **Xuất dữ liệu**: Export danh sách ra CSV hoặc JSON
- **Chi tiết người dùng**: Xem thông tin chi tiết, thống kê cá nhân
- **Chỉnh sửa thông tin**: Cập nhật tên, email, vai trò, trạng thái
- **Quản lý mật khẩu**: Đặt lại mật khẩu cho người dùng
- **Xóa tài khoản**: Xóa người dùng và toàn bộ dữ liệu liên quan

### 3. Thống Kê & Phân Tích 📈
- **Thống kê người dùng**: Tổng số, người dùng hoạt động, admin, tăng trưởng theo thời gian
- **Thống kê file**: Tổng số file, phân bố theo loại, kích thước trung bình
- **Thống kê dung lượng**: Tổng dung lượng, dung lượng trung bình, người dùng top
- **Biểu đồ tăng trưởng**: Người dùng mới và file upload theo thời gian
- **Phân bố loại file**: Thống kê theo định dạng file (image, video, document, etc.)

### 4. Bảo Mật & Phân Quyền 🔐
- **Xác thực admin**: Chỉ admin mới truy cập được panel quản trị
- **Middleware bảo vệ**: Route protection cho /admin/*
- **Rate limiting**: Giới hạn số lượng request cho các API admin
- **Audit logs**: Ghi lại các thao tác quan trọng của admin
- **CSRF protection**: Bảo vệ khỏi Cross-Site Request Forgery

## Cấu Trúc Hệ Thống

### Frontend Components
```
app/admin/
├── layout.tsx          # Layout chung cho admin panel
├── page.tsx           # Dashboard tổng quan
├── users/
│   ├── page.tsx       # Danh sách người dùng
│   └── [id]/
│       ├── page.tsx   # Chi tiết người dùng
│       └── edit/
│           └── page.tsx # Chỉnh sửa người dùng
└── components/        # Các component dùng chung
```

### Backend APIs
```
app/api/admin/
├── stats/
│   └── route.ts       # API thống kê tổng quan
├── users/
│   ├── route.ts       # CRUD người dùng
│   ├── [id]/
│   │   └── route.ts   # Quản lý người dùng cụ thể
│   └── export/
│       └── route.ts   # Xuất danh sách người dùng
└── middleware/        # Middleware xác thực admin
```

### Database Models
```
User Model (Cập nhật):
- role: "user" | "admin"
- isActive: boolean
- lastLoginAt: Date
- totalFilesUploaded: number
- totalStorageUsed: number
```

## Hướng Dẫn Cài Đặt

### 1. Tạo Tài Khoản Admin Đầu Tiên

```bash
# Chạy script tạo admin
npm run create-admin

# Hoặc
npm run setup
```

Script sẽ hỏi thông tin:
- Họ và tên
- Địa chỉ email
- Mật khẩu (tối thiểu 8 ký tự)

### 2. Cấu Hình Environment

Đảm bảo các biến môi trường sau trong `.env.local`:

```env
# Database
DATABASE_URL=your_mongodb_connection_string

# JWT
JWT_SECRET=your_jwt_secret_key

# Telegram
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id

# App
BASE_URL=http://localhost:3000
```

### 3. Khởi Động Ứng Dụng

```bash
npm run dev
```

Truy cập admin panel tại: `http://localhost:3000/admin`

## Hướng Dẫn Sử Dụng

### Đăng Nhập Admin

1. Truy cập `/login`
2. Đăng nhập bằng tài khoản admin
3. Tự động chuyển hướng đến `/admin` (nếu là admin)

### Dashboard Tổng Quan

**Thẻ thống kê nhanh:**
- Tổng người dùng: Hiển thị tổng số và tăng trưởng tháng này
- Tổng file: Số lượng file và tăng trưởng
- Tổng thư mục: Số lượng thư mục đã tạo
- Dung lượng: Tổng dung lượng đã sử dụng

**Hoạt động hôm nay:**
- Người dùng mới đăng ký
- File được upload
- Thư mục được tạo

**Biểu đồ phân bố loại file:**
- Hiển thị top 5 loại file phổ biến
- Số lượng và dung lượng mỗi loại

**Trạng thái hệ thống:**
- Database: Kiểm tra kết nối MongoDB
- API Services: Trạng thái các API endpoint
- File Storage: Tình trạng lưu trữ file

### Quản Lý Người Dùng

**Tìm kiếm và lọc:**
- Tìm theo tên hoặc email
- Lọc theo vai trò (User/Admin)
- Lọc theo trạng thái (Active/Inactive)
- Sắp xếp theo ngày tạo, tên, dung lượng

**Thao tác với người dùng:**
- **Xem chi tiết**: Click vào tên hoặc icon mắt
- **Chỉnh sửa**: Click icon bút chì
- **Xóa**: Click icon thùng rác (có xác nhận)
- **Xuất dữ liệu**: Button "Xuất Excel"

**Tạo người dùng mới:**
1. Click "Thêm người dùng"
2. Điền thông tin: tên, email, mật khẩu, vai trò
3. Click "Tạo người dùng"

**Chỉnh sửa người dùng:**
1. Vào trang chi tiết người dùng
2. Click "Chỉnh sửa"
3. Cập nhật thông tin cần thiết
4. Có thể đổi mật khẩu (tùy chọn)
5. Click "Lưu thay đổi"

**Phân tích người dùng cá nhân:**
- Thống kê file và thư mục
- Phân bố loại file của người dùng
- Lịch sử hoạt động gần đây
- File upload mới nhất

### Xuất Dữ Liệu

**Định dạng CSV:**
- Bao gồm BOM cho Excel
- Mã hóa UTF-8
- Headers tiếng Việt

**Định dạng JSON:**
- Structured data với metadata
- Thông tin filter và thống kê
- Timestamp xuất dữ liệu

## API Documentation

### Authentication

Tất cả API admin yêu cầu:
1. JWT token hợp lệ trong cookie `auth-token`
2. User phải có role `admin`
3. Tài khoản phải đang active

### Endpoints

#### GET /api/admin/stats
Lấy thống kê tổng quan hệ thống

**Response:**
```json
{
  "users": {
    "total": 1250,
    "active": 1180,
    "admins": 5,
    "today": 15,
    "thisWeek": 89,
    "thisMonth": 234
  },
  "files": {
    "total": 45623,
    "today": 156,
    "size": {
      "totalSize": 1073741824,
      "averageSize": 23456
    },
    "typeDistribution": [...]
  },
  "growth": {
    "users": [...],
    "files": [...]
  }
}
```

#### GET /api/admin/users
Lấy danh sách người dùng với phân trang

**Query Parameters:**
- `page`: Trang hiện tại (default: 1)
- `limit`: Số item per page (default: 20)
- `search`: Tìm kiếm theo tên/email
- `role`: Lọc theo vai trò (user/admin/all)
- `status`: Lọc theo trạng thái (active/inactive/all)
- `sortBy`: Sắp xếp theo field (createdAt/name/totalStorageUsed)
- `sortOrder`: Thứ tự sắp xếp (asc/desc)

#### POST /api/admin/users
Tạo người dùng mới

**Request Body:**
```json
{
  "name": "Nguyễn Văn A",
  "email": "user@example.com",
  "password": "password123",
  "role": "user"
}
```

#### GET /api/admin/users/[id]
Lấy thông tin chi tiết người dùng

#### PUT /api/admin/users/[id]
Cập nhật thông tin người dùng

**Request Body:**
```json
{
  "name": "Tên mới",
  "email": "email@moi.com",
  "role": "admin",
  "isActive": true,
  "password": "newpassword123" // optional
}
```

#### DELETE /api/admin/users/[id]
Xóa người dùng và toàn bộ dữ liệu

#### GET /api/admin/users/export
Xuất danh sách người dùng

**Query Parameters:**
- `format`: csv hoặc json (default: csv)
- Các filter tương tự GET /api/admin/users

## Bảo Mật

### Middleware Protection

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
}
```

### API Protection

```typescript
// lib/auth.ts
export async function requireAdmin(request: NextRequest): Promise<AuthUser> {
  const user = await requireAuth(request);
  
  const userDoc = await User.findById(user.id);
  if (!userDoc || userDoc.role !== "admin") {
    throw new AuthError("Admin access required", 403);
  }
  
  return user;
}
```

### Best Practices

1. **Không hardcode credentials**: Sử dụng environment variables
2. **Rate limiting**: Giới hạn request cho API admin
3. **Audit logging**: Ghi lại các thao tác quan trọng
4. **Input validation**: Validate tất cả input từ client
5. **Error handling**: Không expose sensitive information
6. **Session management**: Logout tự động khi hết session

## Troubleshooting

### Lỗi Thường Gặp

**403 Forbidden khi truy cập /admin:**
- Kiểm tra user có role admin không
- Kiểm tra JWT token có hợp lệ không
- Kiểm tra tài khoản có active không

**404 Not Found cho API admin:**
- Kiểm tra đường dẫn API
- Kiểm tra middleware có chạy không
- Kiểm tra authentication headers

**Không tải được thống kê:**
- Kiểm tra kết nối MongoDB
- Kiểm tra permissions của database
- Kiểm tra aggregate queries

**Error khi tạo admin đầu tiên:**
- Kiểm tra DATABASE_URL trong env
- Kiểm tra kết nối internet
- Kiểm tra MongoDB service có chạy không

### Debug Tips

**Kiểm tra logs:**
```bash
# Server logs
npm run dev

# Browser console
F12 > Console tab
```

**Test API trực tiếp:**
```bash
# Get stats
curl -H "Cookie: auth-token=YOUR_TOKEN" \
     http://localhost:3000/api/admin/stats

# Create user
curl -X POST \
     -H "Content-Type: application/json" \
     -H "Cookie: auth-token=YOUR_TOKEN" \
     -d '{"name":"Test","email":"test@test.com","password":"12345678","role":"user"}' \
     http://localhost:3000/api/admin/users
```

## Roadmap

### Version 2.1 (Sắp tới)
- [ ] Quản lý file và thư mục
- [ ] System logs và audit trail
- [ ] Email notifications cho admin
- [ ] Advanced analytics với charts
- [ ] Backup và restore tools

### Version 2.2 (Tương lai)
- [ ] Multi-admin roles (Super Admin, Moderator)
- [ ] Scheduled reports
- [ ] API rate limiting dashboard
- [ ] User activity heatmaps
- [ ] Automated user management rules

### Version 2.3 (Tương lai xa)
- [ ] Real-time notifications
- [ ] Mobile admin app
- [ ] Advanced security features (2FA)
- [ ] Plugin system
- [ ] Multi-tenant support

## Đóng Góp

Để đóng góp vào hệ thống admin:

1. Fork repository
2. Tạo feature branch
3. Implement tính năng mới
4. Viết tests
5. Cập nhật documentation
6. Tạo Pull Request

### Code Style

- TypeScript strict mode
- ESLint + Prettier
- Component naming: PascalCase
- File naming: kebab-case
- Function naming: camelCase

### Testing

```bash
# Run tests
npm test

# Coverage report
npm run test:coverage
```

## Liên Hệ

- **Developer**: Hoàng Minh Khang
- **Email**: support@free-clouds.com
- **Repository**: https://github.com/free-clouds/admin-system
- **Documentation**: https://docs.free-clouds.com/admin

---

**Made with ❤️ in Vietnam 🇻🇳**