/**
 * Folder Tree Utilities
 * Helper functions for building and managing folder hierarchies
 */

export interface FolderDocument {
  _id: string;
  name: string;
  parentFolderId: string | null;
  path: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

export interface FolderTreeNode extends FolderDocument {
  children: FolderTreeNode[];
  fileCount?: number;
  level: number;
}

export interface FileDocument {
  _id: string;
  filename: string;
  folderId: string | null;
  userId: string;
  size: number;
  uploadDate: Date;
  isDeleted: boolean;
}

/**
 * Build hierarchical folder tree from flat array
 */
export function buildFolderTree(
  folders: FolderDocument[],
  parentId: string | null = null,
  level: number = 0
): FolderTreeNode[] {
  const children = folders
    .filter(folder => folder.parentFolderId === parentId)
    .map(folder => ({
      ...folder,
      children: buildFolderTree(folders, folder._id, level + 1),
      level,
      fileCount: 0 // Will be populated separately
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return children;
}

/**
 * Generate folder path based on parent hierarchy
 */
export async function generateFolderPath(
  parentFolderId: string | null,
  folderName: string,
  getFolderById: (id: string) => Promise<FolderDocument | null>
): Promise<string> {
  if (!parentFolderId) {
    return `/${folderName}`;
  }

  const parentFolder = await getFolderById(parentFolderId);
  if (!parentFolder) {
    return `/${folderName}`;
  }

  return `${parentFolder.path}/${folderName}`;
}

/**
 * Update folder paths when parent folder is renamed or moved
 */
export async function updateChildrenPaths(
  folderId: string,
  newPath: string,
  getAllFolders: () => Promise<FolderDocument[]>,
  updateFolder: (id: string, updates: Partial<FolderDocument>) => Promise<void>
): Promise<void> {
  const allFolders = await getAllFolders();
  const children = allFolders.filter(f => f.parentFolderId === folderId);

  for (const child of children) {
    const childNewPath = `${newPath}/${child.name}`;
    await updateFolder(child._id, { path: childNewPath });

    // Recursively update grandchildren
    await updateChildrenPaths(
      child._id,
      childNewPath,
      getAllFolders,
      updateFolder
    );
  }
}

/**
 * Validate folder operations
 */
export class FolderValidator {
  static validateFolderName(name: string): string | null {
    if (!name || name.trim().length === 0) {
      return "Folder name cannot be empty";
    }

    if (name.length > 100) {
      return "Folder name too long (max 100 characters)";
    }

    // Check for invalid characters
    const invalidChars = /[<>:"/\\|?*]/g;
    if (invalidChars.test(name)) {
      return "Folder name contains invalid characters";
    }

    // Reserved names
    const reservedNames = ['con', 'prn', 'aux', 'null', 'com1', 'com2', 'com3', 'com4', 'com5', 'com6', 'com7', 'com8', 'com9', 'lpt1', 'lpt2', 'lpt3', 'lpt4', 'lpt5', 'lpt6', 'lpt7', 'lpt8', 'lpt9'];
    if (reservedNames.includes(name.toLowerCase())) {
      return "Folder name is reserved";
    }

    return null; // Valid
  }

  static async validateFolderOperation(
    operation: 'create' | 'move' | 'rename',
    folderId: string | null,
    parentFolderId: string | null,
    newName: string,
    userId: string,
    getAllFolders: () => Promise<FolderDocument[]>
  ): Promise<string | null> {
    // Validate folder name
    const nameError = this.validateFolderName(newName);
    if (nameError) return nameError;

    const allFolders = await getAllFolders();

    // Check for duplicate names in same parent
    const siblings = allFolders.filter(f =>
      f.parentFolderId === parentFolderId &&
      f._id !== folderId &&
      f.userId === userId &&
      !f.isDeleted
    );

    const duplicateName = siblings.find(f =>
      f.name.toLowerCase() === newName.toLowerCase()
    );

    if (duplicateName) {
      return "A folder with this name already exists in the parent folder";
    }

    // Prevent moving folder into its own subtree (circular reference)
    if (operation === 'move' && folderId && parentFolderId) {
      const isCircular = await this.wouldCreateCircularReference(
        folderId,
        parentFolderId,
        allFolders
      );
      if (isCircular) {
        return "Cannot move folder into its own subtree";
      }
    }

    return null; // Valid
  }

  private static async wouldCreateCircularReference(
    folderId: string,
    newParentId: string,
    allFolders: FolderDocument[]
  ): Promise<boolean> {
    let currentId: string | null = newParentId;

    while (currentId) {
      if (currentId === folderId) {
        return true; // Circular reference detected
      }

      const parent = allFolders.find(f => f._id === currentId);
      currentId = parent?.parentFolderId || null;
    }

    return false;
  }
}

/**
 * Folder statistics and analytics
 */
export class FolderStats {
  static async calculateFolderStats(
    folderId: string | null,
    folders: FolderDocument[],
    files: FileDocument[]
  ): Promise<{
    fileCount: number;
    totalSize: number;
    subfolderCount: number;
    lastModified: Date | null;
  }> {
    // Get all descendant folders
    const descendantIds = this.getDescendantFolderIds(folderId, folders);
    descendantIds.push(folderId); // Include the folder itself

    // Filter files in this folder and its descendants
    const folderFiles = files.filter(f =>
      descendantIds.includes(f.folderId) && !f.isDeleted
    );

    // Get direct subfolders only
    const directSubfolders = folders.filter(f =>
      f.parentFolderId === folderId && !f.isDeleted
    );

    const totalSize = folderFiles.reduce((sum, file) => sum + file.size, 0);
    const lastModified = folderFiles.length > 0
      ? new Date(Math.max(...folderFiles.map(f => f.uploadDate.getTime())))
      : null;

    return {
      fileCount: folderFiles.length,
      totalSize,
      subfolderCount: directSubfolders.length,
      lastModified
    };
  }

  private static getDescendantFolderIds(
    parentId: string | null,
    folders: FolderDocument[]
  ): (string | null)[] {
    const children = folders.filter(f => f.parentFolderId === parentId);
    let descendants: (string | null)[] = [];

    for (const child of children) {
      descendants.push(child._id);
      descendants = descendants.concat(
        this.getDescendantFolderIds(child._id, folders)
      );
    }

    return descendants;
  }
}

/**
 * Folder breadcrumb utilities
 */
export function generateBreadcrumb(
  currentFolderId: string | null,
  folders: FolderDocument[]
): Array<{ id: string | null; name: string; path: string }> {
  if (!currentFolderId) {
    return [{ id: null, name: 'Root', path: '/' }];
  }

  const breadcrumb: Array<{ id: string | null; name: string; path: string }> = [];
  let currentId: string | null = currentFolderId;

  while (currentId) {
    const folder = folders.find(f => f._id === currentId);
    if (!folder) break;

    breadcrumb.unshift({
      id: folder._id,
      name: folder.name,
      path: folder.path
    });

    currentId = folder.parentFolderId;
  }

  // Add root at the beginning
  breadcrumb.unshift({
    id: null,
    name: 'Root',
    path: '/'
  });

  return breadcrumb;
}

/**
 * Search folders with fuzzy matching
 */
export function searchFolders(
  folders: FolderDocument[],
  query: string,
  options: {
    includeFullPath?: boolean;
    caseSensitive?: boolean;
    maxResults?: number;
  } = {}
): FolderDocument[] {
  const {
    includeFullPath = true,
    caseSensitive = false,
    maxResults = 50
  } = options;

  const searchTerm = caseSensitive ? query : query.toLowerCase();

  const matches = folders.filter(folder => {
    if (folder.isDeleted) return false;

    const folderName = caseSensitive ? folder.name : folder.name.toLowerCase();
    const folderPath = caseSensitive ? folder.path : folder.path.toLowerCase();

    // Exact name match gets highest priority
    if (folderName.includes(searchTerm)) return true;

    // Full path search if enabled
    if (includeFullPath && folderPath.includes(searchTerm)) return true;

    return false;
  });

  // Sort by relevance (name matches first, then path matches)
  matches.sort((a, b) => {
    const aName = caseSensitive ? a.name : a.name.toLowerCase();
    const bName = caseSensitive ? b.name : b.name.toLowerCase();

    const aNameMatch = aName.includes(searchTerm);
    const bNameMatch = bName.includes(searchTerm);

    if (aNameMatch && !bNameMatch) return -1;
    if (!aNameMatch && bNameMatch) return 1;

    // Both match, sort by name
    return a.name.localeCompare(b.name);
  });

  return matches.slice(0, maxResults);
}

/**
 * Export folder structure to JSON
 */
export function exportFolderStructure(
  folders: FolderDocument[],
  files: FileDocument[]
): object {
  const tree = buildFolderTree(folders);

  function addFilesToNode(node: FolderTreeNode): any {
    const nodeFiles = files.filter(f =>
      f.folderId === node._id && !f.isDeleted
    );

    return {
      ...node,
      files: nodeFiles.map(f => ({
        id: f._id,
        name: f.filename,
        size: f.size,
        uploadDate: f.uploadDate
      })),
      children: node.children.map(child => addFilesToNode(child))
    };
  }

  return {
    exportDate: new Date().toISOString(),
    totalFolders: folders.filter(f => !f.isDeleted).length,
    totalFiles: files.filter(f => !f.isDeleted).length,
    structure: tree.map(node => addFilesToNode(node))
  };
}
