"use client";

import { useEffect, useState } from "react";
import {
  Settings as SettingsIcon,
  Save,
  AlertTriangle,
  CheckCircle,
  Globe,
  UserPlus,
  HardDrive,
  Loader2,
} from "lucide-react";
import { Lang, getDict } from "../i18n";
import {
  PageHeader,
  ErrorBanner,
  formatFileSize,
} from "../ui";

interface SettingsData {
  allowRegistration: boolean;
  storageLimit: number;
  siteName: string;
}

export default function AdminSettingsPage({ lang }: { lang: Lang }) {
  const t = getDict(lang);

  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [siteName, setSiteName] = useState("");
  const [storageLimitMB, setStorageLimitMB] = useState("");
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/settings");

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        setSiteName(data.siteName || "");
        setStorageLimitMB(
          Math.round((data.storageLimit || 0) / (1024 * 1024)).toString(),
        );
        setAllowRegistration(!!data.allowRegistration);
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || t.settings.errorLoad);
      }
    } catch {
      setError(t.common.connectionError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const patch: Record<string, string | number | boolean> = {
        siteName: siteName.trim(),
        allowRegistration,
      };

      const mb = Number(storageLimitMB);
      if (Number.isFinite(mb) && mb > 0) {
        patch.storageLimit = Math.floor(mb * 1024 * 1024);
      }

      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(patch),
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        setSuccess(true);
      } else {
        const errorData = await response.json();
        setError(errorData.error || t.settings.errorSave);
      }
    } catch {
      setError(t.common.connectionError);
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "block w-full px-3 py-2 border border-line-hover rounded-md bg-card text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={t.settings.title}
        subtitle={
          <span className="mt-2 text-foreground">{t.settings.subtitle}</span>
        }
        actions={
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm shadow-black/10 text-sm font-medium text-foreground bg-accent hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t.settings.saving}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {t.settings.save}
              </>
            )}
          </button>
        }
      />

      <ErrorBanner message={error} />

      {success && (
        <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
            <span className="text-green-300">{t.settings.saved}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* General */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card shadow rounded-lg">
            <div className="px-6 py-4 border-b border-line flex items-center">
              <Globe className="h-5 w-5 text-accent mr-2" />
              <h3 className="text-lg font-medium text-foreground">
                {t.settings.sectionGeneral}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label
                  htmlFor="siteName"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  {t.settings.siteName}
                </label>
                <input
                  id="siteName"
                  type="text"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  className={inputClass}
                  placeholder={t.settings.siteNamePlaceholder}
                />
              </div>
            </div>
          </div>

          <div className="bg-card shadow rounded-lg">
            <div className="px-6 py-4 border-b border-line flex items-center">
              <UserPlus className="h-5 w-5 text-green-400 mr-2" />
              <h3 className="text-lg font-medium text-foreground">
                {t.settings.sectionRegistration}
              </h3>
            </div>
            <div className="p-6">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowRegistration}
                  onChange={(e) => setAllowRegistration(e.target.checked)}
                  className="h-4 w-4 text-accent focus:ring-accent border-line-hover rounded"
                />
                <span className="ml-3 text-sm text-foreground">
                  {t.settings.allowRegistration}
                </span>
              </label>
            </div>
          </div>

          <div className="bg-card shadow rounded-lg">
            <div className="px-6 py-4 border-b border-line flex items-center">
              <HardDrive className="h-5 w-5 text-accent mr-2" />
              <h3 className="text-lg font-medium text-foreground">
                {t.settings.sectionStorage}
              </h3>
            </div>
            <div className="p-6 space-y-3">
              <div>
                <label
                  htmlFor="storageLimit"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  {t.settings.storageLimit}
                </label>
                <input
                  id="storageLimit"
                  type="number"
                  min="1"
                  value={storageLimitMB}
                  onChange={(e) => setStorageLimitMB(e.target.value)}
                  className={inputClass}
                />
              </div>
              {settings && (
                <p className="text-sm text-muted">
                  {t.settings.storageLimitHint.replace(
                    "{value}",
                    formatFileSize(settings.storageLimit),
                  )}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Preview card */}
        <div className="lg:col-span-1">
          <div className="bg-card shadow rounded-lg p-6 sticky top-6">
            <div className="flex items-center mb-4">
              <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
                <SettingsIcon className="h-5 w-5 text-foreground" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-foreground">
                  {siteName || "Free Clouds"}
                </p>
                <p className="text-xs text-muted">
                  {t.nav.brand}
                </p>
              </div>
            </div>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">
                  {t.settings.allowRegistration}
                </dt>
                <dd className="text-foreground">
                  {allowRegistration ? t.common.yes : t.common.no}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">{t.settings.storageLimit}</dt>
                <dd className="text-foreground">
                  {storageLimitMB ? `${Number(storageLimitMB).toLocaleString()} MB` : "—"}
                </dd>
              </div>
            </dl>
            {error && (
              <div className="mt-4 flex items-start">
                <AlertTriangle className="h-4 w-4 text-error mr-2 mt-0.5 shrink-0" />
                <span className="text-xs text-error">{error}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
