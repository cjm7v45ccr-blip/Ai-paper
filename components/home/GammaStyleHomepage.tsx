"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Sparkles,
  Presentation,
  FileText,
  Upload,
  ArrowRight,
  ClipboardPaste,
  BookOpen,
  GraduationCap,
  Briefcase,
  Layers,
  CheckCircle2,
  FolderOpen,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Link2,
  FileSpreadsheet,
  Palette,
  Users,
  Compass,
} from "lucide-react";
import { DocumentModel, DocumentMode } from "@/types/document";
import { DocumentsSection } from "./DocumentsSection";

export interface CreationParams {
  prompt: string;
  mode: DocumentMode;
  audience?: string;
  desiredLength?: string;
  visualTheme?: string;
  sourceContent?: string;
  referenceLinks?: string[];
}

interface GammaStyleHomepageProps {
  documents: DocumentModel[];
  onStartCreation: (params: CreationParams) => void;
  onOpenDraft: (mode: DocumentMode) => void;
  onOpenDocument: (doc: DocumentModel) => void;
  onDeleteDocument: (id: string, e: React.MouseEvent) => void;
  onDuplicateDocument: (id: string, e: React.MouseEvent) => void;
}

const FORMAT_OPTIONS: Array<{
  id: DocumentMode;
  label: string;
  icon: React.ElementType;
  description: string;
}> = [
  { id: "document", label: "Document", icon: FileText, description: "Flowing text, tables, structured sections (Docs / Word)" },
  { id: "presentation", label: "Presentation", icon: Presentation, description: "Visual 16:9 slides with KPI cards and speaker notes (Slides / PPT)" },
  { id: "report", label: "Report", icon: FileSpreadsheet, description: "Executive summary, multi-column analytics, data matrices" },
  { id: "worksheet", label: "Worksheet", icon: GraduationCap, description: "Interactive exercises, practice sheets, question sets" },
  { id: "study-guide", label: "Study Guide", icon: BookOpen, description: "Core definitions, KaTeX formulas, summary tables" },
  { id: "proposal", label: "Proposal", icon: Briefcase, description: "Project milestones, client deliverables, pricing scope" },
  { id: "blank", label: "Blank Canvas", icon: Layers, description: "Empty project with full freeform control" },
];

const SUGGESTED_PROMPTS = [
  { label: "Chemistry Study Guide", mode: "study-guide" as DocumentMode, prompt: "Create a chemistry study guide covering measurement, sig figs, metric conversions, density equations, and error analysis." },
  { label: "10-Page Business Proposal", mode: "proposal" as DocumentMode, prompt: "Make a 10-page business proposal for enterprise cloud security with timeline roadmaps, deliverables, and cost matrices." },
  { label: "Climate Change Presentation", mode: "presentation" as DocumentMode, prompt: "Create a presentation about climate change, renewable energy adoption curves, global milestones, and emission reduction targets." },
  { label: "Compound Interest Research", mode: "report" as DocumentMode, prompt: "Write a research report about compound interest, financial exponential growth formulas, historical asset comparison tables, and wealth simulations." },
  { label: "Notes to Slide Deck", mode: "presentation" as DocumentMode, prompt: "Turn these notes into a professional slide deck with high-impact key takeaway cards, executive metrics, and speaker notes." },
  { label: "Lesson Plan & Worksheets", mode: "worksheet" as DocumentMode, prompt: "Create a lesson plan with interactive activities, student exercises, and self-check question worksheets." },
  { label: "Mobile App Proposal", mode: "proposal" as DocumentMode, prompt: "Make a project proposal for a mobile health app including architecture diagrams, sprint milestones, and user flow breakdown." },
];

const AUDIENCE_OPTIONS = [
  "Executive & C-Suite",
  "Investors & Board",
  "Students & Learners",
  "Academic & Research",
  "Technical Engineers",
  "Clients & Stakeholders",
  "General Audience",
];

const LENGTH_OPTIONS = [
  { id: "short", label: "Quick (1-2 pages/slides)" },
  { id: "standard", label: "Standard (3-5 pages/slides)" },
  { id: "detailed", label: "Detailed (6-8 pages/slides)" },
  { id: "deep", label: "In-Depth (8-10+ pages/slides)" },
];

