// app/api/topics/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/src/lib/db";
import { Topic } from "@/src/models/Topic";
import { deleteCloudinaryImage, uploadBuffer } from "@/src/lib/cloudinary";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id))
      return NextResponse.json(
        { success: false, message: "অবৈধ ID" },
        { status: 400 },
      );

    const topic = await Topic.findById(id);
    if (!topic)
      return NextResponse.json(
        { success: false, message: "Topic পাওয়া যায়নি" },
        { status: 404 },
      );

    const formData = await req.formData();
    const title = (formData.get("title") as string)?.trim();
    const imgFile = formData.get("img") as File | null;
    const updates: { title?: string; img?: string } = {};

    if (title) updates.title = title;

    if (imgFile?.size) {
      await deleteCloudinaryImage(topic.img);
      const buffer = Buffer.from(await imgFile.arrayBuffer());
      updates.img = await uploadBuffer(buffer, "topics");
    }

    if (!Object.keys(updates).length)
      return NextResponse.json(
        { success: false, message: "কিছু একটা পাঠাও আপডেটের জন্য" },
        { status: 400 },
      );

    const updated = await Topic.findByIdAndUpdate(id, updates, {
      new: true,
    }).lean();
    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error("[PATCH /api/topics/:id]", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id))
      return NextResponse.json(
        { success: false, message: "অবৈধ ID" },
        { status: 400 },
      );

    const topic = await Topic.findById(id);
    if (!topic)
      return NextResponse.json(
        { success: false, message: "Topic পাওয়া যায়নি" },
        { status: 404 },
      );

    await Promise.all([
      deleteCloudinaryImage(topic.img),
      Topic.findByIdAndDelete(id),
    ]);

    return NextResponse.json({
      success: true,
      message: "Topic মুছে ফেলা হয়েছে",
    });
  } catch (err) {
    console.error("[DELETE /api/topics/:id]", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}
