"use client";

import { useState, useEffect } from "react";
import { Shield, User, Database, Clock } from "lucide-react";

interface AuthDebugInfo {
  user: any;
  authStatus: number;
  authResponse: any;
  adminStatsStatus: number;
  adminStatsResponse: any;
  timestamp: string;
}

export default function AdminTestPage() {
  const [debugInfo, setDebugInfo] = useState<AuthDebugInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const runDebugTests = async () => {
    setLoading(true);
    try {
      console.log("Admin test: Starting debug tests...");

      // Test 1: Check auth
      const authResponse = await fetch("/api/auth/me");
      const authData = authResponse.ok ? await authResponse.json() : await authResponse.text();
      console.log("Admin test: Auth response:", authResponse.status, authData);

      // Test 2: Check admin stats
      const statsResponse = await fetch("/api/admin/stats");
      const statsData = statsResponse.ok ? await statsResponse.json() : await statsResponse.text();
      console.log("Admin test: Stats response:", statsResponse.status, statsData);

      setDebugInfo({
        user: authResponse.ok ? authData : null,
        authStatus: authResponse.status,
        authResponse: authData,
        adminStatsStatus: statsResponse.status,
        adminStatsResponse: statsData,
        timestamp: new Date().toLocaleString(),
      });

    } catch (error) {
      console.error("Admin test: Error:", error);
      setDebugInfo({
        user: null,
        authStatus: 0,
        authResponse: error,
        adminStatsStatus: 0,
        adminStatsResponse: error,
        timestamp: new Date().toLocaleString(),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDebugTests();
  }, []);

  const getStatusColor = (status: number) => {
    if (status === 200) return "text-green-600";
    if (status === 401 || status === 403) return "text-red-600";
    if (status === 0) return "text-gray-600";
    return "text-yellow-600";
  };

  const getStatusIcon = (status: number) => {
    if (status === 200) return "✅";
    if (status === 401 || status === 403) return "❌";
    if (status === 0) return "⚠️";
    return "⚡";
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">
              Admin Access Test Panel
            </h1>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Controls */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Database className="w-5 h-5" />
                Test Controls
              </h2>

              <button
                onClick={runDebugTests}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Database className="w-4 h-4" />
                )}
                Run Admin Tests
              </button>

              <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                <strong>This page tests:</strong>
                <ul className="mt-1 list-disc list-inside space-y-1">
                  <li>Authentication status (/api/auth/me)</li>
                  <li>Admin stats API (/api/admin/stats)</li>
                  <li>User role verification</li>
                  <li>Cookie authentication</li>
                </ul>
              </div>

              <div className="text-sm text-gray-600 bg-yellow-50 p-3 rounded border border-yellow-200">
                <strong>Expected Results:</strong>
                <ul className="mt-1 list-disc list-inside space-y-1">
                  <li>Auth status: 200 (if logged in as admin)</li>
                  <li>User role: "admin"</li>
                  <li>Stats status: 200 (if admin access granted)</li>
                </ul>
              </div>
            </div>

            {/* Debug Results */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Test Results
              </h2>

              {debugInfo && (
                <div className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <strong>Test Time:</strong> {debugInfo.timestamp}
                  </div>

                  {/* Auth Status */}
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4" />
                      <strong className="text-sm">Authentication Status</strong>
                    </div>
                    <div className={`text-sm font-mono ${getStatusColor(debugInfo.authStatus)}`}>
                      {getStatusIcon(debugInfo.authStatus)} Status: {debugInfo.authStatus}
                    </div>
                    {debugInfo.user && (
                      <div className="text-xs mt-2 space-y-1">
                        <div>Name: {debugInfo.user.name}</div>
                        <div>Email: {debugInfo.user.email}</div>
                        <div className={`font-semibold ${
                          debugInfo.user.role === 'admin' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          Role: {debugInfo.user.role || 'undefined'}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Admin Stats Status */}
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4" />
                      <strong className="text-sm">Admin Stats API</strong>
                    </div>
                    <div className={`text-sm font-mono ${getStatusColor(debugInfo.adminStatsStatus)}`}>
                      {getStatusIcon(debugInfo.adminStatsStatus)} Status: {debugInfo.adminStatsStatus}
                    </div>
                    {debugInfo.adminStatsResponse && typeof debugInfo.adminStatsResponse === 'object' && (
                      <div className="text-xs mt-2">
                        Response keys: {Object.keys(debugInfo.adminStatsResponse).join(', ')}
                      </div>
                    )}
                  </div>

                  {/* Raw Response Data */}
                  <div className="bg-gray-50 p-3 rounded">
                    <strong className="text-sm">Raw Auth Response:</strong>
                    <pre className="text-xs font-mono mt-1 p-2 bg-white rounded border overflow-auto max-h-32">
                      {JSON.stringify(debugInfo.authResponse, null, 2)}
                    </pre>
                  </div>

                  <div className="bg-gray-50 p-3 rounded">
                    <strong className="text-sm">Raw Stats Response:</strong>
                    <pre className="text-xs font-mono mt-1 p-2 bg-white rounded border overflow-auto max-h-32">
                      {typeof debugInfo.adminStatsResponse === 'object'
                        ? JSON.stringify(debugInfo.adminStatsResponse, null, 2)
                        : debugInfo.adminStatsResponse}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Diagnostics */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-md font-semibold text-gray-800 mb-3">Diagnostics</h3>

            {debugInfo && (
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className={`p-2 rounded ${
                    debugInfo.authStatus === 200 ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                  }`}>
                    <strong>Authentication:</strong> {
                      debugInfo.authStatus === 200 ? 'Working' : 'Failed'
                    }
                  </div>

                  <div className={`p-2 rounded ${
                    debugInfo.user?.role === 'admin' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                  }`}>
                    <strong>Admin Role:</strong> {
                      debugInfo.user?.role === 'admin' ? 'Verified' : 'Missing'
                    }
                  </div>
                </div>

                <div className="space-y-2">
                  <div className={`p-2 rounded ${
                    debugInfo.adminStatsStatus === 200 ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                  }`}>
                    <strong>Admin API:</strong> {
                      debugInfo.adminStatsStatus === 200 ? 'Accessible' : 'Blocked'
                    }
                  </div>

                  <div className="p-2 rounded bg-blue-50 text-blue-800">
                    <strong>Overall Status:</strong> {
                      debugInfo.authStatus === 200 &&
                      debugInfo.user?.role === 'admin' &&
                      debugInfo.adminStatsStatus === 200
                        ? 'All Good ✅'
                        : 'Issues Found ⚠️'
                    }
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-3">Quick Actions</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <a href="/debug" className="text-blue-600 hover:underline">
                → General Debug
              </a>
              <a href="/admin" className="text-blue-600 hover:underline">
                → Admin Dashboard
              </a>
              <a href="/login" className="text-blue-600 hover:underline">
                → Login Page
              </a>
              <button
                onClick={() => window.location.reload()}
                className="text-blue-600 hover:underline text-left"
              >
                → Refresh Tests
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
