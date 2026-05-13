// app/api/articles/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import { Article } from "@/src/models/Article";
import { revalidateTag } from "next/cache";

function makeSlug(title: string) {
  return (
    title
      .toLowerCase()
      .trim()
      .replace(/[\s_]+/g, "-")
      .replace(/[^\w\u0980-\u09FF-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || "article"
  );
}

export async function POST(req: NextRequest) {
  try {
    const { topic, title, img, description } = await req.json();
    if (!topic || !title || !img || !description)
      return NextResponse.json(
        { success: false, message: "সব তথ্য দিন" },
        { status: 400 },
      );

    await connectDB();

    const slug = makeSlug(title);

    // ✅ Duplicate slug check
    const existing = await Article.findOne({ slug }).lean();
    if (existing) {
      return NextResponse.json(
        { success: false, message: "এই শিরোনামে আর্টিকেল আগেই আছে" },
        { status: 409 },
      );
    }

    const article = await Article.create({
      topic,
      title,
      slug,
      img,
      description,
    });

    revalidateTag("articles-list", "default");
    revalidateTag("topics-slider", "default");

    return NextResponse.json({ success: true, data: article }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/articles]", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    await connectDB();
    const articles = await Article.find()
      .populate("topic", "title img")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      { success: true, data: articles },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (err) {
    console.error("[GET /api/articles]", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}
