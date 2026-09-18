"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  FileText,
  Sliders,
  Play,
  Share2,
  Download,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ShieldCheck,
  ChevronDown,
  Sparkles,
  Layers,
  Presentation,
  CheckSquare,
  FileSpreadsheet,
  Check,
  Printer,
  Settings,
  HelpCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { DocumentMode } from "@/types/document";

export interface StudioHeaderProps {
  title: string;
  onTitleChange: (title: string) => void;
  documentMode: DocumentMode;
  onModeChange: (mode: DocumentMode) => void;
  activePageIndex: number;
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
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
  onShare?: () => void;
  onExport?: (format: "pdf" | "png" | "json" | "markdown") => void;
}

export const StudioHeader: React.FC<StudioHeaderProps> = ({
  title,
  onTitleChange,
  documentMode,
  onModeChange,
  activePageIndex,
  totalPages,
  onPrevPage,
  onNextPage,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoom,
  onZoomChange,
  onFitToScreen,
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
  onShare,
  onExport,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [localTitle, setLocalTitle] = useState(title);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalTitle(title);
  }, [title]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setIsExportMenuOpen(false);
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

  const handleCopyShareLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <>
      <header className="no-print h-13 bg-[#111215] text-zinc-100 border-b border-white/[0.07] px-3.5 flex items-center justify-between shrink-0 select-none z-30 transition-colors">
        {/* Left Section: Brand Logo, Editable Title, Save Badge */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2">
            {/* PagePilot Icon */}
            <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-white/[0.1] flex items-center justify-center text-zinc-200 shadow-2xs">
              <span className="font-bold text-xs font-mono tracking-tighter text-indigo-400">
                P<span className="text-zinc-400">P</span>
              </span>
            </div>
            <span className="font-semibold tracking-tight text-xs sm:text-sm text-zinc-200 font-sans hidden md:inline-block">
              PagePilot
            </span>
          </div>

          <div className="h-4 w-px bg-white/[0.08] mx-0.5 hidden sm:block" />

          {/* Document Title (Inline Editable) */}
          <div className="min-w-0 max-w-xs md:max-w-sm">
            {isEditingTitle ? (
              <input
                type="text"
                autoFocus
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleTitleSubmit();
                  if (e.key === "Escape") {
                    setLocalTitle(title);
                    setIsEditingTitle(false);
                  }
                }}
                className="bg-[#1a1c22] text-xs sm:text-sm font-medium text-white px-2 py-0.5 rounded border border-indigo-500/50 outline-none w-full shadow-xs"
              />
            ) : (
              <div
                onClick={() => setIsEditingTitle(true)}
                title="Click to rename document"
                className="text-xs sm:text-sm font-medium text-zinc-300 hover:text-white truncate cursor-pointer px-1.5 py-0.5 rounded hover:bg-white/[0.05] transition-colors"
              >
                {title || "Untitled Document"}
              </div>
            )}
          </div>

          {/* Cloud Saved Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-zinc-500 pl-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[11px]">Saved</span>
          </div>
        </div>

        {/* Center Section: Document Mode Switcher, Page Nav, Zoom */}
        <div className="flex items-center gap-2">
          {/* Mode Selector Tabs */}
          <div className="flex items-center bg-[#18191e] border border-white/[0.07] p-0.5 rounded-lg text-xs">
            <button
              onClick={() => onModeChange("document")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all font-medium text-[11px] ${
                documentMode === "document"
                  ? "bg-zinc-800 text-white shadow-2xs border border-white/[0.08]"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              title="Document Mode (Vertical US Letter / A4 pages)"
            >
              <FileText className="w-3 h-3" />
              <span>Doc</span>
            </button>

            <button
              onClick={() => onModeChange("presentation")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all font-medium text-[11px] ${
                documentMode === "presentation"
                  ? "bg-zinc-800 text-white shadow-2xs border border-white/[0.08]"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              title="Presentation Mode (16:9 Slide Workspace)"
            >
              <Presentation className="w-3 h-3" />
              <span>Slides</span>
            </button>

            <button
              onClick={() => onModeChange("worksheet")}
              className={`hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-md transition-all font-medium text-[11px] ${
                documentMode === "worksheet"
                  ? "bg-zinc-800 text-white shadow-2xs border border-white/[0.08]"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              title="Worksheet Mode (Print Margin Safe Problem Set)"
            >
              <FileSpreadsheet className="w-3 h-3" />
              <span>Worksheet</span>
            </button>
          </div>

          {/* Page / Slide Stepper Navigation */}
          {totalPages > 1 && (
            <div className="flex items-center bg-[#18191e] border border-white/[0.07] rounded-lg px-1 py-0.5 text-xs text-zinc-300">
              <button
                onClick={onPrevPage}
                disabled={activePageIndex <= 0}
                className="p-1 rounded hover:bg-white/[0.07] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Previous Page / Slide"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-1.5 text-[11px] font-mono text-zinc-400">
                {activePageIndex + 1} / {totalPages}
              </span>
              <button
                onClick={onNextPage}
                disabled={activePageIndex >= totalPages - 1}
                className="p-1 rounded hover:bg-white/[0.07] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Next Page / Slide"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Zoom Controls */}
          <div className="hidden xl:flex items-center bg-[#18191e] border border-white/[0.07] rounded-lg px-1 py-0.5 text-xs text-zinc-400">
            <button
              onClick={() => onZoomChange(Math.max(0.4, Math.round((zoom - 0.1) * 10) / 10))}
              className="p-1 rounded hover:text-white hover:bg-white/[0.07] transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 text-[11px] font-mono text-zinc-300 min-w-[38px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => onZoomChange(Math.min(1.6, Math.round((zoom + 0.1) * 10) / 10))}
              className="p-1 rounded hover:text-white hover:bg-white/[0.07] transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onFitToScreen}
              className="p-1 rounded hover:text-white hover:bg-white/[0.07] ml-0.5 text-[10px] text-zinc-400"
              title="Fit to Screen"
            >
              Fit
            </button>
          </div>
        </div>

        {/* Right Section: Undo, Redo, Preview, Check, Share, Export */}
        <div className="flex items-center gap-1.5">
          {/* Undo / Redo */}
          <div className="flex items-center bg-[#18191e] border border-white/[0.07] rounded-lg p-0.5">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className="p-1.5 text-zinc-400 hover:text-white disabled:opacity-25 rounded hover:bg-white/[0.07] transition-colors"
              title="Undo (Ctrl+Z / ⌘Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className="p-1.5 text-zinc-400 hover:text-white disabled:opacity-25 rounded hover:bg-white/[0.07] transition-colors"
              title="Redo (Ctrl+Y / ⌘⇧Z)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quality Check Button */}
          <button
            onClick={onCheckPage}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              issueCount > 0
                ? "bg-amber-950/40 text-amber-300 border-amber-800/60 hover:bg-amber-900/50"
                : "bg-[#18191e] text-zinc-300 border-white/[0.07] hover:text-white hover:bg-white/[0.06]"
            }`}
            title="Run Quality & 0.45'' Print Safe Margins Check"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Check</span>
            {issueCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-zinc-950 font-bold text-[9px] flex items-center justify-center">
                {issueCount}
              </span>
            )}
          </button>

          {/* Preview / Present Mode Button */}
          <button
            onClick={onTogglePreview}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              isPreviewMode
                ? "bg-indigo-600 text-white border-indigo-500"
                : "bg-[#18191e] text-zinc-300 border-white/[0.07] hover:text-white hover:bg-white/[0.06]"
            }`}
            title={documentMode === "presentation" ? "Present Slides" : "Distraction-Free Reading Mode"}
          >
            {documentMode === "presentation" ? (
              <Play className="w-3.5 h-3.5 fill-current text-zinc-200" />
            ) : (
              <Eye className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">
              {isPreviewMode ? "Editing" : documentMode === "presentation" ? "Present" : "Preview"}
            </span>
          </button>

          {/* Share Button */}
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#18191e] text-zinc-300 border border-white/[0.07] hover:text-white hover:bg-white/[0.06] text-xs font-medium transition-colors"
            title="Share document link"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Share</span>
          </button>

          {/* Export Dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-200 hover:bg-white text-zinc-950 text-xs font-medium transition-all shadow-xs"
              title="Export Document"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
              <ChevronDown className="w-3 h-3 ml-0.5 opacity-60" />
            </button>

            {isExportMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-48 bg-[#18191e] border border-white/[0.1] rounded-xl shadow-2xl py-1 text-xs text-zinc-200 z-50 animate-in fade-in-50 zoom-in-95 duration-100">
                <button
                  onClick={() => {
                    setIsExportMenuOpen(false);
                    onOpenPrintPreview();
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-white/[0.08] flex items-center gap-2"
                >
                  <Printer className="w-4 h-4 text-zinc-400" />
                  <div>
                    <div className="font-medium text-white">Print / PDF Vector</div>
                    <div className="text-[10px] text-zinc-400">High-res print & PDF export</div>
                  </div>
                </button>

                <div className="h-px bg-white/[0.06] my-1" />

                <button
                  onClick={() => {
                    setIsExportMenuOpen(false);
                    onExport?.("markdown");
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-white/[0.08] flex items-center gap-2"
                >
                  <FileText className="w-4 h-4 text-zinc-400" />
                  <div>
                    <div className="font-medium">Export Markdown + LaTeX</div>
                    <div className="text-[10px] text-zinc-400">Copy equations & text</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setIsExportMenuOpen(false);
                    onExport?.("json");
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-white/[0.08] flex items-center gap-2"
                >
                  <Download className="w-4 h-4 text-zinc-400" />
                  <div>
                    <div className="font-medium">Export JSON Document</div>
                    <div className="text-[10px] text-zinc-400">Save complete state</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Share Modal Dialog */}
      {isShareModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-[#18191e] border border-white/[0.1] rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-indigo-400" />
                <h3 className="font-semibold text-sm text-white">Share Document</h3>
              </div>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="text-zinc-400 hover:text-white text-xs px-2 py-1 rounded hover:bg-white/[0.06]"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Anyone with this link can view this document and export presentation slides or high-resolution vector PDFs.
            </p>

            <div className="flex items-center gap-2 bg-[#111215] p-1.5 rounded-lg border border-white/[0.08]">
              <input
                type="text"
                readOnly
                value={typeof window !== "undefined" ? window.location.href : "https://pagepilot.app/doc"}
                className="bg-transparent text-xs text-zinc-300 font-mono flex-1 outline-none px-2"
              />
              <button
                onClick={handleCopyShareLink}
                className="px-3 py-1.5 rounded-md bg-zinc-200 hover:bg-white text-zinc-950 font-medium text-xs flex items-center gap-1.5 shrink-0 transition-colors"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <span>Copy Link</span>
                )}
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-white/[0.07] hover:bg-white/[0.12] text-xs font-medium text-white transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
