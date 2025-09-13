# Email Configuration Setup

## Cấu hình Email cho Free Clouds

Để sử dụng các tính năng quên mật khẩu và xóa tài khoản, bạn cần cấu hình email service sử dụng Gmail.

## 📧 Thiết lập Gmail App Password

### Bước 1: Kích hoạt 2-Factor Authentication
1. Đi tới [Google Account Security](https://myaccount.google.com/security)
2. Kích hoạt "2-Step Verification" nếu chưa có
3. Xác minh tài khoản qua số điện thoại

### Bước 2: Tạo App Password
1. Vào [App Passwords](https://myaccount.google.com/apppasswords)
2. Chọn "Mail" và "Other (Custom name)"
3. Nhập tên: "Free Clouds"
4. Copy mật khẩu được tạo (16 ký tự)

### Bước 3: Cấu hình Environment Variables
Thêm vào file `.env.local`:

```env
# Email Configuration
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-app-password-16-chars
```

## 🔧 Kiểm tra cấu hình

### Test Email Service
Tạo file `test-email.js` trong thư mục gốc:

```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: 'your-gmail@gmail.com',
    pass: 'your-app-password',
  },
});

const testEmail = async () => {
  try {
    const result = await transporter.sendMail({
      from: 'Free Clouds <your-gmail@gmail.com>',
      to: 'test-email@gmail.com',
      subject: 'Test Email từ Free Clouds',
      text: 'Email test thành công!',
    });
    console.log('Email sent:', result.messageId);
  } catch (error) {
    console.error('Email failed:', error);
  }
};

testEmail();
```

Chạy test:
```bash
node test-email.js
```

## 📝 Template Email

### Password Reset Email
- Subject: "Mã đặt lại mật khẩu Free Clouds"
- Mã 6 số ngẫu nhiên
- Có hiệu lực 15 phút
- HTML template responsive

### Account Deletion Email
- Subject: "Xác nhận xóa tài khoản Free Clouds"
- Mã 6 số ngẫu nhiên
- Có hiệu lực 15 phút
- Cảnh báo rõ ràng về tính không thể hoàn tác

## 🛡️ Bảo mật

### Rate Limiting
- Forgot Password: 5 requests / 15 phút
- Reset Password: 10 requests / 15 phút
- Request Deletion: 3 requests / 1 giờ
- Confirm Deletion: 5 requests / 1 giờ

### Validation
- Email format validation
- Code format: 6 chữ số
- Password strength: tối thiểu 6 ký tự
- Automatic code expiration

### Database Security
- Mã xác thực được hash trong database
- TTL index tự động xóa code hết hạn
- Invalidate tất cả code cũ khi tạo mới

## 🚀 Production Setup

### Environment Variables
```env
# Production Email Config
EMAIL_USER=support@yourdomain.com
EMAIL_PASS=production-app-password
NODE_ENV=production
```

### Domain Setup (Optional)
Để có email chuyên nghiệp:
1. Thiết lập Custom Domain trong Gmail
2. Cập nhật DNS records
3. Sử dụng email domain riêng

### Monitoring
- Log tất cả email activities
- Monitor rate limiting
- Track delivery rates
- Set up alerts cho failures

## 🔍 Troubleshooting

### Lỗi thường gặp:

**"Invalid login"**
- Kiểm tra 2FA đã kích hoạt
- Sử dụng App Password, không phải password thường
- Đảm bảo email đúng format

**"Connection timeout"**
- Kiểm tra network connection
- Firewall có thể block port 587/465
- Thử sử dụng VPN nếu bị ISP block

**"Too many requests"**
- Rate limiting đang hoạt động
- Đợi thời gian reset
- Kiểm tra logs để xác định pattern

### Debug Commands
```bash
# Kiểm tra DNS
nslookup smtp.gmail.com

# Test SMTP connection
telnet smtp.gmail.com 587

# Check environment variables
echo $EMAIL_USER
echo $EMAIL_PASS
```

## 📊 Monitoring & Analytics

### Email Delivery Tracking
- Thêm tracking IDs vào emails
- Log delivery status
- Monitor bounce rates

### User Analytics
- Track password reset frequency
- Monitor account deletion requests
- Analyze email open rates

## 🔄 Maintenance

### Regular Tasks
- Clean up expired verification codes
- Monitor email quota usage
- Update email templates
- Review security logs

### Backup Strategy
- Backup email templates
- Document email configurations
- Keep track of app passwords

---

## 📞 Support

Nếu gặp vấn đề với email setup:
1. Kiểm tra logs trong console
2. Verify environment variables
3. Test với email client khác
4. Liên hệ support nếu cần thiết

**Free Clouds by Hoàng Minh Khang**