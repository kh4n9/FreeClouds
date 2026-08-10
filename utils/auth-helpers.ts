"use client";

import { useState } from "react";

export interface LoginForm {
  email: string;
  password: string;
}

export interface LoginError {
  message: string;
  field?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role?: string;
}

function formatRateLimitMessage(response: Response): string {
  const retryAfter = response.headers.get("Retry-After");
  const wait = retryAfter ? Math.ceil(Number(retryAfter) / 60) : 5;
  return `Too many attempts. Please try again in ${wait} minute${wait === 1 ? "" : "s"}.`;
}

/**
 * Belt-and-suspenders cleanup: expire the auth cookie from the browser side.
 * HttpOnly cookies can still be removed via document.cookie with matching
 * attributes; this guarantees no stale session survives a logout even if the
 * server's Set-Cookie is ignored (e.g. Secure-flag mismatch in production).
 */
export function clearAuthCookieClientSide(): void {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `token=; Max-Age=0; Path=/; HttpOnly; SameSite=lax${secure}`;
}

// Shared authentication hook
export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<LoginError | null>(null);

  const checkAuth = async (): Promise<AuthUser | null> => {
    try {
      const response = await fetch("/api/auth/me");
      console.log("Auth check response:", response.status);
      if (response.ok) {
        const userData = await response.json();
        console.log("User authenticated:", userData);
        return userData;
      }
      return null;
    } catch (error) {
      console.log("Auth check failed:", error);
      return null;
    }
  };

  const login = async (credentials: LoginForm): Promise<AuthUser | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      let data: { error?: string } | null = null;
      try {
        data = await response.json();
      } catch {
        const text = await response.text().catch(() => "");
        console.error("Login failed - non-JSON response:", response.status, text);
        setError({ message: `Server error (${response.status}). Please try again.` });
        return null;
      }

      if (response.ok) {
        console.log("Login successful, user data:", data);

        // Debug cookie information
        console.log("All cookies:", document.cookie);
        const tokenCookie = document.cookie
          .split(";")
          .find((c) => c.trim().startsWith("token="));
        console.log("Token cookie:", tokenCookie);

        // Verify auth status before redirect
        const authCheck = await checkAuth();
        if (authCheck) {
          return authCheck;
        } else {
          throw new Error("Auth verification failed after login");
        }
      } else {
        console.error("Login failed:", response.status, data);
        const message =
          response.status === 429
            ? formatRateLimitMessage(response)
            : data?.error || `Login failed (${response.status}). Please try again.`;
        setError({ message });
        return null;
      }
    } catch (error) {
      console.error("Login error:", error);
      setError({
        message: "Network error. Please check your connection and try again.",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<boolean> => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      clearAuthCookieClientSide();
      return true;
    } catch (error) {
      console.error("Logout failed:", error);
      clearAuthCookieClientSide();
      return false;
    }
  };

  return {
    loading,
    error,
    setError,
    checkAuth,
    login,
    logout,
  };
}

// Form validation utilities
export const validateLoginForm = (form: LoginForm): LoginError | null => {
  if (!form.email.trim()) {
    return { message: "Email is required", field: "email" };
  }

  if (!form.email.includes("@")) {
    return { message: "Please enter a valid email address", field: "email" };
  }

  if (!form.password.trim()) {
    return { message: "Password is required", field: "password" };
  }

  return null;
};

// Redirect utilities
// Returns the safely resolved post-auth redirect path from a query param.
export const getSafeRedirect = (
  query: string | null | undefined,
  fallback: string,
): string => {
  const target = query;
  if (
    target &&
    target.startsWith("/") &&
    !target.startsWith("//") &&
    !target.includes("\\") &&
    !/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(target)
  ) {
    return target;
  }
  return fallback;
};

// Cookie utilities
export const getCookie = (name: string): string | null => {
  const cookie = document.cookie
    .split(";")
    .find((c) => c.trim().startsWith(`${name}=`));
  return cookie ? cookie.split("=")[1] || null : null;
};

export const clearAuthCookie = () => {
  document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
};

// Shared form input handler
export const createInputChangeHandler = (
  setForm: React.Dispatch<React.SetStateAction<LoginForm>>,
  setError: React.Dispatch<React.SetStateAction<LoginError | null>>,
) => {
  return (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    setError(null);
  };
};

// Debug utilities
export const debugAuthState = () => {
  const cookies = document.cookie;
  const tokenCookie = getCookie("token");

  console.log("=== Auth Debug Info ===");
  console.log("All cookies:", cookies);
  console.log("Token cookie:", tokenCookie);
  console.log("======================");

  return {
    cookies,
    tokenCookie,
    hasToken: !!tokenCookie,
  };
};
