"use client";

import { useState, useEffect } from "react";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderPlus,
  MoreVertical,
  Edit2,
  Trash2,
  Expand,
  Minimize2,
} from "lucide-react";

interface FolderData {
  id: string;
  name: string;
  parent: string | null;
  createdAt: string;
  children?: FolderData[];
}

interface FolderTreeProps {
  folders: FolderData[];
  selectedFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
  onCreateFolder: (parentId: string | null) => void;
  onRenameFolder: (folderId: string, newName: string) => void;
  onDeleteFolder: (folderId: string) => void;
  loading?: boolean;
  expandAll?: boolean;
  onExpandAllChange?: (expanded: boolean) => void;
}

interface FolderItemProps {
  folder: FolderData;
  level: number;
  selectedFolderId: string | null;
  onSelect: (folderId: string) => void;
  onCreateChild: (parentId: string) => void;
  onRename: (folderId: string, newName: string) => void;
  onDelete: (folderId: string) => void;
  expandAll?: boolean;
}

function FolderItem({
  folder,
  level,
  selectedFolderId,
  onSelect,
  onCreateChild,
  onRename,
  onDelete,
  expandAll = false,
}: FolderItemProps) {
  const isSelected = selectedFolderId === folder.id;

  // Check if this folder or any descendant is selected
  const isPathToSelected = (): boolean => {
    if (!selectedFolderId) return false;
    if (isSelected) return true;

    const checkChildren = (children: FolderData[]): boolean => {
      return children.some(child => {
        if (child.id === selectedFolderId) return true;
        if (child.children && child.children.length > 0) {
          return checkChildren(child.children);
        }
        return false;
      });
    };

    return folder.children ? checkChildren(folder.children) : false;
  };

  // Auto expand if this folder contains the selected folder
  const [isExpanded, setIsExpanded] = useState(true);

  // Update expansion when selected folder changes or expandAll changes
  useEffect(() => {
    if (isPathToSelected()) {
      setIsExpanded(true);
    } else if (expandAll !== undefined) {
      setIsExpanded(expandAll);
    }
  }, [selectedFolderId, expandAll]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(folder.name);

  const hasChildren = folder.children && folder.children.length > 0;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleSelect = () => {
    onSelect(folder.id);
  };

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  const handleRename = () => {
    setIsRenaming(true);
    setIsMenuOpen(false);
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim() && newName.trim() !== folder.name) {
      onRename(folder.id, newName.trim());
    }
    setIsRenaming(false);
  };

  const handleRenameCancel = () => {
    setNewName(folder.name);
    setIsRenaming(false);
  };

  const handleDelete = () => {
    if (
      confirm(`Are you sure you want to delete the folder "${folder.name}"?`)
    ) {
      onDelete(folder.id);
    }
    setIsMenuOpen(false);
  };

  const handleCreateChild = () => {
    onCreateChild(folder.id);
    setIsMenuOpen(false);
  };

  return (
    <div>
      <div
        className={`group relative flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
          isSelected
            ? "bg-blue-100 text-blue-800"
            : "text-gray-700 hover:bg-gray-100"
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleSelect}
      >
        {/* Expand/Collapse Button */}
        <button
          onClick={handleToggle}
          className={`flex-shrink-0 w-4 h-4 flex items-center justify-center ${
            hasChildren ? "text-gray-500 hover:text-gray-700" : "invisible"
          }`}
        >
          {hasChildren &&
            (isExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            ))}
        </button>

        {/* Folder Icon */}
        <Folder className="w-4 h-4 flex-shrink-0 text-blue-500" />

        {/* Folder Name */}
        {isRenaming ? (
          <form onSubmit={handleRenameSubmit} className="flex-1 min-w-0">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={handleRenameCancel}
              className="w-full px-1 py-0.5 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  handleRenameCancel();
                }
              }}
            />
          </form>
        ) : (
          <span className="flex-1 min-w-0 text-sm font-medium truncate">
            {folder.name}
          </span>
        )}

        {/* Menu Button */}
        {!isRenaming && (
          <div className="relative">
            <button
              onClick={handleMenuToggle}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-200 transition-opacity"
            >
              <MoreVertical className="w-3 h-3" />
            </button>

            {/* Context Menu */}
            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                <button
                  onClick={handleCreateChild}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 first:rounded-t-md"
                >
                  <FolderPlus className="w-4 h-4" />
                  New Folder
                </button>
                <button
                  onClick={handleRename}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Edit2 className="w-4 h-4" />
                  Rename
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 last:rounded-b-md"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {folder.children!.map((child) => (
            <FolderItem
              key={child.id}
              folder={child}
              level={level + 1}
              selectedFolderId={selectedFolderId}
              onSelect={onSelect}
              onCreateChild={onCreateChild}
              onRename={onRename}
              onDelete={onDelete}
              expandAll={expandAll}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FolderTree({
  folders,
  selectedFolderId,
  onFolderSelect,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  loading = false,
  expandAll = true,
  onExpandAllChange,
}: FolderTreeProps) {
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    show: boolean;
  }>({ x: 0, y: 0, show: false });

  // Build folder tree structure
  const buildTree = (folders: FolderData[]): FolderData[] => {
    const folderMap = new Map<string, FolderData>();
    const rootFolders: FolderData[] = [];

    // Initialize all folders with empty children arrays
    folders.forEach((folder) => {
      folderMap.set(folder.id, { ...folder, children: [] });
    });

    // Build the tree structure
    folders.forEach((folder) => {
      const folderNode = folderMap.get(folder.id)!;

      if (folder.parent) {
        const parent = folderMap.get(folder.parent);
        if (parent) {
          parent.children!.push(folderNode);
        }
      } else {
        rootFolders.push(folderNode);
      }
    });

    // Sort folders by name
    const sortFolders = (folders: FolderData[]) => {
      folders.sort((a, b) => a.name.localeCompare(b.name));
      folders.forEach((folder) => {
        if (folder.children) {
          sortFolders(folder.children);
        }
      });
    };

    sortFolders(rootFolders);
    return rootFolders;
  };

  const folderTree = buildTree(folders);

  const handleRootContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      show: true,
    });
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClick = () => {
      setContextMenu((prev) => ({ ...prev, show: false }));
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  if (loading) {
    return (
      <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-3"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-6 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-gray-900">Folders</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onExpandAllChange?.(!expandAll)}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
              title={expandAll ? "Collapse all" : "Expand all"}
            >
              {expandAll ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Expand className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => onCreateFolder(null)}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
              title="Create new folder"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Folder Tree */}
      <div
        className="flex-1 p-2 overflow-y-auto"
        onContextMenu={handleRootContextMenu}
      >
        {/* Root folder */}
        <div
          className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors mb-2 ${
            selectedFolderId === null
              ? "bg-blue-100 text-blue-800"
              : "text-gray-700 hover:bg-gray-100"
          }`}
          onClick={() => onFolderSelect(null)}
        >
          <Folder className="w-4 h-4 flex-shrink-0 text-blue-500" />
          <span className="flex-1 text-sm font-medium">All Files</span>
        </div>

        {/* Folder tree */}
        {folderTree.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Folder className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No folders yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Create your first folder to organize files
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {folderTree.map((folder) => (
              <FolderItem
                key={folder.id}
                folder={folder}
                level={0}
                selectedFolderId={selectedFolderId}
                onSelect={onFolderSelect}
                onCreateChild={onCreateFolder}
                onRename={onRenameFolder}
                onDelete={onDeleteFolder}
                expandAll={expandAll}
              />
            ))}
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu.show && (
        <div
          className="fixed bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
        >
          <button
            onClick={() => {
              onCreateFolder(null);
              setContextMenu((prev) => ({ ...prev, show: false }));
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            <FolderPlus className="w-4 h-4" />
            New Folder
          </button>
        </div>
      )}
    </div>
  );
}
