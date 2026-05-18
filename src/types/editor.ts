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

export interface ToolbarProps {
  onWrap: (before: string, after: string, fallback?: string) => void;
  onPrefixLines: (prefix: string) => void;
  onInsertBlock: (text: string) => void;
  onClose: () => void;
  disabled: boolean;
  colors: ColorOption[];
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
