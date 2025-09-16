"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FolderPlus,
  Upload,
  RefreshCw,
  AlertCircle,
  Menu,
  X,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import PlainFolderTree from "@/components/PlainFolderTree";
import FileGrid from "@/components/FileGrid";
import UploadDropzone from "@/components/UploadDropzone";
import UserProfile from "@/components/UserProfile";
import Footer from "@/components/Footer";

interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  stats?: {
    totalFiles: number;
    totalSize: number;
    totalFolders: number;
  };
}

interface FolderData {
  id: string;
  name: string;
  parent: string | null;
  createdAt: string;
}

interface FileData {
  id: string;
  name: string;
  size: number;
  mime: string;
  folderId: string | null;
  folderName?: string | null;
  createdAt: string;
}

interface FilesResponse {
  files: FileData[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [folders, setFolders] = useState<FolderData[]>([]);
  const [files, setFiles] = useState<FileData[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filesLoading, setFilesLoading] = useState(false);
  const [foldersLoading, setFoldersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandAll, setExpandAll] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showUpload, setShowUpload] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [createFolderParent, setCreateFolderParent] = useState<string | null>(
    null,
  );
  const [newFolderName, setNewFolderName] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();

  // Check authentication
  useEffect(() => {
    checkAuth();
  }, []);

  // Load files when folder selection or search changes
  useEffect(() => {
    if (user) {
      loadFiles();
    }
  }, [user, selectedFolderId, searchQuery]);

  // Load folders when user is available
  useEffect(() => {
    if (user) {
      loadFolders();
    }
  }, [user]);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        router.push("/login");
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const loadFolders = async () => {
    try {
      setFoldersLoading(true);
      const response = await fetch("/api/folders");
      if (response.ok) {
        const data = await response.json();
        setFolders(data);
      } else {
        throw new Error("Failed to load folders");
      }
    } catch (error) {
      console.error("Error loading folders:", error);
      setError("Failed to load folders");
    } finally {
      setFoldersLoading(false);
    }
  };

  const loadFiles = async () => {
    try {
      setFilesLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (selectedFolderId) {
        params.set("folderId", selectedFolderId);
      }
      if (searchQuery) {
        params.set("q", searchQuery);
      }

      const response = await fetch(`/api/files?${params}`);
      if (response.ok) {
        const data: FilesResponse = await response.json();
        setFiles(data.files);
      } else {
        throw new Error("Failed to load files");
      }
    } catch (error) {
      console.error("Error loading files:", error);
      setError("Failed to load files");
    } finally {
      setFilesLoading(false);
    }
  };

  const refreshData = useCallback(() => {
    loadFiles();
    loadFolders();
  }, []);

  const handleFolderSelect = useCallback((folderId: string | null) => {
    setSelectedFolderId(folderId);
    setSearchQuery(""); // Clear search when selecting folder
  }, []);

  const handleCreateFolder = useCallback((parentId: string | null) => {
    setCreateFolderParent(parentId);
    setNewFolderName("");
    setShowCreateFolder(true);
  }, []);

