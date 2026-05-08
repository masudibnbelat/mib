// app/api/articles/[slug]/share/route.ts
// app/api/articles/[slug]/share/route.ts

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
    { $inc: { shares: 1 } },
    { new: true, select: "shares" },
  ).lean<{ shares: number }>();

  return NextResponse.json({ shares: a?.shares ?? 0 });
}
