"use client";

import { useState, useEffect } from "react";
import { Mail, ArrowLeft, Check, AlertCircle, Eye, EyeOff, Lock, Cloud } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthShell from "@/components/AuthShell";

interface ForgotPasswordForm {
  email: string;
}

interface ResetPasswordForm {
  code: string;
  newPassword: string;
  confirmPassword: string;
}

interface FormError {
  message: string;
  field?: string;
}

type Step = 'email' | 'code' | 'password' | 'success';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('email');
  const [emailForm, setEmailForm] = useState<ForgotPasswordForm>({ email: "" });
  const [resetForm, setResetForm] = useState<ResetPasswordForm>({
    code: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<FormError | null>(null);
  const [countdown, setCountdown] = useState(0);
  const router = useRouter();

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        router.push("/dashboard");
      }
    } catch (error) {
      // User not logged in, continue with forgot password page
    }
  };

  useEffect(() => {
    // Check if user is already logged in
    checkAuth();
  }, []);

  // Countdown timer for resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailForm({ email: e.target.value });
    if (error) setError(null);
  };

  const handleResetFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setResetForm(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const validateEmail = (): boolean => {
    if (!emailForm.email.trim()) {
      setError({ message: "Vui lòng nhập địa chỉ email", field: "email" });
      return false;
    }

    if (!emailForm.email.includes("@")) {
      setError({ message: "Vui lòng nhập địa chỉ email hợp lệ", field: "email" });
      return false;
    }

    return true;
  };

  const validateResetForm = (): boolean => {
    if (!resetForm.code.trim()) {
      setError({ message: "Vui lòng nhập mã xác minh", field: "code" });
      return false;
    }

    if (resetForm.code.length !== 6) {
      setError({ message: "Mã xác minh phải có 6 chữ số", field: "code" });
      return false;
    }

    if (!resetForm.newPassword.trim()) {
      setError({ message: "Vui lòng nhập mật khẩu mới", field: "newPassword" });
      return false;
    }

    if (resetForm.newPassword.length < 6) {
      setError({ message: "Mật khẩu phải có ít nhất 6 ký tự", field: "newPassword" });
      return false;
    }

    if (resetForm.confirmPassword !== resetForm.newPassword) {
      setError({ message: "Mật khẩu không khớp", field: "confirmPassword" });
      return false;
    }

    return true;
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailForm),
      });

      const data = await response.json();

      if (response.ok) {
        setStep('code');
        setCountdown(60); // 60 seconds before allowing resend
      } else {
        setError({ message: data.error || "Không thể gửi email đặt lại mật khẩu" });
      }
    } catch (error) {
      console.error("Email submission error:", error);
      setError({ message: "Lỗi mạng. Vui lòng kiểm tra kết nối và thử lại." });
    } finally {
      setLoading(false);
    }
  };

  const handleCodeResend = async () => {
    if (countdown > 0) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailForm),
      });

      if (response.ok) {
        setCountdown(60);
        setError({ message: "Đã gửi mã xác minh mới!", field: "success" });
      } else {
        const data = await response.json();
        setError({ message: data.error || "Không thể gửi lại mã" });
      }
    } catch (error) {
      setError({ message: "Lỗi mạng. Vui lòng thử lại." });
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateResetForm()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailForm.email,
          code: resetForm.code,
          newPassword: resetForm.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStep('success');
      } else {
        setError({ message: data.error || "Không thể đặt lại mật khẩu" });
      }
    } catch (error) {
      console.error("Reset password error:", error);
      setError({ message: "Lỗi mạng. Vui lòng kiểm tra kết nối và thử lại." });
    } finally {
      setLoading(false);
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'email': return 'Quên Mật Khẩu';
      case 'code': return 'Kiểm Tra Email Của Bạn';
      case 'password': return 'Tạo Mật Khẩu Mới';
      case 'success': return 'Đặt Lại Mật Khẩu Thành Công';
      default: return 'Quên Mật Khẩu';
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 'email': return 'Nhập địa chỉ email và chúng tôi sẽ gửi mã xác minh cho bạn';
      case 'code': return `Chúng tôi đã gửi mã 6 chữ số đến ${emailForm.email}`;
      case 'password': return 'Nhập mật khẩu mới của bạn';
      case 'success': return 'Mật khẩu của bạn đã được đặt lại thành công';
      default: return '';
    }
  };

  return (
    <AuthShell>
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 p-3 rounded-2xl bg-accent shadow-[0_12px_32px_-12px_rgba(37,99,235,0.5)]">
            <Cloud className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-2">{getStepTitle()}</h1>
        <p className="text-sub">{getStepDescription()}</p>
      </div>

      <div className="modal-content p-8">
        {error && !error.field && (
          <div className={`p-4 rounded-xl flex items-start gap-3 mb-6 ${
            error.field === 'success'
              ? 'bg-success/10 border border-success/25'
              : 'bg-error/10 border border-error/25'
          }`}>
            {error.field === 'success' ? (
              <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
            )}
            <p className={`text-sm ${
              error.field === 'success' ? 'text-success' : 'text-error'
            }`}>
              {error.message}
            </p>
          </div>
        )}

        {step === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Địa chỉ Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                <input id="email" name="email" type="email" autoComplete="email" required
                  value={emailForm.email} onChange={handleEmailChange}
                  className={`input-modern w-full pl-10 pr-4 py-3 rounded-xl ${
                    error?.field === "email" ? "border-error/50 bg-error/5" : ""
                  }`}
                  placeholder="Nhập địa chỉ email của bạn" disabled={loading} />
              </div>
              {error?.field === "email" && (
                <p className="mt-1.5 text-sm text-error">{error.message}</p>
              )}
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full py-3 rounded-xl font-medium disabled:opacity-50">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Đang gửi mã...
                </span>
              ) : "Gửi Mã Xác Minh"}
            </button>
          </form>
        )}

        {step === 'code' && (
          <div className="space-y-5">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-foreground mb-2">
                Mã Xác Minh
              </label>
              <input id="code" name="code" type="text" maxLength={6}
                value={resetForm.code} onChange={handleResetFormChange}
                className={`input-modern w-full px-4 py-3 rounded-xl text-center text-2xl font-mono tracking-widest ${
                  error?.field === "code" ? "border-error/50 bg-error/5" : ""
                }`}
                placeholder="000000" disabled={loading} />
              {error?.field === "code" && (
                <p className="mt-1.5 text-sm text-error">{error.message}</p>
              )}
            </div>

            <div className="text-center">
              <p className="text-sm text-sub mb-2">
                Không nhận được mã?
              </p>
              <button
                type="button"
                onClick={handleCodeResend}
                disabled={countdown > 0 || loading}
                className="text-accent hover:text-accent-hover font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {countdown > 0 ? `Gửi lại sau ${countdown}s` : "Gửi Lại Mã"}
              </button>
            </div>

            <button
              onClick={() => setStep('password')}
              disabled={!resetForm.code || resetForm.code.length !== 6 || loading}
              className="btn-primary w-full py-3 rounded-xl font-medium disabled:opacity-50"
            >
              Xác Minh Mã
            </button>
          </div>
        )}

        {step === 'password' && (
          <form onSubmit={handleResetSubmit} className="space-y-5">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-foreground mb-2">
                Mật Khẩu Mới
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                <input id="newPassword" name="newPassword" type={showPassword ? "text" : "password"}
                  autoComplete="new-password" required value={resetForm.newPassword} onChange={handleResetFormChange}
                  className={`input-modern w-full pl-10 pr-12 py-3 rounded-xl ${
                    error?.field === "newPassword" ? "border-error/50 bg-error/5" : ""
                  }`}
                  placeholder="Nhập mật khẩu mới" disabled={loading} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {error?.field === "newPassword" && (
                <p className="mt-1.5 text-sm text-error">{error.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
                Xác Nhận Mật Khẩu Mới
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                <input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password" required value={resetForm.confirmPassword} onChange={handleResetFormChange}
                  className={`input-modern w-full pl-10 pr-12 py-3 rounded-xl ${
                    error?.field === "confirmPassword" ? "border-error/50 bg-error/5" : ""
                  }`}
                  placeholder="Xác nhận mật khẩu mới" disabled={loading} />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {error?.field === "confirmPassword" && (
                <p className="mt-1.5 text-sm text-error">{error.message}</p>
              )}
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full py-3 rounded-xl font-medium disabled:opacity-50">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Đang đặt lại...
                </span>
              ) : "Đặt Lại Mật Khẩu"}
            </button>
          </form>
        )}

        {step === 'success' && (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-success/10 border border-success/30 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Đặt Lại Mật Khẩu Thành Công!
              </h3>
              <p className="text-sub mb-6">
                Mật khẩu của bạn đã được cập nhật. Bạn có thể đăng nhập bằng mật khẩu mới ngay bây giờ.
              </p>
            </div>
            <Link href="/vi/login" className="btn-primary w-full py-3 rounded-xl font-medium inline-block text-center">
              Đăng Nhập Ngay
            </Link>
          </div>
        )}

        {step !== 'success' && (
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                if (step === 'code') setStep('email');
                else if (step === 'password') setStep('code');
                else router.push('/vi/login');
              }}
              className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {step === 'email' ? 'Quay lại đăng nhập' : 'Quay lại'}
            </button>
          </div>
        )}
      </div>
    </AuthShell>
  );
}
