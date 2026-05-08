// src/types/Topic.ts

import type { Types } from "mongoose";

export interface TopicData {
  _id: string;
  title: string;
  img: string;
}

export interface TopicLean {
  _id: Types.ObjectId | string;
  title: string;
  img: string;
  createdAt?: Date;
  updatedAt?: Date;
}
