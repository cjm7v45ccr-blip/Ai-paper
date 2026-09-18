"use client";

import React from "react";
import {
  Sparkles,
  Copy,
  Trash2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  Maximize2,
  Layers,
  Check,
} from "lucide-react";
import { DocumentElement } from "@/types/document";

interface ContextualFloatingToolbarProps {
  selectedElement: DocumentElement;
  onUpdateElementStyle: (styleUpdates: Record<string, any>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onAiRefine: (actionType: string) => void;
  isAiLoading?: boolean;
}

export const ContextualFloatingToolbar: React.FC<ContextualFloatingToolbarProps> = ({
  selectedElement,
  onUpdateElementStyle,
  onDuplicate,
  onDelete,
  onAiRefine,
  isAiLoading = false,
}) => {
  const currentAlign = selectedElement.style?.textAlign || "left";

  const colorThemes = [
    { label: "Indigo", bg: "#eef2ff", border: "#c7d2fe", text: "#1e1b4b" },
    { label: "Emerald", bg: "#ecfdf5", border: "#a7f3d0", text: "#064e3b" },
    { label: "Amber", bg: "#fffbeb", border: "#fde68a", text: "#78350f" },
    { label: "Slate", bg: "#f8fafc", border: "#e2e8f0", text: "#0f172a" },
    { label: "Dark", bg: "#18181b", border: "#27272a", text: "#fafafa" },
  ];

  return (
    <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#161822] border border-white/[0.12] shadow-2xl backdrop-blur-xl text-zinc-300 text-xs select-none animate-in fade-in-50 zoom-in-95 duration-100">
      {/* Element Type Badge */}
      <span className="px-2 py-1 rounded-lg bg-white/[0.06] text-[10px] font-mono uppercase tracking-wider text-zinc-400">
        {selectedElement.type}
      </span>

      <div className="h-4 w-[1px] bg-white/[0.1] mx-0.5" />

      {/* Text Alignment */}
      <div className="flex items-center gap-0.5 bg-white/[0.04] rounded-lg p-0.5">
        <button
          onClick={() => onUpdateElementStyle({ textAlign: "left" })}
          className={`p-1 rounded text-zinc-400 hover:text-white transition-colors ${
            currentAlign === "left" ? "bg-white/[0.12] text-white" : ""
          }`}
          title="Align Left"
        >
          <AlignLeft className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onUpdateElementStyle({ textAlign: "center" })}
          className={`p-1 rounded text-zinc-400 hover:text-white transition-colors ${
            currentAlign === "center" ? "bg-white/[0.12] text-white" : ""
          }`}
          title="Align Center"
        >
          <AlignCenter className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onUpdateElementStyle({ textAlign: "right" })}
          className={`p-1 rounded text-zinc-400 hover:text-white transition-colors ${
            currentAlign === "right" ? "bg-white/[0.12] text-white" : ""
          }`}
          title="Align Right"
        >
          <AlignRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Theme Color Presets */}
      <div className="flex items-center gap-1 px-1">
        {colorThemes.map((c, i) => (
          <button
            key={i}
            onClick={() =>
              onUpdateElementStyle({
                backgroundColor: c.bg,
                borderColor: c.border,
                color: c.text,
              })
            }
            className="w-4 h-4 rounded-full border border-black/20 hover:scale-110 transition-transform"
            style={{ backgroundColor: c.bg }}
            title={c.label}
          />
        ))}
      </div>

      <div className="h-4 w-[1px] bg-white/[0.1] mx-0.5" />

      {/* AI Quick Polish Actions */}
      <button
        disabled={isAiLoading}
        onClick={() => onAiRefine("concise")}
        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 hover:text-white transition-colors"
        title="Make this text more concise"
      >
        <Sparkles className="w-3 h-3 text-indigo-400" />
        <span>Concise</span>
      </button>

      <button
        disabled={isAiLoading}
        onClick={() => onAiRefine("professional")}
        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 hover:text-white transition-colors"
        title="Polish with professional executive tone"
      >
        <span>Polish</span>
      </button>

      <div className="h-4 w-[1px] bg-white/[0.1] mx-0.5" />

      {/* Duplicate Button */}
      <button
        onClick={onDuplicate}
        className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
        title="Duplicate block"
      >
        <Copy className="w-3.5 h-3.5" />
      </button>

      {/* Delete Button */}
      <button
        onClick={onDelete}
        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
        title="Delete block (cleans up layout without gaps)"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
