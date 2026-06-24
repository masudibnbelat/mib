// src/types/MibEditorTypes.ts

import { Control, FieldValues, FieldPath } from "react-hook-form";

export interface MibEditorProps<T extends FieldValues = any> {
  name: FieldPath<T>;
  control: Control<T>;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
}


export type BlockType =
  | "paragraph"
  | "h1"
  | "h2"
  | "h3"
  | "bullet"
  | "number"
  | "check"
  | "quote"
  | "code";

 export type BlockInfo = {
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
};