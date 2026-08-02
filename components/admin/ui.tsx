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
        <h2 className="text-2xl font-bold leading-7 text-white sm:truncate sm:text-3xl sm:tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
            <div className="mt-2 flex items-center text-sm text-slate-400">
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
    <div className="bg-red-500/10 border border-red-200 rounded-lg p-4">
      <div className="flex items-center">
        <AlertTriangle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
        <span className="text-red-700">{message}</span>
      </div>
    </div>
  );
}

export function LoadingSpinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center h-64 flex-col gap-3">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      {label && <p className="text-sm text-slate-400">{label}</p>}
    </div>
  );
}

export function TableLoading({ colSpan }: { colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-12 text-center">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </td>
    </tr>
  );
}

export function TableEmpty({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-12 text-center text-slate-400">
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
    default: "bg-slate-800/50 text-slate-100",
    admin: "bg-red-100 text-red-800",
    active: "bg-green-100 text-green-800",
    inactive: "bg-slate-800/50 text-slate-100",
    info: "bg-blue-100 text-blue-800",
  };
  return (
    <span
      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${tones[tone]}`}
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
        <Search className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full pl-10 pr-3 py-2 border border-slate-600/50 rounded-md leading-5 bg-slate-800/80 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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
      className="block w-full px-3 py-2 border border-slate-600/50 rounded-md bg-slate-800/80 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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
      className="inline-flex items-center px-3 py-2 border border-slate-600/50 shadow-sm shadow-black/10 text-sm leading-4 font-medium rounded-md text-slate-200 bg-slate-800/50 hover:bg-slate-800/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
    <div className="px-6 py-3 border-t border-slate-700/50 bg-slate-800/30">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-slate-200">
          {t.common.activeFilters}
        </span>
        {searchTerm && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {`${t.common.searchBy} "${searchTerm}"`}
          </span>
        )}
        {chips.map((chip, i) => (
          <span
            key={i}
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${chip.className}`}
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
    <div className="bg-slate-800/50 px-4 py-3 flex items-center justify-between border-t border-slate-700/50 sm:px-6">
      <div className="flex-1 flex justify-between sm:hidden">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPrev}
          className="relative inline-flex items-center px-4 py-2 border border-slate-600/50 text-sm font-medium rounded-md text-slate-200 bg-slate-800/50 hover:bg-slate-800/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t.common.previous}
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNext}
          className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-600/50 text-sm font-medium rounded-md text-slate-200 bg-slate-800/50 hover:bg-slate-800/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t.common.next}
        </button>
      </div>
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-200">
            {t.common.showing}{" "}
            <span className="font-medium">{from}</span> {t.common.to}{" "}
            <span className="font-medium">{to}</span> {t.common.of}{" "}
            <span className="font-medium">{totalItems}</span> {label}
          </p>
        </div>
        <div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm shadow-black/10 -space-x-px">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={!hasPrev}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-600/50 bg-slate-800/50 text-sm font-medium text-slate-400 hover:bg-slate-800/30 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    pageNum === currentPage
                      ? "z-10 bg-blue-500/10 border-blue-500 text-indigo-400"
                      : "bg-slate-800/50 border-slate-600/50 text-slate-400 hover:bg-slate-800/30"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={!hasNext}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-600/50 bg-slate-800/50 text-sm font-medium text-slate-400 hover:bg-slate-800/30 disabled:opacity-50 disabled:cursor-not-allowed"
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
    <div className="modal-overlay fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div
        className={`relative top-10 mx-auto p-6 border w-full ${maxWidth} shadow-lg shadow-black/20 rounded-md bg-slate-800/50`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
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
    <div className="modal-overlay fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 max-w-[90vw] shadow-lg shadow-black/20 rounded-md bg-slate-800/50">
        <div className="mt-3 text-center">
          <div
            className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${
              danger ? "bg-red-100" : "bg-blue-100"
            }`}
          >
            {icon}
          </div>
          <h3 className="text-lg font-medium text-white mt-5">{title}</h3>
          <div className="mt-2 px-7 py-3">
            <div className="text-sm text-slate-400">{message}</div>
          </div>
          <div className="items-center px-4 py-3">
            <div className="flex space-x-3 justify-center">
              <button
                onClick={onConfirm}
                className={`px-4 py-2 ${
                  danger ? "bg-red-500 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
                } text-white text-base font-medium rounded-md shadow-sm shadow-black/10 focus:outline-none focus:ring-2 focus:ring-red-300`}
              >
                {confirmLabel}
              </button>
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md shadow-sm shadow-black/10 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300"
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
