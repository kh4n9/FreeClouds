"use client";

import React, { useEffect, useMemo, useState } from "react";

type TimePoint = {
  timestamp: string; // ISO date
  value: number;
};

type UploadsByDay = {
  date: string; // yyyy-mm-dd
  count: number;
};

type StorageByType = {
  type: string;
  bytes: number;
};

type AnalyticsResponse = {
  activeUsers: TimePoint[]; // e.g., last 30 days
  uploadsByDay: UploadsByDay[]; // e.g., last 30 days
  storageByType: StorageByType[]; // breakdown by mime/category
  totalFiles?: number;
  totalUsers?: number;
  totalStorageBytes?: number;
};

function formatDateShort(iso: string) {
  try {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  } catch {
    return iso;
  }
}

function niceTicks(min: number, max: number, count = 4) {
  if (min === max) {
    return [min];
  }
  const step = (max - min) / count;
  const ticks = [];
  for (let i = 0; i <= count; i++) {
    ticks.push(Math.round((min + step * i) * 100) / 100);
  }
  return ticks;
}

/**
 * Simple LineChart using SVG polylines
 */
function LineChart({
  data,
  height = 160,
  stroke = "#2563eb",
  fill = "rgba(37,99,235,0.08)",
}: {
  data: TimePoint[];
  height?: number;
  stroke?: string;
  fill?: string;
}) {
  const width = 580;
  const padding = { top: 12, right: 12, bottom: 24, left: 36 };

  const points = useMemo(() => {
    if (!data || data.length === 0) return [];
    const values = data.map((d) => d.value);
    const min = Math.min(...values, 0);
    const max = Math.max(...values, 1);
    const xStep =
      (width - padding.left - padding.right) / Math.max(1, data.length - 1);

    return data.map((d, i) => {
      const x = padding.left + xStep * i;
      const y =
        padding.top +
        (1 - (d.value - min) / (max - min || 1)) *
          (height - padding.top - padding.bottom);
      return { x, y, label: formatDateShort(d.timestamp), value: d.value };
    });
  }, [data, width, height]);

  if (points.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-gray-500">
        No data
      </div>
    );
  }

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(" ");
  // Ensure first/last point are non-null (points.length > 0 is guaranteed above)
  const firstPoint = points[0]!;
  const lastPoint = points[points.length - 1]!;
  const areaPath =
    `M ${firstPoint.x} ${height - padding.bottom} ` +
    `L ${points.map((p) => `${p.x} ${p.y}`).join(" L ")} ` +
    `L ${lastPoint.x} ${height - padding.bottom} Z`;

  const values = data.map((d) => d.value);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const ticks = niceTicks(min, max, 3);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      className="w-full h-40"
      role="img"
      aria-label="Active users over time"
    >
      {/* Y grid lines & labels */}
      {ticks.map((t, i) => {
        const y =
          padding.top +
          (1 - (t - min) / (max - min || 1)) *
            (height - padding.top - padding.bottom);
        return (
          <g key={i}>
            <line
              x1={padding.left}
              x2={width - padding.right}
              y1={y}
              y2={y}
              stroke="#e6e9ef"
              strokeWidth={1}
            />
            <text
              x={8}
              y={y + 4}
              fontSize={10}
              fill="#6b7280"
              aria-hidden="true"
            >
              {String(t)}
            </text>
          </g>
        );
      })}

      {/* area */}
      <path d={areaPath} fill={fill} stroke="none" />

      {/* line */}
      <polyline
        points={polylinePoints}
        fill="none"
        stroke={stroke}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* points */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={2.5} fill={stroke} />
      ))}

      {/* x labels */}
      {points.map((p, i) => {
        // show only a few labels
        const show =
          i % Math.ceil(points.length / 6) === 0 || i === points.length - 1;
        return show ? (
          <text
            key={i}
            x={p.x}
            y={height - 6}
            fontSize={10}
            fill="#6b7280"
            textAnchor="middle"
          >
            {p.label}
          </text>
        ) : null;
      })}
    </svg>
  );
}

/**
 * Simple BarChart using SVG rects
 */