const THEME_OPTIONS = [
  { id: "Executive Slate", label: "Executive Slate (Dark/Slate)" },
  { id: "Clean Minimalist", label: "Clean Minimalist (Light Crisp)" },
  { id: "Editorial Ivory", label: "Editorial Ivory (Serif Premium)" },
  { id: "Emerald Lab", label: "Emerald Lab (Scientific Green)" },
  { id: "High-Tech Indigo", label: "High-Tech Indigo (Modern Vibrant)" },
  { id: "Obsidian Night", label: "Obsidian Night (Deep Contrast)" },
];

export const GammaStyleHomepage: React.FC<GammaStyleHomepageProps> = ({
  documents,
  onStartCreation,
  onOpenDraft,
  onOpenDocument,
  onDeleteDocument,
  onDuplicateDocument,
}) => {
  const [prompt, setPrompt] = useState("");
  const [selectedFormat, setSelectedFormat] = useState<DocumentMode>("document");
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Advanced Options
  const [audience, setAudience] = useState<string>("Executive & C-Suite");
  const [desiredLength, setDesiredLength] = useState<string>("standard");
  const [visualTheme, setVisualTheme] = useState<string>("Executive Slate");
  const [sourceNotes, setSourceNotes] = useState<string>("");
  const [referenceLinksText, setReferenceLinksText] = useState<string>("");
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic AI Format Recommendation Engine
  const recommendedFormat = useMemo<{ mode: DocumentMode; reason: string }>(() => {
    const p = prompt.toLowerCase();
    if (!p.trim()) return { mode: "document", reason: "Standard document" };

    if (p.includes("pitch") || p.includes("presentation") || p.includes("slides") || p.includes("deck") || p.includes("keynote")) {
      return { mode: "presentation", reason: "AI recommends Presentation Deck (16:9 visual slides & speaker notes)" };
    }
    if (p.includes("proposal") || p.includes("rfp") || p.includes("bid") || p.includes("project proposal")) {
      return { mode: "proposal", reason: "AI recommends Proposal (deliverables, milestones, pricing tables)" };
    }
    if (p.includes("study guide") || p.includes("cheat sheet") || p.includes("exam prep") || p.includes("chemistry") || p.includes("physics") || p.includes("formula")) {
      return { mode: "study-guide", reason: "AI recommends Study Guide (KaTeX formulas, definitions, reference tables)" };
    }
    if (p.includes("worksheet") || p.includes("lesson plan") || p.includes("activity") || p.includes("quiz") || p.includes("exercises") || p.includes("practice")) {
      return { mode: "worksheet", reason: "AI recommends Worksheet (practice questions & checkbox groups)" };
    }
    if (p.includes("report") || p.includes("research") || p.includes("analysis") || p.includes("metrics") || p.includes("quarterly") || p.includes("audit")) {
      return { mode: "report", reason: "AI recommends Executive Report (multi-column analytics & charts)" };
    }
    if (p.includes("blank") || p.includes("scratch")) {
      return { mode: "blank", reason: "AI recommends Blank Canvas" };
    }
    return { mode: "document", reason: "AI recommends Document (structured editorial sections)" };
  }, [prompt]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setSourceNotes((prev) => `${prev ? prev + "\n\n" : ""}[File ${file.name}]:\n${content.slice(0, 4000)}`);
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = (overrideFormat?: DocumentMode) => {
    const finalMode = overrideFormat || selectedFormat;
    if (!prompt.trim() && finalMode !== "blank") return;

    const links = referenceLinksText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    onStartCreation({
      prompt: prompt.trim() || (finalMode === "blank" ? "Untitled Blank Project" : "New Document"),
      mode: finalMode,
      audience,
      desiredLength,
      visualTheme,
      sourceContent: sourceNotes.trim() || undefined,
      referenceLinks: links.length > 0 ? links : undefined,
    });
  };

  return (
    <div className="min-h-screen w-full bg-[#090a0f] text-zinc-100 flex flex-col items-center px-4 py-6 sm:py-10 relative overflow-y-auto overflow-x-hidden font-sans">
      {/* Ambient Radial Mesh Gradient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[720px] h-[360px] bg-indigo-600/[0.07] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-48 left-1/4 w-[380px] h-[240px] bg-purple-600/[0.04] rounded-full blur-3xl pointer-events-none" />

      {/* Top Application Header */}
      <header className="w-full max-w-5xl flex items-center justify-between relative z-10 shrink-0 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center shadow-md">
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-white font-mono">
                PagePilot
              </span>
              <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                Unified Workspace
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden sm:block">Docs • Slides • Reports • Worksheets • AI</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href="#documents-section"
            className="text-xs text-zinc-300 hover:text-white transition-colors flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08]"
          >
            <FolderOpen className="w-3.5 h-3.5 text-zinc-400" />
            <span>Saved Projects ({documents.length})</span>
          </a>
        </div>
      </header>

      {/* Main Creation Hero Section */}
      <main className="w-full max-w-3xl flex flex-col items-center text-center relative z-10 shrink-0">
        {/* Core Promise Headline */}
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
          What do you want to create today?
        </h1>
        <p className="mt-3 text-sm sm:text-base text-zinc-400 max-w-xl leading-relaxed">
          Describe what you want to make, and PagePilot creates a polished, editable document, presentation, or report that you can fully control.
        </p>

        {/* AI Input Container */}
        <div className="w-full mt-7 bg-[#11131c] border border-white/[0.12] focus-within:border-indigo-500/60 rounded-3xl p-4 sm:p-5 shadow-2xl transition-all ring-1 ring-white/[0.04] focus-within:ring-2 focus-within:ring-indigo-500/20 text-left">
          {/* Textarea */}
          <textarea
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && (prompt.trim() || selectedFormat === "blank")) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Describe your idea or paste raw notes (e.g. 'Create a chemistry study guide with formulas and practice tables' or 'Make a 10-page business proposal for enterprise cloud migration')..."
            className="w-full bg-transparent text-sm sm:text-base text-zinc-100 placeholder:text-zinc-500 outline-none resize-none leading-relaxed"
          />

          {/* AI Recommendation Banner (Active when typing) */}
          {prompt.trim().length > 8 && (
            <div className="mt-2.5 flex items-center justify-between gap-2 p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-200 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 truncate">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="truncate">{recommendedFormat.reason}</span>
              </div>
              {selectedFormat !== recommendedFormat.mode && (
                <button
                  type="button"
                  onClick={() => setSelectedFormat(recommendedFormat.mode)}
                  className="shrink-0 px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 font-medium transition-colors text-[11px]"
                >
                  Apply Recommendation
                </button>
              )}
            </div>
          )}

          {/* File Upload indicator */}
          {uploadedFileName && (
            <div className="mt-2 flex items-center gap-2 text-xs text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-xl w-fit">
              <Upload className="w-3 h-3" />
              <span className="truncate max-w-[240px]">{uploadedFileName}</span>
              <button
                onClick={() => {
                  setUploadedFileName(null);
                  setSourceNotes("");
                }}
                className="text-zinc-400 hover:text-white ml-0.5"
              >
                ×
              </button>
            </div>
          )}

          {/* Format Selector Pills */}
          <div className="mt-4 pt-3 border-t border-white/[0.06] flex flex-col gap-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Format</span>
              <button
                type="button"
                onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5 transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>{isAdvancedOpen ? "Hide Advanced Options" : "Advanced Options (Audience, Length, Theme)"}</span>
                {isAdvancedOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Formats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5">
              {FORMAT_OPTIONS.map((f) => {
                const Icon = f.icon;
                const isSelected = selectedFormat === f.id;
                const isAiRecommended = recommendedFormat.mode === f.id && prompt.trim().length > 8;

                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedFormat(f.id)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl text-center border transition-all relative ${
                      isSelected
                        ? "bg-indigo-600/90 text-white border-indigo-400 shadow-md font-medium"
                        : "bg-white/[0.03] hover:bg-white/[0.07] text-zinc-300 border-white/[0.06]"
                    }`}
                    title={f.description}
                  >
                    {isAiRecommended && !isSelected && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-indigo-400 rounded-full animate-ping" />
                    )}
                    <Icon className={`w-4 h-4 mb-1 ${isSelected ? "text-white" : "text-zinc-400"}`} />
                    <span className="text-[11px] leading-tight truncate w-full">{f.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Collapsible Advanced Options Drawer */}
            {isAdvancedOpen && (
              <div className="mt-3 p-4 rounded-2xl bg-black/40 border border-white/[0.08] space-y-4 animate-in fade-in duration-200 text-left">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Target Audience */}
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400 mb-1 flex items-center gap-1.5">
                      <Users className="w-3 h-3 text-indigo-400" />
                      Target Audience
                    </label>
                    <select
                      value={audience}
                      onChange={(e) => setAudience(e.target.value)}
                      className="w-full bg-[#181a24] text-xs text-zinc-200 border border-white/[0.1] rounded-xl px-2.5 py-1.5 outline-none focus:border-indigo-500"
                    >
                      {AUDIENCE_OPTIONS.map((aud) => (
                        <option key={aud} value={aud}>
                          {aud}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Desired Length */}
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400 mb-1 flex items-center gap-1.5">
                      <Compass className="w-3 h-3 text-indigo-400" />
                      Target Length
                    </label>
                    <select
                      value={desiredLength}
                      onChange={(e) => setDesiredLength(e.target.value)}
                      className="w-full bg-[#181a24] text-xs text-zinc-200 border border-white/[0.1] rounded-xl px-2.5 py-1.5 outline-none focus:border-indigo-500"
                    >
                      {LENGTH_OPTIONS.map((len) => (
                        <option key={len.id} value={len.id}>
                          {len.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Visual Theme */}
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400 mb-1 flex items-center gap-1.5">
                      <Palette className="w-3 h-3 text-indigo-400" />
                      Visual Styling & Theme
                    </label>
                    <select
                      value={visualTheme}
                      onChange={(e) => setVisualTheme(e.target.value)}
                      className="w-full bg-[#181a24] text-xs text-zinc-200 border border-white/[0.1] rounded-xl px-2.5 py-1.5 outline-none focus:border-indigo-500"
                    >
                      {THEME_OPTIONS.map((thm) => (
                        <option key={thm.id} value={thm.id}>
                          {thm.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Paste Source Notes & Attach File */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/[0.04]">
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400 mb-1 flex items-center gap-1.5">
                      <ClipboardPaste className="w-3 h-3 text-indigo-400" />
                      Paste Notes / Outline / Draft Text
                    </label>
                    <textarea
                      rows={2}
                      value={sourceNotes}
                      onChange={(e) => setSourceNotes(e.target.value)}
                      placeholder="Paste raw bullet points, transcript notes, or source text to expand..."
                      className="w-full bg-[#181a24] text-xs text-zinc-200 border border-white/[0.1] rounded-xl p-2 outline-none focus:border-indigo-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400 mb-1 flex items-center gap-1.5">
                      <Link2 className="w-3 h-3 text-indigo-400" />
                      Reference Links / URLs (1 per line)
                    </label>
                    <textarea
                      rows={2}
                      value={referenceLinksText}
                      onChange={(e) => setReferenceLinksText(e.target.value)}
                      placeholder="https://example.com/research-paper&#10;https://example.com/spec"
                      className="w-full bg-[#181a24] text-xs text-zinc-200 border border-white/[0.1] rounded-xl p-2 outline-none focus:border-indigo-500 resize-none font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Actions Bar */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,.markdown,.csv,.json,.doc,.docx,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-zinc-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs transition-colors"
                  title="Upload .txt, .md, .docx or .csv file"
                >
                  <Upload className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Upload File / Notes</span>
                </button>
              </div>

              {/* Primary Submit Button */}
              <button
                type="button"
                disabled={!prompt.trim() && selectedFormat !== "blank"}
                onClick={() => handleSubmit()}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-30 disabled:pointer-events-none text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/25 transition-all active:scale-[0.98]"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate {FORMAT_OPTIONS.find((f) => f.id === selectedFormat)?.label || "Document"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Inspiration Suggestions */}
        <div className="w-full mt-5">
          <div className="text-[11px] text-zinc-500 mb-2">Popular ideas to try:</div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {SUGGESTED_PROMPTS.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setPrompt(item.prompt);
                  setSelectedFormat(item.mode);
                }}
                className="px-3 py-1.5 rounded-full bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.07] hover:border-indigo-500/40 text-zinc-300 hover:text-white text-xs transition-all flex items-center gap-1.5"
              >
                <span className="text-indigo-400 text-[10px] uppercase font-mono tracking-wider font-semibold">
                  {item.mode}
                </span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* Saved Documents Section */}
      <div id="documents-section" className="w-full flex justify-center mt-10">
        <DocumentsSection
          documents={documents}
          onOpenDocument={onOpenDocument}
          onCreateNew={(mode) => onOpenDraft(mode)}
          onDeleteDocument={onDeleteDocument}
          onDuplicateDocument={onDuplicateDocument}
        />
      </div>

      {/* Footer */}
      <footer className="w-full max-w-5xl flex items-center justify-between text-xs text-zinc-500 border-t border-white/[0.06] pt-5 mt-10 relative z-10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>PagePilot Ready</span>
        </div>
        <div className="flex items-center gap-4 text-zinc-500 text-[11px]">
          <span>Documents • Presentations • Worksheets • Reports • Proposals</span>
        </div>
      </footer>
    </div>
  );
};
