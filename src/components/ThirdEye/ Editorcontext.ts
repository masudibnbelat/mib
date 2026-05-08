// Editorcontext.ts

import { createContext, useContext } from "react";
import type { EditorCtx } from "./ThirdEyeTypes";

export const EditorContext = createContext<EditorCtx | null>(null);

export const useEditor = (): EditorCtx => {
  const ctx = useContext(EditorContext);
  if (!ctx)
    throw new Error("useEditor must be used inside <EditorContext.Provider>");
  return ctx;
};
