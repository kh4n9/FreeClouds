"use client";

import { useState, useEffect } from "react";
import {
  X,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Save,
  Loader2,
  Settings,
  Trash2,
  AlertTriangle,
  Shield,
} from "lucide-react";
import { useTranslation, commonTranslations } from "./LanguageSwitcher";

interface UserData {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  stats?: {
    totalFiles: number;
    totalSize: number;
    totalFolders: number;
  };
}

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserData | null;
  onUserUpdate: (user: UserData) => void;
}

export default function UserProfile({
  isOpen,
  onClose,
  user,
  onUserUpdate,
}: UserProfileProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<
    "profile" | "password" | "account"
  >("profile");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userStats, setUserStats] = useState<UserData | null>(null);

  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [deletionStep, setDeletionStep] = useState<
    "confirm" | "code" | "deleting"
  >("confirm");
  const [deletionCode, setDeletionCode] = useState("");
  const [showDeletionModal, setShowDeletionModal] = useState(false);
  const [deletionCountdown, setDeletionCountdown] = useState(0);

  useEffect(() => {
    if (isOpen && user) {
      setProfileForm({ name: user.name, email: user.email });
      loadUserStats();
    }
  }, [isOpen, user]);

  const loadUserStats = async () => {
    try {
      const response = await fetch("/api/user");
      if (response.ok) {
        const userData = await response.json();
        setUserStats(userData);
      }
    } catch (error) {
      console.error("Failed to load user stats:", error);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setActiveTab("profile");
      setError(null);
      setSuccess(null);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowDeletionModal(false);
      setDeletionStep("confirm");
      setDeletionCode("");
      setDeletionCountdown(0);
      setShowPasswords({ current: false, new: false, confirm: false });
    }
  }, [isOpen]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (deletionCountdown > 0) {
      timer = setTimeout(() => setDeletionCountdown(deletionCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [deletionCountdown]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update-profile", name: profileForm.name.trim(), email: profileForm.email.trim() }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess(t("profileUpdated", commonTranslations.profileUpdated));
        onUserUpdate(data.user);
      } else {
        setError(data.error || t("error", commonTranslations.error));
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "change-password",
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
          confirmPassword: passwordForm.confirmPassword,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess(t("passwordChanged", commonTranslations.passwordChanged));
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        setError(data.error || t("error", commonTranslations.error));
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestDeletion = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/request-deletion", { method: "POST", headers: { "Content-Type": "application/json" } });
      const data = await response.json();
      if (response.ok) {
        setDeletionStep("code");
        setDeletionCountdown(60);
        setSuccess(t("verificationCodeSent", commonTranslations.verificationCodeSent));
      } else {
        setError(data.error || t("error", commonTranslations.error));
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDeletion = async () => {
    if (!deletionCode || deletionCode.length !== 6) {
      setError(t("enter6DigitCode", commonTranslations.enter6DigitCode));
      return;
    }
    setLoading(true);
    setError(null);
    setDeletionStep("deleting");
    try {
      const response = await fetch("/api/auth/confirm-deletion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: deletionCode }),
      });
      const data = await response.json();
      if (response.ok) {
        window.location.href = "/";
      } else {
        setError(data.error || "Failed to delete account");
        setDeletionStep("code");
      }
    } catch {
      setError("Network error. Please try again.");
      setDeletionStep("code");
    } finally {
      setLoading(false);
    }
  };

  const handleResendDeletionCode = async () => {
    if (deletionCountdown > 0) return;
    setLoading(true);
    try {
      const response = await fetch("/api/auth/request-deletion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (response.ok) {
        setDeletionCountdown(60);
        setSuccess(t("newVerificationCodeSent", commonTranslations.newVerificationCodeSent));
      } else {
        const data = await response.json();
        setError(data.error || t("error", commonTranslations.error));
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field: "current" | "new" | "confirm") => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content w-full max-w-md max-h-[90vh] overflow-hidden animate-scale-in" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Settings className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-white">
              {t("userSettings", commonTranslations.userSettings)}
            </h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700/50">
          {(["profile", "password", "account"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-all ${
                activeTab === tab
                  ? "text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5"
                  : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/30"
              }`}>
              {tab === "profile" ? t("profileTab", commonTranslations.profileTab)
                : tab === "password" ? t("passwordTab", commonTranslations.passwordTab)
                : t("accountTab", commonTranslations.accountTab)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 max-h-[55vh] overflow-y-auto">
          {success && (
            <div className="mb-4 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 flex-shrink-0" />
              {success}
            </div>
          )}
          {error && (
            <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <form onSubmit={handleProfileSubmit} className="space-y-5">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                  {t("fullName", commonTranslations.fullName)}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" id="name" value={profileForm.name}
                    onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
                    className="input-modern w-full pl-10 pr-4 py-2.5 rounded-xl"
                    placeholder={t("enterFullName", commonTranslations.enterFullName)} required />
                </div>
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                  {t("emailAddress", commonTranslations.emailAddress)}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="email" id="email" value={profileForm.email}
                    onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))}
                    className="input-modern w-full pl-10 pr-4 py-2.5 rounded-xl"
                    placeholder={t("enterEmailAddress", commonTranslations.enterEmailAddress)} required />
                </div>
              </div>

              {userStats && (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-sm">
                  <h4 className="font-medium text-slate-200 mb-3">Account Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-slate-500">Member since</p>
                      <p className="font-medium text-slate-200">
                        {new Date(userStats.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Last updated</p>
                      <p className="font-medium text-slate-200">
                        {new Date(userStats.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {userStats.stats && (
                    <>
                      <hr className="my-3 border-slate-700/50" />
                      <h5 className="font-medium text-slate-200 mb-3">Storage Usage</h5>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="bg-slate-800/80 rounded-xl p-3">
                          <p className="text-lg font-semibold text-indigo-400">{userStats.stats.totalFiles}</p>
                          <p className="text-xs text-slate-500">Files</p>
                        </div>
                        <div className="bg-slate-800/80 rounded-xl p-3">
                          <p className="text-lg font-semibold text-emerald-400">{userStats.stats.totalFolders}</p>
                          <p className="text-xs text-slate-500">Folders</p>
                        </div>
                        <div className="bg-slate-800/80 rounded-xl p-3">
                          <p className="text-lg font-semibold text-purple-400">
                            {(userStats.stats.totalSize / (1024 * 1024)).toFixed(1)} MB
                          </p>
                          <p className="text-xs text-slate-500">Used</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 btn-primary py-2.5 rounded-xl text-sm font-medium disabled:opacity-50">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {loading ? "Updating..." : "Update Profile"}
              </button>
            </form>
          )}

          {/* Password Tab */}
          {activeTab === "password" && (
            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              {(["currentPassword", "newPassword", "confirmPassword"] as const).map((key) => {
                const label = key === "currentPassword" ? "Current Password" : key === "newPassword" ? "New Password" : "Confirm New Password";
                const pwField = key === "currentPassword" ? "current" as const : key === "newPassword" ? "new" as const : "confirm" as const;
                return (
                <div key={key}>
                  <label className="block text-sm font-medium text-slate-300 mb-2">{label}</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type={showPasswords[pwField] ? "text" : "password"}
                      value={passwordForm[key]}
                      onChange={(e) => setPasswordForm((p) => ({ ...p, [key]: e.target.value }))}
                      className="input-modern w-full pl-10 pr-12 py-2.5 rounded-xl"
                      placeholder={label} required={key !== "newPassword"} minLength={key === "newPassword" ? 8 : undefined} />
                    <button type="button" onClick={() => togglePasswordVisibility(pwField)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300">
                      {showPasswords[pwField] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                );
              })}

              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-sm text-slate-400">
                <p className="font-medium text-slate-300 mb-1.5">Password Requirements:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>At least 8 characters long</li>
                  <li>Should be different from current password</li>
                </ul>
              </div>

              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 btn-primary py-2.5 rounded-xl text-sm font-medium disabled:opacity-50">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                {loading ? "Changing..." : "Change Password"}
              </button>
            </form>
          )}

          {/* Account Tab */}
          {activeTab === "account" && (
            <div className="space-y-5">
              {userStats?.stats && (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                  <h4 className="font-medium text-slate-200 mb-3">Storage Overview</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-400">Total Files</span>
                      <span className="font-medium text-slate-200">{userStats.stats.totalFiles}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-400">Total Folders</span>
                      <span className="font-medium text-slate-200">{userStats.stats.totalFolders}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-400">Storage Used</span>
                      <span className="font-medium text-slate-200">
                        {(userStats.stats.totalSize / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    </div>
                    <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
                      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full"
                        style={{ width: `${Math.min((userStats.stats.totalSize / (100 * 1024 * 1024)) * 100, 100)}%` }} />
                    </div>
                    <p className="text-xs text-slate-500">
                      {(userStats.stats.totalSize / (1024 * 1024)).toFixed(2)} MB of 100 MB used
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                <h4 className="font-medium text-red-400 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Danger Zone
                </h4>
                <p className="text-sm text-red-300/70 mb-4">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <button onClick={() => setShowDeletionModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-rose-700 text-white text-sm rounded-xl hover:shadow-lg hover:shadow-red-500/25 transition-all"
                  disabled={loading}>
                  <Trash2 className="w-4 h-4" />
                  Delete Account
                </button>
              </div>

              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                <h4 className="font-medium text-slate-200 mb-3">Account Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">User ID</span>
                    <span className="font-mono text-xs text-slate-500">{userStats?.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Account Created</span>
                    <span className="text-slate-200">
                      {userStats ? new Date(userStats.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Last Modified</span>
                    <span className="text-slate-200">
                      {userStats ? new Date(userStats.updatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "-"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Account Deletion Modal */}
      {showDeletionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowDeletionModal(false); }}>
          <div className="modal-content w-full max-w-md p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {deletionStep === "confirm" ? "Delete Account"
                    : deletionStep === "code" ? "Verify Deletion"
                    : "Deleting Account"}
                </h3>
                <p className="text-sm text-slate-400">
                  {deletionStep === "confirm" ? "This action cannot be undone"
                    : deletionStep === "code" ? "Check your email for verification code"
                    : "Please wait while we delete your account"}
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-sm">
                {success}
              </div>
            )}

            {deletionStep === "confirm" && (
              <div className="space-y-4">
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                  <h4 className="font-medium text-red-400 mb-2">⚠️ Warning</h4>
                  <p className="text-sm text-red-300/70 mb-3">
                    Deleting your account will permanently remove:
                  </p>
                  <ul className="text-sm text-red-300/70 space-y-1 mb-3 list-disc list-inside">
                    <li>All your uploaded files</li>
                    <li>All your folders and organization</li>
                    <li>Your account information</li>
                    <li>All activity history</li>
                  </ul>
                  <p className="text-sm text-red-400 font-medium">This action cannot be reversed!</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowDeletionModal(false)}
                    className="flex-1 btn-secondary py-2.5 rounded-xl text-sm" disabled={loading}>
                    Cancel
                  </button>
                  <button onClick={handleRequestDeletion}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-red-600 to-rose-700 text-white hover:shadow-lg hover:shadow-red-500/25 disabled:opacity-50 transition-all"
                    disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Send Verification Code"}
                  </button>
                </div>
              </div>
            )}

            {deletionStep === "code" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Verification Code</label>
                  <input type="text" maxLength={6} value={deletionCode}
                    onChange={(e) => { setDeletionCode(e.target.value); setError(null); }}
                    className="input-modern w-full px-4 py-3 rounded-xl text-center text-lg font-mono tracking-widest"
                    placeholder="000000" disabled={loading} />
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-400 mb-2">Didn't receive the code?</p>
                  <button onClick={handleResendDeletionCode}
                    disabled={deletionCountdown > 0 || loading}
                    className="text-indigo-400 hover:text-indigo-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                    {deletionCountdown > 0 ? `Resend in ${deletionCountdown}s` : "Resend Code"}
                  </button>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => { setShowDeletionModal(false); setDeletionStep("confirm"); setDeletionCode(""); }}
                    className="flex-1 btn-secondary py-2.5 rounded-xl text-sm" disabled={loading}>
                    Cancel
                  </button>
                  <button onClick={handleConfirmDeletion}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-red-600 to-rose-700 text-white hover:shadow-lg hover:shadow-red-500/25 disabled:opacity-50 transition-all"
                    disabled={loading || !deletionCode || deletionCode.length !== 6}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Delete Account"}
                  </button>
                </div>
              </div>
            )}

            {deletionStep === "deleting" && (
              <div className="text-center space-y-4 py-4">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
                  <Loader2 className="w-8 h-8 text-red-400 animate-spin" />
                </div>
                <div>
                  <p className="text-lg font-medium text-white mb-2">Deleting your account...</p>
                  <p className="text-sm text-slate-400">Please wait while we permanently delete all your data.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
