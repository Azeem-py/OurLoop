import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const media = await prisma.mediaFile.findUnique({
      where: { id },
    });

    if (!media) {
      return new NextResponse("File not found", { status: 404 });
    }

    return new NextResponse(media.data, {
      headers: {
        "Content-Type": media.mimeType || "application/octet-stream",
        "Content-Length": media.data.length.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error serving media blob:", error);
    return new NextResponse("Failed to load media", { status: 500 });
  }
}
