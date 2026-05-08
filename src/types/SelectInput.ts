// src/types/SelectInput.ts
import type { ReactNode, RefObject } from "react";

export interface SelectOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

export interface DropdownPortalProps {
  children: ReactNode;
  triggerRef: RefObject<HTMLButtonElement | null>;
  isOpen: boolean;
}

export interface SelectInputProps {
  options: SelectOption[];
  value?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  isTouched?: boolean;
  defaultValue?: string;
  className?: string;
}
