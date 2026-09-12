import { escapeRegex } from "@/lib/file-utils";
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import {
  requireAdmin,
  AuthError,
  createAuthResponse,
  validateOrigin,
  createCsrfError,
} from "@/lib/auth";
import { User, type IUser } from "@/models/User";
import { File } from "@/models/File";
import { Folder } from "@/models/Folder";
import { logAction } from "@/lib/activity-log";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import type { FilterQuery } from "mongoose";

interface UserStatsRow {
  id: string;
  totalFilesUploaded: number;
  totalStorageUsed: number;
  totalFolders: number;
  [key: string]: unknown;
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    await requireAdmin(request);

    // Connect to database
    await connectToDatabase();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const status = searchParams.get("status") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build query
    const query: FilterQuery<IUser> = {};

    if (search) {
      query.$or = [
        { name: { $regex: escapeRegex(search), $options: "i" } },
        { email: { $regex: escapeRegex(search), $options: "i" } },
      ];
    }

    if (role && role !== "all") {
      query.role = role;
    }

    if (status && status !== "all") {
      if (status === "active") {
        query.isActive = true;
      } else if (status === "inactive") {
        query.isActive = false;
      }
    }

    // Calculate skip value
    const skip = (page - 1) * limit;

    // Build sort object
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Check if sorting by computed fields (totalFiles, totalStorageUsed, totalFolders)
    const isComputedSort = [
      "totalFilesUploaded",
      "totalStorageUsed",
      "totalFolders",
    ].includes(sortBy);

    let users;
    let usersWithStats: UserStatsRow[];
    // Set when a computed-column sort had to work from a capped candidate set.
    let sortTruncated = false;
    let sortCandidates = 0;
    let sortTotalMatching = 0;

