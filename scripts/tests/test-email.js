const nodemailer = require('nodemailer');
require('dotenv').config({ path: '.env.local' });

console.log('🧪 Testing Email Configuration...\n');

// Kiểm tra environment variables
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

if (!EMAIL_USER || !EMAIL_PASS) {
  console.error('❌ Thiếu cấu hình email trong .env.local');
  console.log('Cần thêm:');
  console.log('EMAIL_USER=your-email@gmail.com');
  console.log('EMAIL_PASS=your-16-character-app-password');
  process.exit(1);
}

console.log('📧 Email User:', EMAIL_USER);
console.log('🔐 Password Length:', EMAIL_PASS.length, 'characters');
console.log('');

// Tạo transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

// Test email function
const testEmail = async () => {
  try {
    console.log('🔄 Đang kiểm tra kết nối SMTP...');

    // Verify connection
    await transporter.verify();
    console.log('✅ Kết nối Gmail thành công!');

    console.log('📤 Đang gửi email test...');

    // Send test email
    const result = await transporter.sendMail({
      from: `Free Clouds <${EMAIL_USER}>`,
      to: EMAIL_USER, // Gửi cho chính mình
      subject: '🎉 Test Email từ Free Clouds',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; color: white; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">🎉 Email Test Thành Công!</h1>
          </div>

          <div style="padding: 30px; background: #f8f9fa; border-radius: 10px; margin-top: 20px;">
            <h2 style="color: #333; margin-top: 0;">Cấu hình Email Hoạt động!</h2>

            <p style="color: #666; line-height: 1.6;">
              Chúc mừng! Hệ thống email của <strong>Free Clouds</strong> đã được cấu hình thành công.
              Các tính năng sau đây đã sẵn sàng hoạt động:
            </p>

            <ul style="color: #666; line-height: 1.8;">
              <li>🔐 Quên mật khẩu (Forgot Password)</li>
              <li>🗑️ Xác nhận xóa tài khoản</li>
              <li>📧 Gửi mã xác thực</li>
              <li>🛡️ Rate limiting bảo mật</li>
            </ul>

            <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #1976d2;">
                <strong>📊 Thông tin test:</strong><br>
                Thời gian: ${new Date().toLocaleString('vi-VN')}<br>
                Email: ${EMAIL_USER}<br>
                Status: ✅ Thành công
              </p>
            </div>

            <p style="color: #666; font-size: 14px; margin-bottom: 0;">
              Tin nhắn này được gửi tự động từ hệ thống test email.<br>
              <strong>Free Clouds</strong> - Cloud Storage by Hoàng Minh Khang
            </p>
          </div>
        </div>
      `,
      text: `
        🎉 Email Test Thành Công!

        Cấu hình Email Hoạt động!

        Chúc mừng! Hệ thống email của Free Clouds đã được cấu hình thành công.
        Các tính năng sau đây đã sẵn sàng hoạt động:

        - 🔐 Quên mật khẩu (Forgot Password)
        - 🗑️ Xác nhận xóa tài khoản
        - 📧 Gửi mã xác thực
        - 🛡️ Rate limiting bảo mật

        Thông tin test:
        Thời gian: ${new Date().toLocaleString('vi-VN')}
        Email: ${EMAIL_USER}
        Status: ✅ Thành công

        Free Clouds - Cloud Storage by Hoàng Minh Khang
      `
    });

    console.log('✅ Email gửi thành công!');
    console.log('📧 Message ID:', result.messageId);
    console.log('');
    console.log('🎯 Kiểm tra email trong hộp thư của bạn:', EMAIL_USER);
    console.log('');
    console.log('🚀 Hệ thống email đã sẵn sàng cho production!');

  } catch (error) {
    console.error('❌ Lỗi email:', error.message);
    console.log('');
    console.log('🔍 Các bước khắc phục:');
    console.log('1. Kiểm tra EMAIL_USER và EMAIL_PASS trong .env.local');
    console.log('2. Đảm bảo đã kích hoạt 2-Factor Authentication');
    console.log('3. Sử dụng App Password (16 ký tự), không phải password thường');
    console.log('4. Kiểm tra kết nối internet');
    console.log('');
    console.log('📖 Xem hướng dẫn chi tiết: docs/EMAIL_SETUP.md');
  }
};

// Chạy test
testEmail();
