import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface VerificationCodeData {
  email: string;
  code: string;
  type: "password_reset" | "account_deletion" | "email_verification";
  expiresAt: Date;
}

// Create transporter for Gmail
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // App password, not regular password
    },
  });
};

// Generate 6-digit verification code
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send email
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: {
        name: "Free Clouds",
        address: process.env.EMAIL_USER || "",
      },
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", result.messageId);
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}

// Send password reset email
export async function sendPasswordResetEmail(
  email: string,
  code: string,
): Promise<boolean> {
  const subject = "Mã đặt lại mật khẩu Free Clouds";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Đặt lại mật khẩu</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .container {
          background: #ffffff;
          border-radius: 12px;
          padding: 40px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          background: #3B82F6;
          color: white;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 20px;
        }
        .title {
          color: #1F2937;
          font-size: 24px;
          font-weight: 600;
          margin: 0;
        }
        .code-container {
          background: #F3F4F6;
          border: 2px dashed #D1D5DB;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          margin: 30px 0;
        }
        .code {
          font-size: 32px;
          font-weight: bold;
          font-family: 'Courier New', monospace;
          color: #3B82F6;
          letter-spacing: 4px;
        }
        .warning {
          background: #FEF3C7;
          border: 1px solid #F59E0B;
          border-radius: 6px;
          padding: 16px;
          margin: 20px 0;
        }
        .warning-title {
          color: #92400E;
          font-weight: 600;
          margin: 0 0 8px 0;
        }
        .warning-text {
          color: #92400E;
          margin: 0;
          font-size: 14px;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #E5E7EB;
          color: #6B7280;
          font-size: 14px;
        }
        .button {
          display: inline-block;
          background: #3B82F6;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 500;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">FC</div>
          <h1 class="title">Đặt lại mật khẩu</h1>
        </div>

        <p>Xin chào,</p>
        <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản Free Clouds của mình. Sử dụng mã xác thực dưới đây để tiếp tục:</p>

        <div class="code-container">
          <div class="code">${code}</div>
        </div>

        <div class="warning">
          <p class="warning-title">⚠️ Lưu ý bảo mật</p>
          <p class="warning-text">
            • Mã này có hiệu lực trong 15 phút<br>
            • Không chia sẻ mã này với bất kỳ ai<br>
            • Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này
          </p>
        </div>

        <p>Nếu bạn gặp khó khăn, vui lòng liên hệ với chúng tôi qua email hỗ trợ.</p>

        <div class="footer">
          <p>Email này được gửi từ <strong>Free Clouds</strong></p>
          <p>By Hoàng Minh Khang</p>
          <p style="margin-top: 10px; font-size: 12px;">
            Đây là email tự động, vui lòng không trả lời email này.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Đặt lại mật khẩu Free Clouds

    Mã xác thực của bạn là: ${code}

    Mã này có hiệu lực trong 15 phút.
    Không chia sẻ mã này với bất kỳ ai.

    Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.

    ---
    Free Clouds
    By Hoàng Minh Khang
  `;

  return await sendEmail({
    to: email,
    subject,
    html,
    text,
  });
}

// Send email verification email
export async function sendVerificationEmail(
  email: string,
  code: string,
): Promise<boolean> {
  const subject = "Xác thực email Free Clouds";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Xác thực email</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .container {
          background: #ffffff;
          border-radius: 12px;
          padding: 40px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          background: #3B82F6;
          color: white;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 20px;
        }
        .title {
          color: #1F2937;
          font-size: 24px;
          font-weight: 600;
          margin: 0;
        }
        .code-container {
          background: #F3F4F6;
          border: 2px dashed #D1D5DB;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          margin: 30px 0;
        }
        .code {
          font-size: 32px;
          font-weight: bold;
          font-family: 'Courier New', monospace;
          color: #3B82F6;
          letter-spacing: 4px;
        }
        .warning {
          background: #FEF3C7;
          border: 1px solid #F59E0B;
          border-radius: 6px;
          padding: 16px;
          margin: 20px 0;
        }
        .warning-title {
          color: #92400E;
          font-weight: 600;
          margin: 0 0 8px 0;
        }
        .warning-text {
          color: #92400E;
          margin: 0;
          font-size: 14px;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #E5E7EB;
          color: #6B7280;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">FC</div>
          <h1 class="title">Xác thực email</h1>
        </div>

        <p>Xin chào,</p>
        <p>Bạn đã yêu cầu xác thực địa chỉ email cho tài khoản Free Clouds của mình. Sử dụng mã xác thực dưới đây:</p>

        <div class="code-container">
          <div class="code">${code}</div>
        </div>

        <div class="warning">
          <p class="warning-title">⚠️ Lưu ý bảo mật</p>
          <p class="warning-text">
            • Mã này có hiệu lực trong 15 phút<br>
            • Không chia sẻ mã này với bất kỳ ai<br>
            • Nếu bạn không yêu cầu xác thực email, vui lòng bỏ qua email này
          </p>
        </div>

        <div class="footer">
          <p>Email này được gửi từ <strong>Free Clouds</strong></p>
          <p>By Hoàng Minh Khang</p>
          <p style="margin-top: 10px; font-size: 12px;">
            Đây là email tự động, vui lòng không trả lời email này.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Xác thực email Free Clouds

    Mã xác thực của bạn là: ${code}

    Mã này có hiệu lực trong 15 phút.
    Không chia sẻ mã này với bất kỳ ai.

    Nếu bạn không yêu cầu xác thực email, vui lòng bỏ qua email này.

    ---
    Free Clouds
    By Hoàng Minh Khang
  `;

  return await sendEmail({
    to: email,
    subject,
    html,
    text,
  });
}

// Send account deletion confirmation email
export async function sendAccountDeletionEmail(
  email: string,
  code: string,
): Promise<boolean> {
  const subject = "Xác nhận xóa tài khoản Free Clouds";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Xác nhận xóa tài khoản</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .container {
          background: #ffffff;
          border-radius: 12px;
          padding: 40px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          background: #EF4444;
          color: white;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 20px;
        }
        .title {
          color: #DC2626;
          font-size: 24px;
          font-weight: 600;
          margin: 0;
        }
        .code-container {
          background: #FEF2F2;
          border: 2px dashed #FCA5A5;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          margin: 30px 0;
        }
        .code {
          font-size: 32px;
          font-weight: bold;
          font-family: 'Courier New', monospace;
          color: #DC2626;
          letter-spacing: 4px;
        }
        .danger {
          background: #FEF2F2;
          border: 1px solid #F87171;
          border-radius: 6px;
          padding: 16px;
          margin: 20px 0;
        }
        .danger-title {
          color: #DC2626;
          font-weight: 600;
          margin: 0 0 8px 0;
        }
        .danger-text {
          color: #DC2626;
          margin: 0;
          font-size: 14px;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #E5E7EB;
          color: #6B7280;
          font-size: 14px;
        }
        ul {
          margin: 10px 0;
          padding-left: 20px;
        }
        li {
          margin: 5px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">⚠️</div>
          <h1 class="title">Xác nhận xóa tài khoản</h1>
        </div>

        <p>Xin chào,</p>
        <p>Bạn đã yêu cầu <strong>xóa vĩnh viễn</strong> tài khoản Free Clouds của mình. Đây là hành động không thể hoàn tác.</p>

        <div class="code-container">
          <div class="code">${code}</div>
        </div>

        <div class="danger">
          <p class="danger-title">🚨 CẢNH BÁO QUAN TRỌNG</p>
          <p class="danger-text">
            Khi xóa tài khoản, bạn sẽ mất vĩnh viễn:
          </p>
          <ul style="color: #DC2626; margin: 10px 0;">
            <li>Tất cả các file đã upload</li>
            <li>Tất cả các thư mục đã tạo</li>
            <li>Lịch sử hoạt động</li>
            <li>Thông tin tài khoản</li>
          </ul>
          <p class="danger-text">
            • Mã này có hiệu lực trong 15 phút<br>
            • Không chia sẻ mã này với bất kỳ ai<br>
            • Nếu bạn không muốn xóa tài khoản, vui lòng bỏ qua email này
          </p>
        </div>

        <p><strong>Lưu ý:</strong> Nếu bạn chỉ muốn thay đổi thông tin tài khoản hoặc tạm dừng sử dụng, vui lòng liên hệ với chúng tôi thay vì xóa tài khoản.</p>

        <div class="footer">
          <p>Email này được gửi từ <strong>Free Clouds</strong></p>
          <p>By Hoàng Minh Khang</p>
          <p style="margin-top: 10px; font-size: 12px;">
            Đây là email tự động, vui lòng không trả lời email này.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Xác nhận xóa tài khoản Free Clouds

    Mã xác thực của bạn là: ${code}

    CẢNH BÁO: Đây là hành động không thể hoàn tác!

    Khi xóa tài khoản, bạn sẽ mất vĩnh viễn:
    - Tất cả các file đã upload
    - Tất cả các thư mục đã tạo
    - Lịch sử hoạt động
    - Thông tin tài khoản

    Mã này có hiệu lực trong 15 phút.
    Không chia sẻ mã này với bất kỳ ai.

    Nếu bạn không muốn xóa tài khoản, vui lòng bỏ qua email này.

    ---
    Free Clouds
    By Hoàng Minh Khang
  `;

  return await sendEmail({
    to: email,
    subject,
    html,
    text,
  });
}

// Send vault (hidden folder) PIN reset email
export async function sendVaultPinResetEmail(
  email: string,
  code: string,
  folderName: string,
): Promise<boolean> {
  const subject = "Mã khôi phục mã PIN thư mục bảo mật Free Clouds";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Khôi phục mã PIN thư mục bảo mật</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .container {
          background: #ffffff;
          border-radius: 12px;
          padding: 40px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          background: #3B82F6;
          color: white;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 20px;
        }
        .title {
          color: #1F2937;
          font-size: 24px;
          font-weight: 600;
          margin: 0;
        }
        .code-container {
          background: #F3F4F6;
          border: 2px dashed #D1D5DB;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          margin: 30px 0;
        }
        .code {
          font-size: 32px;
          font-weight: bold;
          font-family: 'Courier New', monospace;
          color: #3B82F6;
          letter-spacing: 4px;
        }
        .warning {
          background: #FEF3C7;
          border: 1px solid #F59E0B;
          border-radius: 6px;
          padding: 16px;
          margin: 20px 0;
        }
        .warning-title {
          color: #92400E;
          font-weight: 600;
          margin: 0 0 8px 0;
        }
        .warning-text {
          color: #92400E;
          margin: 0;
          font-size: 14px;
        }
        .folder {
          background: #EFF6FF;
          border: 1px solid #BFDBFE;
          border-radius: 8px;
          padding: 12px 16px;
          color: #1E40AF;
          font-weight: 500;
          margin: 16px 0;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #E5E7EB;
          color: #6B7280;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">FC</div>
          <h1 class="title">Khôi phục mã PIN thư mục bảo mật</h1>
        </div>

        <p>Xin chào,</p>
        <p>Bạn đã yêu cầu khôi phục mã PIN cho thư mục bảo mật:</p>

        <div class="folder">🔒 ${folderName}</div>

        <p>Sử dụng mã xác thực dưới đây để đặt mã PIN mới:</p>

        <div class="code-container">
          <div class="code">${code}</div>
        </div>

        <div class="warning">
          <p class="warning-title">⚠️ Lưu ý bảo mật</p>
          <p class="warning-text">
            • Mã này có hiệu lực trong 15 phút<br>
            • Không chia sẻ mã này với bất kỳ ai<br>
            • Nếu bạn không yêu cầu khôi phục mã PIN, vui lòng bỏ qua email này và đổi mật khẩu tài khoản ngay lập tức
          </p>
        </div>

        <p>Nếu bạn gặp khó khăn, vui lòng liên hệ với chúng tôi qua email hỗ trợ.</p>

        <div class="footer">
          <p>Email này được gửi từ <strong>Free Clouds</strong></p>
          <p>By Hoàng Minh Khang</p>
          <p style="margin-top: 10px; font-size: 12px;">
            Đây là email tự động, vui lòng không trả lời email này.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Khôi phục mã PIN thư mục bảo mật Free Clouds

    Thư mục: ${folderName}

    Mã xác thực của bạn là: ${code}

    Mã này có hiệu lực trong 15 phút.
    Không chia sẻ mã này với bất kỳ ai.

    Nếu bạn không yêu cầu khôi phục mã PIN, vui lòng bỏ qua email này.

    ---
    Free Clouds
    By Hoàng Minh Khang
  `;

  return await sendEmail({
    to: email,
    subject,
    html,
    text,
  });
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Check if email is from Gmail (optional additional validation)
export function isGmailAddress(email: string): boolean {
  return email.toLowerCase().endsWith("@gmail.com");
}

export type { VerificationCodeData };
