// scripts/fix-article-slugs.ts

import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import mongoose from "mongoose";
import { Article } from "../models/Article";
import { connectDB } from "../lib/db";

const ONLY_OLD_AUTO_SLUGS = true;

const DRY_RUN = false;

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

async function makeUniqueSlug(baseSlug: string, currentId: string) {
  let slug = baseSlug;
  let counter = 2;

  while (
    await Article.exists({
      slug,
      _id: { $ne: currentId },
    })
  ) {
    const suffix = `-${counter}`;
    const trimmedBase = baseSlug
      .slice(0, Math.max(1, 80 - suffix.length))
      .replace(/-+$/g, "");

    slug = `${trimmedBase}${suffix}`;
    counter++;
  }

  return slug;
}

async function run() {
  await connectDB();

  const articles = await Article.find({}, "title slug createdAt").sort({
    createdAt: 1,
  });

  console.log(` মোট article: ${articles.length}`);

  let updated = 0;
  let skipped = 0;

  for (const article of articles) {
    const oldSlug = article.slug || "";
    const title = article.title || "";

    // শুধু পুরোনো article-123456789 টাইপ slug update করতে চাইলে
    if (ONLY_OLD_AUTO_SLUGS && !/^article-\d+$/.test(oldSlug)) {
      skipped++;
      console.log(`SKIP  | ${oldSlug} | ${title}`);
      continue;
    }

    const baseSlug = makeSlug(title);
    const newSlug = await makeUniqueSlug(baseSlug, article._id.toString());

    if (oldSlug === newSlug) {
      skipped++;
      console.log(`SAME  | ${oldSlug} | ${title}`);
      continue;
    }

    console.log(`UPDATE | ${oldSlug}  ->  ${newSlug}`);

    if (!DRY_RUN) {
      article.slug = newSlug;
      await article.save();
    }

    updated++;
  }

  console.log("\n Done");
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);

  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error(" Script failed:", err);
  await mongoose.disconnect();
  process.exit(1);
});
