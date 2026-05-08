// app/api/projects/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import { Project } from "@/src/models/Project";
import { uploadBase64Image } from "@/src/lib/cloudinary";

const MAX_IMAGES = 6;
const MAX_TECHNOLOGIES = 20;
const MAX_TECH_LENGTH = 50;
const ALLOWED_TYPES = ["web", "app"] as const;

const err = (msg: string, status: number) =>
  NextResponse.json({ success: false, message: msg }, { status });

function sanitizeTechnologies(raw: unknown): string[] | null {
  if (!Array.isArray(raw)) return null;
  const list = raw
    .filter((t): t is string => typeof t === "string")
    .map((t) => t.trim().slice(0, MAX_TECH_LENGTH))
    .filter((t) => t.length > 0)
    .slice(0, MAX_TECHNOLOGIES);
  return list.length > 0 ? list : null;
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/* ── GET /api/projects ── */
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const rawType = searchParams.get("type");
    const type = rawType === "web" || rawType === "app" ? rawType : null;

    const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
    const limit = Math.min(
      50,
      Math.max(1, Number(searchParams.get("limit") ?? "10") || 10),
    );

    const filter = type ? { type } : {};
    const skip = (page - 1) * limit;

    const projection = {
      _id: 1,
      type: 1,
      title: 1,
      slug: 1,
      description: 1,
      githubLink: 1,
      liveLink: 1,
      technologies: 1,
      images: 1,
      createdAt: 1,
    };

    const totalPromise = type
      ? Project.countDocuments(filter)
      : Project.estimatedDocumentCount();

    const dataPromise = Project.find(filter)
      .select(projection)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const [total, data] = await Promise.all([totalPromise, dataPromise]);

    return NextResponse.json(
      {
        success: true,
        data,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
      },
      {
        headers: {
          "Cache-Control":
            "public, max-age=30, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (e) {
    console.error("[GET /api/projects]", e);
    return err("সার্ভার ত্রুটি", 500);
  }
}

/* ── POST /api/projects ── */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // ── Parse FormData ──
    const formData = await req.formData();

    const type = formData.get("type") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const githubLink = (formData.get("githubLink") as string) ?? "";
    const liveLink = (formData.get("liveLink") as string) ?? "";

    // technologies JSON string parse
    let technologies: unknown;
    try {
      technologies = JSON.parse(formData.get("technologies") as string);
    } catch {
      return err("technologies format ভুল", 400);
    }

    // images — multiple files
    const imageFiles = formData.getAll("images") as File[];

    /* ── Validation ── */
    if (!type || !ALLOWED_TYPES.includes(type as "web" | "app"))
      return err("সঠিক type দিন (web/app)", 400);

    if (!title?.trim()) return err("শিরোনাম দিন", 400);
    if (title.trim().length > 120)
      return err("শিরোনাম সর্বোচ্চ ১২০ অক্ষর", 400);

    if (!description?.trim()) return err("বিবরণ দিন", 400);
    if (description.trim().length > 2000)
      return err("বিবরণ সর্বোচ্চ ২০০০ অক্ষর", 400);

    if (githubLink.trim() && !isValidUrl(githubLink.trim()))
      return err("সঠিক GitHub URL দিন", 400);

    if (liveLink.trim() && !isValidUrl(liveLink.trim()))
      return err("সঠিক Live URL দিন", 400);

    const sanitizedTech = sanitizeTechnologies(technologies);
    if (!sanitizedTech) return err("কমপক্ষে একটি প্রযুক্তি দিন", 400);

    if (!imageFiles || imageFiles.length === 0)
      return err("কমপক্ষে একটি ছবি দিন", 400);

    if (imageFiles.length > MAX_IMAGES)
      return err(`সর্বোচ্চ ${MAX_IMAGES}টি ছবি দেওয়া যাবে`, 400);

    /* ── Upload images to Cloudinary ── */
    const uploadedUrls: string[] = [];

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];

      // File → Buffer → base64
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

      try {
        const url = await uploadBase64Image(base64);
        uploadedUrls.push(url);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Upload failed";
        return err(`Image ${i + 1}: ${message}`, 500);
      }
    }

    /* ── Save to DB ── */
    const project = await Project.create({
      type,
      title: title.trim(),
      description: description.trim(),
      githubLink: githubLink.trim(),
      liveLink: liveLink.trim(),
      technologies: sanitizedTech,
      images: uploadedUrls,
    });

    return NextResponse.json(
      { success: true, message: "প্রজেক্ট যোগ হয়েছে", data: project },
      { status: 201 },
    );
  } catch (e) {
    console.error("[POST /api/projects]", e);
    const message = e instanceof Error ? e.message : "Unknown server error";
    return err(message, 500);
  }
}

export async function PUT() {
  return err("Method Not Allowed", 405);
}
export async function DELETE() {
  return err("Method Not Allowed", 405);
}