  const confirmCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const response = await fetch("/api/folders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newFolderName.trim(),
          parent: createFolderParent,
        }),
      });

      if (response.ok) {
        await loadFolders();
        setShowCreateFolder(false);
        setNewFolderName("");
      } else {
        const data = await response.json();
        alert(data.error || "Failed to create folder");
      }
    } catch (error) {
      console.error("Error creating folder:", error);
      alert("Failed to create folder");
    }
  };

  const handleRenameFolder = async (folderId: string, newName: string) => {
    try {
      const response = await fetch(`/api/folders/${folderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newName }),
      });

      if (response.ok) {
        await loadFolders();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to rename folder");
      }
    } catch (error) {
      console.error("Error renaming folder:", error);
      alert("Failed to rename folder");
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    try {
      const folder = folders.find((f) => f.id === folderId);
      if (!folder) {
        alert("Folder not found");
        return;
      }

      const countSubfolders = (
        folders: FolderData[],
        parentId: string,
      ): number => {
        const children = folders.filter((f) => f.parent === parentId);
        return (
          children.length +
          children.reduce(
            (sum, child) => sum + countSubfolders(folders, child.id),
            0,
          )
        );
      };

      const subfolderCount = countSubfolders(folders, folderId);

      let confirmMessage = `⚠️ DELETE FOLDER: "${folder.name}"\n\n`;
      confirmMessage += `This will permanently delete:\n`;
      confirmMessage += `• The folder "${folder.name}"\n`;

      if (subfolderCount > 0) {
        confirmMessage += `• ${subfolderCount} subfolder(s)\n`;
      }

      confirmMessage += `• All files in this folder and subfolders\n\n`;
      confirmMessage += `❌ This action CANNOT be undone!\n\n`;
      confirmMessage += `Are you sure you want to continue?`;

      if (!confirm(confirmMessage)) {
        return;
      }

      alert("Deleting folder and contents... This may take a moment.");

      const response = await fetch(`/api/folders/${folderId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const data = await response.json();
        const stats = data.stats;
        let message = `✅ Folder deleted successfully!\n\n`;
        message += `📊 Deletion Summary:\n`;
        message += `• Folders deleted: ${stats.foldersDeleted}\n`;
        message += `• Files deleted: ${stats.filesDeleted}`;

        if (stats.errors && stats.errors.length > 0) {
          message += `\n\n⚠️ Warnings:\n${stats.errors.join("\n")}`;
        }

        alert(message);
        await loadFolders();
        await loadFiles();

        if (selectedFolderId === folderId) {
          setSelectedFolderId(null);
        }
      } else {
        const data = await response.json();
        alert(`❌ Failed to delete folder: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error deleting folder:", error);
      alert("❌ Failed to delete folder: Network error");
    }
  };

  const handleUserUpdate = (updatedUser: User) => {
    setUser(updatedUser);
    loadFiles();
    loadFolders();
  };

  const handleUpload = async (files: File[], folderId?: string | null) => {
    const uploadPromises = files.map(async (file) => {
      const formData = new FormData();
      formData.append("file", file);
      if (folderId !== undefined) {
        formData.append("folderId", folderId || "");
      } else if (selectedFolderId) {
        formData.append("folderId", selectedFolderId);
      }

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to upload ${file.name}`);
      }

      return response.json();
    });

    try {
      await Promise.all(uploadPromises);
      await loadFiles();
      setShowUpload(false);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Some files failed to upload. Please try again.");
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm("Are you sure you want to delete this file?")) {
      return;
    }

    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await loadFiles();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete file");
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      alert("Failed to delete file");
    }
  };

  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/files/${fileId}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await response.json();
        alert(data.error || "Failed to download file");
      }
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to download file");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const selectedFolder = folders.find((f) => f.id === selectedFolderId);

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <Navbar user={user} />

      <div className="flex-1 flex overflow-hidden h-full">
        {/* Sidebar */}
        <div
          className={`${sidebarOpen ? "w-80" : "w-16"} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col min-h-0`}
        >
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              {sidebarOpen && (
                <h2 className="text-lg font-semibold text-gray-900">Folders</h2>
              )}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {sidebarOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {sidebarOpen && (
            <div className="flex-1 overflow-y-auto p-4 min-h-0">
              {foldersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              ) : (
                <PlainFolderTree
                  folders={folders}
                  selectedFolderId={selectedFolderId}
                  onFolderSelect={handleFolderSelect}
                  onCreateFolder={handleCreateFolder}
                  onRenameFolder={handleRenameFolder}
                  onDeleteFolder={handleDeleteFolder}
                  expandAll={expandAll}
                />
              )}
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedFolder ? `${selectedFolder.name}` : "All Files"}
                  {searchQuery && ` - "${searchQuery}"`}
                </h1>
                <p className="text-gray-600">Welcome back, {user.name}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={refreshData}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  disabled={filesLoading || foldersLoading}
                >
                  <RefreshCw
                    className={`w-4 h-4 ${filesLoading || foldersLoading ? "animate-spin" : ""}`}
                  />
                  Refresh
                </button>

                <button
                  onClick={() => setShowUpload(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Upload
                </button>

                <button
                  onClick={() => handleCreateFolder(selectedFolderId)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <FolderPlus className="w-4 h-4" />
                  New Folder
                </button>

                <button
                  onClick={() => setShowUserProfile(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Profile
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="mt-4">
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600">{files.length} files</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    viewMode === "grid"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    viewMode === "list"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  List
                </button>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                ✕
              </button>
            </div>
          )}

          {/* File Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {filesLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  {searchQuery
                    ? `No files found matching "${searchQuery}"`
                    : selectedFolder
                      ? "This folder is empty"
                      : "No files uploaded yet"}
                </p>
              </div>
            ) : (
              <FileGrid
                files={files}
                loading={filesLoading}
                onDownload={handleDownload}
                onDelete={handleDeleteFile}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
              />
            )}
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Upload Files
                </h3>
                <button
                  onClick={() => setShowUpload(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6">
              <UploadDropzone
                onUpload={(files) => handleUpload(files, selectedFolderId)}
                folderId={selectedFolderId}
              />
            </div>
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      {showUserProfile && user && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  User Profile
                </h3>
                <button
                  onClick={() => setShowUserProfile(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6">
              <UserProfile
                isOpen={showUserProfile}
                onClose={() => setShowUserProfile(false)}
                user={user}
                onUserUpdate={handleUserUpdate}
              />
            </div>
          </div>
        </div>
      )}

      {/* Create Folder Modal */}
      {showCreateFolder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Create New Folder
              </h3>
            </div>
            <div className="p-6">
              <input
                type="text"
                placeholder="Folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                onKeyPress={(e) => e.key === "Enter" && confirmCreateFolder()}
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowCreateFolder(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmCreateFolder}
                  disabled={!newFolderName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
