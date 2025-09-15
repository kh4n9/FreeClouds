import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import mongoose from "mongoose";

export async function GET(request: NextRequest) {
  try {
    console.log("Admin stats API: Starting...");

    // Verify admin authentication
    await requireAdmin(request);
    console.log("Admin stats API: Admin access verified");

    // Connect to database
    await connectToDatabase();
    console.log("Admin stats API: Database connected");

    // Calculate date ranges
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisYear = new Date(now.getFullYear(), 0, 1);

    console.log("Admin stats API: Date ranges calculated");

    // Get database collections directly
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Database connection not available");
    }
    const usersCollection = db.collection("users");
    const filesCollection = db.collection("files");
    const foldersCollection = db.collection("folders");

    // Fetch user statistics
    const [
      totalUsers,
      activeUsers,
      adminUsers,
      todayUsers,
      thisWeekUsers,
      thisMonthUsers,
      thisYearUsers,
    ] = await Promise.all([
      usersCollection.countDocuments(),
      usersCollection.countDocuments({ isActive: true }),
      usersCollection.countDocuments({ role: "admin" }),
      usersCollection.countDocuments({ createdAt: { $gte: today } }),
      usersCollection.countDocuments({ createdAt: { $gte: thisWeek } }),
      usersCollection.countDocuments({ createdAt: { $gte: thisMonth } }),
      usersCollection.countDocuments({ createdAt: { $gte: thisYear } }),
    ]);

    console.log("Admin stats API: User stats fetched", {
      totalUsers,
      activeUsers,
      adminUsers,
    });

    // Fetch file statistics (exclude deleted files)
    const [
      totalFiles,
      todayFiles,
      thisWeekFiles,
      thisMonthFiles,
      thisYearFiles,
    ] = await Promise.all([
      filesCollection.countDocuments({ deletedAt: null }),
      filesCollection.countDocuments({
        deletedAt: null,
        createdAt: { $gte: today },
      }),
      filesCollection.countDocuments({
        deletedAt: null,
        createdAt: { $gte: thisWeek },
      }),
      filesCollection.countDocuments({
        deletedAt: null,
        createdAt: { $gte: thisMonth },
      }),
      filesCollection.countDocuments({
        deletedAt: null,
        createdAt: { $gte: thisYear },
      }),
    ]);

    console.log("Admin stats API: File stats fetched", {
      totalFiles,
      todayFiles,
      thisWeekFiles,
    });

    // Fetch folder statistics
    const [
      totalFolders,
      todayFolders,
      thisWeekFolders,
      thisMonthFolders,
      thisYearFolders,
    ] = await Promise.all([
      foldersCollection.countDocuments(),
      foldersCollection.countDocuments({ createdAt: { $gte: today } }),
      foldersCollection.countDocuments({ createdAt: { $gte: thisWeek } }),
      foldersCollection.countDocuments({ createdAt: { $gte: thisMonth } }),
      foldersCollection.countDocuments({ createdAt: { $gte: thisYear } }),
    ]);

    console.log("Admin stats API: Folder stats fetched", {
      totalFolders,
      todayFolders,
    });

    // Calculate file size statistics (exclude deleted files)
    const fileSizeStatsResult = await filesCollection
      .aggregate([
        {
          $match: { deletedAt: null },
        },
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

    console.log("Admin stats API: File size stats calculated", fileSize);

    // Get file type distribution (exclude deleted files)
    const fileTypeDistributionResult = await filesCollection
      .aggregate([
        {
          $match: { deletedAt: null },
        },
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

    console.log("Admin stats API: File type distribution calculated");

    // Calculate user storage statistics (exclude deleted files)
    const userStorageStatsResult = await filesCollection
      .aggregate([
        {
          $match: { deletedAt: null },
        },
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

    console.log("Admin stats API: User storage stats calculated");

    // Get top users by storage (exclude deleted files)
    const topUsersResult = await filesCollection
      .aggregate([
        {
          $match: { deletedAt: null },
        },
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

    console.log("Admin stats API: Top users calculated");

    // Get recent users
    const recentUsersResult = await usersCollection
      .find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .project({ name: 1, email: 1, role: 1, createdAt: 1 })
      .toArray();

    // Get recent files (exclude deleted files)
    const recentFilesResult = await filesCollection
      .find({ deletedAt: null })
      .sort({ createdAt: -1 })
      .limit(5)
      .project({ name: 1, size: 1, mime: 1, createdAt: 1, owner: 1 })
      .toArray();

    // Calculate simple growth data (last 7 days)
    const userGrowthResult = await usersCollection
      .aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        },
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
        {
          $match: {
            deletedAt: null,
            createdAt: {
              $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        },
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

    console.log("Admin stats API: Growth data calculated");

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
        files: (recentFilesResult || []).map((file: any) => ({
          _id: file._id,
          name: file.name,
          type: file.mime,
          size: file.size,
          createdAt: file.createdAt,
          userId: file.owner,
        })),
      },
      system: {
        timestamp: new Date().toISOString(),
        totalStorage: fileSize.totalSize || 0,
        totalEntities: totalUsers + totalFiles + totalFolders,
      },
    };

    console.log("Admin stats API: Response built successfully");
    console.log("Admin stats API: Response summary", {
      totalUsers: response.users.total,
      totalFiles: response.files.total,
      totalFolders: response.folders.total,
      totalStorage: response.system.totalStorage,
    });

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Admin stats API error:", error);

    if (error instanceof Error) {
      if (error.message.includes("Admin access required")) {
        return NextResponse.json(
          { error: "Admin access required" },
          { status: 403 },
        );
      }

      if (error.message.includes("Authentication required")) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 },
        );
      }
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
