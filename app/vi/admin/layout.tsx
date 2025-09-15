"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  FolderOpen,
  Settings,
  BarChart3,
  Shield,
  LogOut,
  Menu,
  X,
  Bell,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      console.log("Admin layout: Checking authentication...");
      const response = await fetch("/api/auth/me");
      console.log("Admin layout: Auth response status:", response.status);

      if (response.ok) {
        const userData = await response.json();
        console.log("Admin layout: User data:", userData);
        console.log("Admin layout: User role:", userData.role);

        if (userData.role !== "admin") {
          console.log(
            "Admin layout: User is not admin, redirecting to dashboard",
          );
          router.push("/vi/dashboard");
          return;
        }
        console.log("Admin layout: User is admin, setting user data");
        setUser(userData);
      } else {
        console.log("Admin layout: Auth failed, redirecting to login");
        const errorText = await response.text();
        console.log("Admin layout: Auth error:", errorText);
        router.push("/vi/login");
      }
    } catch (error) {
      console.error("Admin layout: Auth check failed:", error);
      router.push("/vi/login");
    } finally {
      console.log("Admin layout: Setting loading to false");
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/vi/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const navigation = [
    {
      name: "Tổng quan",
      href: "/vi/admin",
      icon: LayoutDashboard,
      current: pathname === "/vi/admin",
    },
    {
      name: "Quản lý người dùng",
      href: "/vi/admin/users",
      icon: Users,
      current: pathname.startsWith("/vi/admin/users"),
    },
    {
      name: "Quản lý file",
      href: "/vi/admin/files",
      icon: FileText,
      current: pathname.startsWith("/vi/admin/files"),
    },
    {
      name: "Quản lý thư mục",
      href: "/vi/admin/folders",
      icon: FolderOpen,
      current: pathname.startsWith("/vi/admin/folders"),
    },
    {
      name: "Thống kê & Báo cáo",
      href: "/vi/admin/analytics",
      icon: BarChart3,
      current: pathname.startsWith("/vi/admin/analytics"),
    },
    {
      name: "Cài đặt hệ thống",
      href: "/vi/admin/settings",
      icon: Settings,
      current: pathname.startsWith("/vi/admin/settings"),
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang kiểm tra quyền admin...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log("Admin layout: No user data, rendering null");
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Đang chuyển hướng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-gray-600 opacity-75"></div>
        </div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:flex lg:flex-col ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 lg:justify-center">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.svg"
              alt="Free Clouds Admin"
              width={32}
              height={32}
              className="h-8 w-8"
            />
            <span className="text-xl font-bold text-gray-900">Admin</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 mt-5 px-2 overflow-y-auto">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                      item.current
                        ? "bg-blue-100 text-blue-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon
                      className={`mr-3 h-5 w-5 ${
                        item.current
                          ? "text-blue-500"
                          : "text-gray-400 group-hover:text-gray-500"
                      }`}
                    />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User info and logout */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center mb-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Shield className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.name}
              </p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Đăng xuất
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Top header */}
        <header className="bg-white shadow-sm border-b border-gray-200 z-10">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500"
              >
                <Menu className="h-5 w-5" />
              </button>
              <h1 className="ml-2 text-2xl font-semibold text-gray-900 lg:ml-0">
                Quản trị hệ thống
              </h1>
            </div>

            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button className="relative p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>

              {/* User menu */}
              <div className="flex items-center gap-2">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500">Quản trị viên</p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Shield className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
