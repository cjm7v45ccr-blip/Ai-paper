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
  FileCode,
  Copy,
  Sliders,
  Search,
  MessageSquare,
  Presentation,
  BookOpen,
  GraduationCap,
  Briefcase,
  Layers,
  FileSpreadsheet,
  Clock,
} from "lucide-react";
import { DocumentMode } from "@/types/document";

interface MinimalTopNavProps {
  title: string;
  onUpdateTitle: (newTitle: string) => void;
  documentMode: DocumentMode;
  onChangeMode: (newMode: DocumentMode) => void;
  onTransformMode?: (targetMode: DocumentMode) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onAddSectionOrSlide: () => void;
  onRegenerate?: () => void;
  onOpenPresenter: () => void;
  onBackToHome: () => void;
  onExport: (format: "pdf" | "png" | "json" | "markdown") => void;
  zoom?: number;
  onUpdateZoom?: (newZoom: number) => void;
  viewMode?: "stacked" | "single";
  onToggleViewMode?: () => void;
  isAiBarOpen?: boolean;
  onToggleAiBar?: () => void;
  isInspectorCollapsed?: boolean;
  onToggleInspector?: () => void;
  wordCount?: number;
  charCount?: number;
  commentsCount?: number;
  isCommentsOpen?: boolean;
  onToggleComments?: () => void;
  isFindOpen?: boolean;
  onToggleFind?: () => void;
}

const MODES_LIST: Array<{
  id: DocumentMode;
  label: string;
  desc: string;
  icon: React.ElementType;
}> = [
  { id: "document", label: "Document", desc: "Flowing text & tables (Docs / Word)", icon: FileText },
  { id: "presentation", label: "Presentation", desc: "16:9 slides & speaker notes (Slides / PPT)", icon: Presentation },
  { id: "report", label: "Executive Report", desc: "Multi-page metrics & data tables", icon: FileSpreadsheet },
  { id: "worksheet", label: "Worksheet", desc: "Interactive exercises & question sets", icon: GraduationCap },
  { id: "study-guide", label: "Study Guide", desc: "Formulas, cheat sheets & definitions", icon: BookOpen },
  { id: "proposal", label: "Proposal", desc: "Milestones, pricing & deliverables", icon: Briefcase },
  { id: "blank", label: "Blank Canvas", desc: "Freeform absolute layout", icon: Layers },
];

