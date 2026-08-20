"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X,
  Lock,
  LockOpen,
  Plus,
  Loader2,
  Shield,
  KeyRound,
  MailCheck,
} from "lucide-react";
import { useTranslation } from "./LanguageSwitcher";

interface VaultEntry {
  id: string;
  name: string;
  locked: boolean;
  unlocked: boolean;
}

interface VaultManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onToast: (type: "success" | "error" | "info", message: string) => void;
  /** Fired after vault state changes so the caller can refresh folders/files. */
  onChanged: () => void;
  /** Open a now-unlocked vault folder in the main file list. */
  onNavigate: (folderId: string) => void;
}

export default function VaultManager({
  isOpen,
  onClose,
  onToast,
  onChanged,
  onNavigate,
}: VaultManagerProps) {
  const { t: translate } = useTranslation();
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<"none" | "unlock" | "create" | "pin">("none");
  const [target, setTarget] = useState<VaultEntry | null>(null);
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [currentPin, setCurrentPin] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [forgotStep, setForgotStep] = useState<0 | 1 | 2>(0);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/vault");
      if (res.ok) setEntries(await res.json());
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAction("none");
      setTarget(null);
      setPin("");
      setPin2("");
      setCurrentPin("");
      setName("");
      setError(null);
      setForgotStep(0);
      refresh();
    }
  }, [isOpen, refresh]);

  if (!isOpen) return null;

  const resetForm = () => {
    setAction("none");
    setTarget(null);
    setPin("");
    setPin2("");
    setCurrentPin("");
    setName("");
    setError(null);
    setForgotStep(0);
  };

  const handleUnlock = async () => {
    if (!target || pin.trim() === "") return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId: target.id, pin: pin.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        onToast("success", translate("vaultUnlocked", { en: "Vault unlocked", vi: "Đã mở khóa kho bảo mật" }));
        setEntries((prev) => prev.map((e) => (e.id === target.id ? { ...e, unlocked: true } : e)));
        onChanged();
        resetForm();
        if (data.unlocked) onNavigate(target.id);
      } else {
        setError(data.error || translate("vaultWrongPin", { en: "Incorrect PIN", vi: "Sai mã PIN" }));
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleRequestRecovery = async () => {
    if (!target) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/vault/recover-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId: target.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setForgotStep(2);
        setError(
          data.devCode
            ? translate("vaultDevCode", { en: `Dev mode — use code: ${data.devCode}`, vi: `Chế độ dev — dùng mã: ${data.devCode}` })
            : translate("vaultEmailSent", { en: "Recovery code sent to your email", vi: "Mã khôi phục đã gửi đến email của bạn" }),
        );
      } else {
        setError(data.error || "Failed to send recovery code");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleRecover = async () => {
    if (!target || pin.trim() === "" || pin2.trim() === "") return;
    if (pin !== pin2) {
      setError(translate("vaultPinMismatch", { en: "PINs do not match", vi: "Mã PIN không khớp" }));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/vault/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId: target.id, code: pin.trim(), newPin: pin2.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        onToast("success", translate("vaultRecovered", { en: "PIN reset — vault unlocked", vi: "Đã đặt lại mã PIN — kho đã mở khóa" }));
        setEntries((prev) => prev.map((e) => (e.id === target.id ? { ...e, unlocked: true } : e)));
        onChanged();
        resetForm();
        onNavigate(target.id);
      } else {
        setError(data.error || "Failed to reset PIN");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = async () => {
    if (name.trim() === "") return;
    if (pin && !/^\d{4,8}$/.test(pin)) {
      setError(translate("vaultPinInvalid", { en: "PIN must be 4-8 digits", vi: "Mã PIN phải gồm 4-8 chữ số" }));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), parent: null, isHidden: true, pin: pin || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        onToast("success", translate("vaultCreated", { en: "Vault folder created", vi: "Đã tạo thư mục bảo mật" }));
        onChanged();
        resetForm();
        refresh();
      } else {
        setError(data.error || "Failed to create vault folder");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleLock = async (entry: VaultEntry) => {
    setBusy(true);
    try {
      const res = await fetch("/api/vault/lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId: entry.id }),
      });
      if (res.ok) {
        setEntries((prev) => prev.map((e) => (e.id === entry.id ? { ...e, unlocked: false } : e)));
        onChanged();
      }
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  };

  const handleSetPin = async () => {
    if (!target) return;
    if (pin.trim() === "" || !/^\d{4,8}$/.test(pin)) {
      setError(translate("vaultPinInvalid", { en: "PIN must be 4-8 digits", vi: "Mã PIN phải gồm 4-8 chữ số" }));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/folders/${target.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set-pin",
          pin: pin.trim(),
          currentPin: target.unlocked && !target.locked ? undefined : currentPin || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        onToast("success", translate("vaultPinChanged", { en: "PIN updated", vi: "Đã cập nhật mã PIN" }));
        resetForm();
      } else {
        setError(data.error || "Failed to update PIN");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleUnhide = async (entry: VaultEntry) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/folders/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unhide" }),
      });
      if (res.ok) {
        onToast("success", translate("vaultUnhidden", { en: "Folder removed from vault", vi: "Đã bỏ khỏi kho bảo mật" }));
        setEntries((prev) => prev.filter((e) => e.id !== entry.id));
        onChanged();
      } else {
        const data = await res.json().catch(() => ({}));
        onToast("error", data.error || "Failed");
      }
    } catch {
      onToast("error", "Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-content w-full max-w-md max-h-[85vh] overflow-y-auto animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-line">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground leading-tight">
                {translate("vault", { en: "Vault", vi: "Kho bảo mật" })}
              </h2>
              <p className="text-xs text-muted">
                {translate("vaultSub", { en: "Hidden folders protected by PIN", vi: "Các thư mục ẩn được bảo vệ bằng mã PIN" })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-foreground hover:bg-card-hover transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          {action === "none" && (
            <>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-14 rounded-xl bg-card animate-pulse" />
                  ))}
                </div>
              ) : entries.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-14 h-14 rounded-2xl bg-card border border-line flex items-center justify-center mx-auto mb-3">
                    <Lock className="w-6 h-6 text-muted" />
                  </div>
                  <p className="text-sm text-muted mb-1">
                    {translate("vaultEmpty", { en: "No vault folders yet", vi: "Chưa có thư mục bảo mật nào" })}
                  </p>
                  <p className="text-xs text-muted/70 mb-5">
                    {translate("vaultEmptySub", { en: "Create a PIN-protected folder to hide files from WebDAV and file listing.", vi: "Tạo thư mục bảo vệ bằng mã PIN để ẩn tệp khỏi WebDAV và danh sách tệp." })}
                  </p>
                  <button
                    onClick={() => setAction("create")}
                    className="btn-primary px-4 py-2 rounded-xl text-sm flex items-center gap-2 mx-auto"
                  >
                    <Plus className="w-4 h-4" /> {translate("vaultCreate", { en: "New vault folder", vi: "Tạo thư mục bảo mật" })}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-card border border-line hover:border-line-hover transition-all"
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          entry.unlocked ? "bg-accent/15 text-accent" : "bg-card-hover text-muted"
                        }`}
                      >
                        {entry.unlocked ? <LockOpen className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{entry.name}</p>
                        <p className="text-xs text-muted">
                          {entry.unlocked
                            ? translate("vaultUnlocked", { en: "Unlocked", vi: "Đã mở khóa" })
                            : translate("vaultLocked", { en: "Locked", vi: "Đang khóa" })}
                        </p>
                      </div>
                      {entry.unlocked ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { setTarget(entry); setAction("pin"); setPin(""); setCurrentPin(""); setError(null); }}
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-muted hover:text-foreground hover:bg-card-hover transition-all"
                            title={translate("vaultChangePin", { en: "Change PIN", vi: "Đổi mã PIN" })}
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleLock(entry)}
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-muted hover:text-foreground hover:bg-card-hover transition-all"
                            title={translate("vaultLock", { en: "Lock", vi: "Khóa" })}
                          >
                            <Lock className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setTarget(entry); setAction("unlock"); setPin(""); setError(null); }}
                          className="btn-primary px-3 py-2 rounded-lg text-sm flex items-center gap-1.5"
                        >
                          <LockOpen className="w-4 h-4" /> {translate("vaultUnlock", { en: "Unlock", vi: "Mở khóa" })}
                        </button>
                      )}
                    </div>
                  ))}
                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={() => setAction("create")}
                      className="btn-secondary flex-1 px-3 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> {translate("vaultCreate", { en: "New vault folder", vi: "Tạo thư mục bảo mật" })}
                    </button>
                    {entries.some((e) => e.unlocked) && (
                      <button
                        onClick={() => {
                          const e = entries.find((x) => x.unlocked);
                          if (e && window.confirm(translate("vaultUnhideConfirm", { en: `Remove "${e.name}" from the vault and make it a normal folder?`, vi: `Bỏ "${e.name}" khỏi kho bảo mật và trở thành thư mục thường?` }))) {
                            void handleUnhide(e);
                          }
                        }}
                        className="btn-ghost px-3 py-2.5 rounded-xl text-sm text-muted hover:text-foreground"
                      >
                        {translate("vaultUnhide", { en: "Remove from Vault", vi: "Bỏ khỏi kho" })}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {action === "unlock" && target && (
            <>
              <div className="flex items-center gap-2 mb-4 text-sm text-muted">
                <Lock className="w-4 h-4" />
                {translate("vaultUnlockTitle", { en: `Enter the PIN for "${target.name}"`, vi: `Nhập mã PIN cho "${target.name}"` })}
              </div>
              {forgotStep === 0 && (
                <>
                  <input
                    type="password"
                    inputMode="numeric"
                    autoFocus
                    placeholder={translate("vaultPinPlaceholder", { en: "PIN (4-8 digits)", vi: "Mã PIN (4-8 chữ số)" })}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !busy && handleUnlock()}
                    className="input-modern w-full px-4 py-2.5 rounded-xl mb-3"
                  />
                  {error && <p className="text-sm text-error mb-3">{error}</p>}
                  <button onClick={handleUnlock} disabled={busy || pin.trim() === ""}
                    className="btn-primary w-full px-4 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                    {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                    {translate("vaultUnlock", { en: "Unlock", vi: "Mở khóa" })}
                  </button>
                  <button
                    onClick={() => { setForgotStep(1); setError(null); }}
                    className="w-full mt-2 py-2 text-xs text-accent hover:text-accent/80 transition-colors"
                  >
                    {translate("vaultForgot", { en: "Forgot PIN? Recover by email", vi: "Quên mã PIN? Khôi phục qua email" })}
                  </button>
                </>
              )}
              {forgotStep === 1 && (
                <>
                  <p className="text-sm text-muted mb-4">
                    {translate("vaultForgotInfo", { en: "A 6-digit code will be sent to your account email. Use it to set a new PIN.", vi: "Mã 6 chữ số sẽ được gửi đến email tài khoản. Dùng mã để đặt mã PIN mới." })}
                  </p>
                  <button onClick={handleRequestRecovery} disabled={busy}
                    className="btn-primary w-full px-4 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <MailCheck className="w-4 h-4" />}
                    {translate("vaultSendCode", { en: "Send recovery code", vi: "Gửi mã khôi phục" })}
                  </button>
                </>
              )}
              {forgotStep === 2 && (
                <>
                  {error && <p className="text-sm text-muted bg-card-hover rounded-lg px-3 py-2 mb-3">{error}</p>}
                  <input
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    placeholder={translate("vaultCodePlaceholder", { en: "Recovery code", vi: "Mã khôi phục" })}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                    className="input-modern w-full px-4 py-2.5 rounded-xl mb-3"
                  />
                  <input
                    type="password"
                    inputMode="numeric"
                    placeholder={translate("vaultNewPin", { en: "New PIN (4-8 digits)", vi: "Mã PIN mới (4-8 chữ số)" })}
                    value={pin2}
                    onChange={(e) => setPin2(e.target.value)}
                    className="input-modern w-full px-4 py-2.5 rounded-xl mb-3"
                  />
                  {error && !error.startsWith("Dev mode") && !error.startsWith("Chế độ dev") && !error.includes("code") && (
                    <p className="text-sm text-error mb-3">{error}</p>
                  )}
                  <button onClick={handleRecover} disabled={busy || pin.trim() === "" || pin2.trim() === ""}
                    className="btn-primary w-full px-4 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                    {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                    {translate("vaultResetPin", { en: "Reset PIN & unlock", vi: "Đặt lại mã PIN và mở khóa" })}
                  </button>
                </>
              )}
              <button onClick={resetForm} className="w-full mt-2 py-2 text-xs text-muted hover:text-foreground transition-colors">
                {translate("vaultBack", { en: "Back", vi: "Quay lại" })}
              </button>
            </>
          )}

          {action === "create" && (
            <>
              <div className="flex items-center gap-2 mb-4 text-sm text-muted">
                <Lock className="w-4 h-4" />
                {translate("vaultCreateInfo", { en: "Hidden from file listing and WebDAV. Optionally protected by a PIN.", vi: "Ẩn khỏi danh sách tệp và WebDAV. Có thể bảo vệ bằng mã PIN." })}
              </div>
              <input
                type="text"
                autoFocus
                placeholder={translate("vaultFolderName", { en: "Vault folder name", vi: "Tên thư mục bảo mật" })}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-modern w-full px-4 py-2.5 rounded-xl mb-3"
              />
              <input
                type="password"
                inputMode="numeric"
                placeholder={translate("vaultPinOptional", { en: "PIN (optional, 4-8 digits)", vi: "Mã PIN (tùy chọn, 4-8 chữ số)" })}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="input-modern w-full px-4 py-2.5 rounded-xl mb-3"
              />
              {error && <p className="text-sm text-error mb-3">{error}</p>}
              <button onClick={handleCreate} disabled={busy || name.trim() === ""}
                className="btn-primary w-full px-4 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                {translate("vaultCreate", { en: "Create vault folder", vi: "Tạo thư mục bảo mật" })}
              </button>
              <button onClick={resetForm} className="w-full mt-2 py-2 text-xs text-muted hover:text-foreground transition-colors">
                {translate("vaultBack", { en: "Back", vi: "Quay lại" })}
              </button>
            </>
          )}

          {action === "pin" && target && (
            <>
              <div className="flex items-center gap-2 mb-4 text-sm text-muted">
                <KeyRound className="w-4 h-4" />
                {translate("vaultChangePinTitle", { en: `Set/change PIN for "${target.name}"`, vi: `Đặt/đổi mã PIN cho "${target.name}"` })}
              </div>
              <input
                type="password"
                inputMode="numeric"
                autoFocus
                placeholder={translate("vaultCurrentPin", { en: "Current PIN (leave blank if none)", vi: "Mã PIN hiện tại (bỏ trống nếu chưa có)" })}
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value)}
                className="input-modern w-full px-4 py-2.5 rounded-xl mb-3"
              />
              <input
                type="password"
                inputMode="numeric"
                placeholder={translate("vaultNewPin", { en: "New PIN (4-8 digits)", vi: "Mã PIN mới (4-8 chữ số)" })}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="input-modern w-full px-4 py-2.5 rounded-xl mb-3"
              />
              {error && <p className="text-sm text-error mb-3">{error}</p>}
              <button onClick={handleSetPin} disabled={busy || pin.trim() === ""}
                className="btn-primary w-full px-4 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                {translate("vaultSavePin", { en: "Save PIN", vi: "Lưu mã PIN" })}
              </button>
              <button onClick={resetForm} className="w-full mt-2 py-2 text-xs text-muted hover:text-foreground transition-colors">
                {translate("vaultBack", { en: "Back", vi: "Quay lại" })}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}