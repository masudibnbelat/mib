// app/api/articles/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import { Article } from "@/src/models/Article";
import { revalidateTag } from "next/cache";

function makeSlug(title: string) {
  const ascii = title
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);

  return (ascii || "article") + "-" + Date.now();
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
    const article = await Article.create({
      topic,
      title,
      slug: makeSlug(title),
      img,
      description,
    });

    // Cache clear করে নতুন ডেটা আনবে

    revalidateTag("articles-list", "default");
    revalidateTag("topics-slider", "default");

    return NextResponse.json({ success: true, data: article }, { status: 201 });
  } catch {
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
