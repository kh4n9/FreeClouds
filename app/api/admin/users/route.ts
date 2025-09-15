import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { User } from "@/models/User";
import { File } from "@/models/File";
import { Folder } from "@/models/Folder";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

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
    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
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
    const sort: any = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Check if sorting by computed fields (totalFiles, totalStorageUsed, totalFolders)
    const isComputedSort = [
      "totalFilesUploaded",
      "totalStorageUsed",
      "totalFolders",
    ].includes(sortBy);

    let users;
    let usersWithStats;

    if (isComputedSort) {
      // For computed fields, get all users with stats and sort in memory
      const allUsers = await User.find(query).select("-passwordHash").lean();
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
        const aValue = (a as any)[sortBy] || 0;
        const bValue = (b as any)[sortBy] || 0;
        return sortOrder === "desc" ? bValue - aValue : aValue - bValue;
      });

      // Apply pagination to sorted results
      usersWithStats = usersWithStats.slice(skip, skip + limit);
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
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Admin users GET error:", error);

    if (
      error instanceof Error &&
      error.message.includes("Admin access required")
    ) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    await requireAdmin(request);

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

    // Return user without password hash
    const userResponse = (newUser as any).toSafeObject();

    return NextResponse.json(
      {
        message: "User created successfully",
        user: userResponse,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Admin users POST error:", error);

    if (
      error instanceof Error &&
      error.message.includes("Admin access required")
    ) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
