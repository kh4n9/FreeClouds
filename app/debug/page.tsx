"use client";

import { useState, useEffect } from "react";
import { User, Shield, Cookie, Database, RefreshCw } from "lucide-react";

interface AuthDebugInfo {
  cookies: string;
  tokenCookie: string | null;
  apiResponse: any;
  apiStatus: number;
  user: any;
  timestamp: string;
}

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<AuthDebugInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const runAuthDebug = async () => {
    setLoading(true);
    try {
      // Get all cookies
      const allCookies = document.cookie;
      console.log("All cookies:", allCookies);

      // Find token cookie
      const tokenCookie = document.cookie
        .split(";")
        .find((c) => c.trim().startsWith("token="));

      console.log("Token cookie:", tokenCookie);

      // Test API
      const response = await fetch("/api/auth/me");
      const responseData = response.ok ? await response.json() : await response.text();

      console.log("API Response:", responseData);
      console.log("API Status:", response.status);

      setDebugInfo({
        cookies: allCookies,
        tokenCookie: tokenCookie || null,
        apiResponse: responseData,
        apiStatus: response.status,
        user: response.ok ? responseData : null,
        timestamp: new Date().toLocaleString(),
      });
    } catch (error) {
      console.error("Debug error:", error);
      setDebugInfo({
        cookies: document.cookie,
        tokenCookie: null,
        apiResponse: error,
        apiStatus: 0,
        user: null,
        timestamp: new Date().toLocaleString(),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runAuthDebug();
  }, []);

  const testLogin = async () => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "admin@example.com",
          password: "admin123",
        }),
      });

      const data = await response.json();
      console.log("Test login response:", data);

      if (response.ok) {
        // Refresh debug info after login
        setTimeout(() => runAuthDebug(), 500);
      }
    } catch (error) {
      console.error("Test login error:", error);
    }
  };

  const clearCookies = () => {
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    setTimeout(() => runAuthDebug(), 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">
              Authentication Debug Panel
            </h1>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Controls */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <RefreshCw className="w-5 h-5" />
                Debug Controls
              </h2>

              <div className="space-y-2">
                <button
                  onClick={runAuthDebug}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Refresh Debug Info
                </button>

                <button
                  onClick={testLogin}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <User className="w-4 h-4" />
                  Test Login (admin@example.com)
                </button>

                <button
                  onClick={clearCookies}
                  className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                >
                  <Cookie className="w-4 h-4" />
                  Clear Cookies
                </button>
              </div>

              <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                <strong>Test Credentials:</strong>
                <br />
                Email: admin@example.com
                <br />
                Password: admin123
                <br />
                <br />
                Create admin user with: <code>npm run create-admin</code>
              </div>
            </div>

            {/* Debug Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Database className="w-5 h-5" />
                Debug Information
              </h2>

              {debugInfo && (
                <div className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <strong>Timestamp:</strong> {debugInfo.timestamp}
                  </div>

                  <div className="bg-gray-50 p-3 rounded">
                    <strong className="text-sm">All Cookies:</strong>
                    <div className="text-xs font-mono mt-1 p-2 bg-white rounded border break-all">
                      {debugInfo.cookies || "(no cookies)"}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded">
                    <strong className="text-sm">Token Cookie:</strong>
                    <div className="text-xs font-mono mt-1 p-2 bg-white rounded border break-all">
                      {debugInfo.tokenCookie || "(not found)"}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded">
                    <strong className="text-sm">API Status:</strong>
                    <div className={`text-sm mt-1 font-semibold ${
                      debugInfo.apiStatus === 200 ? "text-green-600" : "text-red-600"
                    }`}>
                      {debugInfo.apiStatus}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded">
                    <strong className="text-sm">API Response:</strong>
                    <pre className="text-xs font-mono mt-1 p-2 bg-white rounded border overflow-auto max-h-32">
                      {JSON.stringify(debugInfo.apiResponse, null, 2)}
                    </pre>
                  </div>

                  <div className="bg-gray-50 p-3 rounded">
                    <strong className="text-sm">User Status:</strong>
                    <div className={`text-sm mt-1 font-semibold ${
                      debugInfo.user ? "text-green-600" : "text-red-600"
                    }`}>
                      {debugInfo.user ? "✅ Authenticated" : "❌ Not Authenticated"}
                    </div>
                    {debugInfo.user && (
                      <div className="text-xs mt-1">
                        Name: {debugInfo.user.name}
                        <br />
                        Email: {debugInfo.user.email}
                        <br />
                        ID: {debugInfo.user.id}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-md font-semibold text-gray-800 mb-3">Quick Links</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <a href="/login" className="text-blue-600 hover:underline">
                → Login Page
              </a>
              <a href="/register" className="text-blue-600 hover:underline">
                → Register Page
              </a>
              <a href="/dashboard" className="text-blue-600 hover:underline">
                → Dashboard
              </a>
              <a href="/admin" className="text-blue-600 hover:underline">
                → Admin Panel
              </a>
              <a href="/api/auth/me" className="text-blue-600 hover:underline">
                → Auth API
              </a>
              <a href="/api/auth/logout" className="text-blue-600 hover:underline">
                → Logout API
              </a>
              <a href="/" className="text-blue-600 hover:underline">
                → Home Page
              </a>
              <button
                onClick={() => window.location.reload()}
                className="text-blue-600 hover:underline text-left"
              >
                → Reload Page
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-yellow-50 rounded border border-yellow-200">
            <h4 className="font-semibold text-yellow-800 mb-2">Debugging Steps:</h4>
            <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
              <li>Check if cookies are being set correctly</li>
              <li>Verify API response status (should be 200 for authenticated users)</li>
              <li>Test login with valid credentials</li>
              <li>Check browser Network tab for failed requests</li>
              <li>Verify middleware is working correctly</li>
              <li>Check server logs for errors</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
