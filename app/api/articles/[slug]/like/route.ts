// app/api/articles/[slug]/like/route.ts

// app/api/articles/[slug]/like/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import { Article } from "@/src/models/Article";

type P = { params: Promise<{ slug: string }> };

export async function POST(_req: NextRequest, { params }: P) {
  const { slug } = await params;
  await connectDB();

  const article = await Article.findOneAndUpdate(
    { slug },
    { $inc: { likesCount: 1 } },
    { new: true, select: "likesCount" },
  ).lean<{ likesCount: number }>();

  if (!article)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ likesCount: article.likesCount });
}
