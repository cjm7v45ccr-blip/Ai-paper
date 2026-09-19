"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  CheckSquare,
  Sparkles,
  ChevronDown,
  Palette,
  Highlighter,
  Plus,
  Minus,
  Type,
  LayoutGrid,
  BarChart3,
  Table as TableIcon,
  Sigma,
  Quote,
  AlertCircle,
  HelpCircle,
  Maximize2,
  Lock,
  Unlock,
  Layers,
  ArrowUp,
  ArrowDown,
  Copy,
  Trash2,
  Wand2,
  Languages,
  RotateCcw,
  Check,
  Split,
  TrendingUp,
  Clock,
  Columns3,
  SlidersHorizontal,
} from "lucide-react";
import { DocumentModel, DocumentElement, ElementType, DocumentMode } from "@/types/document";

interface SmartFormattingRibbonProps {
  document: DocumentModel;
  selectedElement: DocumentElement | null;
  onUpdateElement: (id: string, changes: Partial<DocumentElement>) => void;
  onUpdateElementStyle: (id: string, styleUpdates: Record<string, any>) => void;
  onAddBlock: (type: ElementType) => void;
  onDuplicateElement: (id: string) => void;
  onDeleteElement: (id: string) => void;
  onAiRefineElement: (id: string, actionType: string) => void;
  onApplyThemePreset?: (themeName: string) => void;
  documentMode: DocumentMode;
  isAiLoading?: boolean;
}

const FONT_FAMILIES = [
  { name: "Inter (Modern Sans)", value: "Inter, sans-serif" },
  { name: "Plus Jakarta Sans (Crisp Tech)", value: "'Plus Jakarta Sans', sans-serif" },
  { name: "Outfit (Geometric Clean)", value: "Outfit, sans-serif" },
  { name: "Playfair Display (Luxury Editorial)", value: "'Playfair Display', serif" },
  { name: "Merriweather (Classic Reading)", value: "Merriweather, serif" },
  { name: "Space Grotesk (Neo-Brutalist)", value: "'Space Grotesk', sans-serif" },
  { name: "DM Sans (Minimalist Executive)", value: "'DM Sans', sans-serif" },
  { name: "JetBrains Mono (Code/Technical)", value: "'JetBrains Mono', monospace" },
  { name: "Cinzel (Cinematic Title)", value: "Cinzel, serif" },
];

const FONT_SIZES = [10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 64, 72];

const COLOR_SWATCHES = [
  { name: "Obsidian", value: "#09090b" },
  { name: "Charcoal", value: "#27272a" },
  { name: "Zinc Slate", value: "#52525b" },
  { name: "Indigo Tech", value: "#4f46e5" },
  { name: "Blue Modern", value: "#2563eb" },
  { name: "Emerald Pro", value: "#059669" },
  { name: "Amber Warm", value: "#d97706" },
  { name: "Rose Accent", value: "#e11d48" },
  { name: "Violet Royal", value: "#7c3aed" },
  { name: "Pure White", value: "#ffffff" },
];

const HIGHLIGHT_SWATCHES = [
  { name: "None", value: "transparent" },
  { name: "Yellow Highlight", value: "#fef08a" },
  { name: "Green Soft", value: "#bbf7d0" },
  { name: "Blue Ice", value: "#bfdbfe" },
  { name: "Rose Blush", value: "#fecdd3" },
  { name: "Purple Soft", value: "#e9d5ff" },
  { name: "Light Gray", value: "#f4f4f5" },
  { name: "Dark Card", value: "#18181b" },
];

const THEME_PRESETS = [
  { name: "Minimalist Titanium", headingFont: "Inter", bodyFont: "Inter", primaryColor: "#09090b", accentColor: "#4f46e5", backgroundColor: "#ffffff" },
  { name: "Silicon Valley Tech", headingFont: "Plus Jakarta Sans", bodyFont: "Inter", primaryColor: "#0f172a", accentColor: "#2563eb", backgroundColor: "#f8fafc" },
  { name: "Editorial Broadside", headingFont: "Playfair Display", bodyFont: "Merriweather", primaryColor: "#1c1917", accentColor: "#9a3412", backgroundColor: "#fdfbf7" },
  { name: "Emerald Executive", headingFont: "Outfit", bodyFont: "DM Sans", primaryColor: "#064e3b", accentColor: "#059669", backgroundColor: "#f0fdf4" },
  { name: "Monochrome Swiss", headingFont: "Space Grotesk", bodyFont: "Inter", primaryColor: "#000000", accentColor: "#52525b", backgroundColor: "#ffffff" },
  { name: "Obsidian Night", headingFont: "Outfit", bodyFont: "Inter", primaryColor: "#fafafa", accentColor: "#818cf8", backgroundColor: "#0f172a" },
];

