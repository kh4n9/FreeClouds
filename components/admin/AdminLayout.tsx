"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  FolderOpen,
  BarChart3,
  Settings,
  History,
  Trash2,
  Shield,
  LogOut,
  Menu,
  X,
  Bell,
  Cloud,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Lang, getDict } from "./i18n";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AdminLayoutProps {
  children: React.ReactNode;
  lang: Lang;
}

export default function AdminLayout({ children, lang }: AdminLayoutProps) {
  const t = getDict(lang);
  const base = lang === "vi" ? "/vi/admin" : "/admin";
  const dashboardPath = lang === "vi" ? "/vi/dashboard" : "/dashboard";
  const loginPath = lang === "vi" ? "/vi/login" : "/login";

  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { href: base, icon: LayoutDashboard, label: t.nav.overview },
    { href: `${base}/users`, icon: Users, label: t.nav.users },
    { href: `${base}/files`, icon: FileText, label: t.nav.files },
    { href: `${base}/folders`, icon: FolderOpen, label: t.nav.folders },
    { href: `${base}/analytics`, icon: BarChart3, label: t.nav.analytics },
    { href: `${base}/settings`, icon: Settings, label: t.nav.settings },
    { href: `${base}/logs`, icon: History, label: t.nav.logs },
    { href: `${base}/trash`, icon: Trash2, label: t.nav.trash },
  ];

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.role !== "admin") {
            router.push(dashboardPath);
            return;
          }
          setUser(data);
        } else if (res.status === 401) {
          // Only unauthenticated should bounce to login. 5xx / other errors
          // are transient — navigating away re-triggers the login page's
          // auto-redirect and causes an endless reload loop.
          router.push(loginPath);
        } else {
          setAuthError(true);
        }
      } catch {
        setAuthError(true);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push(loginPath);
  };

  if (loading) {
    return (
      <div className="min-h-screen app-bg flex items-center justify-center">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Cloud className="w-7 h-7 text-white" />
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen app-bg flex items-center justify-center p-4">
        <div className="modal-content p-8 max-w-md w-full text-center">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
            <Bell className="w-6 h-6 text-amber-400" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">
            {t.nav.brand}
          </h2>
          <p className="text-sm text-slate-400 mb-6">{t.common.authError}</p>
          <button
            onClick={() => {
              setLoading(true);
              setAuthError(false);
              setReloadKey((k) => k + 1);
            }}
            className="btn-primary px-6 py-2.5 rounded-xl text-sm font-medium"
          >
            {t.common.retry}
          </button>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen app-bg flex animate-fade-in">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900/80 border-r border-slate-800 transform transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} flex flex-col`}
      >
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <Link href={base} className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center transition-transform group-hover:scale-110">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">
                {t.nav.brand}
              </span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              !!pathname &&
              (pathname === item.href ||
                (item.href !== base && pathname.startsWith(item.href)));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link text-sm ${isActive ? "active" : ""}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-800">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user.name}
              </p>
              <p className="text-xs text-slate-500">{t.nav.roleLabel}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 mt-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
          >
            <LogOut className="w-4 h-4" /> {t.nav.logout}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="glass border-b border-slate-700/50 px-6 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-400 hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 ml-auto">
              <button className="btn-ghost p-2 rounded-lg relative">
                <Bell className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <Shield className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-medium text-blue-300">
                  {t.nav.adminBadge}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