    if (isComputedSort) {
      // Sorting by a computed column (file/folder counts) needs every matching
      // user in memory, because the value comes from an aggregation rather than
      // a field Mongo can sort on. That is inherently unbounded, so cap the
      // candidate set and tell the caller when it was truncated instead of
      // silently loading an entire user table into one request.
      const COMPUTED_SORT_ROW_CAP = 5000;

      const totalMatching = await User.countDocuments(query);
      const truncated = totalMatching > COMPUTED_SORT_ROW_CAP;

      const allUsers = await User.find(query)
        .select("-passwordHash")
        // Newest first, so a truncated set is the most relevant slice.
        .sort({ createdAt: -1 })
        .limit(COMPUTED_SORT_ROW_CAP)
        .lean();
      const userIds = allUsers.map(
        (user) => new mongoose.Types.ObjectId(user._id.toString()),
      );

      // Get file stats for all users in one aggregation
      const fileStatsResults = await File.aggregate([
        {
          $match: {
            owner: { $in: userIds },
            deletedAt: null,
          },
        },
        {
          $group: {
            _id: "$owner",
            totalFiles: { $sum: 1 },
            totalSize: { $sum: "$size" },
          },
        },
      ]);

      // Get folder stats for all users in one aggregation
      const folderStatsResults = await Folder.aggregate([
        {
          $match: {
            owner: { $in: userIds },
          },
        },
        {
          $group: {
            _id: "$owner",
            totalFolders: { $sum: 1 },
          },
        },
      ]);

      // Create lookup maps for faster access
      const fileStatsMap = new Map();
      fileStatsResults.forEach((stat) => {
        fileStatsMap.set(stat._id.toString(), stat);
      });

      const folderStatsMap = new Map();
      folderStatsResults.forEach((stat) => {
        folderStatsMap.set(stat._id.toString(), stat);
      });

      // Merge users with their stats
      usersWithStats = allUsers.map((user) => {
        const userId = user._id.toString();
        const fileStats = fileStatsMap.get(userId) || {
          totalFiles: 0,
          totalSize: 0,
        };
        const folderStats = folderStatsMap.get(userId) || { totalFolders: 0 };

        return {
          ...user,
          id: userId,
          _id: undefined,
          totalFilesUploaded: fileStats.totalFiles,
          totalStorageUsed: fileStats.totalSize,
          totalFolders: folderStats.totalFolders,
        };
      });

      // Sort by computed field
      usersWithStats.sort((a, b) => {
        const aValue = (a[sortBy] as number) || 0;
        const bValue = (b[sortBy] as number) || 0;
        return sortOrder === "desc" ? bValue - aValue : aValue - bValue;
      });

      // Apply pagination to sorted results
      usersWithStats = usersWithStats.slice(skip, skip + limit);
      sortTruncated = truncated;
      sortCandidates = allUsers.length;
      sortTotalMatching = totalMatching;
    } else {
      // For regular fields, use database sorting
      users = await User.find(query)
        .select("-passwordHash")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();

      const userIds = users.map(
        (user) => new mongoose.Types.ObjectId(user._id.toString()),
      );

      // Get file stats for paginated users in one aggregation
      const fileStatsResults = await File.aggregate([
        {
          $match: {
            owner: { $in: userIds },
            deletedAt: null,
          },
        },
        {
          $group: {
            _id: "$owner",
            totalFiles: { $sum: 1 },
            totalSize: { $sum: "$size" },
          },
        },
      ]);

      // Get folder stats for paginated users in one aggregation
      const folderStatsResults = await Folder.aggregate([
        {
          $match: {
            owner: { $in: userIds },
          },
        },
        {
          $group: {
            _id: "$owner",
            totalFolders: { $sum: 1 },
          },
        },
      ]);

      // Create lookup maps
      const fileStatsMap = new Map();
      fileStatsResults.forEach((stat) => {
        fileStatsMap.set(stat._id.toString(), stat);
      });

      const folderStatsMap = new Map();
      folderStatsResults.forEach((stat) => {
        folderStatsMap.set(stat._id.toString(), stat);
      });

      // Merge users with their stats
      usersWithStats = users.map((user) => {
        const userId = user._id.toString();
        const fileStats = fileStatsMap.get(userId) || {
          totalFiles: 0,
          totalSize: 0,
        };
        const folderStats = folderStatsMap.get(userId) || { totalFolders: 0 };

        return {
          ...user,
          id: userId,
          _id: undefined,
          totalFilesUploaded: fileStats.totalFiles,
          totalStorageUsed: fileStats.totalSize,
          totalFolders: folderStats.totalFolders,
        };
      });
    }

    // Get total count for pagination
    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limit);

    return NextResponse.json(
      {
        users: usersWithStats,
        pagination: {
          currentPage: page,
          totalPages,
          totalUsers,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        // Set only for computed-column sorts, so the UI can say the ranking is
        // based on a most-recent slice rather than every matching user.
        ...(sortTruncated
          ? {
              sortNotice: {
                truncated: true,
                candidatesConsidered: sortCandidates,
                totalMatching: sortTotalMatching,
              },
            }
          : {}),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Admin users GET error:", error);
    if (error instanceof AuthError) return createAuthResponse(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!validateOrigin(request)) return createCsrfError();
    // Verify admin authentication
    const adminUser = await requireAdmin(request);

    // Connect to database
    await connectToDatabase();

    const body = await request.json();
    const { name, email, password, role = "user" } = body;

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 },
      );
    }

    if (!["user", "admin"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be 'user' or 'admin'" },
        { status: 400 },
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 },
      );
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role,
      isActive: true,
      totalFilesUploaded: 0,
      totalStorageUsed: 0,
    });

    await newUser.save();

    await logAction("admin.user.create", {
      userId: adminUser.id,
      email: adminUser.email,
      entityType: "user",
      entityId: newUser._id.toString(),
      metadata: { createdEmail: newUser.email, role },
      request,
    });

    // Return user without password hash
    const userResponse = newUser.toSafeObject();

    return NextResponse.json(
      {
        message: "User created successfully",
        user: userResponse,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Admin users POST error:", error);
    if (error instanceof AuthError) return createAuthResponse(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
