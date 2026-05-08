// app/api/articles/[slug]/route.ts

import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/src/lib/db"; // shared connectDB
import { Article } from "@/src/models/Article"; // shared model

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

// ── GET single article by slug ──────────────────────────────
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { slug } = await params;

    if (!slug?.trim()) {
      return NextResponse.json(
        { success: false, message: "slug দরকার" },
        { status: 400 },
      );
    }

    const article = await Article.findOne({ slug: slug.trim() })
      .populate("topic", "title img")
      .lean(); // ← critical: mongoose document overhead বাদ

    if (!article) {
      return NextResponse.json(
        { success: false, message: "Article পাওয়া যায়নি" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { success: true, data: article },
      {
        headers: {
          // article rarely changes — aggressive cache
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      },
    );
  } catch (err) {
    console.error("[GET /api/articles/:slug]", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}

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

    const body = (await req.json()) as {
      topic?: string;
      title?: string;
      img?: string;
      description?: string;
    };

    const updates: Record<string, unknown> = {};

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
    if (body.description?.trim()) updates.description = body.description.trim();

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, message: "কিছু একটা পাঠাও আপডেটের জন্য" },
        { status: 400 },
      );
    }

    const updated = await Article.findOneAndUpdate(
      { slug: slug.trim() },
      updates,
      { new: true },
    )
      .populate("topic", "title img")
      .lean();

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error("[PATCH /api/articles/:slug]", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}

// ── DELETE article by slug ──────────────────────────────────
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { slug } = await params;

    if (!slug?.trim()) {
      return NextResponse.json(
        { success: false, message: "slug দরকার" },
        { status: 400 },
      );
    }

    const article = await Article.findOneAndDelete({ slug: slug.trim() });

    if (!article) {
      return NextResponse.json(
        { success: false, message: "Article পাওয়া যায়নি" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Article মুছে ফেলা হয়েছে",
    });
  } catch (err) {
    console.error("[DELETE /api/articles/:slug]", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}
