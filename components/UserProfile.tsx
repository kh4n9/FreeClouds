"use client";

import { useState, useEffect, useRef } from "react";
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
  BadgeCheck,
  Clock,
  Camera,
  Trash,
  KeyRound,
  Copy,
  Check,
} from "lucide-react";
import { useTranslation, commonTranslations } from "./LanguageSwitcher";

interface UserData {
  id: string;
  name: string;
  email: string;
  emailVerified?: boolean;
  avatar?: string | null;
  storageLimit?: number;
  customStorageLimit?: boolean;
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
    "profile" | "password" | "account" | "webdav"
  >("profile");

  const formatBytes = (bytes: number): string => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };
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

  // Email verification state
  const [verifyStep, setVerifyStep] = useState<"idle" | "code">("idle");
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyCountdown, setVerifyCountdown] = useState(0);
  const [verifying, setVerifying] = useState(false);

  // Avatar state
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // WebDAV state
  const [webdav, setWebdav] = useState<{
    enabled: boolean;
    createdAt: string | null;
    webdavUrl: string;
  } | null>(null);
  const [webdavToken, setWebdavToken] = useState<string | null>(null);
  const [webdavBusy, setWebdavBusy] = useState(false);
  const [webdavCopied, setWebdavCopied] = useState(false);

  const loadWebdavStatus = async () => {
    try {
      const response = await fetch("/api/user/webdav-token");
      if (response.ok) {
        setWebdav(await response.json());
      }
    } catch {
      // Ignore - treated as disabled
    }
  };

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
    if (isOpen && user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProfileForm({ name: user.name, email: user.email });
      loadUserStats();
      loadWebdavStatus();
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (!isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab("profile");
      setError(null);
      setSuccess(null);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowDeletionModal(false);
      setDeletionStep("confirm");
      setDeletionCode("");
      setDeletionCountdown(0);
      setShowPasswords({ current: false, new: false, confirm: false });
      setVerifyStep("idle");
      setVerifyCode("");
      setVerifyCountdown(0);
      setAvatarPreview(null);
      setWebdav(null);
      setWebdavToken(null);
      setWebdavCopied(false);
    }
  }, [isOpen]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (deletionCountdown > 0) {
      timer = setTimeout(() => setDeletionCountdown(deletionCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [deletionCountdown]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (verifyCountdown > 0) {
      timer = setTimeout(() => setVerifyCountdown(verifyCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [verifyCountdown]);

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

  const handleSendVerification = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send" }),
      });
      const data = await response.json();
      if (response.ok) {
        setVerifyStep("code");
        setVerifyCountdown(60);
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

  const handleVerifyEmail = async () => {
    if (!verifyCode || verifyCode.length !== 6) {
      setError(t("enter6DigitCode", commonTranslations.enter6DigitCode));
      return;
    }
    setVerifying(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", code: verifyCode }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess(t("emailVerifiedSuccess", commonTranslations.emailVerifiedSuccess));
        setVerifyStep("idle");
        setVerifyCode("");
        loadUserStats();
        onUserUpdate({ ...user!, emailVerified: true });
      } else {
        setError(data.error || t("error", commonTranslations.error));
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const size = 256;
        const canvas = document.createElement("canvas");
        const ratio = Math.min(size / img.width, size / img.height, 1);
        canvas.width = Math.max(1, Math.round(img.width * ratio));
        canvas.height = Math.max(1, Math.round(img.height * ratio));
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setAvatarPreview(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setAvatarPreview(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = () => setError("Could not read image");
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAvatar = async () => {
    if (!avatarPreview) return;
    setAvatarSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update-avatar", avatar: avatarPreview }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess("Avatar updated");
        setAvatarPreview(null);
        loadUserStats();
        onUserUpdate({ ...user!, avatar: data.avatar });
      } else {
        setError(data.error || "Failed to update avatar");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setAvatarSaving(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove-avatar" }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess("Avatar removed");
        setAvatarPreview(null);
        loadUserStats();
        onUserUpdate({ ...user!, avatar: null });
      } else {
        setError(data.error || "Failed to remove avatar");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setAvatarSaving(false);
    }
  };

  const handleGenerateWebdavToken = async () => {
    setWebdavBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch("/api/user/webdav-token", { method: "POST" });
      const data = await response.json();
      if (response.ok) {
        setWebdavToken(data.token);
        setWebdav({ enabled: true, createdAt: new Date().toISOString(), webdavUrl: data.webdavUrl });
        setSuccess(t("webdavTokenCreated", commonTranslations.webdavTokenCreated));
      } else {
        setError(data.error || t("error", commonTranslations.error));
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setWebdavBusy(false);
    }
  };

  const handleRevokeWebdavToken = async () => {
    setWebdavBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch("/api/user/webdav-token", { method: "DELETE" });
      const data = await response.json();
      if (response.ok) {
        setWebdav(null);
        setWebdavToken(null);
        setWebdavCopied(false);
        setSuccess(t("webdavTokenRevoked", commonTranslations.webdavTokenRevoked));
      } else {
        setError(data.error || t("error", commonTranslations.error));
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setWebdavBusy(false);
    }
  };

  const handleCopyWebdavToken = async () => {
    if (!webdavToken) return;
    try {
      await navigator.clipboard.writeText(webdavToken);
      setWebdavCopied(true);
      setTimeout(() => setWebdavCopied(false), 2000);
    } catch {
      setError("Failed to copy token");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content w-full max-w-md max-h-[90vh] overflow-hidden animate-scale-in" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-line">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center">
              <Settings className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">
              {t("userSettings", commonTranslations.userSettings)}
            </h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-foreground hover:bg-card-hover transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-line">
          {(["profile", "password", "account", "webdav"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-all ${
                activeTab === tab
                  ? "text-accent border-b-2 border-blue-500 bg-blue-500/5"
                  : "text-muted hover:text-foreground hover:bg-card-hover/30"
              }`}>
              {tab === "profile" ? t("profileTab", commonTranslations.profileTab)
                : tab === "password" ? t("passwordTab", commonTranslations.passwordTab)
                : tab === "account" ? t("accountTab", commonTranslations.accountTab)
                : t("webdavTab", commonTranslations.webdavTab)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 max-h-[55vh] overflow-y-auto">
          {success && (
            <div className="mb-4 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 text-success rounded-xl text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 flex-shrink-0" />
              {success}
            </div>
          )}
          {error && (
            <div className="mb-4 px-4 py-3 bg-error/10 border border-red-500/20 text-error rounded-xl text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <>
              {/* Email verification card */}
              <div className={`mb-5 rounded-xl border p-4 ${userStats?.emailVerified ? "bg-emerald-500/5 border-emerald-500/20" : "bg-amber-500/5 border-amber-500/20"}`}>
                <div className="flex items-start gap-3">
                  {userStats?.emailVerified ? (
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                      <BadgeCheck className="w-5 h-5 text-success" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-warning/10 border border-warning/30 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-warning" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${userStats?.emailVerified ? "text-success" : "text-warning"}`}>
                      {userStats?.emailVerified
                        ? t("emailVerified", commonTranslations.emailVerified)
                        : t("emailNotVerified", commonTranslations.emailNotVerified)}
                    </p>
                    {userStats?.emailVerified ? (
                      <p className="text-xs text-muted mt-0.5">
                        {userStats.email}
                      </p>
                    ) : (
                      <>
                        <p className="text-xs text-muted mt-0.5">
                          {t("verifyEmailPrompt", commonTranslations.verifyEmailPrompt)}
                        </p>
                        {verifyStep === "code" ? (
                          <div className="mt-3 space-y-2">
                            <input
                              type="text"
                              maxLength={6}
                              value={verifyCode}
                              onChange={(e) => { setVerifyCode(e.target.value.replace(/\D/g, "")); setError(null); }}
                              className="input-modern w-full px-4 py-2 rounded-xl text-center text-lg font-mono tracking-widest"
                              placeholder="000000"
                              disabled={verifying}
                            />
                            <div className="flex items-center justify-between">
                              <button onClick={handleSendVerification}
                                disabled={verifyCountdown > 0 || loading}
                                className="text-accent hover:text-accent text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                                {verifyCountdown > 0 ? `Resend in ${verifyCountdown}s` : t("resendCode", commonTranslations.resendCode)}
                              </button>
                              <button onClick={handleVerifyEmail}
                                disabled={verifying || verifyCode.length !== 6}
                                className="px-4 py-1.5 rounded-lg text-xs font-medium bg-accent text-white disabled:opacity-50 transition-all">
                                {verifying ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : t("verifyEmail", commonTranslations.verifyEmail)}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={handleSendVerification} disabled={loading}
                            className="mt-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-warning/10 border border-warning/30 text-warning hover:bg-amber-500/20 transition-all">
                            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : t("verifyNow", commonTranslations.verifyNow)}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Avatar card */}
              <div className="mb-5 rounded-xl border border-line bg-card/40 p-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-accent flex items-center justify-center shrink-0">
                    {avatarPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                    ) : userStats?.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={userStats.avatar} alt={userStats.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">Profile picture</p>
                    <p className="text-xs text-muted mt-0.5">
                      {avatarPreview ? "Preview of your new photo" : "PNG, JPG or WebP up to 5MB"}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleAvatarFile} className="hidden" />
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={avatarSaving}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 transition-all disabled:opacity-50">
                    <Camera className="w-3.5 h-3.5" />
                    Choose photo
                  </button>
                  {avatarPreview && (
                    <>
                      <button type="button" onClick={handleSaveAvatar} disabled={avatarSaving}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium btn-primary disabled:opacity-50">
                        {avatarSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Save
                      </button>
                      <button type="button" onClick={() => { setAvatarPreview(null); setError(null); }} disabled={avatarSaving}
                        className="px-3 py-2 rounded-lg text-xs font-medium text-muted hover:bg-card-hover hover:text-foreground transition-all disabled:opacity-50">
                        Cancel
                      </button>
                    </>
                  )}
                  {!avatarPreview && userStats?.avatar && (
                    <button type="button" onClick={handleRemoveAvatar} disabled={avatarSaving}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-error hover:bg-error/10 transition-all disabled:opacity-50">
                      {avatarSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash className="w-3.5 h-3.5" />}
                      Remove
                    </button>
                  )}
                </div>
              </div>

              <form onSubmit={handleProfileSubmit} className="space-y-5">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                  {t("fullName", commonTranslations.fullName)}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input type="text" id="name" value={profileForm.name}
                    onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
                    className="input-modern w-full pl-10 pr-4 py-2.5 rounded-xl"
                    placeholder={t("enterFullName", commonTranslations.enterFullName)} required />
                </div>
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  {t("emailAddress", commonTranslations.emailAddress)}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input type="email" id="email" value={profileForm.email}
                    onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))}
                    className="input-modern w-full pl-10 pr-4 py-2.5 rounded-xl"
                    placeholder={t("enterEmailAddress", commonTranslations.enterEmailAddress)} required />
                </div>
              </div>

              {userStats && (
                <div className="bg-card border border-line rounded-xl p-4 text-sm">
                  <h4 className="font-medium text-foreground mb-3">Account Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-muted">Member since</p>
                      <p className="font-medium text-foreground">
                        {new Date(userStats.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted">Last updated</p>
                      <p className="font-medium text-foreground">
                        {new Date(userStats.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {userStats.stats && (
                    <>
                      <hr className="my-3 border-line" />
                      <h5 className="font-medium text-foreground mb-3">Storage Usage</h5>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="bg-card rounded-xl p-3">
                          <p className="text-lg font-semibold text-accent">{userStats.stats.totalFiles}</p>
                          <p className="text-xs text-muted">Files</p>
                        </div>
                        <div className="bg-card rounded-xl p-3">
                          <p className="text-lg font-semibold text-success">{userStats.stats.totalFolders}</p>
                          <p className="text-xs text-muted">Folders</p>
                        </div>
                        <div className="bg-card rounded-xl p-3">
                          <p className="text-lg font-semibold text-accent">
                            {(userStats.stats.totalSize / (1024 * 1024)).toFixed(1)} MB
                          </p>
                          <p className="text-xs text-muted">Used</p>
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
            </>
          )}

          {/* Password Tab */}
          {activeTab === "password" && (
            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              {(["currentPassword", "newPassword", "confirmPassword"] as const).map((key) => {
                const label = key === "currentPassword" ? "Current Password" : key === "newPassword" ? "New Password" : "Confirm New Password";
                const pwField = key === "currentPassword" ? "current" as const : key === "newPassword" ? "new" as const : "confirm" as const;
                return (
                <div key={key}>
                  <label className="block text-sm font-medium text-foreground mb-2">{label}</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                    <input type={showPasswords[pwField] ? "text" : "password"}
                      value={passwordForm[key]}
                      onChange={(e) => setPasswordForm((p) => ({ ...p, [key]: e.target.value }))}
                      className="input-modern w-full pl-10 pr-12 py-2.5 rounded-xl"
                      placeholder={label} required={key !== "newPassword"} minLength={key === "newPassword" ? 8 : undefined} />
                    <button type="button" onClick={() => togglePasswordVisibility(pwField)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground">
                      {showPasswords[pwField] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                );
              })}

              <div className="bg-card border border-line rounded-xl p-4 text-sm text-muted">
                <p className="font-medium text-foreground mb-1.5">Password Requirements:</p>
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
                <div className="bg-card border border-line rounded-xl p-4">
                  <h4 className="font-medium text-foreground mb-3">Storage Overview</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted">Total Files</span>
                      <span className="font-medium text-foreground">{userStats.stats.totalFiles}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted">Total Folders</span>
                      <span className="font-medium text-foreground">{userStats.stats.totalFolders}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted">Storage Used</span>
                      <span className="font-medium text-foreground">
                        {(userStats.stats.totalSize / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    </div>
                    <div className="w-full bg-card-hover rounded-full h-2 overflow-hidden">
                      <div className="bg-accent h-2 rounded-full"
                        style={{ width: `${Math.min((userStats.stats.totalSize / (userStats.storageLimit || 1)) * 100, 100)}%` }} />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-muted">
                        {formatBytes(userStats.stats.totalSize)} of {formatBytes(userStats.storageLimit || 0)} used
                      </p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${userStats.customStorageLimit ? "bg-accent/10 text-accent" : "bg-card-hover text-muted"}`}>
                        {userStats.customStorageLimit ? "Custom plan" : "System default"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-error/5 border border-red-500/20 rounded-xl p-4">
                <h4 className="font-medium text-error mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Danger Zone
                </h4>
                <p className="text-sm text-error/70 mb-4">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <button onClick={() => setShowDeletionModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-error text-white text-sm rounded-xl hover:shadow-lg hover:shadow-error/25 transition-all"
                  disabled={loading}>
                  <Trash2 className="w-4 h-4" />
                  Delete Account
                </button>
              </div>

              <div className="bg-card border border-line rounded-xl p-4">
                <h4 className="font-medium text-foreground mb-3">Account Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted">User ID</span>
                    <span className="font-mono text-xs text-muted">{userStats?.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Account Created</span>
                    <span className="text-foreground">
                      {userStats ? new Date(userStats.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Last Modified</span>
                    <span className="text-foreground">
                      {userStats ? new Date(userStats.updatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "-"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* WebDAV Tab */}
          {activeTab === "webdav" && (
            <div className="space-y-5">
              <div className="bg-card border border-line rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 shrink-0 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center">
                    <KeyRound className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground mb-1">
                      {t("webdavAccess", commonTranslations.webdavAccess)}
                    </h4>
                    <p className="text-sm text-muted">
                      {t("webdavDescription", commonTranslations.webdavDescription)}
                    </p>
                  </div>
                </div>
              </div>

              {webdavToken && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                  <p className="text-sm text-success mb-3 font-medium">
                    {t("webdavTokenGenerated", commonTranslations.webdavTokenGenerated)}
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 break-all bg-card border border-line rounded-lg px-3 py-2 text-sm text-success font-mono">
                      {webdavToken}
                    </code>
                    <button onClick={handleCopyWebdavToken}
                      className="flex items-center gap-1.5 shrink-0 px-3 py-2 rounded-lg text-sm font-medium bg-emerald-500/20 text-success hover:bg-emerald-500/30 transition-all"
                      title={t("webdavCopy", commonTranslations.webdavCopy)}>
                      {webdavCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {webdavCopied ? t("webdavTokenCopied", commonTranslations.webdavTokenCopied) : t("webdavCopy", commonTranslations.webdavCopy)}
                    </button>
                  </div>
                </div>
              )}

              {webdav?.enabled && webdav.webdavUrl && (
                <div className="bg-card border border-line rounded-xl p-4">
                  <p className="text-sm text-muted mb-2">
                    {t("webdavUrl", commonTranslations.webdavUrl)}
                  </p>
                  <code className="block break-all bg-card border border-line rounded-lg px-3 py-2 text-sm text-accent font-mono">
                    {webdav.webdavUrl}
                  </code>
                  {webdav.createdAt && (
                    <p className="text-xs text-muted mt-2">
                      {t("webdavEnabledSince", commonTranslations.webdavEnabledSince)}{" "}
                      {new Date(webdav.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                  )}
                </div>
              )}

              <div className="bg-card border border-line rounded-xl p-4">
                <h4 className="font-medium text-foreground mb-2">
                  {t("webdavHowTo", commonTranslations.webdavHowTo)}
                </h4>
                <ol className="space-y-2 text-sm text-muted list-decimal list-inside">
                  <li>{t("webdavHowToStep1", commonTranslations.webdavHowToStep1)}</li>
                  <li>{t("webdavHowToStep2", commonTranslations.webdavHowToStep2)}</li>
                  <li>{t("webdavHowToStep3", commonTranslations.webdavHowToStep3)}</li>
                </ol>
              </div>

              {!webdav?.enabled && !webdavToken && (
                <p className="text-sm text-muted">
                  {t("webdavNoTokenYet", commonTranslations.webdavNoTokenYet)}
                </p>
              )}

              <button onClick={webdav?.enabled ? handleRevokeWebdavToken : handleGenerateWebdavToken}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50 ${
                  webdav?.enabled
                    ? "bg-error text-white hover:shadow-lg hover:shadow-error/25"
                    : "bg-accent text-white hover:shadow-lg hover:shadow-accent/25"
                }`}
                disabled={webdavBusy}>
                {webdavBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : webdav?.enabled ? <Trash className="w-4 h-4" /> : <KeyRound className="w-4 h-4" />}
                {webdav?.enabled
                  ? t("webdavRevokeToken", commonTranslations.webdavRevokeToken)
                  : t("webdavGenerateToken", commonTranslations.webdavGenerateToken)}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Account Deletion Modal */}
      {showDeletionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowDeletionModal(false); }}>
          <div className="modal-content w-full max-w-md p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-error" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {deletionStep === "confirm" ? "Delete Account"
                    : deletionStep === "code" ? "Verify Deletion"
                    : "Deleting Account"}
                </h3>
                <p className="text-sm text-muted">
                  {deletionStep === "confirm" ? "This action cannot be undone"
                    : deletionStep === "code" ? "Check your email for verification code"
                    : "Please wait while we delete your account"}
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 px-4 py-3 bg-error/10 border border-red-500/20 text-error rounded-xl text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 text-success rounded-xl text-sm">
                {success}
              </div>
            )}

            {deletionStep === "confirm" && (
              <div className="space-y-4">
                <div className="bg-error/5 border border-red-500/20 rounded-xl p-4">
                  <h4 className="font-medium text-error mb-2">⚠️ Warning</h4>
                  <p className="text-sm text-error/70 mb-3">
                    Deleting your account will permanently remove:
                  </p>
                  <ul className="text-sm text-error/70 space-y-1 mb-3 list-disc list-inside">
                    <li>All your uploaded files</li>
                    <li>All your folders and organization</li>
                    <li>Your account information</li>
                    <li>All activity history</li>
                  </ul>
                  <p className="text-sm text-error font-medium">This action cannot be reversed!</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowDeletionModal(false)}
                    className="flex-1 btn-secondary py-2.5 rounded-xl text-sm" disabled={loading}>
                    Cancel
                  </button>
                  <button onClick={handleRequestDeletion}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-error text-white hover:shadow-lg hover:shadow-error/25 disabled:opacity-50 transition-all"
                    disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Send Verification Code"}
                  </button>
                </div>
              </div>
            )}

            {deletionStep === "code" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Verification Code</label>
                  <input type="text" maxLength={6} value={deletionCode}
                    onChange={(e) => { setDeletionCode(e.target.value); setError(null); }}
                    className="input-modern w-full px-4 py-3 rounded-xl text-center text-lg font-mono tracking-widest"
                    placeholder="000000" disabled={loading} />
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted mb-2">Didn&apos;t receive the code?</p>
                  <button onClick={handleResendDeletionCode}
                    disabled={deletionCountdown > 0 || loading}
                    className="text-accent hover:text-accent text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                    {deletionCountdown > 0 ? `Resend in ${deletionCountdown}s` : "Resend Code"}
                  </button>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => { setShowDeletionModal(false); setDeletionStep("confirm"); setDeletionCode(""); }}
                    className="flex-1 btn-secondary py-2.5 rounded-xl text-sm" disabled={loading}>
                    Cancel
                  </button>
                  <button onClick={handleConfirmDeletion}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-error text-white hover:shadow-lg hover:shadow-error/25 disabled:opacity-50 transition-all"
                    disabled={loading || !deletionCode || deletionCode.length !== 6}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Delete Account"}
                  </button>
                </div>
              </div>
            )}

            {deletionStep === "deleting" && (
              <div className="text-center space-y-4 py-4">
                <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mx-auto">
                  <Loader2 className="w-8 h-8 text-error animate-spin" />
                </div>
                <div>
                  <p className="text-lg font-medium text-foreground mb-2">Deleting your account...</p>
                  <p className="text-sm text-muted">Please wait while we permanently delete all your data.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
