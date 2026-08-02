import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAdmin, AuthError, createAuthResponse } from "@/lib/auth";
import mongoose from "mongoose";

interface RecentFileItem {
  _id: unknown;
  name: string;
  mime: string;
  size: number;
  createdAt: Date;
  owner: unknown;
  ownerName?: string;
  ownerEmail?: string | null;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    await connectToDatabase();

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Database connection not available");
    }
    const usersCollection = db.collection("users");
    const filesCollection = db.collection("files");
    const foldersCollection = db.collection("folders");

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(startOfToday.getTime() - 30 * 24 * 60 * 60 * 1000);
    const thisYear = new Date(now.getFullYear(), 0, 1);

    const { searchParams } = new URL(request.url);
    const days = Math.min(
      365,
      Math.max(1, parseInt(searchParams.get("days") || "7", 10) || 7),
    );
    const growthSince = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const fileMatch = { deletedAt: null };

    const [
      totalUsers,
      activeUsers,
      adminUsers,
      todayUsers,
      thisWeekUsers,
      thisMonthUsers,
      thisYearUsers,
      totalFiles,
      todayFiles,
      thisWeekFiles,
      thisMonthFiles,
      thisYearFiles,
      totalFolders,
      todayFolders,
      thisWeekFolders,
      thisMonthFolders,
      thisYearFolders,
    ] = await Promise.all([
      usersCollection.countDocuments({}),
      usersCollection.countDocuments({ isActive: { $ne: false } }),
      usersCollection.countDocuments({ role: "admin" }),
      usersCollection.countDocuments({ createdAt: { $gte: startOfToday } }),
      usersCollection.countDocuments({ createdAt: { $gte: thisWeek } }),
      usersCollection.countDocuments({ createdAt: { $gte: thisMonth } }),
      usersCollection.countDocuments({ createdAt: { $gte: thisYear } }),
      filesCollection.countDocuments(fileMatch),
      filesCollection.countDocuments({ ...fileMatch, createdAt: { $gte: startOfToday } }),
      filesCollection.countDocuments({ ...fileMatch, createdAt: { $gte: thisWeek } }),
      filesCollection.countDocuments({ ...fileMatch, createdAt: { $gte: thisMonth } }),
      filesCollection.countDocuments({ ...fileMatch, createdAt: { $gte: thisYear } }),
      foldersCollection.countDocuments({}),
      foldersCollection.countDocuments({ createdAt: { $gte: startOfToday } }),
      foldersCollection.countDocuments({ createdAt: { $gte: thisWeek } }),
      foldersCollection.countDocuments({ createdAt: { $gte: thisMonth } }),
      foldersCollection.countDocuments({ createdAt: { $gte: thisYear } }),
    ]);

    // Calculate file size statistics (exclude deleted files)
    const fileSizeStatsResult = await filesCollection
      .aggregate([
        { $match: fileMatch },
        {
          $group: {
            _id: null,
            totalSize: { $sum: "$size" },
            averageSize: { $avg: "$size" },
            maxSize: { $max: "$size" },
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();

    const fileSize = fileSizeStatsResult[0] || {
      totalSize: 0,
      averageSize: 0,
      maxSize: 0,
      count: 0,
    };

    // Get file type distribution (exclude deleted files)
    const fileTypeDistributionResult = await filesCollection
      .aggregate([
        { $match: fileMatch },
        {
          $group: {
            _id: "$mime",
            count: { $sum: 1 },
            totalSize: { $sum: "$size" },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ])
      .toArray();

    // Calculate user storage statistics (exclude deleted files)
    const userStorageStatsResult = await filesCollection
      .aggregate([
        { $match: fileMatch },
        {
          $group: {
            _id: "$owner",
            totalStorage: { $sum: "$size" },
            fileCount: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: null,
            totalStorage: { $sum: "$totalStorage" },
            averageStorage: { $avg: "$totalStorage" },
            maxStorage: { $max: "$totalStorage" },
          },
        },
      ])
      .toArray();

    const userStorage = userStorageStatsResult[0] || {
      totalStorage: 0,
      averageStorage: 0,
      maxStorage: 0,
    };

    // Get top users by storage (exclude deleted files)
    const topUsersResult = await filesCollection
      .aggregate([
        { $match: fileMatch },
        {
          $group: {
            _id: "$owner",
            totalStorageUsed: { $sum: "$size" },
            totalFilesUploaded: { $sum: 1 },
          },
        },
        { $sort: { totalStorageUsed: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },
        {
          $project: {
            _id: 1,
            name: "$user.name",
            email: "$user.email",
            totalStorageUsed: 1,
            totalFilesUploaded: 1,
            createdAt: "$user.createdAt",
            lastLoginAt: "$user.lastLoginAt",
          },
        },
      ])
      .toArray();

    // Get recent users
    const recentUsersResult = await usersCollection
      .find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .project({ name: 1, email: 1, role: 1, createdAt: 1 })
      .toArray();

    // Get recent files (exclude deleted files, resolve owner info)
    const recentFilesResult = await filesCollection
      .aggregate([
        { $match: fileMatch },
        { $sort: { createdAt: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "ownerDoc",
          },
        },
        { $unwind: { path: "$ownerDoc", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            name: 1,
            mime: 1,
            size: 1,
            createdAt: 1,
            owner: 1,
            ownerName: "$ownerDoc.name",
            ownerEmail: "$ownerDoc.email",
          },
        },
      ])
      .toArray();

    // Calculate growth data over the requested range
    const userGrowthResult = await usersCollection
      .aggregate([
        { $match: { createdAt: { $gte: growthSince } } },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
      ])
      .toArray();

    const fileGrowthResult = await filesCollection
      .aggregate([
        { $match: { ...fileMatch, createdAt: { $gte: growthSince } } },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" },
            },
            count: { $sum: 1 },
            totalSize: { $sum: "$size" },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
      ])
      .toArray();

    // Build response
    const response = {
      users: {
        total: totalUsers,
        active: activeUsers,
        admins: adminUsers,
        today: todayUsers,
        thisWeek: thisWeekUsers,
        thisMonth: thisMonthUsers,
        thisYear: thisYearUsers,
        storage: {
          totalStorage: userStorage.totalStorage || 0,
          averageStorage: Math.round(userStorage.averageStorage || 0),
          maxStorage: userStorage.maxStorage || 0,
        },
      },
      files: {
        total: totalFiles,
        today: todayFiles,
        thisWeek: thisWeekFiles,
        thisMonth: thisMonthFiles,
        thisYear: thisYearFiles,
        size: {
          totalSize: fileSize.totalSize || 0,
          averageSize: Math.round(fileSize.averageSize || 0),
          maxSize: fileSize.maxSize || 0,
        },
        typeDistribution: fileTypeDistributionResult || [],
      },
      folders: {
        total: totalFolders,
        today: todayFolders,
        thisWeek: thisWeekFolders,
        thisMonth: thisMonthFolders,
        thisYear: thisYearFolders,
      },
      growth: {
        users: userGrowthResult || [],
        files: fileGrowthResult || [],
      },
      topUsers: topUsersResult || [],
      recentActivity: {
        users: recentUsersResult || [],
        files: ((recentFilesResult as RecentFileItem[]) || []).map((file) => ({
          _id: file._id,
          name: file.name,
          type: file.mime,
          size: file.size,
          createdAt: file.createdAt,
          userId: {
            id: file.owner,
            name: file.ownerName || "Unknown",
            email: file.ownerEmail || null,
          },
        })),
      },
      system: {
        timestamp: new Date().toISOString(),
        totalStorage: fileSize.totalSize || 0,
        totalEntities: totalUsers + totalFiles + totalFolders,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Admin stats API error:", error);
    if (error instanceof AuthError) return createAuthResponse(error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