function BarChart({
  data,
  height = 160,
  color = "#059669",
}: {
  data: UploadsByDay[];
  height?: number;
  color?: string;
}) {
  const width = 580;
  const padding = { top: 12, right: 12, bottom: 28, left: 36 };
  const points = useMemo(() => {
    if (!data || data.length === 0) return [];
    const counts = data.map((d) => d.count);
    const max = Math.max(...counts, 1);
    const w = (width - padding.left - padding.right) / data.length;
    return data.map((d, i) => {
      const x = padding.left + i * w;
      const h = (d.count / max) * (height - padding.top - padding.bottom) || 0;
      const y = height - padding.bottom - h;
      return { x, y, w: Math.max(4, w * 0.7), label: d.date, count: d.count };
    });
  }, [data, width, height]);

  if (points.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-gray-500">
        No data
      </div>
    );
  }

  const counts = data.map((d) => d.count);
  const max = Math.max(...counts, 1);
  const ticks = niceTicks(0, max, 3);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-40"
      role="img"
      aria-label="Uploads per day"
    >
      {/* Y grid lines */}
      {ticks.map((t, i) => {
        const y =
          padding.top +
          (1 - (t - 0) / (max - 0 || 1)) *
            (height - padding.top - padding.bottom);
        return (
          <g key={i}>
            <line
              x1={padding.left}
              x2={width - padding.right}
              y1={y}
              y2={y}
              stroke="#e6e9ef"
            />
            <text x={8} y={y + 4} fontSize={10} fill="#6b7280">
              {String(t)}
            </text>
          </g>
        );
      })}

      {/* bars */}
      {points.map((p, i) => (
        <g key={i}>
          <rect
            x={
              p.x +
              ((width - padding.left - padding.right) / data.length - p.w) / 2
            }
            y={p.y}
            width={p.w}
            height={height - padding.bottom - p.y}
            fill={color}
            rx={3}
          />
          {/* optional small x labels for a few bars */}
          {i % Math.ceil(points.length / 6) === 0 || i === points.length - 1 ? (
            <text
              x={p.x + p.w / 2}
              y={height - 6}
              fontSize={10}
              fill="#6b7280"
              textAnchor="middle"
            >
              {p.label.slice(5)}
              {/* MM-DD */}
            </text>
          ) : null}
        </g>
      ))}
    </svg>
  );
}

/**
 * Pie chart (SVG path arc slices)
 */
function PieChart({
  data,
  width = 240,
  height = 240,
}: {
  data: StorageByType[];
  width?: number;
  height?: number;
}) {
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(cx, cy) - 8;
  const total = data.reduce((s, d) => s + d.bytes, 0);
  let angleFrom = -Math.PI / 2;

  const colors = [
    "#ef4444",
    "#f97316",
    "#f59e0b",
    "#10b981",
    "#3b82f6",
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
  ];

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-gray-500">
        No data
      </div>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-56"
      role="img"
      aria-label="Storage by type"
    >
      <g transform={`translate(${cx}, ${cy})`}>
        {data.map((d, i) => {
          const portion = d.bytes / total;
          const angleTo = angleFrom + portion * Math.PI * 2;
          const large = portion > 0.5 ? 1 : 0;

          const x1 = Math.cos(angleFrom) * radius;
          const y1 = Math.sin(angleFrom) * radius;
          const x2 = Math.cos(angleTo) * radius;
          const y2 = Math.sin(angleTo) * radius;
          const path = `M 0 0 L ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2} Z`;
          angleFrom = angleTo;
          return (
            <path
              key={d.type}
              d={path}
              fill={colors[i % colors.length]}
              stroke="#fff"
              strokeWidth={1}
            />
          );
        })}
      </g>
    </svg>
  );
}

/**
 * Utilities
 */
