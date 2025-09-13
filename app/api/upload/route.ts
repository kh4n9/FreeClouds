import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { File } from "@/models/File";
import { Folder } from "@/models/Folder";
import { requireAuth, AuthError, createAuthResponse, validateOrigin, createCsrfError, verifyOwnership } from "@/lib/auth";
import { checkRateLimit, createRateLimitResponse, RATE_LIMITS } from "@/lib/ratelimit";
import { telegramAPI, isAllowedFileType, validateFileName, sanitizeFileName, TELEGRAM_FILE_SIZE_LIMIT } from "@/lib/telegram";

const uploadSchema = z.object({
  folderId: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    // CSRF protection
    if (!validateOrigin(request)) {
      return createCsrfError();
    }

    // Rate limiting
    const rateLimit = checkRateLimit(request, RATE_LIMITS.UPLOAD);
    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit.remaining, rateLimit.resetTime);
    }

    // Authentication required
    const user = await requireAuth(request);

    // Connect to database
    await connectToDatabase();

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folderIdParam = formData.get("folderId") as string | null;

    // Validate file presence
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate folder ID if provided
    let folderId: string | null = null;
    if (folderIdParam && folderIdParam !== "null" && folderIdParam !== "") {
      const validation = uploadSchema.safeParse({ folderId: folderIdParam });
      if (!validation.success) {
        return NextResponse.json(
          { error: "Invalid folder ID" },
          { status: 400 }
        );
      }
      folderId = validation.data.folderId || null;
    }

    // Verify folder ownership if folderId is provided
    if (folderId) {
      const folder = await Folder.findById(folderId);
      if (!folder || !(await verifyOwnership(user.id, folder))) {
        return NextResponse.json(
          { error: "Folder not found or access denied" },
          { status: 404 }
        );
      }
    }

    // Validate file size
    if (file.size > TELEGRAM_FILE_SIZE_LIMIT) {
      return NextResponse.json(
        { error: `File size exceeds maximum limit (${Math.round(TELEGRAM_FILE_SIZE_LIMIT / (1024 * 1024))}MB)` },
        { status: 413 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: "Empty file not allowed" },
        { status: 400 }
      );
    }

    // Validate and sanitize file name
    let fileName = file.name;
    if (!validateFileName(fileName)) {
      fileName = sanitizeFileName(fileName);
    }

    // Validate file type
    const mimeType = file.type || "application/octet-stream";
    if (!isAllowedFileType(mimeType, fileName)) {
      return NextResponse.json(
        { error: "File type not allowed for security reasons" },
        { status: 415 }
      );
    }

    // Check for duplicate file name in the same folder
    const existingFile = await File.findOne({
      owner: user.id,
      folder: folderId,
      name: fileName,
      deletedAt: null,
    });

    if (existingFile) {
      // Generate unique file name
      const extension = fileName.substring(fileName.lastIndexOf("."));
      const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf("."));
      const timestamp = Date.now();
      fileName = `${nameWithoutExt}_${timestamp}${extension}`;
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Telegram
    let telegramResponse;
    try {
      telegramResponse = await telegramAPI.sendDocument(buffer, fileName, mimeType);
    } catch (error) {
      console.error("Telegram upload failed:", error);
      return NextResponse.json(
        { error: "File upload failed. Please try again." },
        { status: 500 }
      );
    }

    // Save file metadata to database
    const fileRecord = new File({
      name: fileName,
      size: file.size,
      mime: mimeType,
      fileId: telegramResponse.document.file_id,
      owner: user.id,
      folder: folderId,
    });

    await fileRecord.save();

    // Return success response
    const response = {
      id: fileRecord._id.toString(),
      name: fileRecord.name,
      size: fileRecord.size,
      mime: fileRecord.mime,
      folderId: fileRecord.folder?.toString() || null,
      createdAt: fileRecord.createdAt,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);

    if (error instanceof AuthError) {
      return createAuthResponse(error);
    }

    // Handle specific MongoDB errors
    if (error instanceof Error) {
      if (error.name === "ValidationError") {
        return NextResponse.json(
          { error: "Invalid file data", details: error.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500 }
    );
  }
}

// Method not allowed for other HTTP methods
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}
