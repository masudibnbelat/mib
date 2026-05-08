// app/api/projects/[slug]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import { Project } from "@/src/models/Project";
import { deleteCloudinaryImage, uploadBase64Image } from "@/src/lib/cloudinary";

type Ctx = { params: Promise<{ slug: string }> };

const MAX_BODY_BYTES = 50 * 1024 * 1024;
const MAX_IMAGES = 10;
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

/* ── GET /api/projects/[slug] ── */
export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const { slug } = await params;
    await connectDB();

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

    const project = await Project.findOne({ slug }).select(projection).lean();

    if (!project) return err("প্রজেক্ট পাওয়া যায়নি", 404);

    return NextResponse.json(
      { success: true, data: project },
      {
        headers: {
          "Cache-Control":
            "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
        },
      },
    );
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.error("[GET /api/projects/[slug]]", e);
    }
    return err("সার্ভার ত্রুটি", 500);
  }
}

/* ── PATCH /api/projects/[slug] ── */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const contentLength = parseInt(req.headers.get("content-length") ?? "0");
    if (contentLength > MAX_BODY_BYTES) return err("Request too large", 413);

    const { slug } = await params;
    await connectDB();

    const project = await Project.findOne({ slug });
    if (!project) return err("প্রজেক্ট পাওয়া যায়নি", 404);

    const body = await req.json();
    const {
      type,
      title,
      description,
      githubLink,
      liveLink,
      technologies,
      newImages,
      keepImages,
    } = body;

    /* ── Validation ── */
    if (type !== undefined && !ALLOWED_TYPES.includes(type))
      return err("সঠিক type দিন (web/app)", 400);
    if (title !== undefined && !title?.trim())
      return err("শিরোনাম খালি রাখা যাবে না", 400);
    if (title !== undefined && title.trim().length > 120)
      return err("শিরোনাম সর্বোচ্চ ১২০ অক্ষর", 400);
    if (description !== undefined && !description?.trim())
      return err("বিবরণ খালি রাখা যাবে না", 400);
    if (description !== undefined && description.trim().length > 2000)
      return err("বিবরণ সর্বোচ্চ ২০০০ অক্ষর", 400);
    if (githubLink?.trim() && !isValidUrl(githubLink.trim()))
      return err("সঠিক GitHub URL দিন", 400);
    if (liveLink?.trim() && !isValidUrl(liveLink.trim()))
      return err("সঠিক Live URL দিন", 400);

    if (technologies !== undefined) {
      const sanitizedTech = sanitizeTechnologies(technologies);
      if (!sanitizedTech) return err("কমপক্ষে একটি প্রযুক্তি দিন", 400);
    }

    /* ── Image handling ── */
    let finalImages: string[] = project.images ?? [];

    if (keepImages !== undefined || newImages !== undefined) {
      /* শুধু এই project-এর existing images keep করতে পারবে */
      const existingImages: string[] = project.images ?? [];
      const kept: string[] = Array.isArray(keepImages)
        ? keepImages.filter((url: string) => existingImages.includes(url))
        : [];

      const toDelete = existingImages.filter((url) => !kept.includes(url));
      await Promise.all(toDelete.map((url) => deleteCloudinaryImage(url)));

      let uploaded: string[] = [];
      if (Array.isArray(newImages) && newImages.length > 0) {
        if (kept.length + newImages.length > MAX_IMAGES)
          return err(`সর্বোচ্চ ${MAX_IMAGES}টি ছবি দেওয়া যাবে`, 400);

        uploaded = await Promise.all(
          newImages.map(async (img: { base64: string }) => {
            if (!img?.base64) throw new Error("Invalid image data");
            return await uploadBase64Image(img.base64);
          }),
        );
      }

      finalImages = [...kept, ...uploaded];
      if (finalImages.length === 0)
        return err("কমপক্ষে একটি ছবি থাকতে হবে", 400);
    }

    const sanitizedTech =
      technologies !== undefined
        ? sanitizeTechnologies(technologies)
        : undefined;

    const updated = await Project.findOneAndUpdate(
      { slug },
      {
        ...(type !== undefined && { type }),
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(githubLink !== undefined && {
          githubLink: githubLink?.trim() ?? "",
        }),
        ...(liveLink !== undefined && { liveLink: liveLink?.trim() ?? "" }),
        ...(sanitizedTech !== undefined && { technologies: sanitizedTech }),
        images: finalImages,
      },
      { new: true, runValidators: true },
    ).lean();

    return NextResponse.json({
      success: true,
      message: "প্রজেক্ট আপডেট হয়েছে",
      data: updated,
    });
  } catch (e) {
    if (process.env.NODE_ENV === "development")
      console.error("[PATCH /api/projects/[slug]]", e);
    return err("সার্ভার ত্রুটি", 500);
  }
}

/* ── DELETE /api/projects/[slug] ── */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { slug } = await params;
    await connectDB();

    const project = await Project.findOne({ slug });
    if (!project) return err("প্রজেক্ট পাওয়া যায়নি", 404);

    await Promise.all(
      (project.images ?? []).map((url: string) => deleteCloudinaryImage(url)),
    );
    await project.deleteOne();

    return NextResponse.json({ success: true, message: "প্রজেক্ট মুছে গেছে" });
  } catch (e) {
    if (process.env.NODE_ENV === "development")
      console.error("[DELETE /api/projects/[slug]]", e);
    return err("সার্ভার ত্রুটি", 500);
  }
}

export async function POST() {
  return err("Method Not Allowed", 405);
}
export async function PUT() {
  return err("Method Not Allowed", 405);
}
