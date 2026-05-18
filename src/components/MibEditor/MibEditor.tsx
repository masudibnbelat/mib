// components/editor/MibEditor.tsx
"use client";
import { useState } from "react";
import { CollapsedPreview } from "./CollapsedPreview";
import { FullscreenEditor } from "./FullscreenEditor";
import type { MibEditorProps } from "../../types/editor";

const MibEditor = ({
  value,
  onChange,
  placeholder = "বিস্তারিত বিবরণ লিখুন...",
  rows = 6,
  disabled = false,
  className = "",
}: MibEditorProps) => {
  const [open, setOpen] = useState(false);

  return (
    <div className={className}>
      <CollapsedPreview
        value={value}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        onOpen={() => setOpen(true)}
      />
      {open && (
        <FullscreenEditor
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
};

export default MibEditor;
