"use client";

import React from "react";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  X,
  Search,
  Filter,
} from "lucide-react";
import { getDict, Lang } from "./i18n";

export const formatFileSize = (bytes: number): string => {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export const formatDate = (
  dateString: string | null | undefined,
  lang: Lang,
): string => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString(
    lang === "vi" ? "vi-VN" : "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  );
};

export function PageHeader({
  title,
  icon,
  subtitle,
  actions,
}: {
  title: string;
  icon?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="md:flex md:items-center md:justify-between">
      <div className="min-w-0 flex-1">
        <h2 className="text-2xl font-bold leading-7 text-foreground sm:truncate sm:text-3xl sm:tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
            <div className="mt-2 flex items-center gap-2 text-sm text-sub">
              {icon}
              {subtitle}
            </div>
          </div>
        )}
      </div>
      {actions && <div className="mt-4 flex flex-wrap gap-3 md:ml-4 md:mt-0">{actions}</div>}
    </div>
  );
}

export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="bg-error/10 border border-error/30 rounded-xl p-4">
      <div className="flex items-center">
        <AlertTriangle className="h-5 w-5 text-error mr-2 flex-shrink-0" />
        <span className="text-sm text-error font-medium">{message}</span>
      </div>
    </div>
  );
}

export function LoadingSpinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center h-64 flex-col gap-4">
      <div className="w-8 h-8 rounded-full border-2 border-line border-t-accent animate-spin"></div>
      {label && <p className="text-sm text-sub">{label}</p>}
    </div>
  );
}

export function TableLoading({ colSpan }: { colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-12 text-center">
        <div className="flex justify-center">
          <div className="w-7 h-7 rounded-full border-2 border-line border-t-accent animate-spin"></div>
        </div>
      </td>
    </tr>
  );
}

export function TableEmpty({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-12 text-center text-sub">
        {message}
      </td>
    </tr>
  );
}

export function Badge({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "admin" | "active" | "inactive" | "info";
}) {
  const tones: Record<string, string> = {
    default: "bg-sub/10 text-sub border border-line",
    admin: "bg-error/10 text-error border border-error/25",
    active: "bg-success/10 text-success border border-success/25",
    inactive: "bg-sub/10 text-sub border border-line",
    info: "bg-accent/10 text-accent border border-accent/25",
  };
  return (
    <span
      className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-muted" />
      </div>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full pl-10 pr-3 py-2 border border-line rounded-lg leading-5 bg-card placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
      />
    </div>
  );
}

export function SelectFilter({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="block w-full px-3 py-2 border border-line rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export function ResetFiltersButton({
  lang,
  onClick,
  disabled,
}: {
  lang: Lang;
  onClick: () => void;
  disabled?: boolean;
}) {
  const t = getDict(lang);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center px-3.5 py-2 border border-line rounded-lg text-sm leading-4 font-medium text-foreground bg-card hover:bg-card-hover focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Filter className="mr-2 h-4 w-4" />
      {t.common.resetFilters}
    </button>
  );
}

export function ActiveFilterChips({
  lang,
  searchTerm,
  chips,
}: {
  lang: Lang;
  searchTerm?: string;
  chips: { label: string; className: string }[];
}) {
  const t = getDict(lang);
  return (
    <div className="px-6 py-3 border-t border-line bg-background/50">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-foreground">
          {t.common.activeFilters}
        </span>
        {searchTerm && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent border border-accent/25">
            {`${t.common.searchBy} "${searchTerm}"`}
          </span>
        )}
        {chips.map((chip, i) => (
          <span
            key={i}
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${chip.className}`}
          >
            {chip.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Pagination({
  lang,
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  label,
  onPageChange,
}: {
  lang: Lang;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  label: string;
  onPageChange: (page: number) => void;
}) {
  const t = getDict(lang);
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;
  const from = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="bg-card px-4 py-3 flex items-center justify-between border-t border-line sm:px-6">
      <div className="flex-1 flex justify-between sm:hidden">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPrev}
          className="relative inline-flex items-center px-4 py-2 border border-line text-sm font-medium rounded-lg text-foreground bg-card hover:bg-card-hover disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t.common.previous}
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNext}
          className="ml-3 relative inline-flex items-center px-4 py-2 border border-line text-sm font-medium rounded-lg text-foreground bg-card hover:bg-card-hover disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t.common.next}
        </button>
      </div>
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-sub">
            {t.common.showing}{" "}
            <span className="font-medium text-foreground">{from}</span> {t.common.to}{" "}
            <span className="font-medium text-foreground">{to}</span> {t.common.of}{" "}
            <span className="font-medium text-foreground">{totalItems}</span> {label}
          </p>
        </div>
        <div>
          <nav className="relative z-0 inline-flex rounded-lg border border-line -space-x-px overflow-hidden">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={!hasPrev}
              className="relative inline-flex items-center px-2.5 py-2 bg-card text-sm font-medium text-sub hover:bg-card-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, currentPage - 2) + i;
              if (pageNum > totalPages) return null;
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-medium border-l border-line ${
                    pageNum === currentPage
                      ? "bg-accent/10 text-accent"
                      : "bg-card text-sub hover:bg-card-hover"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={!hasNext}
              className="relative inline-flex items-center px-2.5 py-2 border-l border-line bg-card text-sm font-medium text-sub hover:bg-card-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = "max-w-md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <div className="min-h-full flex items-start justify-center p-6">
        <div
          className={`relative w-full ${maxWidth} border border-line rounded-xl bg-card shadow-xl`}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-line">
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-foreground hover:bg-card-hover transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="px-6 py-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  onCancel,
  onConfirm,
  icon,
  title,
  message,
  confirmLabel,
  cancelLabel,
  danger = true,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  icon: React.ReactNode;
  title: string;
  message: React.ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  danger?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="min-h-full flex items-center justify-center p-6">
        <div className="relative w-full max-w-sm border border-line rounded-xl bg-card shadow-xl p-6">
          <div className="text-center">
            <div
              className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full border ${
                danger
                  ? "bg-error/10 border-error/25 text-error"
                  : "bg-accent/10 border-accent/25 text-accent"
              }`}
            >
              {icon}
            </div>
            <h3 className="text-lg font-semibold text-foreground mt-4">{title}</h3>
            <div className="mt-2 px-2">
              <div className="text-sm text-sub">{message}</div>
            </div>
            <div className="flex justify-center gap-3 mt-6">
              <button
                onClick={onConfirm}
                className={`px-5 py-2.5 ${
                  danger ? "btn-danger" : "btn-primary"
                } text-sm font-medium rounded-lg`}
              >
                {confirmLabel}
              </button>
              <button
                onClick={onCancel}
                className="px-5 py-2.5 btn-secondary text-sm font-medium rounded-lg"
              >
                {cancelLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
