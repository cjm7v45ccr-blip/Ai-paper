"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Sigma,
  Eye,
  Printer,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ShieldCheck,
  ChevronDown,
  Layers,
  FileCode2,
  Sliders,
  Check,
  Wand2,
  Type,
  Plus,
  Scale,
} from "lucide-react";

export interface StudioHeaderProps {
  title: string;
  onTitleChange: (title: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onFitToScreen: () => void;
  onPrint: () => void;
  onOpenPrintPreview: () => void;
  onCheckPage: () => void;
  issueCount?: number;
  isBlackAndWhite: boolean;
  onToggleBW: () => void;
  showMargins: boolean;
  onToggleMargins: () => void;
  isPreviewMode: boolean;
  onTogglePreview: () => void;
  onOpenMarkdownMathModal?: () => void;
  onInsertEquation?: (preset?: any) => void;
  onInsertElement?: (type: string) => void;
  activeFontFamily?: string;
  onFontFamilyChange?: (font: string) => void;
  onAutoDesign?: (mode: string) => void;
}

export const StudioHeader: React.FC<StudioHeaderProps> = ({
  title,
  onTitleChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoom,
  onZoomChange,
  onFitToScreen,
  onPrint,
  onOpenPrintPreview,
  onCheckPage,
  issueCount = 0,
  isBlackAndWhite,
  onToggleBW,
  showMargins,
  onToggleMargins,
  isPreviewMode,
  onTogglePreview,
  onOpenMarkdownMathModal,
  onInsertEquation,
  onInsertElement,
  activeFontFamily = "Inter, sans-serif",
  onFontFamilyChange,
  onAutoDesign,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [localTitle, setLocalTitle] = useState(title);
  const [isDiaDropdownOpen, setIsDiaDropdownOpen] = useState(false);
  const [isInsertDropdownOpen, setIsInsertDropdownOpen] = useState(false);
  const diaDropdownRef = useRef<HTMLDivElement>(null);
  const insertDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalTitle(title);
  }, [title]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (diaDropdownRef.current && !diaDropdownRef.current.contains(e.target as Node)) {
        setIsDiaDropdownOpen(false);
      }
      if (insertDropdownRef.current && !insertDropdownRef.current.contains(e.target as Node)) {
        setIsInsertDropdownOpen(false);
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (localTitle.trim()) {
      onTitleChange(localTitle.trim());
    } else {
      setLocalTitle(title);
    }
  };

  return (
    <header className="no-print h-14 bg-slate-950 text-slate-100 border-b border-slate-800/80 px-4 flex items-center justify-between shrink-0 select-none z-30 shadow-md">
      {/* 1. Left Studio Brand & Dynamic Title */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2">
          {/* Studio Emblem */}
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-sm shrink-0">
            <Sparkles className="w-4 h-4 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-sm text-white font-sans">
                PagePilot
              </span>
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-700/60">
                Dia Studio
              </span>
            </div>
          </div>
        </div>

        <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />

        {/* Editable Document Title */}
        <div className="min-w-0 max-w-xs md:max-w-md">
          {isEditingTitle ? (
            <input
              type="text"
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTitleSubmit();
                if (e.key === "Escape") {
                  setIsEditingTitle(false);
                  setLocalTitle(title);
                }
              }}
              autoFocus
              className="bg-slate-900 border border-indigo-500 text-white text-xs font-semibold px-2 py-1 rounded outline-none w-full shadow-inner"
            />
          ) : (
            <button
              onClick={() => setIsEditingTitle(true)}
              className="text-xs font-semibold text-slate-200 hover:text-white truncate block text-left px-2 py-1 rounded hover:bg-slate-900/80 transition-colors group"
              title="Click to rename document"
            >
              <span className="truncate">{title || "Untitled Document"}</span>
              <span className="text-[10px] text-slate-500 font-mono ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                (Edit)
              </span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Center: Dia Autonomous Craft & Studio Tools */}
      <div className="flex items-center gap-2">
        {/* Dia Autonomous Layout Engine (The Designist & Top Engineer) */}
        <div className="relative" ref={diaDropdownRef}>
          <div className="inline-flex rounded-lg shadow-sm">
            <button
              onClick={() => onAutoDesign?.("auto")}
              className="h-8 px-3 rounded-l-lg bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 hover:from-violet-500 hover:via-indigo-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(99,102,241,0.35)] hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] border border-indigo-400/30 active:scale-95"
              title="Dia Autonomous Redesign — Dia analyzes and does whatever looks best!"
            >
              <Wand2 className="w-3.5 h-3.5 text-amber-300" />
              <span>Dia Auto-Craft</span>
            </button>
            <button
              onClick={() => setIsDiaDropdownOpen(!isDiaDropdownOpen)}
              className="h-8 px-1.5 rounded-r-lg bg-indigo-700 hover:bg-indigo-600 text-white border-l border-indigo-500/40 flex items-center justify-center transition-colors"
              title="Dia Designist Directives"
            >
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          {/* Dia Intelligence Dropdown */}
          {isDiaDropdownOpen && (
            <div className="absolute left-0 mt-1.5 w-72 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl p-2 z-50 text-xs text-slate-200 animate-in fade-in zoom-in-95 duration-100 backdrop-blur-xl">
              <div className="px-2.5 py-1.5 border-b border-slate-800">
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Dia Creative Engine
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                  Autonomous designist analyzes semantic hierarchy, KaTeX math & golden-ratio grids.
                </p>
              </div>

              <div className="mt-1 space-y-1">
                <button
                  onClick={() => {
                    onAutoDesign?.("auto");
                    setIsDiaDropdownOpen(false);
                  }}
                  className="w-full text-left p-2 rounded-lg hover:bg-slate-800 hover:text-white flex items-start gap-2.5 transition-colors group"
                >
                  <Wand2 className="w-4 h-4 text-indigo-400 group-hover:text-indigo-300 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-200 group-hover:text-white text-xs">
                      Dia Autonomous Redesign
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Dia analyzes the full content and applies optimal bento balance.
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onAutoDesign?.("chemistry");
                    setIsDiaDropdownOpen(false);
                  }}
                  className="w-full text-left p-2 rounded-lg hover:bg-slate-800 hover:text-white flex items-start gap-2.5 transition-colors group"
                >
                  <span className="text-sm shrink-0">🧪</span>
                  <div>
                    <div className="font-bold text-slate-200 group-hover:text-white text-xs">
                      STEM / Chemistry Lab Guide
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Elevated KaTeX $D=m/V$ card, mnemonic & error analysis.
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onAutoDesign?.("balance");
                    setIsDiaDropdownOpen(false);
                  }}
                  className="w-full text-left p-2 rounded-lg hover:bg-slate-800 hover:text-white flex items-start gap-2.5 transition-colors group"
                >
                  <Scale className="w-4 h-4 text-cyan-400 group-hover:text-cyan-300 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-200 group-hover:text-white text-xs">
                      Equalize Column Weights
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Re-balances left and right columns to prevent uneven bottom drift.
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onAutoDesign?.("margins");
                    setIsDiaDropdownOpen(false);
                  }}
                  className="w-full text-left p-2 rounded-lg hover:bg-slate-800 hover:text-white flex items-start gap-2.5 transition-colors group"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400 group-hover:text-emerald-300 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-200 group-hover:text-white text-xs">
                      Clamp to 0.45" Safe Margins
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Strict print-safety verification and boundary realignment.
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Math KaTeX Studio Trigger */}
        <button
          onClick={onOpenMarkdownMathModal}
          className="h-8 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          title="Open Math Markdown & KaTeX Engine Studio"
        >
          <Sigma className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden md:inline">Math Studio</span>
        </button>

        {/* Optical Telemetry Pill (Desktop) */}
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-slate-400">
          <span className="flex items-center gap-1 text-emerald-400 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            0.45" Safe
          </span>
          <span>•</span>
          <span className="text-slate-300">KaTeX Active</span>
        </div>
      </div>

      {/* 3. Right: Viewport, Quality, Preview & Publish Actions */}
      <div className="flex items-center gap-2">
        {/* Undo / Redo */}
        <div className="flex items-center rounded-lg bg-slate-900 border border-slate-800 overflow-hidden">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors border-l border-slate-800"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center rounded-lg bg-slate-900 border border-slate-800 px-1.5 py-1 text-xs">
          <button
            onClick={() => onZoomChange(Math.max(0.4, zoom - 0.1))}
            title="Zoom Out"
            className="text-slate-400 hover:text-white p-0.5"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <span className="w-10 text-center font-mono text-[11px] text-slate-300 font-medium">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => onZoomChange(Math.min(1.6, zoom + 0.1))}
            title="Zoom In"
            className="text-slate-400 hover:text-white p-0.5"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
          <button
            onClick={onFitToScreen}
            title="Fit Page to Window"
            className="ml-1 pl-1 border-l border-slate-800 text-slate-400 hover:text-white"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
        </div>

        {/* B&W Ink Simulator Toggle */}
        <button
          onClick={onToggleBW}
          title="Toggle B&W Print Ink Simulation"
          className={`h-8 px-2 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-colors ${
            isBlackAndWhite
              ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
              : "bg-slate-900 text-slate-400 hover:text-white border-slate-800"
          }`}
        >
          <span>{isBlackAndWhite ? "B&W" : "Color"}</span>
        </button>

        {/* Reading Preview Toggle */}
        <button
          onClick={onTogglePreview}
          title="Toggle Preview / Edit Mode"
          className={`h-8 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
            isPreviewMode
              ? "bg-indigo-600 text-white border-indigo-400"
              : "bg-slate-900 text-slate-300 hover:text-white border-slate-800"
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{isPreviewMode ? "Editing" : "Preview"}</span>
        </button>

        {/* Publish PDF / Print Trigger */}
        <button
          onClick={onOpenPrintPreview}
          className="h-8 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95"
          title="Publish High-Resolution PDF or Print"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Publish PDF</span>
        </button>
      </div>
    </header>
  );
};
