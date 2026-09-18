"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Printer,
  ShieldCheck,
  Eye,
  Sparkles,
  CheckCircle2,
  Layers,
  Palette,
  ExternalLink,
  ChevronDown,
  Sigma,
  FileText,
  Table as TableIcon,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Plus,
  HelpCircle,
} from "lucide-react";
import { GOOGLE_DOCS_MATH_PALETTE, MATH_PRESETS, MathRenderer } from "@/lib/math-markdown-engine";

interface CanvasToolbarProps {
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
  modelName?: string;
  onOpenMarkdownMathModal?: () => void;
  onInsertEquation?: (preset?: any) => void;
  onInsertElement?: (type: string) => void;
  activeFontFamily?: string;
  onFontFamilyChange?: (font: string) => void;
  onAutoDesign?: (mode: string) => void;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
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
  const [showEquationToolbar, setShowEquationToolbar] = useState(false);
  const [activePaletteGroup, setActivePaletteGroup] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
        setActivePaletteGroup(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleOpenInNewTab = () => {
    if (typeof window !== "undefined") {
      window.open(window.location.href, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div ref={menuRef} className="no-print bg-white border-b border-slate-200 select-none z-30 shadow-xs">
      {/* 1. Google Docs Main App Header */}
      <div className="h-12 px-3 flex items-center justify-between border-b border-slate-100">
        {/* Left: Google Docs Document Icon & Title & Menu Bar */}
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Authentic Google Docs Blue Page Icon */}
          <div
            title="Google Docs Document"
            className="w-8 h-9 rounded-sm bg-[#4285F4] flex items-center justify-center text-white shadow-xs shrink-0 relative overflow-hidden"
          >
            {/* Page fold corner */}
            <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#1A73E8] border-b border-l border-white/30 rounded-bl-xs" />
            <FileText className="w-4 h-4 text-white mt-1" />
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                className="text-sm font-medium text-slate-800 hover:bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded px-1.5 py-0.5 border border-transparent hover:border-slate-200 transition-all outline-none truncate max-w-[200px] sm:max-w-[320px]"
                title="Rename Document"
              />
              <span
                className="hidden md:flex items-center gap-1 text-[10px] text-slate-500 font-medium shrink-0"
                title="All changes saved to storage"
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Saved to cloud
              </span>
            </div>

            {/* Google Docs Menus: File, Edit, View, Insert, Format, Tools, Help */}
            <div className="flex items-center gap-0.5 text-xs text-slate-700 font-normal mt-[-2px]">
              {/* File Menu */}
              <div className="relative">
                <button
                  onClick={() => setActiveMenu(activeMenu === "file" ? null : "file")}
                  className={`px-1.5 py-0.5 rounded hover:bg-slate-100 transition-colors ${
                    activeMenu === "file" ? "bg-slate-100 font-medium" : ""
                  }`}
                >
                  File
                </button>
                {activeMenu === "file" && (
                  <div className="absolute left-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-md shadow-lg py-1 z-50 text-xs text-slate-700">
                    <button
                      onClick={() => {
                        onOpenPrintPreview();
                        setActiveMenu(null);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between"
                    >
                      <span>Print / PDF Export</span>
                      <span className="text-[10px] text-slate-400">Ctrl+P</span>
                    </button>
                    <button
                      onClick={() => {
                        handleOpenInNewTab();
                        setActiveMenu(null);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between"
                    >
                      <span>Open in New Tab</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </button>
                  </div>
                )}
              </div>

              {/* Edit Menu */}
              <div className="relative">
                <button
                  onClick={() => setActiveMenu(activeMenu === "edit" ? null : "edit")}
                  className={`px-1.5 py-0.5 rounded hover:bg-slate-100 transition-colors ${
                    activeMenu === "edit" ? "bg-slate-100 font-medium" : ""
                  }`}
                >
                  Edit
                </button>
                {activeMenu === "edit" && (
                  <div className="absolute left-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-md shadow-lg py-1 z-50 text-xs text-slate-700">
                    <button
                      onClick={() => {
                        onUndo();
                        setActiveMenu(null);
                      }}
                      disabled={!canUndo}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between disabled:opacity-40"
                    >
                      <span>Undo</span>
                      <span className="text-[10px] text-slate-400">Ctrl+Z</span>
                    </button>
                    <button
                      onClick={() => {
                        onRedo();
                        setActiveMenu(null);
                      }}
                      disabled={!canRedo}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between disabled:opacity-40"
                    >
                      <span>Redo</span>
                      <span className="text-[10px] text-slate-400">Ctrl+Y</span>
                    </button>
                  </div>
                )}
              </div>

              {/* View Menu */}
              <div className="relative">
                <button
                  onClick={() => setActiveMenu(activeMenu === "view" ? null : "view")}
                  className={`px-1.5 py-0.5 rounded hover:bg-slate-100 transition-colors ${
                    activeMenu === "view" ? "bg-slate-100 font-medium" : ""
                  }`}
                >
                  View
                </button>
                {activeMenu === "view" && (
                  <div className="absolute left-0 top-full mt-1 w-52 bg-white border border-slate-200 rounded-md shadow-lg py-1 z-50 text-xs text-slate-700">
                    <button
                      onClick={() => {
                        setShowEquationToolbar(!showEquationToolbar);
                        setActiveMenu(null);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between"
                    >
                      <span>Show equation toolbar</span>
                      {showEquationToolbar && <span className="text-blue-600 font-bold">✓</span>}
                    </button>
                    <button
                      onClick={() => {
                        onToggleMargins();
                        setActiveMenu(null);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between"
                    >
                      <span>Show 0.45" print margins</span>
                      {showMargins && <span className="text-blue-600 font-bold">✓</span>}
                    </button>
                    <button
                      onClick={() => {
                        onToggleBW();
                        setActiveMenu(null);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between"
                    >
                      <span>Black & White mode</span>
                      {isBlackAndWhite && <span className="text-blue-600 font-bold">✓</span>}
                    </button>
                    <button
                      onClick={() => {
                        onTogglePreview();
                        setActiveMenu(null);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between"
                    >
                      <span>Preview mode</span>
                      {isPreviewMode && <span className="text-blue-600 font-bold">✓</span>}
                    </button>
                  </div>
                )}
              </div>

              {/* Insert Menu */}
              <div className="relative">
                <button
                  onClick={() => setActiveMenu(activeMenu === "insert" ? null : "insert")}
                  className={`px-1.5 py-0.5 rounded hover:bg-slate-100 transition-colors ${
                    activeMenu === "insert" ? "bg-slate-100 font-medium" : ""
                  }`}
                >
                  Insert
                </button>
                {activeMenu === "insert" && (
                  <div className="absolute left-0 top-full mt-1 w-56 bg-white border border-slate-200 rounded-md shadow-lg py-1 z-50 text-xs text-slate-700">
                    <button
                      onClick={() => {
                        setShowEquationToolbar(true);
                        onInsertEquation?.();
                        setActiveMenu(null);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-blue-50 hover:text-blue-700 flex items-center justify-between font-semibold"
                    >
                      <span className="flex items-center gap-2">
                        <Sigma className="w-3.5 h-3.5 text-blue-600" />
                        Equation... (π)
                      </span>
                      <span className="text-[10px] text-blue-600 bg-blue-50 px-1 rounded">KaTeX</span>
                    </button>
                    <div className="h-[1px] bg-slate-100 my-1" />
                    <button
                      onClick={() => {
                        onInsertElement?.("text");
                        setActiveMenu(null);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      Text block (Markdown)
                    </button>
                    <button
                      onClick={() => {
                        onInsertElement?.("table");
                        setActiveMenu(null);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2"
                    >
                      <TableIcon className="w-3.5 h-3.5 text-slate-400" />
                      Table matrix
                    </button>
                    <button
                      onClick={() => {
                        onInsertElement?.("callout");
                        setActiveMenu(null);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2"
                    >
                      <span>Key Takeaway Callout</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Tools Menu */}
              <div className="relative">
                <button
                  onClick={() => setActiveMenu(activeMenu === "tools" ? null : "tools")}
                  className={`px-1.5 py-0.5 rounded hover:bg-slate-100 transition-colors ${
                    activeMenu === "tools" ? "bg-slate-100 font-medium" : ""
                  }`}
                >
                  Tools
                </button>
                {activeMenu === "tools" && (
                  <div className="absolute left-0 top-full mt-1 w-64 bg-white border border-slate-200 rounded-md shadow-lg py-1 z-50 text-xs text-slate-700">
                    <button
                      onClick={() => {
                        onOpenMarkdownMathModal?.();
                        setActiveMenu(null);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-indigo-50 hover:text-indigo-700 flex items-center justify-between font-semibold"
                    >
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        Convert Markdown to Math Engine...
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        onCheckPage();
                        setActiveMenu(null);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between"
                    >
                      <span>Run Print Margin & Quality Audit</span>
                      {issueCount > 0 && (
                        <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-bold">
                          {issueCount}
                        </span>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Header: Open In New Tab, Check Page, Print */}
        <div className="flex items-center gap-2">
          {/* Markdown to Math Engine Quick Button */}
          <button
            onClick={onOpenMarkdownMathModal}
            title="Convert Markdown text with math equations into a professional 8.5x11 document"
            className="text-xs px-2.5 py-1.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 flex items-center gap-1.5 font-semibold transition-all shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Markdown to Math</span>
          </button>

          {/* Open In New Tab Button (Solves iframe 401 error!) */}
          <button
            onClick={handleOpenInNewTab}
            title="Open in new browser tab to view full screen or bypass preview cookie restrictions"
            className="hidden sm:flex text-xs px-2.5 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 items-center gap-1.5 font-medium transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden lg:inline">Open New Tab</span>
          </button>

          {/* Quality Audit Button */}
          <button
            onClick={onCheckPage}
            title="Audit Print Margins & Visual Quality"
            className="text-xs px-2.5 py-1.5 rounded-md bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 font-medium transition-all"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden md:inline">Audit</span>
            {issueCount > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500 text-white text-[10px] font-bold rounded-full">
                {issueCount}
              </span>
            )}
          </button>

          {/* Google Docs Primary Print / Export Button */}
          <button
            onClick={onOpenPrintPreview}
            title="Print or Export as PDF (US Letter 8.5 x 11 in)"
            className="text-xs px-3.5 py-1.5 rounded-md bg-[#1a73e8] hover:bg-[#1557b0] text-white flex items-center gap-1.5 font-semibold shadow-xs transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* 2. Google Docs Action Ribbon */}
      <div className="h-10 px-3 flex items-center gap-1 overflow-x-auto bg-[#edf2fa]/70 border-b border-slate-200 text-slate-700 text-xs">
        {/* Undo / Redo */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className="p-1.5 rounded hover:bg-slate-200/70 disabled:opacity-35 transition-colors"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          className="p-1.5 rounded hover:bg-slate-200/70 disabled:opacity-35 transition-colors"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onOpenPrintPreview}
          title="Print (Ctrl+P)"
          className="p-1.5 rounded hover:bg-slate-200/70 transition-colors"
        >
          <Printer className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-[1px] bg-slate-300 mx-1 shrink-0" />

        {/* Zoom Selector */}
        <select
          value={Math.round(zoom * 100)}
          onChange={(e) => onZoomChange(parseInt(e.target.value) / 100)}
          className="h-7 px-1.5 text-xs bg-transparent hover:bg-slate-200/70 rounded cursor-pointer outline-none font-medium text-slate-700"
          title="Zoom"
        >
          <option value="50">50%</option>
          <option value="75">75%</option>
          <option value="90">90%</option>
          <option value="100">100%</option>
          <option value="125">125%</option>
          <option value="150">150%</option>
        </select>
        <button
          onClick={onFitToScreen}
          title="Fit Page to Screen"
          className="p-1.5 rounded hover:bg-slate-200/70 text-slate-600 transition-colors"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-[1px] bg-slate-300 mx-1 shrink-0" />

        {/* Font Family Selector */}
        <select
          value={activeFontFamily}
          onChange={(e) => onFontFamilyChange?.(e.target.value)}
          className="h-7 px-2 text-xs bg-transparent hover:bg-slate-200/70 rounded cursor-pointer outline-none font-medium text-slate-800 max-w-[130px]"
          title="Font"
        >
          <option value="Inter, sans-serif">Inter</option>
          <option value="Roboto, sans-serif">Roboto</option>
          <option value="Arial, sans-serif">Arial</option>
          <option value="'Times New Roman', serif">Times New Roman</option>
          <option value="'Playfair Display', serif">Playfair Display</option>
          <option value="'JetBrains Mono', monospace">JetBrains Mono</option>
          <option value="Caveat, cursive">Caveat (Handwritten)</option>
        </select>

        <div className="h-4 w-[1px] bg-slate-300 mx-1 shrink-0" />

        {/* Text Formatting Icons */}
        <button
          type="button"
          className="p-1.5 rounded hover:bg-slate-200/70 transition-colors"
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          className="p-1.5 rounded hover:bg-slate-200/70 transition-colors"
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          className="p-1.5 rounded hover:bg-slate-200/70 transition-colors"
          title="Underline (Ctrl+U)"
        >
          <Underline className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-[1px] bg-slate-300 mx-1 shrink-0" />

        {/* Alignment */}
        <button
          type="button"
          className="p-1.5 rounded hover:bg-slate-200/70 transition-colors"
          title="Align Left"
        >
          <AlignLeft className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          className="p-1.5 rounded hover:bg-slate-200/70 transition-colors"
          title="Align Center"
        >
          <AlignCenter className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          className="p-1.5 rounded hover:bg-slate-200/70 transition-colors"
          title="Align Right"
        >
          <AlignRight className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-[1px] bg-slate-300 mx-1 shrink-0" />

        {/* Google Docs Authentic Equation Toolbar Button (π) */}
        <button
          onClick={() => setShowEquationToolbar(!showEquationToolbar)}
          title="Toggle Google Docs Equation Toolbar (LaTeX Math)"
          className={`h-7 px-2.5 rounded flex items-center gap-1.5 font-semibold text-xs transition-all ${
            showEquationToolbar
              ? "bg-[#1a73e8] text-white shadow-xs"
              : "hover:bg-slate-200/70 text-slate-700"
          }`}
        >
          <span className="font-serif font-bold text-sm leading-none">π</span>
          <span>Equation</span>
        </button>

        {/* Safe Margin Guide Toggle */}
        <button
          onClick={onToggleMargins}
          title="Toggle 0.45 inch Safe Margins"
          className={`h-7 px-2 rounded flex items-center gap-1 text-xs transition-colors ${
            showMargins ? "bg-blue-100 text-blue-800 font-semibold" : "hover:bg-slate-200/70 text-slate-600"
          }`}
        >
          <Layers className="w-3 h-3" />
          <span className="hidden xl:inline">0.45" Margins</span>
        </button>

        {/* B&W Mode */}
        <button
          onClick={onToggleBW}
          title="Classroom Black & White Optimization"
          className={`h-7 px-2 rounded flex items-center gap-1 text-xs transition-colors ${
            isBlackAndWhite ? "bg-slate-900 text-white" : "hover:bg-slate-200/70 text-slate-600"
          }`}
        >
          <Palette className="w-3 h-3" />
          <span className="hidden xl:inline">B&W</span>
        </button>

        {/* AI Architect Quick Design Dropdown */}
        <div className="relative">
          <button
            onClick={() => setActiveMenu(activeMenu === "aiArchitect" ? null : "aiArchitect")}
            className="h-7 px-2.5 rounded bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white flex items-center gap-1.5 font-bold text-xs shadow-2xs transition-all"
            title="AI Layout Architect — Complete Document Redesign"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI Design</span>
            <ChevronDown className="w-3 h-3 text-indigo-200" />
          </button>
          {activeMenu === "aiArchitect" && (
            <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-2xl py-1.5 z-50 text-xs text-slate-700">
              <div className="px-3 py-1.5 border-b border-slate-100">
                <span className="text-[10px] font-bold tracking-wider uppercase text-indigo-600">
                  Smart Layout Architect
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Semantic restructuring, balanced columns & KaTeX formulas.
                </p>
              </div>
              <button
                onClick={() => {
                  onAutoDesign?.("auto");
                  setActiveMenu(null);
                }}
                className="w-full text-left px-3 py-2 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2 font-medium"
              >
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-800">Auto-Design Document</div>
                  <div className="text-[10px] text-slate-500">Restructure content & equalize grid</div>
                </div>
              </button>
              <button
                onClick={() => {
                  onAutoDesign?.("chemistry");
                  setActiveMenu(null);
                }}
                className="w-full text-left px-3 py-2 hover:bg-emerald-50 hover:text-emerald-800 flex items-center gap-2 font-medium"
              >
                <span className="text-base">🧪</span>
                <div>
                  <div className="font-semibold text-slate-800">Chemistry / STEM Lab Guide</div>
                  <div className="text-[10px] text-slate-500">Bento grid + KaTeX $D=m/V$ + mnemonic</div>
                </div>
              </button>
              <button
                onClick={() => {
                  onAutoDesign?.("academic");
                  setActiveMenu(null);
                }}
                className="w-full text-left px-3 py-2 hover:bg-blue-50 hover:text-blue-800 flex items-center gap-2 font-medium"
              >
                <span className="text-base">🏛️</span>
                <div>
                  <div className="font-semibold text-slate-800">Academic Study Guide</div>
                  <div className="text-[10px] text-slate-500">Formal sections, key takeaways, equations</div>
                </div>
              </button>
              <button
                onClick={() => {
                  onAutoDesign?.("executive");
                  setActiveMenu(null);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-100 flex items-center gap-2 font-medium"
              >
                <span className="text-base">💼</span>
                <div>
                  <div className="font-semibold text-slate-800">Executive Whitepaper</div>
                  <div className="text-[10px] text-slate-500">Summary card, two-column insights, metrics</div>
                </div>
              </button>
              <div className="h-[1px] bg-slate-100 my-1" />
              <button
                onClick={() => {
                  onAutoDesign?.("balance");
                  setActiveMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between text-slate-600"
              >
                <span>Auto-Balance Column Heights</span>
                <span className="text-[10px] text-slate-400">0.24" Gutter</span>
              </button>
              <button
                onClick={() => {
                  onAutoDesign?.("margins");
                  setActiveMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between text-slate-600"
              >
                <span>Clamp to 0.45" Safe Margins</span>
                <span className="text-[10px] text-emerald-600 font-bold">Safe Bleed</span>
              </button>
            </div>
          )}
        </div>

        {/* Preview Mode */}
        <button
          onClick={onTogglePreview}
          title="Preview Document Layout"
          className={`h-7 px-2 rounded flex items-center gap-1 text-xs transition-colors ${
            isPreviewMode ? "bg-indigo-100 text-indigo-800 font-bold" : "hover:bg-slate-200/70 text-slate-600"
          }`}
        >
          <Eye className="w-3 h-3" />
          <span>{isPreviewMode ? "Editing" : "Preview"}</span>
        </button>
      </div>

      {/* 3. Google Docs Equation Toolbar Strip (Revealed when Equation toolbar active) */}
      {showEquationToolbar && (
        <div className="bg-[#f0f4f9] border-b border-slate-300 px-3 py-1.5 flex items-center gap-2 overflow-x-auto animate-in slide-in-from-top-1 duration-150">
          <div className="flex items-center gap-1 font-bold text-slate-700 text-xs shrink-0 pr-2 border-r border-slate-300">
            <span className="font-serif font-black text-sm text-[#1a73e8]">π</span>
            <span>Math Tools</span>
          </div>

          {/* New Equation Button */}
          <button
            onClick={() => onInsertEquation?.()}
            className="h-7 px-2.5 bg-white border border-slate-300 hover:border-blue-500 hover:text-blue-700 rounded text-xs font-semibold flex items-center gap-1 shrink-0 shadow-2xs transition-all"
            title="Insert a new equation box onto the canvas"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" />
            <span>New Equation</span>
          </button>

          {/* Symbol Category Dropdowns */}
          {GOOGLE_DOCS_MATH_PALETTE.map((group) => (
            <div key={group.name} className="relative shrink-0">
              <button
                onClick={() =>
                  setActivePaletteGroup(activePaletteGroup === group.name ? null : group.name)
                }
                className={`h-7 px-2 rounded border text-xs flex items-center gap-1 transition-all ${
                  activePaletteGroup === group.name
                    ? "bg-white border-blue-500 text-blue-700 font-semibold shadow-2xs"
                    : "bg-white/80 border-slate-300 hover:bg-white text-slate-700"
                }`}
              >
                <span>{group.name}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {/* Symbol Palette Popover */}
              {activePaletteGroup === group.name && (
                <div className="absolute left-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl p-2.5 grid grid-cols-4 sm:grid-cols-6 gap-1 z-50 min-w-[240px] max-h-64 overflow-y-auto">
                  {group.symbols.map((sym, sIdx) => (
                    <button
                      key={sIdx}
                      type="button"
                      onClick={() => {
                        onInsertEquation?.({ equation: sym.latex });
                        setActivePaletteGroup(null);
                      }}
                      title={`${sym.label} (${sym.latex})`}
                      className="p-1.5 hover:bg-blue-50 hover:border-blue-300 rounded border border-transparent flex flex-col items-center justify-center font-serif text-sm text-slate-800 transition-colors"
                    >
                      <span className="font-bold">{sym.preview}</span>
                      <span className="text-[9px] text-slate-400 font-sans truncate max-w-[40px]">
                        {sym.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Preset Formulas Dropdown */}
          <div className="relative shrink-0">
            <select
              defaultValue=""
              onChange={(e) => {
                const preset = MATH_PRESETS.find((p) => p.id === e.target.value);
                if (preset) {
                  onInsertEquation?.(preset);
                  e.target.value = "";
                }
              }}
              className="h-7 px-2 text-xs bg-white border border-slate-300 rounded font-medium text-slate-700 cursor-pointer outline-none hover:border-blue-500"
              title="Insert standard formula"
            >
              <option value="" disabled>
                Standard Formulas...
              </option>
              {MATH_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          {/* Convert Markdown Button in Equation Ribbon */}
          <button
            onClick={onOpenMarkdownMathModal}
            className="h-7 px-2 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 rounded text-xs font-semibold flex items-center gap-1 shrink-0 ml-auto"
            title="Convert Markdown text into full math document"
          >
            <Sparkles className="w-3 h-3 text-indigo-600" />
            <span>Markdown Engine</span>
          </button>
        </div>
      )}
    </div>
  );
};
