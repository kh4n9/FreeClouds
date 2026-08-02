import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAdmin, AuthError, createAuthResponse } from "@/lib/auth";
import { User, type IUser } from "@/models/User";
import { File } from "@/models/File";
import mongoose from "mongoose";
import type { FilterQuery } from "mongoose";

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    await requireAdmin(request);

    // Connect to database
    await connectToDatabase();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const status = searchParams.get("status") || "";
    const format = searchParams.get("format") || "csv";
    const lang = searchParams.get("lang") === "vi" ? "vi" : "en";

    // Build query
    const query: FilterQuery<IUser> = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    if (role && role !== "all") {
      query.role = role;
    }

    if (status && status !== "all") {
      query.isActive = status === "active";
    }

    // Get all users matching criteria
    const users = await User.find(query)
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .lean();

    // Compute live storage/file stats (exclude deleted files)
    const userIds = users.map(
      (user) => new mongoose.Types.ObjectId(user._id.toString()),
    );
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
    const statsMap = new Map(
      fileStatsResults.map((stat) => [stat._id.toString(), stat]),
    );
    const getStats = (userId: string) =>
      statsMap.get(userId) || { totalFiles: 0, totalSize: 0 };

    const t = lang === "vi"
      ? {
          headers: [
            "ID",
            "Tên",
            "Email",
            "Vai trò",
            "Trạng thái",
            "Tổng file",
            "Dung lượng sử dụng (bytes)",
            "Ngày tham gia",
            "Đăng nhập cuối",
          ],
          admin: "Quản trị viên",
          user: "Người dùng",
          active: "Hoạt động",
          inactive: "Vô hiệu hóa",
          never: "Chưa đăng nhập",
          locale: "vi-VN",
        }
      : {
          headers: [
            "ID",
            "Name",
            "Email",
            "Role",
            "Status",
            "Total files",
            "Storage used (bytes)",
            "Joined",
            "Last login",
          ],
          admin: "Administrator",
          user: "User",
          active: "Active",
          inactive: "Inactive",
          never: "Never",
          locale: "en-US",
        };

    if (format === "csv") {
      // Generate CSV content
      const csvRows = [t.headers.join(",")];

      users.forEach((user) => {
        const stats = getStats(user._id.toString());
        const row = [
          user._id.toString(),
          `"${user.name.replace(/"/g, '""')}"`,
          user.email,
          user.role === "admin" ? t.admin : t.user,
          user.isActive ? t.active : t.inactive,
          stats.totalFiles,
          stats.totalSize,
          new Date(user.createdAt).toLocaleDateString(t.locale),
          user.lastLoginAt
            ? new Date(user.lastLoginAt).toLocaleDateString(t.locale)
            : t.never,
        ];
        csvRows.push(row.join(","));
      });

      const csvContent = csvRows.join("\n");

      // Add BOM for proper UTF-8 encoding in Excel
      const bom = "\uFEFF";
      const csvWithBom = bom + csvContent;

      return new NextResponse(csvWithBom, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="users-export-${new Date().toISOString().split("T")[0]}.csv"`,
          "Cache-Control": "no-cache"
        }
      });
    }

    if (format === "json") {
      // Format users for JSON export
      const formattedUsers = users.map((user) => {
        const stats = getStats(user._id.toString());
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          totalFilesUploaded: stats.totalFiles,
          totalStorageUsed: stats.totalSize,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
          updatedAt: user.updatedAt
        };
      });

      const jsonContent = JSON.stringify({
        exportDate: new Date().toISOString(),
        totalUsers: users.length,
        filters: {
          search: search || null,
          role: role || "all",
          status: status || "all"
        },
        users: formattedUsers
      }, null, 2);

      return new NextResponse(jsonContent, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="users-export-${new Date().toISOString().split("T")[0]}.json"`,
          "Cache-Control": "no-cache"
        }
      });
    }

    return NextResponse.json(
      { error: "Unsupported format. Use 'csv' or 'json'" },
      { status: 400 }
    );

  } catch (error) {
    console.error("Admin users export error:", error);
    if (error instanceof AuthError) return createAuthResponse(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
