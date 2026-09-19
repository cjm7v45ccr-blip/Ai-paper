"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Copy,
  Trash2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Plus,
  Minus,
  Columns3,
  TrendingUp,
  Clock,
  Wand2,
  ChevronDown,
  Palette,
  Lock,
  Unlock,
} from "lucide-react";
import { DocumentElement } from "@/types/document";

interface ContextualFloatingToolbarProps {
  selectedElement: DocumentElement;
  onUpdateElementStyle: (styleUpdates: Record<string, any>) => void;
  onUpdateElement?: (changes: Partial<DocumentElement>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onAiRefine: (actionType: string) => void;
  isAiLoading?: boolean;
}

export const ContextualFloatingToolbar: React.FC<ContextualFloatingToolbarProps> = ({
  selectedElement,
  onUpdateElementStyle,
  onUpdateElement,
  onDuplicate,
  onDelete,
  onAiRefine,
  isAiLoading = false,
}) => {
  const [showAiMenu, setShowAiMenu] = useState(false);
  const style = selectedElement.style || {};
  const currentAlign = style.textAlign || "left";
  const isBold = (style.fontWeight as number) >= 600 || style.fontWeight === "bold";
  const isItalic = style.fontStyle === "italic";
  const isUnderline = style.textDecoration === "underline";
  const fontSize = style.fontSize || 14;

  const colorThemes = [
    { label: "Indigo Card", bg: "#eef2ff", border: "#c7d2fe", text: "#1e1b4b" },
    { label: "Emerald Card", bg: "#ecfdf5", border: "#a7f3d0", text: "#064e3b" },
    { label: "Amber Card", bg: "#fffbeb", border: "#fde68a", text: "#78350f" },
    { label: "Slate Card", bg: "#f8fafc", border: "#e2e8f0", text: "#0f172a" },
    { label: "Pure White", bg: "#ffffff", border: "#e4e4e7", text: "#09090b" },
  ];

  return (
    <div className="flex items-center gap-1 p-1 rounded-2xl bg-[#141620]/95 border border-white/[0.14] shadow-2xl backdrop-blur-xl text-zinc-300 text-xs select-none animate-in fade-in-50 zoom-in-95 duration-100 z-50">
      {/* Element Type Badge */}
      <span className="px-2 py-0.5 rounded-lg bg-white/[0.08] text-[9px] font-mono uppercase tracking-wider text-zinc-300 font-semibold">
        {selectedElement.type}
      </span>

      <div className="h-4 w-[1px] bg-white/[0.1] mx-0.5" />

      {/* Font Formatting: Bold & Italic */}
      <div className="flex items-center gap-0.5 bg-white/[0.04] rounded-lg p-0.5 border border-white/[0.06]">
        <button
          onClick={() => onUpdateElementStyle({ fontWeight: isBold ? 400 : 700 })}
          className={`p-1 rounded transition-colors ${
            isBold ? "bg-indigo-600 text-white shadow-xs" : "text-zinc-400 hover:text-white"
          }`}
          title="Bold (Cmd+B)"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onUpdateElementStyle({ fontStyle: isItalic ? "normal" : "italic" })}
          className={`p-1 rounded transition-colors ${
            isItalic ? "bg-indigo-600 text-white shadow-xs" : "text-zinc-400 hover:text-white"
          }`}
          title="Italic (Cmd+I)"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onUpdateElementStyle({ textDecoration: isUnderline ? "none" : "underline" })}
          className={`p-1 rounded transition-colors ${
            isUnderline ? "bg-indigo-600 text-white shadow-xs" : "text-zinc-400 hover:text-white"
          }`}
          title="Underline (Cmd+U)"
        >
          <Underline className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Font Size Stepper */}
      <div className="flex items-center bg-white/[0.04] rounded-lg p-0.5 border border-white/[0.06]">
        <button
          onClick={() => onUpdateElementStyle({ fontSize: Math.max(8, fontSize - 1) })}
          className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/[0.08]"
          title="Smaller"
        >
          <Minus className="w-3 h-3" />
        </button>
        <span className="w-6 text-center font-mono text-[10px] text-zinc-200">
          {fontSize}
        </span>
        <button
          onClick={() => onUpdateElementStyle({ fontSize: Math.min(100, fontSize + 1) })}
          className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/[0.08]"
          title="Larger"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      {/* Text Alignment */}
      <div className="flex items-center gap-0.5 bg-white/[0.04] rounded-lg p-0.5 border border-white/[0.06]">
        <button
          onClick={() => onUpdateElementStyle({ textAlign: "left" })}
          className={`p-1 rounded text-zinc-400 hover:text-white transition-colors ${
            currentAlign === "left" ? "bg-white/[0.15] text-white" : ""
          }`}
          title="Align Left"
        >
          <AlignLeft className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onUpdateElementStyle({ textAlign: "center" })}
          className={`p-1 rounded text-zinc-400 hover:text-white transition-colors ${
            currentAlign === "center" ? "bg-white/[0.15] text-white" : ""
          }`}
          title="Align Center"
        >
          <AlignCenter className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onUpdateElementStyle({ textAlign: "right" })}
          className={`p-1 rounded text-zinc-400 hover:text-white transition-colors ${
            currentAlign === "right" ? "bg-white/[0.15] text-white" : ""
          }`}
          title="Align Right"
        >
          <AlignRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Card Theme Preset Colors */}
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
            className="w-3.5 h-3.5 rounded-full border border-black/20 hover:scale-125 transition-transform"
            style={{ backgroundColor: c.bg }}
            title={c.label}
          />
        ))}
      </div>

      <div className="h-4 w-[1px] bg-white/[0.1] mx-0.5" />

      {/* Gamma-Grade AI Remix Menu */}
      <div className="relative">
        <button
          disabled={isAiLoading}
          onClick={() => setShowAiMenu((prev) => !prev)}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium hover:brightness-110 transition-all shadow-sm"
          title="AI Remix Options"
        >
          <Sparkles className="w-3 h-3 text-white" />
          <span className="text-[10px]">Remix</span>
          <ChevronDown className="w-2.5 h-2.5 opacity-75" />
        </button>

        {showAiMenu && (
          <div className="absolute bottom-full left-0 mb-1.5 w-56 bg-[#161822] border border-white/[0.14] rounded-xl shadow-2xl p-1.5 z-50 space-y-1">
            <div className="text-[9px] font-mono uppercase text-zinc-400 px-2 py-0.5">
              Smart Transformations
            </div>
            <button
              onClick={() => {
                onAiRefine("card_grid");
                setShowAiMenu(false);
              }}
              className="w-full flex items-center gap-2 px-2 py-1 rounded-md text-zinc-300 hover:text-white hover:bg-white/[0.08] text-left text-xs"
            >
              <Columns3 className="w-3 h-3 text-emerald-400" />
              <span>Turn into 3-Card Grid</span>
            </button>
            <button
              onClick={() => {
                onAiRefine("stat_metric");
                setShowAiMenu(false);
              }}
              className="w-full flex items-center gap-2 px-2 py-1 rounded-md text-zinc-300 hover:text-white hover:bg-white/[0.08] text-left text-xs"
            >
              <TrendingUp className="w-3 h-3 text-amber-400" />
              <span>Turn into KPI Stat Cards</span>
            </button>
            <button
              onClick={() => {
                onAiRefine("timeline");
                setShowAiMenu(false);
              }}
              className="w-full flex items-center gap-2 px-2 py-1 rounded-md text-zinc-300 hover:text-white hover:bg-white/[0.08] text-left text-xs"
            >
              <Clock className="w-3 h-3 text-sky-400" />
              <span>Turn into Roadmap Timeline</span>
            </button>
            <div className="border-t border-white/[0.06] my-1" />
            <button
              onClick={() => {
                onAiRefine("concise");
                setShowAiMenu(false);
              }}
              className="w-full flex items-center gap-2 px-2 py-1 rounded-md text-zinc-300 hover:text-white hover:bg-white/[0.08] text-left text-xs"
            >
              <Wand2 className="w-3 h-3 text-purple-400" />
              <span>Make Ultra Concise</span>
            </button>
            <button
              onClick={() => {
                onAiRefine("professional");
                setShowAiMenu(false);
              }}
              className="w-full flex items-center gap-2 px-2 py-1 rounded-md text-zinc-300 hover:text-white hover:bg-white/[0.08] text-left text-xs"
            >
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>Polish Tone</span>
            </button>
          </div>
        )}
      </div>

      <div className="h-4 w-[1px] bg-white/[0.1] mx-0.5" />

      {/* Duplicate & Delete */}
      <button
        onClick={onDuplicate}
        className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
        title="Duplicate (Cmd+D)"
      >
        <Copy className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={onDelete}
        className="p-1 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
        title="Delete"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
