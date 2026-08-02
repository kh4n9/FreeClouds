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
    "block w-full px-3 py-2 border border-slate-600/50 rounded-md bg-slate-800/80 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

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
          <span className="mt-2 text-slate-300">{t.settings.subtitle}</span>
        }
        actions={
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm shadow-black/10 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
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
          <div className="bg-slate-800/50 shadow rounded-lg">
            <div className="px-6 py-4 border-b border-slate-700/50 flex items-center">
              <Globe className="h-5 w-5 text-sky-400 mr-2" />
              <h3 className="text-lg font-medium text-white">
                {t.settings.sectionGeneral}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label
                  htmlFor="siteName"
                  className="block text-sm font-medium text-slate-200 mb-2"
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

          <div className="bg-slate-800/50 shadow rounded-lg">
            <div className="px-6 py-4 border-b border-slate-700/50 flex items-center">
              <UserPlus className="h-5 w-5 text-green-400 mr-2" />
              <h3 className="text-lg font-medium text-white">
                {t.settings.sectionRegistration}
              </h3>
            </div>
            <div className="p-6">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowRegistration}
                  onChange={(e) => setAllowRegistration(e.target.checked)}
                  className="h-4 w-4 text-sky-400 focus:ring-blue-500 border-slate-600/50 rounded"
                />
                <span className="ml-3 text-sm text-slate-200">
                  {t.settings.allowRegistration}
                </span>
              </label>
            </div>
          </div>

          <div className="bg-slate-800/50 shadow rounded-lg">
            <div className="px-6 py-4 border-b border-slate-700/50 flex items-center">
              <HardDrive className="h-5 w-5 text-cyan-400 mr-2" />
              <h3 className="text-lg font-medium text-white">
                {t.settings.sectionStorage}
              </h3>
            </div>
            <div className="p-6 space-y-3">
              <div>
                <label
                  htmlFor="storageLimit"
                  className="block text-sm font-medium text-slate-200 mb-2"
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
                <p className="text-sm text-slate-400">
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
          <div className="bg-slate-800/50 shadow rounded-lg p-6 sticky top-6">
            <div className="flex items-center mb-4">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                <SettingsIcon className="h-5 w-5 text-white" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">
                  {siteName || "Free Clouds"}
                </p>
                <p className="text-xs text-slate-400">
                  {t.nav.brand}
                </p>
              </div>
            </div>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-400">
                  {t.settings.allowRegistration}
                </dt>
                <dd className="text-white">
                  {allowRegistration ? t.common.yes : t.common.no}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">{t.settings.storageLimit}</dt>
                <dd className="text-white">
                  {storageLimitMB ? `${Number(storageLimitMB).toLocaleString()} MB` : "—"}
                </dd>
              </div>
            </dl>
            {error && (
              <div className="mt-4 flex items-start">
                <AlertTriangle className="h-4 w-4 text-red-400 mr-2 mt-0.5 shrink-0" />
                <span className="text-xs text-red-300">{error}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
