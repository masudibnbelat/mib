// types/editor.ts
export interface MibEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  className?: string;
}

export interface ColorOption {
  label: string;
  hex: string;
  marker: string;
  key: string;
}

export interface QuoteStyle {
  key: string;
  label: string;
  titleColor: string; // deep color
  borderColor: string;
  bgColor: string; // thin/light bg
  textColor: string;
}

export interface CheatItem {
  sym: string;
  desc: string;
}

export interface ToolBtnProps {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}

export interface ColorPickerProps {
  colors: ColorOption[];
  onSelect: (marker: string) => void;
  disabled?: boolean;
}

export interface QuotePickerProps {
  quotes: QuoteStyle[];
  onSelect: (style: QuoteStyle) => void;
  disabled?: boolean;
}

export interface EditorAreaProps {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  disabled: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

export interface CheatsheetProps {
  items: CheatItem[];
}
