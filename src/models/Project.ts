// src/models/Project.ts
import mongoose, { Schema, Document, Model } from "mongoose";
import slugify from "slugify";

export interface IProject extends Document {
  type: "web" | "app";
  title: string;
  slug: string;
  description: string;
  githubLink: string;
  liveLink: string;
  technologies: string[];
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    type: {
      type: String,
      enum: ["web", "app"],
      required: [true, "Type required"],
    },
    title: {
      type: String,
      required: [true, "Title required"],
      trim: true,
      maxlength: [120, "Title max 120 chars"],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description required"],
      trim: true,
      maxlength: [2000, "Description max 2000 chars"],
    },
    githubLink: {
      type: String,
      default: "",
      trim: true,
      maxlength: [500, "URL too long"],
    },
    liveLink: {
      type: String,
      default: "",
      trim: true,
      maxlength: [500, "URL too long"],
    },
    technologies: {
      type: [String],
      validate: {
        validator: (v: string[]) => v.length > 0 && v.length <= 20,
        message: "1-20 technologies required",
      },
    },
    images: {
      type: [String],
      validate: {
        validator: (v: string[]) => v.length > 0 && v.length <= 10,
        message: "1-10 images required",
      },
    },
  },
  { timestamps: true },
);

/* ── Auto slug ── */
ProjectSchema.pre("save", async function () {
  if (!this.isModified("title")) return;

  const base = slugify(this.title, { lower: true, strict: true });
  let slug = base;
  let count = 1;

  while (
    await (this.constructor as Model<IProject>).exists({
      slug,
      _id: { $ne: this._id },
    })
  ) {
    slug = `${base}-${count++}`;
  }

  this.slug = slug;
});

export const Project =
  mongoose.models.Project || mongoose.model<IProject>("Project", ProjectSchema);
