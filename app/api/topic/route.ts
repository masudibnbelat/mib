// app/api/topic/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import { Topic } from "@/src/models/Topic";
import { uploadBuffer } from "@/src/lib/cloudinary";

export async function GET() {
  await connectDB();
  const topics = await Topic.find()
    .sort({ createdAt: -1 })
    .select("title img")
    .lean();
  return NextResponse.json({ success: true, data: topics });
}

export async function POST(req: NextRequest) {
  try {
    const fd = await req.formData();
    const title = (fd.get("title") as string)?.trim();
    const imgFile = fd.get("img") as File | null;

    if (!title || !imgFile)
      return NextResponse.json(
        { success: false, message: "সব তথ্য দিন" },
        { status: 400 },
      );

    const buffer = Buffer.from(await imgFile.arrayBuffer());
    const [imgUrl] = await Promise.all([
      uploadBuffer(buffer, "topics"),
      connectDB(),
    ]);

    const topic = await Topic.create({ title, img: imgUrl });
    return NextResponse.json(
      { success: true, message: "Topic তৈরি হয়েছে!", data: topic },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}
