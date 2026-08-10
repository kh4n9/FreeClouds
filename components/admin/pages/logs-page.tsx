"use client";

import { useEffect, useState } from "react";
import {
  RefreshCw,
  Search,
  Eye,
  X,
  ScrollText,
  LogIn,
  Upload,
  UserPlus,
  UserCog,
  FolderX,
  Trash2,
  Settings as SettingsIcon,
} from "lucide-react";
import { Lang, getDict } from "../i18n";
import {
  formatDate,
  PageHeader,
  ErrorBanner,
  TableLoading,
  TableEmpty,
  Pagination,
  Modal,
} from "../ui";

interface LogEntry {
  id: string;
  userId: string | null;
  email: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  ip: string | null;
  createdAt: string;
}

const ACTION_COLORS: Record<string, string> = {
  "login": "bg-blue-100 text-blue-800",
  "login.failed": "bg-red-100 text-red-800",
  "login.blocked": "bg-red-100 text-red-800",
  "register": "bg-green-100 text-green-800",
  "register.blocked": "bg-red-100 text-red-800",
  "file.upload": "bg-green-100 text-green-800",
  "trash.empty": "bg-card-hover text-gray-800",
  "admin.user.create": "bg-sky-100 text-sky-800",
  "admin.user.update": "bg-sky-100 text-sky-800",
  "admin.user.delete": "bg-red-100 text-red-800",
  "admin.file.restore": "bg-green-100 text-green-800",
  "admin.folder.delete": "bg-cyan-100 text-cyan-800",
  "admin.trash.restore": "bg-green-100 text-green-800",
  "admin.trash.delete": "bg-red-100 text-red-800",
  "admin.settings.update": "bg-amber-100 text-amber-800",
};

function actionColor(action: string): string {
  return (
    ACTION_COLORS[action] ||
    "bg-card-hover text-sub"
  );
}

function actionIcon(action: string) {
  if (action === "login") return <LogIn className="h-4 w-4" />;
  if (action === "register") return <UserPlus className="h-4 w-4" />;
  if (action === "file.upload") return <Upload className="h-4 w-4" />;
  if (action.startsWith("admin.folder")) return <FolderX className="h-4 w-4" />;
  if (action.startsWith("admin.trash") || action === "trash.empty")
    return <Trash2 className="h-4 w-4" />;
  if (action.startsWith("admin.settings"))
    return <SettingsIcon className="h-4 w-4" />;
  if (action.startsWith("admin.user"))
    return <UserCog className="h-4 w-4" />;
  return <ScrollText className="h-4 w-4" />;
}

export default function AdminLogsPage({ lang }: { lang: Lang }) {
  const t = getDict(lang);

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  const allActions = Object.keys(ACTION_COLORS);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchLogs = async (page: number = pagination.currentPage) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "30",
      });
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (actionFilter) params.append("action", actionFilter);

      const response = await fetch(`/api/admin/logs?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch logs");
      }

      const data = await response.json();
      setLogs(data.logs);
      setPagination({
        currentPage: data.page || 1,
        totalPages: data.totalPages || 1,
        total: data.total || 0,
      });
      setError(null);
    } catch {
      setError(t.logs.errorLoad);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, actionFilter, pagination.currentPage]);

  const resetFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setActionFilter("");
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const hasFilters = searchTerm || actionFilter;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={t.logs.title}
        subtitle={
          <span className="mt-2 text-foreground">{t.logs.subtitle}</span>
        }
        actions={
          <button
            onClick={() => fetchLogs()}
            className="inline-flex items-center px-4 py-2 border border-line-hover rounded-md shadow-sm text-sm font-medium text-foreground bg-card hover:bg-card-hover/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {t.logs.refresh}
          </button>
        }
      />

      <ErrorBanner message={error} />

      {/* Filters */}
      <div className="bg-card shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPagination((prev) => ({ ...prev, currentPage: 1 }));
              }}
              placeholder={t.logs.searchPlaceholder}
              className="block w-full pl-10 pr-3 py-2 border border-line-hover rounded-md leading-5 bg-card placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />
          </div>

          <div>
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPagination((prev) => ({ ...prev, currentPage: 1 }));
              }}
              className="block w-full px-3 py-2 border border-line-hover rounded-md bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            >
              <option value="">{t.logs.allActions}</option>
              {allActions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </div>
        </div>

        {hasFilters && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={resetFilters}
              className="inline-flex items-center px-3 py-2 border border-line-hover shadow-sm text-sm leading-4 font-medium rounded-md text-foreground bg-card hover:bg-card-hover/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
            >
              <X className="h-4 w-4 mr-2" />
              {t.common.resetFilters}
            </button>
          </div>
        )}
      </div>

      {/* Logs Table */}
      <div className="bg-card shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-700/50">
              <thead className="bg-card">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    {t.logs.actionCol}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    {t.logs.userCol}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    {t.logs.entityCol}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    {t.logs.ipCol}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    {t.logs.timeCol}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    {t.common.actions}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-slate-700/50">
                {loading ? (
                  <TableLoading colSpan={6} />
                ) : logs.length === 0 ? (
                  <TableEmpty colSpan={6} message={t.logs.noLogs} />
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-card-hover/30">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${actionColor(log.action)}`}
                        >
                          <span className="mr-1.5">{actionIcon(log.action)}</span>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        {log.email || (
                          <span className="text-muted">
                            {t.common.unknown}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        {log.entityType ? (
                          <span className="text-muted">{log.entityType}</span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                        {log.ip || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        {formatDate(log.createdAt, lang)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="inline-flex items-center text-accent hover:text-accent"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          {t.logs.details}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <Pagination
              lang={lang}
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              pageSize={30}
              label={t.logs.actionCol.toLowerCase()}
              onPageChange={(page) => fetchLogs(page)}
            />
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <Modal
        open={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={t.logs.details}
      >
        {selectedLog && (
          <div>
            <div className="flex items-start justify-between">
              <div>
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${actionColor(selectedLog.action)}`}
                >
                  {selectedLog.action}
                </span>
              </div>
            </div>
            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">{t.logs.userCol}</dt>
                <dd className="text-foreground text-right">
                  {selectedLog.email || t.common.unknown}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">{t.logs.entityCol}</dt>
                <dd className="text-foreground text-right break-all">
                  {selectedLog.entityId || "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">{t.logs.ipCol}</dt>
                <dd className="text-foreground text-right">
                  {selectedLog.ip || "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">{t.logs.timeCol}</dt>
                <dd className="text-foreground text-right">
                  {formatDate(selectedLog.createdAt, lang)}
                </dd>
              </div>
            </dl>
            {selectedLog.metadata &&
              Object.keys(selectedLog.metadata).length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-foreground mb-2">
                    {t.logs.metadataEmpty}
                  </h4>
                  <pre className="p-3 bg-card rounded-md text-xs text-foreground overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
          </div>
        )}
      </Modal>
    </div>
  );
}
