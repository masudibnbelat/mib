// src/models/Article.ts

// src/models/Article.ts

import { Schema, models, model } from "mongoose";

const articleSchema = new Schema(
  {
    topic: { type: Schema.Types.ObjectId, ref: "Topic", required: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    img: { type: String, required: true },
    description: { type: String, required: true, trim: true },
    views: { type: Number, default: 0 },
    likesCount: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const Article = models.Article || model("Article", articleSchema);
