// app/api/articles/[slug]/route.ts

import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/src/lib/db";
import { Article } from "@/src/models/Article";
import { uploadBuffer, deleteCloudinaryImage } from "@/src/lib/cloudinary";

const generateSlug = (title: string): string => {
  return (
    title
      .toLowerCase()
      .trim()
      .replace(/[\s_]+/g, "-")
      .replace(/[^\w\u0980-\u09FF-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "article"
  );
};

const Topic =
  mongoose.models.Topic ||
  mongoose.model(
    "Topic",
    new mongoose.Schema({
      title: { type: String, required: true },
      img: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
    }),
  );

type Params = { params: Promise<{ slug: string }> };

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// ── PATCH article by slug ───────────────────────────────────
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { slug } = await params;

    if (!slug?.trim()) {
      return NextResponse.json(
        { success: false, message: "slug দরকার" },
        { status: 400 },
      );
    }

    const article = await Article.findOne({ slug: slug.trim() });

    if (!article) {
      return NextResponse.json(
        { success: false, message: "Article পাওয়া যায়নি" },
        { status: 404 },
      );
    }

    const updates: Record<string, unknown> = {};
    let newUploadedImgUrl: string | null = null;

    const contentType = req.headers.get("content-type") || "";

    // ── multipart/form-data support ─────────────────────────
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();

      const topic = form.get("topic");
      const title = form.get("title");
      const description = form.get("description");
      const img = form.get("img");

      if (typeof topic === "string" && topic.trim()) {
        if (!mongoose.Types.ObjectId.isValid(topic)) {
          return NextResponse.json(
            { success: false, message: "অবৈধ topic ID" },
            { status: 400 },
          );
        }

        const topicExists = await Topic.findById(topic.trim()).lean();
        if (!topicExists) {
          return NextResponse.json(
            { success: false, message: "Topic পাওয়া যায়নি" },
            { status: 404 },
          );
        }

        updates.topic = topic.trim();
      }

      if (typeof title === "string" && title.trim()) {
        const cleanTitle = title.trim();
        const newSlug = generateSlug(cleanTitle);

        const existingSlug = await Article.findOne({
          slug: newSlug,
          _id: { $ne: article._id },
        }).lean();

        if (existingSlug) {
          return NextResponse.json(
            { success: false, message: "এই title আগে থেকেই আছে" },
            { status: 409 },
          );
        }

        updates.title = cleanTitle;
        updates.slug = newSlug;
      }

      if (typeof description === "string" && description.trim()) {
        updates.description = description.trim();
      }

      if (img instanceof File && img.size > 0) {
        if (!ALLOWED_IMAGE_TYPES.includes(img.type)) {
          return NextResponse.json(
            { success: false, message: "শুধু valid image file দিন" },
            { status: 400 },
          );
        }

        if (img.size > MAX_IMAGE_BYTES) {
          return NextResponse.json(
            { success: false, message: "ছবির সাইজ ৫MB এর বেশি" },
            { status: 400 },
          );
        }

        const arrayBuffer = await img.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        newUploadedImgUrl = await uploadBuffer(buffer, "articles");
        updates.img = newUploadedImgUrl;
      }
    } else {
      // ── old JSON support ──────────────────────────────────
      const body = (await req.json()) as {
        topic?: string;
        title?: string;
        img?: string;
        description?: string;
      };

      if (body.topic?.trim()) {
        if (!mongoose.Types.ObjectId.isValid(body.topic)) {
          return NextResponse.json(
            { success: false, message: "অবৈধ topic ID" },
            { status: 400 },
          );
        }

        const topicExists = await Topic.findById(body.topic.trim()).lean();
        if (!topicExists) {
          return NextResponse.json(
            { success: false, message: "Topic পাওয়া যায়নি" },
            { status: 404 },
          );
        }

        updates.topic = body.topic.trim();
      }

      if (body.title?.trim()) {
        const cleanTitle = body.title.trim();
        const newSlug = generateSlug(cleanTitle);

        const existingSlug = await Article.findOne({
          slug: newSlug,
          _id: { $ne: article._id },
        }).lean();

        if (existingSlug) {
          return NextResponse.json(
            { success: false, message: "এই title আগে থেকেই আছে" },
            { status: 409 },
          );
        }

        updates.title = cleanTitle;
        updates.slug = newSlug;
      }

      if (body.img?.trim()) updates.img = body.img.trim();
      if (body.description?.trim())
        updates.description = body.description.trim();
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, message: "কিছু একটা পাঠাও আপডেটের জন্য" },
        { status: 400 },
      );
    }

    const oldImg = article.img;

    const updated = await Article.findOneAndUpdate(
      { slug: slug.trim() },
      updates,
      { new: true },
    )
      .populate("topic", "title img")
      .lean();

    // নতুন ছবি এলে পুরানো cloudinary image delete
    if (newUploadedImgUrl && oldImg && oldImg !== newUploadedImgUrl) {
      void deleteCloudinaryImage(oldImg);
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error("[PATCH /api/articles/:slug]", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}
