"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Link2,
  Copy,
  Check,
  Lock,
  LockOpen,
  Trash2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

interface ShareModalProps {
  fileId: string;
  fileName: string;
  lang?: "en" | "vi";
  onClose: () => void;
  onToast?: (type: "success" | "error" | "info", message: string) => void;
}

export default function ShareModal({ fileId, fileName, lang = "en", onClose, onToast }: ShareModalProps) {
  const vi = lang === "vi";
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [hasPassword, setHasPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [enablePassword, setEnablePassword] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");
  const [maxDownloads, setMaxDownloads] = useState("");
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!showPassword) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const showPassword = enablePassword;

  const handleCreate = async (applySettings = false) => {
    setLoading(true);
    try {
      const body: Record<string, unknown> = {};
      if (applySettings) {
        if (showPassword) body.password = password;
        else body.password = null;
        if (expiresAt) body.expiresAt = expiresAt;
        else body.expiresAt = null;
        if (maxDownloads) body.maxDownloads = parseInt(maxDownloads, 10);
        else body.maxDownloads = null;
      }
      const res = await fetch(`/api/files/${fileId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        onToast?.("error", data.error || (vi ? "Không tạo được liên kết chia sẻ" : "Failed to create share link"));
        return;
      }
      const data = await res.json();
      setShareUrl(`${window.location.origin}${data.url}`);
      setHasPassword(Boolean(data.hasPassword));
      onToast?.("success", vi ? "Đã tạo liên kết chia sẻ" : "Share link created");
    } catch {
      onToast?.("error", vi ? "Không tạo được liên kết chia sẻ" : "Failed to create share link");
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/files/${fileId}/share`, { method: "DELETE" });
      if (res.ok) {
        setShareUrl(null);
        setPassword("");
        setEnablePassword(false);
        setExpiresAt("");
        setMaxDownloads("");
        onToast?.("success", vi ? "Đã thu hồi liên kết chia sẻ" : "Share link revoked");
      } else {
        onToast?.("error", vi ? "Không thu hồi được liên kết chia sẻ" : "Failed to revoke share link");
      }
    } catch {
      onToast?.("error", vi ? "Không thu hồi được liên kết chia sẻ" : "Failed to revoke share link");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      inputRef.current?.select();
      document.execCommand("copy");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative modal-content w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center">
              <Link2 className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{vi ? "Liên kết chia sẻ" : "Share Link"}</h3>
              <p className="text-xs text-slate-400 truncate max-w-[280px]">{fileName}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {!shareUrl ? (
            <>
              {/* Options */}
              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2 cursor-pointer">
                    <input type="checkbox" checked={showPassword} onChange={(e) => setEnablePassword(e.target.checked)} className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-sky-500 focus:ring-blue-500/50" />
                    {showPassword ? <LockOpen className="w-4 h-4 text-cyan-400" /> : <Lock className="w-4 h-4 text-slate-400" />}
                    {vi ? "Bảo vệ bằng mật khẩu" : "Password protected"}
                  </label>
                  {showPassword && (
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={vi ? "Đặt mật khẩu cho liên kết" : "Set a password for this link"}
                      className="input-modern w-full px-4 py-2.5 rounded-xl text-sm bg-slate-900/60 border-slate-700/50 focus:border-cyan-500/50" />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">{vi ? "Hết hạn lúc (tùy chọn)" : "Expires at (optional)"}</label>
                  <input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)}
                    className="input-modern w-full px-4 py-2.5 rounded-xl text-sm bg-slate-900/60 border-slate-700/50 focus:border-cyan-500/50" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">{vi ? "Tối đa lượt tải (tùy chọn)" : "Max downloads (optional)"}</label>
                  <input type="number" min="1" value={maxDownloads} onChange={(e) => setMaxDownloads(e.target.value)} placeholder={vi ? "Không giới hạn" : "Unlimited"}
                    className="input-modern w-full px-4 py-2.5 rounded-xl text-sm bg-slate-900/60 border-slate-700/50 focus:border-cyan-500/50" />
                </div>
              </div>

              <button onClick={() => handleCreate(true)} disabled={loading || (showPassword && !password.trim())}
                className="btn-primary w-full px-6 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-all">
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                {vi ? "Tạo liên kết chia sẻ" : "Create Share Link"}
              </button>
            </>
          ) : (
            <>
              {/* Link display */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                  {hasPassword ? <Lock className="w-4 h-4 text-cyan-400" /> : <ShieldCheck className="w-4 h-4 text-emerald-400" />}
                  {hasPassword ? (vi ? "Được bảo vệ bằng mật khẩu" : "Password protected") : (vi ? "Liên kết công khai" : "Public link")}
                </label>
                <div className="flex items-center gap-2">
                  <input ref={inputRef} readOnly value={shareUrl}
                    className="input-modern flex-1 min-w-0 px-4 py-2.5 rounded-xl text-sm bg-slate-900/60 border-slate-700/50 focus:border-cyan-500/50" />
                  <button onClick={handleCopy}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium bg-slate-700/50 border border-slate-600/50 text-slate-200 hover:bg-slate-700 hover:border-slate-500/50 transition-all flex items-center gap-1.5 shrink-0">
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    {copied ? (vi ? "Đã chép" : "Copied") : (vi ? "Chép" : "Copy")}
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShareUrl(null)} disabled={loading}
                  className="btn-secondary flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all">
                  {vi ? "Sửa cài đặt" : "Edit settings"}
                </button>
                <button onClick={handleRevoke} disabled={loading}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-red-500 to-rose-600 text-white hover:shadow-lg hover:shadow-red-500/25 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {vi ? "Thu hồi" : "Revoke"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
