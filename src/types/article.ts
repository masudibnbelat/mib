import { Types } from "mongoose";
import type { TopicLean } from "./Topic";

export interface ArticleData {
  _id: string;
  title: string;
  slug: string;
  img: string;
  description: string;
  createdAt: string;
  views: number;
  likesCount: number;
  shares: number;
  topic: {
    _id: string;
    title: string;
    img: string;
  };
}

export interface ArticleLean {
  _id: string | Types.ObjectId;
  title?: string;
  slug?: string;
  img?: string;
  description?: string;
  createdAt?: Date;
  views?: number;
  likesCount?: number;
  shares?: number;
  topic?: TopicLean | string | Types.ObjectId | null;
}
