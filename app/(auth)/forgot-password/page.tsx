"use client";

import { useState, useEffect } from "react";
import { Mail, ArrowLeft, Check, AlertCircle, Eye, EyeOff, Lock, Cloud } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Footer from "@/components/Footer";

interface ForgotPasswordForm { email: string; }
interface ResetPasswordForm { code: string; newPassword: string; confirmPassword: string; }
interface FormError { message: string; field?: string; }
type Step = 'email' | 'code' | 'password' | 'success';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('email');
  const [emailForm, setEmailForm] = useState<ForgotPasswordForm>({ email: "" });
  const [resetForm, setResetForm] = useState<ResetPasswordForm>({ code: "", newPassword: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<FormError | null>(null);
  const [countdown, setCountdown] = useState(0);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try { if ((await fetch("/api/auth/me")).ok) router.push("/dashboard"); } catch { /* not logged in */ }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(t);
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
    if (!emailForm.email.trim()) { setError({ message: "Email is required", field: "email" }); return false; }
    if (!emailForm.email.includes("@")) { setError({ message: "Please enter a valid email address", field: "email" }); return false; }
    return true;
  };

  const validateResetForm = (): boolean => {
    if (!resetForm.code.trim()) { setError({ message: "Verification code is required", field: "code" }); return false; }
    if (resetForm.code.length !== 6) { setError({ message: "Verification code must be 6 digits", field: "code" }); return false; }
    if (!resetForm.newPassword.trim()) { setError({ message: "New password is required", field: "newPassword" }); return false; }
    if (resetForm.newPassword.length < 6) { setError({ message: "Password must be at least 6 characters long", field: "newPassword" }); return false; }
    if (resetForm.confirmPassword !== resetForm.newPassword) { setError({ message: "Passwords do not match", field: "confirmPassword" }); return false; }
    return true;
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail()) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/auth/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(emailForm) });
      const data = await res.json();
      if (res.ok) { setStep('code'); setCountdown(60); }
      else setError({ message: data.error || "Failed to send reset email" });
    } catch { setError({ message: "Network error. Please check your connection and try again." }); }
    finally { setLoading(false); }
  };

  const handleCodeResend = async () => {
    if (countdown > 0) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/auth/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(emailForm) });
      if (res.ok) { setCountdown(60); setError({ message: "New verification code sent!", field: "success" }); }
      else { const data = await res.json(); setError({ message: data.error || "Failed to resend code" }); }
    } catch { setError({ message: "Network error. Please try again." }); }
    finally { setLoading(false); }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateResetForm()) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: emailForm.email, code: resetForm.code, newPassword: resetForm.newPassword }) });
      if (res.ok) setStep('success');
      else { const data = await res.json(); setError({ message: data.error || "Failed to reset password" }); }
    } catch { setError({ message: "Network error. Please check your connection and try again." }); }
    finally { setLoading(false); }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'email': return 'Forgot Password';
      case 'code': return 'Check Your Email';
      case 'password': return 'Create New Password';
      case 'success': return 'Password Reset Complete';
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 'email': return "Enter your email address and we'll send you a verification code";
      case 'code': return `We've sent a 6-digit code to ${emailForm.email}`;
      case 'password': return 'Enter your new password';
      case 'success': return 'Your password has been successfully reset';
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Cloud className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">{getStepTitle()}</h1>
            <p className="text-slate-400">{getStepDescription()}</p>
          </div>

          <div className="modal-content p-8">
            {error && !error.field && (
              <div className={`p-4 rounded-xl flex items-start gap-3 mb-6 ${
                error.field === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'
              }`}>
                {error.field === 'success' ? <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />}
                <p className={`text-sm ${error.field === 'success' ? 'text-emerald-300' : 'text-red-300'}`}>{error.message}</p>
              </div>
            )}

            {step === 'email' && (
              <form onSubmit={handleEmailSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input id="email" name="email" type="email" autoComplete="email" required
                      value={emailForm.email} onChange={handleEmailChange}
                      className={`input-modern w-full pl-10 pr-4 py-3 rounded-xl ${error?.field === "email" ? "border-red-500/50 bg-red-500/5" : ""}`}
                      placeholder="Enter your email" disabled={loading} />
                  </div>
                  {error?.field === "email" && <p className="mt-1 text-sm text-red-400">{error.message}</p>}
                </div>
                <button type="submit" disabled={loading}
                  className="btn-primary w-full py-3 rounded-xl font-medium disabled:opacity-50">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending Code...</span>
                  ) : "Send Verification Code"}
                </button>
              </form>
            )}

            {step === 'code' && (
              <div className="space-y-5">
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-slate-300 mb-2">Verification Code</label>
                  <input id="code" name="code" type="text" maxLength={6}
                    value={resetForm.code} onChange={handleResetFormChange}
                    className={`input-modern w-full px-4 py-3 rounded-xl text-center text-2xl font-mono tracking-widest ${error?.field === "code" ? "border-red-500/50 bg-red-500/5" : ""}`}
                    placeholder="000000" disabled={loading} />
                  {error?.field === "code" && <p className="mt-1 text-sm text-red-400">{error.message}</p>}
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-400 mb-2">Didn't receive the code?</p>
                  <button type="button" onClick={handleCodeResend} disabled={countdown > 0 || loading}
                    className="text-indigo-400 hover:text-indigo-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                    {countdown > 0 ? `Resend in ${countdown}s` : "Resend Code"}
                  </button>
                </div>
                <button onClick={() => setStep('password')}
                  disabled={!resetForm.code || resetForm.code.length !== 6 || loading}
                  className="btn-primary w-full py-3 rounded-xl font-medium disabled:opacity-50">
                  Verify Code
                </button>
              </div>
            )}

            {step === 'password' && (
              <form onSubmit={handleResetSubmit} className="space-y-5">
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-slate-300 mb-2">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input id="newPassword" name="newPassword" type={showPassword ? "text" : "password"}
                      autoComplete="new-password" required value={resetForm.newPassword} onChange={handleResetFormChange}
                      className={`input-modern w-full pl-10 pr-12 py-3 rounded-xl ${error?.field === "newPassword" ? "border-red-500/50 bg-red-500/5" : ""}`}
                      placeholder="Enter new password" disabled={loading} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {error?.field === "newPassword" && <p className="mt-1 text-sm text-red-400">{error.message}</p>}
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-2">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password" required value={resetForm.confirmPassword} onChange={handleResetFormChange}
                      className={`input-modern w-full pl-10 pr-12 py-3 rounded-xl ${error?.field === "confirmPassword" ? "border-red-500/50 bg-red-500/5" : ""}`}
                      placeholder="Confirm new password" disabled={loading} />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {error?.field === "confirmPassword" && <p className="mt-1 text-sm text-red-400">{error.message}</p>}
                </div>
                <button type="submit" disabled={loading}
                  className="btn-primary w-full py-3 rounded-xl font-medium disabled:opacity-50">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Resetting Password...</span>
                  ) : "Reset Password"}
                </button>
              </form>
            )}

            {step === 'success' && (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Password Reset Successful!</h3>
                  <p className="text-slate-400 mb-6">Your password has been successfully updated. You can now sign in with your new password.</p>
                </div>
                <Link href="/login" className="btn-primary w-full py-3 rounded-xl font-medium inline-block text-center">
                  Sign In Now
                </Link>
              </div>
            )}

            {step !== 'success' && (
              <div className="mt-6 text-center">
                <button onClick={() => {
                  if (step === 'code') setStep('email');
                  else if (step === 'password') setStep('code');
                  else router.push('/login');
                }} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                  {step === 'email' ? 'Back to Sign In' : 'Back'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
