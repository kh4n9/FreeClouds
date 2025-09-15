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

      const data = await response.json();

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
        console.error("Login failed:", data);
        setError({
          message: data.error || "Login failed. Please try again.",
        });
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
      return true;
    } catch (error) {
      console.error("Logout failed:", error);
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
export const redirectToPage = (path: string, delay: number = 200) => {
  setTimeout(() => {
    console.log(`Redirecting to ${path}...`);
    window.location.href = path;
  }, delay);
};

// Cookie utilities
export const getCookie = (name: string): string | null => {
  const cookie = document.cookie
    .split(";")
    .find((c) => c.trim().startsWith(`${name}=`));
  return cookie ? cookie.split("=")[1] : null;
};

export const clearAuthCookie = () => {
  document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
};

// Shared form input handler
export const createInputChangeHandler = (
  setForm: React.Dispatch<React.SetStateAction<LoginForm>>,
  setError: React.Dispatch<React.SetStateAction<LoginError | null>>
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
