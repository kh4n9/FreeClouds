# 🚀 Free Clouds Admin Setup Guide

## Hướng Dẫn Thiết Lập Admin Nhanh

### 1. Kiểm Tra Environment Variables

Đảm bảo file `.env.local` có các biến sau:

```env
# Database (MongoDB Connection String)
DATABASE_URL=mongodb://localhost:27017/free-clouds
# hoặc MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/free-clouds

# JWT Secret (tối thiểu 32 ký tự)
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id

# Base URL
BASE_URL=http://localhost:3000

# Security
ALLOWED_ORIGIN=http://localhost:3000
```

### 2. Tạo Tài Khoản Admin Đầu Tiên

```bash
# Chạy script setup admin
npm run create-admin
```

Script sẽ hỏi:
- **Họ và tên**: VD: Nguyễn Văn Admin
- **Email**: VD: admin@example.com  
- **Mật khẩu**: Tối thiểu 8 ký tự

### 3. Khởi Động Ứng Dụng

```bash
npm run dev
```

### 4. Truy Cập Admin Panel

1. Mở trình duyệt: `http://localhost:3000/login`
2. Đăng nhập bằng tài khoản admin vừa tạo
3. Tự động chuyển hướng đến: `http://localhost:3000/admin`

## 🎯 Tính Năng Admin Panel

### Dashboard Chính
- **📊 Thống kê tổng quan**: Users, Files, Folders, Storage
- **📈 Biểu đồ tăng trưởng**: Theo ngày/tuần/tháng
- **👥 Top Users**: Xếp hạng theo dung lượng sử dụng
- **⚡ Hoạt động gần đây**: Users mới, Files mới

### Quản Lý Users
- **📋 Danh sách**: Tìm kiếm, lọc, sắp xếp
- **➕ Tạo mới**: Thêm user/admin
- **✏️ Chỉnh sửa**: Cập nhật thông tin, đổi role
- **🗑️ Xóa**: Xóa user và toàn bộ dữ liệu
- **📤 Xuất Excel**: Export danh sách CSV/JSON

## 🔧 Troubleshooting

### Lỗi "DATABASE_URL not found"
```bash
# Kiểm tra file .env.local có DATABASE_URL chưa
cat .env.local | grep DATABASE_URL
```

### Lỗi "Cannot connect to MongoDB"
- Kiểm tra MongoDB đang chạy
- Kiểm tra connection string đúng chưa
- Kiểm tra network/firewall

### Lỗi "403 Forbidden" khi vào /admin
- Đảm bảo đăng nhập bằng tài khoản có role "admin"
- Clear browser cookies và đăng nhập lại

### Script create-admin bị lỗi
```bash
# Chạy với verbose
node scripts/create-admin.js
```

## 📱 Sử Dụng Admin Panel

### Tạo User Mới
1. Vào **Admin Panel** → **Quản lý người dùng**
2. Click **"Thêm người dùng"**
3. Điền thông tin: Tên, Email, Mật khẩu, Vai trò
4. Click **"Tạo người dùng"**

### Chỉnh Sửa User
1. Tìm user trong danh sách
2. Click icon **"Chỉnh sửa"** (bút chì)
3. Cập nhật thông tin cần thiết
4. Click **"Lưu thay đổi"**

### Xem Chi Tiết User
1. Click vào tên user hoặc icon **"Xem"** (mắt)
2. Xem thống kê file, thư mục, dung lượng
3. Xem file upload gần đây

### Thống Kê Hệ Thống
- **Dashboard**: Tổng quan nhanh
- **Users**: Số lượng active/inactive, admin
- **Storage**: Tổng dung lượng, phân bố theo user
- **Files**: Phân bố theo loại file

## 🔐 Bảo Mật

### Best Practices
- ✅ Sử dụng mật khẩu mạnh cho admin
- ✅ Giới hạn số lượng admin
- ✅ Thường xuyên kiểm tra activity logs
- ✅ Backup dữ liệu định kỳ
- ✅ Update dependencies thường xuyên

### Production Setup
```env
# Sử dụng HTTPS
BASE_URL=https://yourdomain.com
ALLOWED_ORIGIN=https://yourdomain.com

# Strong JWT secret
JWT_SECRET=your-very-strong-production-jwt-secret-key-64-characters-long

# Production MongoDB
DATABASE_URL=mongodb+srv://user:pass@cluster.mongodb.net/production-db
```

---

**🇻🇳 Made with ❤️ in Vietnam**

Cần hỗ trợ? Tạo issue trên GitHub hoặc liên hệ: admin@free-clouds.com