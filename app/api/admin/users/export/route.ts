import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { User } from "@/models/User";

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

    // Build query
    const query: any = {};

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

    if (format === "csv") {
      // Generate CSV content
      const headers = [
        "ID",
        "Tên",
        "Email",
        "Vai trò",
        "Trạng thái",
        "Tổng file",
        "Dung lượng sử dụng (bytes)",
        "Ngày tham gia",
        "Đăng nhập cuối"
      ];

      const csvRows = [headers.join(",")];

      users.forEach(user => {
        const row = [
          user._id.toString(),
          `"${user.name.replace(/"/g, '""')}"`, // Escape quotes
          user.email,
          user.role === "admin" ? "Quản trị viên" : "Người dùng",
          user.isActive ? "Hoạt động" : "Vô hiệu hóa",
          user.totalFilesUploaded || 0,
          user.totalStorageUsed || 0,
          new Date(user.createdAt).toLocaleDateString("vi-VN"),
          user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString("vi-VN") : "Chưa đăng nhập"
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
      const formattedUsers = users.map(user => ({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        totalFilesUploaded: user.totalFilesUploaded || 0,
        totalStorageUsed: user.totalStorageUsed || 0,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        updatedAt: user.updatedAt
      }));

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

    if (error instanceof Error && error.message.includes("Admin access required")) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
