"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Download,
  Lock,
  File as FileIcon,
  Calendar,
  HardDrive,
  ShieldAlert,
  Cloud,
  Globe,
  RefreshCw,
} from "lucide-react";
import Footer from "@/components/Footer";

interface ShareMeta {
  token: string;
  name: string;
  displayName: string;
  size: number;
  mime: string;
  hasPassword: boolean;
  expiresAt: string | null;
  downloadCount: number;
  maxDownloads: number | null;
  ownerName: string;
  createdAt: string;
}

interface SharePageProps {
  token: string;
  lang?: "en" | "vi";
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatDate(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString();
}

export default function SharePage({ token, lang = "en" }: SharePageProps) {
  const vi = lang === "vi";
  const [meta, setMeta] = useState<ShareMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/shares/${token}`);
        if (res.ok) {
          setMeta(await res.json());
        } else {
          const data = await res.json().catch(() => ({}));
          setError(data.error || (vi ? "Liên kết chia sẻ không tồn tại" : "Share link not found"));
        }
      } catch {
        setError(vi ? "Không thể tải thông tin chia sẻ" : "Failed to load share info");
      } finally {
        setLoading(false);
      }
    })();
  }, [token, vi]);

  const startDownload = async (withPassword?: string) => {
    setDownloading(true);
    setPasswordError(null);
    try {
      const init: RequestInit = {};
      if (withPassword) {
        init.headers = { "x-share-password": withPassword };
      }
      const res = await fetch(`/api/shares/${token}/download`, init);

      if (res.status === 401) {
        const data = await res.json().catch(() => ({}));
        if (data.code === "SHARE_PASSWORD_REQUIRED" || data.code === "SHARE_PASSWORD_INCORRECT") {
          setPasswordError(vi ? "Mật khẩu không đúng" : "Incorrect password");
        }
        setDownloading(false);
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setPasswordError(data.error || (vi ? "Tải xuống thất bại" : "Download failed"));
        setDownloading(false);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = meta?.displayName || meta?.name || "download";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setPasswordError(vi ? "Tải xuống thất bại" : "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadClick = () => {
    if (meta?.hasPassword) {
      if (!password.trim()) {
        setPasswordError(vi ? "Vui lòng nhập mật khẩu" : "Please enter the password");
        return;
      }
      startDownload(password.trim());
    } else {
      startDownload();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-blue-500/20 animate-pulse">
            <Cloud className="w-8 h-8 text-white" />
          </div>
          <div className="flex gap-1.5 justify-center">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-2.5 h-2.5 rounded-full bg-blue-500/60 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col">
      <nav className="flex-shrink-0 border-b border-slate-800/50 bg-slate-950/40 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-sm">
              <Cloud className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">Free<span className="text-cyan-400">Clouds</span></span>
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          {error ? (
            <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-10 text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-5">
                <ShieldAlert className="w-8 h-8 text-red-400" />
              </div>
              <h1 className="text-xl font-bold text-white mb-2">
                {vi ? "Liên kết không hợp lệ" : "Invalid share link"}
              </h1>
              <p className="text-sm text-slate-400 mb-6">{error}</p>
              <Link href="/" className="btn-primary px-6 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2">
                <Globe className="w-4 h-4" /> {vi ? "Về trang chủ" : "Go to homepage"}
              </Link>
            </div>
          ) : meta ? (
            <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 overflow-hidden animate-fade-in">
              {/* Header */}
              <div className="p-6 border-b border-slate-700/50">
                <div className="text-xs text-slate-400 mb-4 flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  {vi ? `Được chia sẻ bởi ${meta.ownerName}` : `Shared by ${meta.ownerName}`}
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center">
                    <FileIcon className="w-7 h-7 text-cyan-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-lg font-bold text-white break-all leading-snug">{meta.displayName}</h1>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-400">
                      <span className="flex items-center gap-1.5"><HardDrive className="w-3.5 h-3.5" /> {formatSize(meta.size)}</span>
                      <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {formatDate(meta.createdAt)}</span>
                      {meta.maxDownloads && (
                        <span>{vi ? `Còn ${meta.maxDownloads - meta.downloadCount}/${meta.maxDownloads} lượt tải` : `${Math.max(0, meta.maxDownloads - meta.downloadCount)}/${meta.maxDownloads} downloads left`}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-6">
                {meta.hasPassword && (
                  <div className="mb-5">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      {vi ? "Mật khẩu bảo vệ" : "Protected by password"}
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setPasswordError(null); }}
                        onKeyDown={(e) => e.key === "Enter" && handleDownloadClick()}
                        placeholder={vi ? "Nhập mật khẩu để tải xuống" : "Enter password to download"}
                        className="input-modern w-full pl-10 pr-4 py-3 rounded-xl text-sm bg-slate-900/60 border-slate-700/50 focus:border-cyan-500/50 transition-all"
                      />
                    </div>
                    {passwordError && <p className="text-xs text-red-400 mt-2">{passwordError}</p>}
                  </div>
                )}

                <button
                  onClick={handleDownloadClick}
                  disabled={downloading}
                  className="btn-primary w-full px-6 py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
                >
                  {downloading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  {downloading
                    ? (vi ? "Đang tải xuống..." : "Downloading...")
                    : (vi ? "Tải xuống file" : "Download File")}
                </button>

                <p className="text-xs text-slate-500 text-center mt-4">
                  {vi
                    ? "File được lưu trữ an toàn trên hạ tầng Telegram"
                    : "File securely stored on Telegram infrastructure"}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </main>

      <Footer />
    </div>
  );
}
