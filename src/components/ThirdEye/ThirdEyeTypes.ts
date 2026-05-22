// ThirdEyeTypes.ts

import type { Dispatch } from "react";

export interface Language {
  label: string;
  value: string;
  mono: boolean;
}

export interface ErrorGutter {
  line: number;
  message: string;
}

export type OutputStatus = "loading" | "success" | "error";

export interface OutputState {
  status: OutputStatus;
  text: string;
}

export type PyStatus = "idle" | "loading" | "ready";
export type TextFont = "rubik";

export type AppMode = "editor" | "draw";

export interface AppState {
  text: string;
  lang: Language;
  output: OutputState | null;
  running: boolean;
  pyStatus: PyStatus;
  dropOpen: boolean;
  errors: ErrorGutter[];
  formatting: boolean;
  textFont: TextFont;
  mode: AppMode;
}

export type AppAction =
  | { type: "SET_TEXT"; payload: string }
  | { type: "SET_LANG"; payload: Language }
  | { type: "SET_OUTPUT"; payload: OutputState | null }
  | { type: "SET_RUNNING"; payload: boolean }
  | { type: "SET_PY_STATUS"; payload: PyStatus }
  | { type: "SET_ERRORS"; payload: ErrorGutter[] }
  | { type: "TOGGLE_DROP" }
  | { type: "CLOSE_DROP" }
  | { type: "SET_FORMATTING"; payload: boolean }
  | { type: "SET_TEXT_FONT"; payload: TextFont }
  | { type: "SET_MODE"; payload: AppMode };

export interface SyntaxError2 {
  startChar: number;
  endChar: number;
  line: number;
  message: string;
}

export type RunResult = { ok: boolean; text: string };

export interface EditorCtx {
  state: AppState;
  dispatch: Dispatch<AppAction>;
  onRun: () => Promise<void>;
  onFormat: () => Promise<void>;
  canRun: boolean;
  hasSelection: boolean;
}
