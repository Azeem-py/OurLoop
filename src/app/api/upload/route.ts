import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import path from "path";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !user.coupleId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const bucket = (formData.get("bucket") as string) || "memories";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext =
      path.extname(file.name) ||
      (file.type.includes("audio")
        ? file.type.includes("wav")
          ? ".wav"
          : file.type.includes("ogg")
          ? ".ogg"
          : file.type.includes("mp4")
          ? ".m4a"
          : ".webm"
        : ".jpg");
    const uniqueName = `${user.coupleId}/${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;

    // 1. Production Mode: Use Supabase Storage if configured
    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseUrl = rawUrl?.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      let { data, error } = await supabase.storage.from(bucket).upload(uniqueName, buffer, {
        contentType: file.type,
        upsert: false,
      });

      // If bucket is missing, automatically create it as public using the service role key and retry
      if (error && (error.message?.toLowerCase().includes("not found") || (error as any).statusCode === "404")) {
        await supabase.storage.createBucket(bucket, { public: true });
        const retry = await supabase.storage.from(bucket).upload(uniqueName, buffer, {
          contentType: file.type,
          upsert: false,
        });
        data = retry.data;
        error = retry.error;
      }

      if (error) {
        console.error("Supabase storage error, falling back to database blob:", error);
      } else {
        const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(uniqueName);
        return NextResponse.json({ url: publicData.publicUrl });
      }
    }

    // 2. Local Mode: Save directly to database as binary blob (no filesystem clutter)
    const media = await prisma.mediaFile.create({
      data: {
        coupleId: user.coupleId,
        fileName: file.name || `file${ext}`,
        mimeType: file.type || "application/octet-stream",
        data: buffer,
      },
    });

    return NextResponse.json({ url: `/api/media/${media.id}` });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
  }
}