export const SmartFormattingRibbon: React.FC<SmartFormattingRibbonProps> = ({
  document: doc,
  selectedElement,
  onUpdateElement,
  onUpdateElementStyle,
  onAddBlock,
  onDuplicateElement,
  onDeleteElement,
  onAiRefineElement,
  onApplyThemePreset,
  documentMode,
  isAiLoading = false,
}) => {
  const [isFontMenuOpen, setIsFontMenuOpen] = useState(false);
  const [isColorMenuOpen, setIsColorMenuOpen] = useState(false);
  const [isHighlightMenuOpen, setIsHighlightMenuOpen] = useState(false);
  const [isAiRemixOpen, setIsAiRemixOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [isInsertMenuOpen, setIsInsertMenuOpen] = useState(false);

  const ribbonRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ribbonRef.current && !ribbonRef.current.contains(e.target as Node)) {
        setIsFontMenuOpen(false);
        setIsColorMenuOpen(false);
        setIsHighlightMenuOpen(false);
        setIsAiRemixOpen(false);
        setIsThemeMenuOpen(false);
        setIsInsertMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentStyle = selectedElement?.style || {};
  const currentFontFamily = currentStyle.fontFamily || "Inter, sans-serif";
  const currentFontSize = currentStyle.fontSize || (selectedElement?.type === "heading" ? 24 : 14);
  const isBold = (currentStyle.fontWeight as number) >= 600 || currentStyle.fontWeight === "bold";
  const isItalic = currentStyle.fontStyle === "italic";
  const isUnderline = currentStyle.textDecoration === "underline";
  const isStrikethrough = currentStyle.textDecoration === "line-through";
  const textAlign = currentStyle.textAlign || "left";

  const handleToggleBold = () => {
    if (!selectedElement) return;
    onUpdateElementStyle(selectedElement.id, {
      fontWeight: isBold ? 400 : 700,
    });
  };

  const handleToggleItalic = () => {
    if (!selectedElement) return;
    onUpdateElementStyle(selectedElement.id, {
      fontStyle: isItalic ? "normal" : "italic",
    });
  };

  const handleToggleUnderline = () => {
    if (!selectedElement) return;
    onUpdateElementStyle(selectedElement.id, {
      textDecoration: isUnderline ? "none" : "underline",
    });
  };

  const handleToggleStrikethrough = () => {
    if (!selectedElement) return;
    onUpdateElementStyle(selectedElement.id, {
      textDecoration: isStrikethrough ? "none" : "line-through",
    });
  };

  const handleChangeFontSize = (delta: number) => {
    if (!selectedElement) return;
    const newSize = Math.max(8, Math.min(120, currentFontSize + delta));
    onUpdateElementStyle(selectedElement.id, { fontSize: newSize });
  };

  const handleSetFontFamily = (family: string) => {
    if (!selectedElement) return;
    onUpdateElementStyle(selectedElement.id, { fontFamily: family });
    setIsFontMenuOpen(false);
  };

  const handleSetColor = (color: string) => {
    if (!selectedElement) return;
    onUpdateElementStyle(selectedElement.id, { color });
    setIsColorMenuOpen(false);
  };

  const handleSetHighlight = (backgroundColor: string) => {
    if (!selectedElement) return;
    onUpdateElementStyle(selectedElement.id, { backgroundColor });
    setIsHighlightMenuOpen(false);
  };

  const handleSetAlign = (align: "left" | "center" | "right" | "justify") => {
    if (!selectedElement) return;
    onUpdateElementStyle(selectedElement.id, { textAlign: align });
  };

  return (
    <div
      ref={ribbonRef}
      className="no-print h-10 border-b border-white/[0.06] bg-[#0c0e15] px-3 flex items-center justify-between text-xs text-zinc-300 select-none z-40 relative shrink-0 gap-2 overflow-visible"
    >
      {/* LEFT CLUSTER: Typography, Sizing & In-Line Styling */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Quick Insert Menu Button */}
        <div className="relative">
          <button
            onClick={() => setIsInsertMenuOpen((prev) => !prev)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 font-medium transition-colors border border-white/[0.07]"
            title="Insert Block or Component"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[11px]">Insert</span>
            <ChevronDown className="w-3 h-3 text-zinc-400" />
          </button>

          {isInsertMenuOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-60 bg-[#141620] border border-white/[0.12] rounded-xl shadow-2xl p-1.5 z-[100] animate-in fade-in-50 zoom-in-95 space-y-0.5">
              <div className="text-[9px] font-mono uppercase text-zinc-400 px-2 py-1 tracking-wider">
                Add Components
              </div>
              <button
                onClick={() => {
                  onAddBlock("heading");
                  setIsInsertMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-white/[0.08] text-left transition-colors text-xs"
              >
                <Type className="w-3.5 h-3.5 text-indigo-400" />
                <span>Heading & Subtitle</span>
              </button>
              <button
                onClick={() => {
                  onAddBlock("richText");
                  setIsInsertMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-white/[0.08] text-left transition-colors text-xs"
              >
                <AlignLeft className="w-3.5 h-3.5 text-blue-400" />
                <span>Text Block (Markdown)</span>
              </button>
              <button
                onClick={() => {
                  onAddBlock("card");
                  setIsInsertMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-white/[0.08] text-left transition-colors text-xs"
              >
                <Columns3 className="w-3.5 h-3.5 text-emerald-400" />
                <span>3-Card Feature Grid</span>
              </button>
              <button
                onClick={() => {
                  onAddBlock("metric");
                  setIsInsertMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-white/[0.08] text-left transition-colors text-xs"
              >
                <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                <span>KPI Stat Metric Box</span>
              </button>
              <button
                onClick={() => {
                  onAddBlock("callout");
                  setIsInsertMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-white/[0.08] text-left transition-colors text-xs"
              >
                <AlertCircle className="w-3.5 h-3.5 text-purple-400" />
                <span>Executive Callout Box</span>
              </button>
              <button
                onClick={() => {
                  onAddBlock("chart");
                  setIsInsertMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-white/[0.08] text-left transition-colors text-xs"
              >
                <BarChart3 className="w-3.5 h-3.5 text-sky-400" />
                <span>Analytical Chart</span>
              </button>
              <button
                onClick={() => {
                  onAddBlock("table");
                  setIsInsertMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-white/[0.08] text-left transition-colors text-xs"
              >
                <TableIcon className="w-3.5 h-3.5 text-teal-400" />
                <span>Data Table</span>
              </button>
              <button
                onClick={() => {
                  onAddBlock("formula");
                  setIsInsertMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-white/[0.08] text-left transition-colors text-xs"
              >
                <Sigma className="w-3.5 h-3.5 text-indigo-400" />
                <span>LaTeX Math Formula</span>
              </button>
              <button
                onClick={() => {
                  onAddBlock("checkboxGroup");
                  setIsInsertMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-white/[0.08] text-left transition-colors text-xs"
              >
                <CheckSquare className="w-3.5 h-3.5 text-rose-400" />
                <span>Verification Checklist</span>
              </button>
            </div>
          )}
        </div>

        <div className="h-4 w-[1px] bg-white/[0.08]" />

        {/* Font Family Selector */}
        <div className="relative">
          <button
            disabled={!selectedElement}
            onClick={() => setIsFontMenuOpen((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
              selectedElement
                ? "hover:bg-white/[0.08] text-zinc-200 border border-white/[0.06]"
                : "text-zinc-600 cursor-not-allowed"
            }`}
            title="Font Family"
          >
            <span className="truncate max-w-[100px] sm:max-w-[120px]">
              {FONT_FAMILIES.find((f) => f.value === currentFontFamily)?.name.split(" ")[0] || "Inter"}
            </span>
            <ChevronDown className="w-3 h-3 text-zinc-400 shrink-0" />
          </button>

          {isFontMenuOpen && selectedElement && (
            <div className="absolute top-full left-0 mt-1.5 w-64 bg-[#141620] border border-white/[0.12] rounded-xl shadow-2xl p-1 z-[100] max-h-64 overflow-y-auto">
              {FONT_FAMILIES.map((font) => (
                <button
                  key={font.value}
                  onClick={() => handleSetFontFamily(font.value)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left hover:bg-white/[0.08] text-zinc-300 hover:text-white text-xs transition-colors"
                  style={{ fontFamily: font.value }}
                >
                  <span>{font.name}</span>
                  {currentFontFamily === font.value && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Font Size Stepper */}
        <div className="flex items-center bg-white/[0.03] rounded-md border border-white/[0.06] p-0.5">
          <button
            disabled={!selectedElement}
            onClick={() => handleChangeFontSize(-1)}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/[0.08] disabled:opacity-30 transition-colors"
            title="Decrease Font Size"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="w-7 text-center font-mono text-[11px] text-zinc-200">
            {currentFontSize}
          </span>
          <button
            disabled={!selectedElement}
            onClick={() => handleChangeFontSize(1)}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/[0.08] disabled:opacity-30 transition-colors"
            title="Increase Font Size"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        <div className="h-4 w-[1px] bg-white/[0.08]" />

        {/* In-Line Text Formatting Toggles */}
        <div className="flex items-center gap-0.5 bg-white/[0.03] rounded-md border border-white/[0.06] p-0.5">
          <button
            disabled={!selectedElement}
            onClick={handleToggleBold}
            className={`p-1 rounded transition-colors ${
              isBold
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.08] disabled:opacity-30"
            }`}
            title="Bold (Cmd+B)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            disabled={!selectedElement}
            onClick={handleToggleItalic}
            className={`p-1 rounded transition-colors ${
              isItalic
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.08] disabled:opacity-30"
            }`}
            title="Italic (Cmd+I)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            disabled={!selectedElement}
            onClick={handleToggleUnderline}
            className={`p-1 rounded transition-colors ${
              isUnderline
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.08] disabled:opacity-30"
            }`}
            title="Underline (Cmd+U)"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>
          <button
            disabled={!selectedElement}
            onClick={handleToggleStrikethrough}
            className={`p-1 rounded transition-colors ${
              isStrikethrough
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.08] disabled:opacity-30"
            }`}
            title="Strikethrough"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Text Color Picker */}
        <div className="relative">
          <button
            disabled={!selectedElement}
            onClick={() => setIsColorMenuOpen((prev) => !prev)}
            className="p-1 px-1.5 rounded-md text-zinc-300 hover:text-white hover:bg-white/[0.08] disabled:opacity-30 flex items-center gap-1.5 transition-colors border border-transparent hover:border-white/[0.06]"
            title="Text Color"
          >
            <Palette className="w-3.5 h-3.5 text-zinc-300" />
            <div
              className="w-2.5 h-2.5 rounded-full border border-white/30"
              style={{ backgroundColor: currentStyle.color || "#09090b" }}
            />
          </button>

          {isColorMenuOpen && selectedElement && (
            <div className="absolute top-full left-0 mt-1.5 w-52 bg-[#141620] border border-white/[0.14] rounded-xl shadow-2xl p-2.5 z-[100] animate-in fade-in-50 zoom-in-95">
              <div className="text-[10px] font-mono uppercase text-zinc-400 mb-2 flex items-center justify-between">
                <span>Text Color</span>
                <span className="text-[9px] text-zinc-500 font-sans">{currentStyle.color || "Default"}</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {COLOR_SWATCHES.map((swatch) => (
                  <button
                    key={swatch.value}
                    onClick={() => handleSetColor(swatch.value)}
                    className="w-7 h-7 rounded-lg border border-white/20 flex items-center justify-center hover:scale-110 transition-transform shadow-xs"
                    style={{ backgroundColor: swatch.value }}
                    title={swatch.name}
                  >
                    {currentStyle.color === swatch.value && (
                      <Check className="w-3.5 h-3.5 text-white mix-blend-difference" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Background / Highlight Picker */}
        <div className="relative">
          <button
            disabled={!selectedElement}
            onClick={() => setIsHighlightMenuOpen((prev) => !prev)}
            className="p-1 px-1.5 rounded-md text-zinc-300 hover:text-white hover:bg-white/[0.08] disabled:opacity-30 flex items-center gap-1.5 transition-colors border border-transparent hover:border-white/[0.06]"
            title="Card / Text Background"
          >
            <Highlighter className="w-3.5 h-3.5 text-zinc-300" />
            <div
              className="w-2.5 h-2.5 rounded-full border border-white/30"
              style={{ backgroundColor: currentStyle.backgroundColor || "transparent" }}
            />
          </button>

          {isHighlightMenuOpen && selectedElement && (
            <div className="absolute top-full left-0 mt-1.5 w-52 bg-[#141620] border border-white/[0.14] rounded-xl shadow-2xl p-2.5 z-[100] animate-in fade-in-50 zoom-in-95">
              <div className="text-[10px] font-mono uppercase text-zinc-400 mb-2 flex items-center justify-between">
                <span>Background Fill</span>
                <span className="text-[9px] text-zinc-500 font-sans">{currentStyle.backgroundColor || "Transparent"}</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {HIGHLIGHT_SWATCHES.map((swatch) => (
                  <button
                    key={swatch.value}
                    onClick={() => handleSetHighlight(swatch.value)}
                    className="w-8 h-8 rounded-lg border border-white/20 flex items-center justify-center hover:scale-110 transition-transform relative shadow-xs"
                    style={{ backgroundColor: swatch.value }}
                    title={swatch.name}
                  >
                    {swatch.value === "transparent" ? (
                      <span className="text-[9px] text-zinc-400 font-mono">None</span>
                    ) : (
                      currentStyle.backgroundColor === swatch.value && (
                        <Check className="w-3.5 h-3.5 text-zinc-900" />
                      )
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="h-4 w-[1px] bg-white/[0.08]" />

        {/* Text Alignment */}
        <div className="flex items-center gap-0.5 bg-white/[0.03] rounded-md border border-white/[0.06] p-0.5">
          <button
            disabled={!selectedElement}
            onClick={() => handleSetAlign("left")}
            className={`p-1 rounded transition-colors ${
              textAlign === "left"
                ? "bg-white/[0.15] text-white"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.08] disabled:opacity-30"
            }`}
            title="Align Left"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            disabled={!selectedElement}
            onClick={() => handleSetAlign("center")}
            className={`p-1 rounded transition-colors ${
              textAlign === "center"
                ? "bg-white/[0.15] text-white"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.08] disabled:opacity-30"
            }`}
            title="Align Center"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button
            disabled={!selectedElement}
            onClick={() => handleSetAlign("right")}
            className={`p-1 rounded transition-colors ${
              textAlign === "right"
                ? "bg-white/[0.15] text-white"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.08] disabled:opacity-30"
            }`}
            title="Align Right"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>
          <button
            disabled={!selectedElement}
            onClick={() => handleSetAlign("justify")}
            className={`p-1 rounded transition-colors ${
              textAlign === "justify"
                ? "bg-white/[0.15] text-white"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.08] disabled:opacity-30"
            }`}
            title="Justify"
          >
            <AlignJustify className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* RIGHT CLUSTER: AI Transform, Theme Swapper & Block Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* AI Remix Dropdown */}
        <div className="relative">
          <button
            disabled={!selectedElement || isAiLoading}
            onClick={() => setIsAiRemixOpen((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
              selectedElement
                ? "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-xs hover:brightness-110"
                : "bg-white/[0.04] text-zinc-600 cursor-not-allowed"
            }`}
            title="AI Smart Remix & Transform"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-[11px]">AI Remix</span>
            <ChevronDown className="w-3 h-3 opacity-75" />
          </button>

          {isAiRemixOpen && selectedElement && (
            <div className="absolute top-full right-0 mt-1.5 w-64 bg-[#141620] border border-white/[0.14] rounded-xl shadow-2xl p-1.5 z-[100] animate-in fade-in-50 zoom-in-95 space-y-0.5">
              <div className="text-[9px] font-mono uppercase text-indigo-300 px-2 py-1 tracking-wider flex items-center justify-between">
                <span>Layout Transforms</span>
                <span className="text-[8px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded">AI ENGINE</span>
              </div>
              <button
                onClick={() => {
                  onAiRefineElement(selectedElement.id, "card_grid");
                  setIsAiRemixOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-200 hover:text-white hover:bg-white/[0.08] text-left text-xs transition-colors"
              >
                <Columns3 className="w-3.5 h-3.5 text-emerald-400" />
                <div>
                  <div className="font-medium">Turn into 3-Card Grid</div>
                  <div className="text-[10px] text-zinc-400">Structured feature comparison cards</div>
                </div>
              </button>
              <button
                onClick={() => {
                  onAiRefineElement(selectedElement.id, "stat_metric");
                  setIsAiRemixOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-200 hover:text-white hover:bg-white/[0.08] text-left text-xs transition-colors"
              >
                <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                <div>
                  <div className="font-medium">Turn into KPI Metric Cards</div>
                  <div className="text-[10px] text-zinc-400">Big bold figures with % delta indicators</div>
                </div>
              </button>
              <button
                onClick={() => {
                  onAiRefineElement(selectedElement.id, "timeline");
                  setIsAiRemixOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-200 hover:text-white hover:bg-white/[0.08] text-left text-xs transition-colors"
              >
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                <div>
                  <div className="font-medium">Turn into Milestone Roadmap</div>
                  <div className="text-[10px] text-zinc-400">Sequential milestone timeline</div>
                </div>
              </button>

              <div className="border-t border-white/[0.06] my-1" />

              <div className="text-[9px] font-mono uppercase text-zinc-400 px-2 py-1 tracking-wider">
                Writing Polish
              </div>
              <button
                onClick={() => {
                  onAiRefineElement(selectedElement.id, "concise");
                  setIsAiRemixOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-200 hover:text-white hover:bg-white/[0.08] text-left text-xs transition-colors"
              >
                <Wand2 className="w-3.5 h-3.5 text-purple-400" />
                <span>Make Ultra Concise & Punchy</span>
              </button>
              <button
                onClick={() => {
                  onAiRefineElement(selectedElement.id, "professional");
                  setIsAiRemixOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-200 hover:text-white hover:bg-white/[0.08] text-left text-xs transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Executive Presentation Tone</span>
              </button>
              <button
                onClick={() => {
                  onAiRefineElement(selectedElement.id, "fix_grammar");
                  setIsAiRemixOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-200 hover:text-white hover:bg-white/[0.08] text-left text-xs transition-colors"
              >
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Fix Spelling & Grammar</span>
              </button>
            </div>
          )}
        </div>

        {/* Global Document Themes Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsThemeMenuOpen((prev) => !prev)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 text-xs font-medium transition-colors border border-white/[0.07]"
            title="Document Visual Themes"
          >
            <Palette className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[11px] hidden sm:inline">Theme</span>
            <ChevronDown className="w-3 h-3 text-zinc-400" />
          </button>

          {isThemeMenuOpen && (
            <div className="absolute top-full right-0 mt-1.5 w-64 bg-[#141620] border border-white/[0.12] rounded-xl shadow-2xl p-1.5 z-[100] animate-in fade-in-50 zoom-in-95 space-y-0.5">
              <div className="text-[9px] font-mono uppercase text-zinc-400 px-2 py-1 tracking-wider">
                Curated Design Themes
              </div>
              {THEME_PRESETS.map((t) => (
                <button
                  key={t.name}
                  onClick={() => {
                    if (onApplyThemePreset) onApplyThemePreset(t.name);
                    setIsThemeMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-zinc-200 hover:text-white hover:bg-white/[0.08] text-left text-xs transition-colors"
                >
                  <div>
                    <div className="font-semibold text-[11px]">{t.name}</div>
                    <div className="text-[10px] text-zinc-400">
                      {t.headingFont} + {t.bodyFont}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full border border-black/30" style={{ backgroundColor: t.primaryColor }} />
                    <span className="w-3 h-3 rounded-full border border-black/30" style={{ backgroundColor: t.accentColor }} />
                    <span className="w-3 h-3 rounded-full border border-black/30" style={{ backgroundColor: t.backgroundColor }} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected Block Quick Utility Actions */}
        {selectedElement && (
          <div className="flex items-center gap-0.5 pl-1.5 border-l border-white/[0.08]">
            <button
              onClick={() => onDuplicateElement(selectedElement.id)}
              className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
              title="Duplicate (Cmd+D)"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDeleteElement(selectedElement.id)}
              className="p-1.5 rounded text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Delete (Backspace/Delete)"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
