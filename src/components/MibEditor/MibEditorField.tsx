// components/editor/MibEditorField.tsx
"use client";
import { useController, Control, FieldValues, Path } from "react-hook-form";
import MibEditor from "./MibEditor";

interface MibEditorFieldProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  className?: string;
}

export function MibEditorField<T extends FieldValues>({
  name,
  control,
  placeholder,
  rows,
  disabled,
  className,
}: MibEditorFieldProps<T>) {
  const {
    field: { value, onChange },
    fieldState: { error },
  } = useController({ name, control });

  return (
    <div className={className}>
      <MibEditor
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
      />
      {error && <p className="mt-1.5 text-sm text-red-400">{error.message}</p>}
    </div>
  );
}