function bytesToHuman(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  let v = bytes;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${Math.round(v * 10) / 10} ${units[i]}`;
}

/**
 * Main exported component
 */
export default function AnalyticsCharts() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rangeDays, setRangeDays] = useState<number>(30);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Call the server-side admin stats endpoint and map its response
        const res = await fetch(`/api/admin/stats?days=${rangeDays}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) {
          throw new Error(`Failed to load analytics (${res.status})`);
        }
        const raw = await res.json();

        // Map server response to the AnalyticsCharts component's expected shape.
        // The admin stats endpoint returns structured data (users, files, growth, etc.).
        // We derive: activeUsers (time series), uploadsByDay, storageByType and totals.
        const mapped: AnalyticsResponse = {
          activeUsers:
            (raw.growth?.users || []).map((u: any) => {
              const id = u._id || {};
              const year = id.year ?? new Date().getFullYear();
              const month = id.month ?? new Date().getMonth() + 1;
              const day = id.day ?? new Date().getDate();
              return {
                timestamp: new Date(year, month - 1, day).toISOString(),
                value: u.count || 0,
              };
            }) || [],
          uploadsByDay:
            (raw.growth?.files || []).map((f: any) => {
              const id = f._id || {};
              const year = id.year ?? new Date().getFullYear();
              const month = id.month ?? new Date().getMonth() + 1;
              const day = id.day ?? new Date().getDate();
              return {
                date: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
                count: f.count || 0,
              };
            }) || [],
          storageByType:
            (raw.files?.typeDistribution || []).map((t: any) => ({
              type: t._id || t.mime || "unknown",
              bytes: t.totalSize || 0,
            })) || [],
          totalFiles: raw.files?.total || 0,
          totalUsers: raw.users?.total || 0,
          totalStorageBytes:
            raw.system?.totalStorage || raw.files?.size?.totalSize || 0,
        };

        if (mounted) setData(mapped);
      } catch (err: any) {
        console.error("Analytics fetch error", err);
        if (mounted) {
          setError(err?.message || "Failed to load analytics");
          // keep data null
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [rangeDays]);

  // Derived summary values
  const totals = useMemo(() => {
    if (!data) return { totalFiles: 0, totalUsers: 0, totalStorage: 0 };
    return {
      totalFiles: data.totalFiles || 0,
      totalUsers: data.totalUsers || 0,
      totalStorage:
        data.totalStorageBytes ||
        data.storageByType?.reduce((s, x) => s + x.bytes, 0) ||
        0,
    };
  }, [data]);

  return (
    <section className="bg-white border border-gray-200 rounded-lg p-4">
      <header className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-semibold">System Analytics</h3>
          <p className="text-sm text-gray-500">
            Overview of key system metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Range:</label>
          <select
            className="px-2 py-1 border rounded bg-white text-sm"
            value={rangeDays}
            onChange={(e) => setRangeDays(Number(e.target.value))}
          >
            <option value={7}>7d</option>
            <option value={14}>14d</option>
            <option value={30}>30d</option>
            <option value={90}>90d</option>
          </select>

          <button
            onClick={() => {
              // re-fetch by toggling state
              setRangeDays((r) => r);
              // simple UI feedback can be added
            }}
            className="px-3 py-1 bg-gray-100 border rounded text-sm"
          >
            Refresh
          </button>
        </div>
      </header>

      {loading && (
        <div className="p-6 text-center text-gray-500">Loading analytics…</div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {!loading && !error && data && (
        <div className="space-y-6">
          {/* summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 border rounded flex flex-col">
              <span className="text-sm text-gray-500">Total users</span>
              <span className="text-2xl font-semibold">
                {totals.totalUsers}
              </span>
              <span className="text-xs text-gray-400 mt-1">
                Active in range: {data.activeUsers?.length ?? 0}
              </span>
            </div>
            <div className="p-4 border rounded flex flex-col">
              <span className="text-sm text-gray-500">Total files</span>
              <span className="text-2xl font-semibold">
                {totals.totalFiles}
              </span>
              <span className="text-xs text-gray-400 mt-1">
                Uploads in range:{" "}
                {data.uploadsByDay?.reduce((s, x) => s + x.count, 0) ?? 0}
              </span>
            </div>
            <div className="p-4 border rounded flex flex-col">
              <span className="text-sm text-gray-500">Storage used</span>
              <span className="text-2xl font-semibold">
                {bytesToHuman(totals.totalStorage)}
              </span>
              <span className="text-xs text-gray-400 mt-1">
                Breakdown by type below
              </span>
            </div>
          </div>

          {/* charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-4 border rounded">
              <h4 className="text-sm font-medium mb-2">Active Users</h4>
              <LineChart data={data.activeUsers ?? []} />
            </div>

            <div className="p-4 border rounded">
              <h4 className="text-sm font-medium mb-2">Uploads per day</h4>
              <BarChart data={data.uploadsByDay ?? []} />
            </div>
          </div>

          <div className="p-4 border rounded">
            <h4 className="text-sm font-medium mb-2">Storage by type</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              <div className="sm:col-span-1">
                <PieChart data={data.storageByType ?? []} />
              </div>
              <div className="sm:col-span-2">
                <ul className="space-y-2">
                  {(data.storageByType ?? []).map((s) => (
                    <li
                      key={s.type}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="inline-block w-3 h-3 rounded"
                          style={{
                            background:
                              // deterministic color pick
                              [
                                "#ef4444",
                                "#f97316",
                                "#f59e0b",
                                "#10b981",
                                "#3b82f6",
                                "#8b5cf6",
                                "#ec4899",
                                "#06b6d4",
                              ][
                                Math.abs(
                                  Array.from(s.type).reduce(
                                    (a, c) => a + c.charCodeAt(0),
                                    0,
                                  ),
                                ) % 8
                              ],
                          }}
                        />
                        <span className="text-sm">{s.type}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {bytesToHuman(s.bytes)}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && !data && (
        <div className="p-4 text-sm text-gray-500">No analytics available.</div>
      )}
    </section>
  );
}
