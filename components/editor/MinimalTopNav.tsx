"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Undo2,
  Redo2,
  Play,
  Share2,
  Download,
  Plus,
  Sparkles,
  Check,
  ChevronDown,
  FileText,
  Presentation,
  CheckSquare,
  FileCode,
  Copy,
} from "lucide-react";
import { DocumentMode } from "@/types/document";

interface MinimalTopNavProps {
  title: string;
  onUpdateTitle: (newTitle: string) => void;
  documentMode: DocumentMode;
  onChangeMode: (newMode: DocumentMode) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onAddSectionOrSlide: () => void;
  onRegenerate: () => void;
  onOpenPresenter: () => void;
  onBackToHome: () => void;
  onExport: (format: "pdf" | "png" | "json" | "markdown") => void;
}

export const MinimalTopNav: React.FC<MinimalTopNavProps> = ({
  title,
  onUpdateTitle,
  documentMode,
  onChangeMode,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onAddSectionOrSlide,
  onRegenerate,
  onOpenPresenter,
  onBackToHome,
  onExport,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [localTitle, setLocalTitle] = useState(title);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalTitle(title);
  }, [title]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setIsExportOpen(false);
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (localTitle.trim() && localTitle !== title) {
      onUpdateTitle(localTitle.trim());
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard?.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <header className="h-14 border-b border-white/[0.08] bg-[#0d0f14]/90 backdrop-blur-md px-4 flex items-center justify-between text-zinc-300 select-none z-30 shrink-0">
      {/* Left Section: Back, Title, Mode Badge, Saved status */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBackToHome}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          title="Back to Homepage"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {/* Project Name (Inline Editable) */}
        {isEditingTitle ? (
          <input
            type="text"
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleTitleSubmit();
              if (e.key === "Escape") setIsEditingTitle(false);
            }}
            autoFocus
            className="text-xs sm:text-sm font-semibold text-white bg-zinc-800 border border-white/[0.15] rounded-md px-2 py-0.5 outline-none max-w-[220px] sm:max-w-md"
          />
        ) : (
          <button
            onClick={() => setIsEditingTitle(true)}
            className="text-xs sm:text-sm font-semibold text-white hover:text-indigo-300 transition-colors truncate max-w-[180px] sm:max-w-xs md:max-w-md text-left"
            title="Click to rename"
          >
            {title || "Untitled Project"}
          </button>
        )}

        {/* Format Pill Badge */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-[11px] font-mono text-zinc-400">
          {documentMode === "presentation" ? (
            <Presentation className="w-3 h-3 text-indigo-400" />
          ) : (
            <FileText className="w-3 h-3 text-emerald-400" />
          )}
          <span className="capitalize">{documentMode === "presentation" ? "16:9 Deck" : "Document"}</span>
        </div>

        {/* Subtle Auto-Save Indicator */}
        <div className="hidden md:flex items-center gap-1 text-[11px] text-zinc-500 font-mono">
          <Check className="w-3 h-3 text-zinc-500" />
          <span>Saved</span>
        </div>
      </div>

      {/* Right Section: Undo/Redo, Add, Regenerate, Present, Share, Export */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Undo / Redo */}
        <div className="flex items-center bg-white/[0.04] border border-white/[0.06] rounded-lg p-0.5">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 rounded-md text-zinc-400 hover:text-white disabled:opacity-20 disabled:pointer-events-none transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 rounded-md text-zinc-400 hover:text-white disabled:opacity-20 disabled:pointer-events-none transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Add Section / Slide Button */}
        <button
          onClick={onAddSectionOrSlide}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.09] text-zinc-300 hover:text-white text-xs font-medium transition-colors"
          title={documentMode === "presentation" ? "Add new slide" : "Add new section"}
        >
          <Plus className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">
            {documentMode === "presentation" ? "Add Slide" : "Add Section"}
          </span>
        </button>

        {/* Regenerate First Draft */}
        <button
          onClick={onRegenerate}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.09] text-zinc-300 hover:text-white text-xs font-medium transition-colors"
          title="Regenerate structure and polish with AI"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden md:inline">Regenerate</span>
        </button>

        {/* Fullscreen Present / Preview Button */}
        <button
          onClick={onOpenPresenter}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-all active:scale-[0.98]"
          title="Present Fullscreen"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Present</span>
        </button>

        {/* Share Button & Modal */}
        <div className="relative">
          <button
            onClick={() => setIsShareOpen(!isShareOpen)}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5"
            title="Share document link"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Share</span>
          </button>

          {isShareOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-[#161822] border border-white/[0.12] rounded-2xl p-4 shadow-2xl z-50 animate-in fade-in-50 zoom-in-95 duration-100 text-left">
              <h4 className="text-xs font-semibold text-white">Share Project</h4>
              <p className="mt-1 text-[11px] text-zinc-400 leading-snug">
                Anyone with the link can view this {documentMode === "presentation" ? "deck" : "document"}.
              </p>

              <button
                onClick={handleCopyLink}
                className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors shadow-xs"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Web Link</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Export Dropdown */}
        <div className="relative" ref={exportRef}>
          <button
            onClick={() => setIsExportOpen(!isExportOpen)}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white text-xs font-medium transition-colors flex items-center gap-1"
            title="Export Options"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {isExportOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-[#161822] border border-white/[0.12] rounded-2xl shadow-2xl py-1 text-xs text-zinc-300 z-50 animate-in fade-in-50 zoom-in-95 duration-100 text-left">
              <button
                onClick={() => {
                  setIsExportOpen(false);
                  onExport("pdf");
                }}
                className="w-full text-left px-3.5 py-2.5 hover:bg-white/[0.06] hover:text-white flex items-center gap-2.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                <div>
                  <div className="font-medium text-white">Print / PDF</div>
                  <div className="text-[10px] text-zinc-400">High-resolution vector output</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsExportOpen(false);
                  onExport("markdown");
                }}
                className="w-full text-left px-3.5 py-2.5 hover:bg-white/[0.06] hover:text-white flex items-center gap-2.5 transition-colors border-t border-white/[0.06]"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <div>
                  <div className="font-medium text-white">Markdown (.md)</div>
                  <div className="text-[10px] text-zinc-400">With KaTeX math syntax</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsExportOpen(false);
                  onExport("json");
                }}
                className="w-full text-left px-3.5 py-2.5 hover:bg-white/[0.06] hover:text-white flex items-center gap-2.5 transition-colors border-t border-white/[0.06]"
              >
                <FileCode className="w-3.5 h-3.5 text-amber-400" />
                <div>
                  <div className="font-medium text-white">JSON Document Schema</div>
                  <div className="text-[10px] text-zinc-400">Raw layout AST</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