export const MinimalTopNav: React.FC<MinimalTopNavProps> = ({
  title,
  onUpdateTitle,
  documentMode,
  onChangeMode,
  onTransformMode,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onAddSectionOrSlide,
  onOpenPresenter,
  onBackToHome,
  onExport,
  zoom = 1.0,
  onUpdateZoom,
  viewMode = "stacked",
  onToggleViewMode,
  isAiBarOpen,
  onToggleAiBar,
  isInspectorCollapsed,
  onToggleInspector,
  wordCount = 0,
  charCount = 0,
  commentsCount = 0,
  isCommentsOpen,
  onToggleComments,
  isFindOpen,
  onToggleFind,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [localTitle, setLocalTitle] = useState(title);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isModeMenuOpen, setIsModeMenuOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const modeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalTitle(title);
  }, [title]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setIsExportOpen(false);
      }
      if (modeRef.current && !modeRef.current.contains(e.target as Node)) {
        setIsModeMenuOpen(false);
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

  const readingTimeMin = Math.max(1, Math.ceil(wordCount / 200));
  const currentModeObj = MODES_LIST.find((m) => m.id === documentMode) || MODES_LIST[0];
  const CurrentIcon = currentModeObj.icon;

  return (
    <header className="h-12 border-b border-white/[0.06] bg-[#090a0f] px-3.5 flex items-center justify-between text-zinc-300 select-none z-50 relative shrink-0">
      {/* Left Section: Back button, Title & Mode Dropdown */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={onBackToHome}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          title="Back to Projects"
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
            className="text-xs sm:text-sm font-medium text-white bg-zinc-800/80 border border-indigo-500/50 rounded-md px-2 py-0.5 outline-none max-w-[200px] sm:max-w-xs"
          />
        ) : (
          <button
            onClick={() => setIsEditingTitle(true)}
            className="text-xs sm:text-sm font-medium text-zinc-100 hover:text-white transition-colors truncate max-w-[160px] sm:max-w-xs text-left px-1 py-0.5 rounded hover:bg-white/[0.04]"
            title="Click to rename"
          >
            {title || "Untitled Project"}
          </button>
        )}

        {/* Mode Selector Dropdown */}
        <div className="relative shrink-0" ref={modeRef}>
          <button
            onClick={() => setIsModeMenuOpen(!isModeMenuOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] text-[11px] font-medium text-zinc-300 transition-colors"
          >
            <CurrentIcon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="capitalize">{currentModeObj.label}</span>
            <ChevronDown className="w-3 h-3 text-zinc-400" />
          </button>

          {isModeMenuOpen && (
            <div className="absolute left-0 mt-1.5 w-64 bg-[#141620] border border-white/[0.12] rounded-xl p-1.5 shadow-2xl z-[100] animate-in fade-in-50 zoom-in-95 text-xs text-left">
              <div className="px-2 py-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                Project Format Mode
              </div>

              {MODES_LIST.map((m) => {
                const Icon = m.icon;
                const isActive = documentMode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      onChangeMode(m.id);
                      setIsModeMenuOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-start gap-2.5 transition-colors ${
                      isActive
                        ? "bg-indigo-600/30 text-indigo-300 font-medium"
                        : "hover:bg-white/[0.06] text-zinc-300"
                    }`}
                  >
                    <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isActive ? "text-indigo-300" : "text-zinc-400"}`} />
                    <div className="flex flex-col">
                      <span className="text-xs">{m.label}</span>
                      <span className="text-[10px] text-zinc-500">{m.desc}</span>
                    </div>
                  </button>
                );
              })}

              {onTransformMode && (
                <div className="mt-1 pt-1.5 border-t border-white/[0.06]">
                  <div className="px-2 py-1 text-[10px] font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>AI Format Conversion</span>
                  </div>
                  {documentMode !== "presentation" && (
                    <button
                      onClick={() => {
                        onTransformMode("presentation");
                        setIsModeMenuOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-indigo-500/20 text-indigo-200 text-xs transition-colors flex items-center gap-2"
                    >
                      <Presentation className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Convert to 16:9 Slide Deck</span>
                    </button>
                  )}
                  {documentMode !== "report" && documentMode !== "document" && (
                    <button
                      onClick={() => {
                        onTransformMode("report");
                        setIsModeMenuOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-indigo-500/20 text-indigo-200 text-xs transition-colors flex items-center gap-2"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Convert to Executive Report</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Word count & Reading time status pill */}
        {wordCount > 0 && (
          <div className="hidden xl:flex items-center gap-2 text-[11px] text-zinc-400 px-2 py-0.5 rounded-md bg-white/[0.02] border border-white/[0.04]">
            <span>{wordCount} words</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {readingTimeMin} min read
            </span>
          </div>
        )}
      </div>

      {/* Right Section: Controls */}
      <div className="flex items-center gap-1.5">
        {/* Undo / Redo */}
        <div className="flex items-center bg-white/[0.03] border border-white/[0.06] rounded-md p-0.5">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 rounded text-zinc-400 hover:text-white disabled:opacity-20 disabled:pointer-events-none transition-colors"
            title="Undo (Ctrl+Z / Cmd+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 rounded text-zinc-400 hover:text-white disabled:opacity-20 disabled:pointer-events-none transition-colors"
            title="Redo (Ctrl+Y / Cmd+Shift+Z)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Find & Replace Toggle */}
        {onToggleFind && (
          <button
            onClick={onToggleFind}
            className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
              isFindOpen
                ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/40"
                : "bg-white/[0.03] hover:bg-white/[0.08] text-zinc-400 hover:text-white border border-white/[0.06]"
            }`}
            title="Find & Replace (Cmd+F)"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Comments Drawer Toggle */}
        {onToggleComments && (
          <button
            onClick={onToggleComments}
            className={`p-1.5 rounded-md text-xs font-medium transition-colors relative ${
              isCommentsOpen
                ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/40"
                : "bg-white/[0.03] hover:bg-white/[0.08] text-zinc-400 hover:text-white border border-white/[0.06]"
            }`}
            title="Comments & Review"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            {commentsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-500 text-white text-[9px] flex items-center justify-center font-bold">
                {commentsCount}
              </span>
            )}
          </button>
        )}

        <div className="h-4 w-[1px] bg-white/[0.08] mx-0.5" />

        {/* Add Slide / Add Section */}
        <button
          onClick={onAddSectionOrSlide}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.03] hover:bg-white/[0.08] text-zinc-300 hover:text-white text-xs font-medium border border-white/[0.06] transition-colors"
          title={documentMode === "presentation" ? "Add new slide" : "Add new page"}
        >
          <Plus className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">
            {documentMode === "presentation" ? "Add Slide" : "Add Page"}
          </span>
        </button>

        {/* Fullscreen Present Button */}
        <button
          onClick={onOpenPresenter}
          className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all active:scale-[0.98] shadow-xs"
          title="Play / Present (⌘P)"
        >
          <Play className="w-3 h-3 fill-current" />
          <span>Present</span>
        </button>

        {/* Share Button */}
        <div className="relative">
          <button
            onClick={() => setIsShareOpen(!isShareOpen)}
            className="p-1 sm:px-2.5 sm:py-1 rounded-md bg-white/[0.03] hover:bg-white/[0.08] text-zinc-400 hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5 border border-white/[0.06]"
            title="Share document link"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Share</span>
          </button>

          {isShareOpen && (
            <div className="absolute right-0 mt-1.5 w-64 bg-[#141620] border border-white/[0.12] rounded-xl p-3 shadow-2xl z-[100] animate-in fade-in-50 zoom-in-95 text-left">
              <h4 className="text-xs font-semibold text-white">Share Project</h4>
              <p className="mt-1 text-[11px] text-zinc-400 leading-snug">
                Anyone with the link can view this document or presentation.
              </p>
              <button
                onClick={handleCopyLink}
                className="mt-2.5 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Link Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* AI Assistant Pill Toggle */}
        {onToggleAiBar && (
          <button
            onClick={onToggleAiBar}
            className={`p-1 sm:px-2.5 sm:py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 border ${
              isAiBarOpen
                ? "bg-indigo-600/30 text-indigo-300 border-indigo-500/40"
                : "bg-white/[0.03] hover:bg-white/[0.08] text-zinc-400 hover:text-white border-white/[0.06]"
            }`}
            title="Toggle AI Assistant"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden lg:inline">AI</span>
          </button>
        )}

        {/* Inspector Panel Toggle */}
        {onToggleInspector && (
          <button
            onClick={onToggleInspector}
            className={`p-1 sm:px-2 sm:py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 border ${
              !isInspectorCollapsed
                ? "bg-indigo-600/30 text-indigo-300 border-indigo-500/40"
                : "bg-white/[0.03] hover:bg-white/[0.08] text-zinc-400 hover:text-white border-white/[0.06]"
            }`}
            title="Toggle Settings & Layout"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Export Dropdown */}
        <div className="relative" ref={exportRef}>
          <button
            onClick={() => setIsExportOpen(!isExportOpen)}
            className="p-1 sm:px-2.5 sm:py-1 rounded-md bg-white/[0.03] hover:bg-white/[0.08] text-zinc-400 hover:text-white text-xs font-medium transition-colors flex items-center gap-1 border border-white/[0.06]"
            title="Export Options"
          >
            <Download className="w-3.5 h-3.5" />
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {isExportOpen && (
            <div className="absolute right-0 mt-1.5 w-48 bg-[#141620] border border-white/[0.12] rounded-xl shadow-2xl py-1 text-xs text-zinc-300 z-[100] animate-in fade-in-50 zoom-in-95 text-left">
              <button
                onClick={() => {
                  setIsExportOpen(false);
                  onExport("pdf");
                }}
                className="w-full text-left px-3 py-2 hover:bg-white/[0.06] hover:text-white flex items-center gap-2 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                <span>Print / PDF Document</span>
              </button>

              <button
                onClick={() => {
                  setIsExportOpen(false);
                  onExport("markdown");
                }}
                className="w-full text-left px-3 py-2 hover:bg-white/[0.06] hover:text-white flex items-center gap-2 transition-colors border-t border-white/[0.06]"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>Markdown (.md)</span>
              </button>

              <button
                onClick={() => {
                  setIsExportOpen(false);
                  onExport("json");
                }}
                className="w-full text-left px-3 py-2 hover:bg-white/[0.06] hover:text-white flex items-center gap-2 transition-colors border-t border-white/[0.06]"
              >
                <FileCode className="w-3.5 h-3.5 text-amber-400" />
                <span>JSON Project State</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

