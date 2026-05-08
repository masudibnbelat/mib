// app/api/articles/[slug]/view/route.ts

import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import { Article } from "@/src/models/Article";

export async function POST(
  _: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  await connectDB();

  const a = await Article.findOneAndUpdate(
    { slug },
    { $inc: { views: 1 } },
    { new: true, select: "views" },
  ).lean<{ views: number }>();

  return NextResponse.json({ views: a?.views ?? 0 });
}
