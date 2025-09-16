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

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
  });

  // Password form state
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

  // Account deletion state
  const [deletionStep, setDeletionStep] = useState<
    "confirm" | "code" | "deleting"
  >("confirm");
  const [deletionCode, setDeletionCode] = useState("");
  const [showDeletionModal, setShowDeletionModal] = useState(false);
  const [deletionCountdown, setDeletionCountdown] = useState(0);

  // Load user data with stats when modal opens
  useEffect(() => {
    if (isOpen && user) {
      setProfileForm({
        name: user.name,
        email: user.email,
      });
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

  // Reset form and state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setActiveTab("profile");
      setError(null);
      setSuccess(null);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowDeletionModal(false);
      setDeletionStep("confirm");
      setDeletionCode("");
      setDeletionCountdown(0);
      setShowPasswords({
        current: false,
        new: false,
        confirm: false,
      });
    }
  }, [isOpen]);

  // Countdown timer for deletion code resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (deletionCountdown > 0) {
      timer = setTimeout(
        () => setDeletionCountdown(deletionCountdown - 1),
        1000,
      );
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "update-profile",
          name: profileForm.name.trim(),
          email: profileForm.email.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(t("profileUpdated", commonTranslations.profileUpdated));
        onUserUpdate(data.user);
      } else {
        setError(data.error || t("error", commonTranslations.error));
      }
    } catch (error) {
      console.error("Profile update error:", error);
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
        headers: {
          "Content-Type": "application/json",
        },
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
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        setError(data.error || t("error", commonTranslations.error));
      }
    } catch (error) {
      console.error("Password change error:", error);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestDeletion = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/request-deletion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (response.ok) {
        setDeletionStep("code");
        setDeletionCountdown(60);
        setSuccess(
          t("verificationCodeSent", commonTranslations.verificationCodeSent),
        );
      } else {
        setError(data.error || t("error", commonTranslations.error));
      }
    } catch (error) {
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
        // Account deleted successfully, redirect to home
        window.location.href = "/";
      } else {
        setError(data.error || "Failed to delete account");
        setDeletionStep("code");
      }
    } catch (error) {
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
        setSuccess(
          t(
            "newVerificationCodeSent",
            commonTranslations.newVerificationCodeSent,
          ),
        );
      } else {
        const data = await response.json();
        setError(data.error || t("error", commonTranslations.error));
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field: "current" | "new" | "confirm") => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {t("userSettings", commonTranslations.userSettings)}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "profile"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t("profileTab", commonTranslations.profileTab)}
          </button>
          <button
            onClick={() => setActiveTab("password")}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "password"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t("passwordTab", commonTranslations.passwordTab)}
          </button>
          <button
            onClick={() => setActiveTab("account")}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "account"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t("accountTab", commonTranslations.accountTab)}
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Success/Error Messages */}
          {success && (
            <div className="mb-4 p-3 bg-green-100 border border-green-200 text-green-700 rounded-lg text-sm">
              {success}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {t("fullName", commonTranslations.fullName)}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    id="name"
                    value={profileForm.name}
                    onChange={(e) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t(
                      "enterFullName",
                      commonTranslations.enterFullName,
                    )}
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {t("emailAddress", commonTranslations.emailAddress)}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    id="email"
                    value={profileForm.email}
                    onChange={(e) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t(
                      "enterEmailAddress",
                      commonTranslations.enterEmailAddress,
                    )}
                    required
                  />
                </div>
              </div>

              {/* User Statistics */}
              {userStats && (
                <div className="bg-gray-50 p-4 rounded-lg text-sm">
                  <h4 className="font-medium text-gray-900 mb-3">
                    Account Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-600">Member since</p>
                      <p className="font-medium">
                        {new Date(userStats.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Last updated</p>
                      <p className="font-medium">
                        {new Date(userStats.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {userStats.stats && (
                    <>
                      <hr className="my-3 border-gray-200" />
                      <h5 className="font-medium text-gray-900 mb-2">
                        Storage Usage
                      </h5>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-lg font-semibold text-blue-600">
                            {userStats.stats.totalFiles}
                          </p>
                          <p className="text-xs text-gray-500">Files</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-green-600">
                            {userStats.stats.totalFolders}
                          </p>
                          <p className="text-xs text-gray-500">Folders</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-purple-600">
                            {(
                              userStats.stats.totalSize /
                              (1024 * 1024)
                            ).toFixed(1)}{" "}
                            MB
                          </p>
                          <p className="text-xs text-gray-500">Used</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {loading ? "Updating..." : "Update Profile"}
              </button>
            </form>
          )}

          {/* Password Tab */}
          {activeTab === "password" && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="currentPassword"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Current Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPasswords.current ? "text" : "password"}
                    id="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        currentPassword: e.target.value,
                      }))
                    }
                    className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter current password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("current")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.current ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    id="newPassword"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        newPassword: e.target.value,
                      }))
                    }
                    className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter new password (min 8 characters)"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("new")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.new ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    id="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value,
                      }))
                    }
                    className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Confirm new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("confirm")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.confirm ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600">
                <p className="font-medium mb-1">Password Requirements:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>At least 8 characters long</li>
                  <li>Should be different from current password</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
                {loading ? "Changing..." : "Change Password"}
              </button>
            </form>
          )}

          {/* Account Tab */}
          {activeTab === "account" && (
            <div className="space-y-6">
              {/* Storage Usage Details */}
              {userStats?.stats && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">
                    Storage Overview
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Files</span>
                      <span className="font-medium">
                        {userStats.stats.totalFiles}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Total Folders
                      </span>
                      <span className="font-medium">
                        {userStats.stats.totalFolders}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Storage Used
                      </span>
                      <span className="font-medium">
                        {(userStats.stats.totalSize / (1024 * 1024)).toFixed(2)}{" "}
                        MB
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min((userStats.stats.totalSize / (100 * 1024 * 1024)) * 100, 100)}%`,
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500">
                      {(userStats.stats.totalSize / (1024 * 1024)).toFixed(2)}{" "}
                      MB of 100 MB used
                    </p>
                  </div>
                </div>
              )}

              {/* Account Actions */}
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <h4 className="font-medium text-red-900 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Danger Zone
                </h4>
                <p className="text-sm text-red-700 mb-4">
                  Permanently delete your account and all associated data. This
                  action cannot be undone.
                </p>
                <button
                  onClick={() => setShowDeletionModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                  disabled={loading}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Account
                </button>
              </div>

              {/* Account Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">
                  Account Details
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">User ID</span>
                    <span className="font-mono text-xs">{userStats?.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Account Created</span>
                    <span>
                      {userStats
                        ? new Date(userStats.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            },
                          )
                        : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Modified</span>
                    <span>
                      {userStats
                        ? new Date(userStats.updatedAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            },
                          )
                        : "-"}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {deletionStep === "confirm"
                    ? "Delete Account"
                    : deletionStep === "code"
                      ? "Verify Deletion"
                      : "Deleting Account"}
                </h3>
                <p className="text-sm text-gray-600">
                  {deletionStep === "confirm"
                    ? "This action cannot be undone"
                    : deletionStep === "code"
                      ? "Check your email for verification code"
                      : "Please wait while we delete your account"}
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            )}

            {deletionStep === "confirm" && (
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-900 mb-2">⚠️ Warning</h4>
                  <p className="text-sm text-red-700 mb-3">
                    Deleting your account will permanently remove:
                  </p>
                  <ul className="text-sm text-red-700 space-y-1 mb-3">
                    <li>• All your uploaded files</li>
                    <li>• All your folders and organization</li>
                    <li>• Your account information</li>
                    <li>• All activity history</li>
                  </ul>
                  <p className="text-sm text-red-700 font-medium">
                    This action cannot be reversed!
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeletionModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRequestDeletion}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2 justify-center">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </div>
                    ) : (
                      "Send Verification Code"
                    )}
                  </button>
                </div>
              </div>
            )}

            {deletionStep === "code" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={deletionCode}
                    onChange={(e) => {
                      setDeletionCode(e.target.value);
                      setError(null);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center text-lg font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="000000"
                    disabled={loading}
                  />
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">
                    Didn't receive the code?
                  </p>
                  <button
                    onClick={handleResendDeletionCode}
                    disabled={deletionCountdown > 0 || loading}
                    className="text-blue-600 hover:text-blue-500 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deletionCountdown > 0
                      ? `Resend in ${deletionCountdown}s`
                      : "Resend Code"}
                  </button>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeletionModal(false);
                      setDeletionStep("confirm");
                      setDeletionCode("");
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmDeletion}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    disabled={
                      loading || !deletionCode || deletionCode.length !== 6
                    }
                  >
                    {loading ? (
                      <div className="flex items-center gap-2 justify-center">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Verifying...
                      </div>
                    ) : (
                      "Delete Account"
                    )}
                  </button>
                </div>
              </div>
            )}

            {deletionStep === "deleting" && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Deleting your account...
                  </p>
                  <p className="text-sm text-gray-600">
                    Please wait while we permanently delete all your data.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
