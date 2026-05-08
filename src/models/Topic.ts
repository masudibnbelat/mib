// src/models/Topic.ts
// src/models/Topic.ts

import {
  Schema,
  models,
  model,
  type Model,
  type InferSchemaType,
} from "mongoose";

const topicSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    img: { type: String, required: true },
  },
  { timestamps: true },
);

export type TopicDocument = InferSchemaType<typeof topicSchema>;

export const Topic: Model<TopicDocument> =
  (models.Topic as Model<TopicDocument>) ||
  model<TopicDocument>("Topic", topicSchema);
