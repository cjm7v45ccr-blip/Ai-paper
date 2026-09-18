"use client";

import React, { useState, useRef } from "react";
import {
  Sparkles,
  Presentation,
  FileText,
  Upload,
  ArrowRight,
  ClipboardPaste,
  BookOpen,
  Cpu,
  Atom,
  TrendingUp,
  Clock,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { DocumentMode } from "@/types/document";

interface GammaStyleHomepageProps {
  onStartCreation: (params: {
    prompt: string;
    mode: DocumentMode;
    sourceContent?: string;
  }) => void;
  onOpenDraft: (mode: DocumentMode) => void;
}

export const GammaStyleHomepage: React.FC<GammaStyleHomepageProps> = ({
  onStartCreation,
  onOpenDraft,
}) => {
  const [prompt, setPrompt] = useState("");
  const [selectedFormat, setSelectedFormat] = useState<DocumentMode | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isPastingNotes, setIsPastingNotes] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const curatedIdeas = [
    {
      title: "Autonomous AI Agent Architecture",
      category: "Slide Deck",
      mode: "presentation" as DocumentMode,
      description: "6-slide executive deck on multi-agent loops, tool protocols, memory stores, and latency SLAs.",
      icon: Cpu,
    },
    {
      title: "Quantum Computing & Decoherence",
      category: "Slide Deck",
      mode: "presentation" as DocumentMode,
      description: "Superposition, qubit gates, KaTeX formulations, and cryogenic benchmarking matrix.",
      icon: Atom,
    },
    {
      title: "Enzyme Kinetics & Michaelis-Menten",
      category: "Document",
      mode: "document" as DocumentMode,
      description: "Comprehensive biochemistry study compendium with Lineweaver-Burk derivation and formulas.",
      icon: BookOpen,
    },
    {
      title: "Executive Cloud Strategy & Capex Memo",
      category: "Document",
      mode: "document" as DocumentMode,
      description: "Leadership one-pager on Kafka streaming, multi-region partitioning, and budget allocation.",
      icon: TrendingUp,
    },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setPrompt(
          (prev) =>
            `${prev ? prev + "\n\n" : ""}Uploaded document [${file.name}]:\n${content.slice(0, 1500)}`
        );
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = (formatChoice?: DocumentMode) => {
    const modeToUse = formatChoice || selectedFormat;
    if (!prompt.trim()) return;

    if (!modeToUse) {
      // Prompt user to pick format by focusing the format choice section
      setSelectedFormat("presentation");
      return;
    }

    onStartCreation({
      prompt: prompt.trim(),
      mode: modeToUse,
    });
  };

  return (
    <div className="min-h-screen bg-[#0d0f14] text-zinc-100 flex flex-col items-center justify-between px-4 py-8 sm:py-14 select-none relative overflow-x-hidden font-sans">
      {/* Subtle Ambient Background Radial Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[720px] h-[360px] bg-indigo-500/[0.07] rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Logo */}
      <header className="w-full max-w-4xl flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/[0.07] border border-white/[0.12] flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-white font-mono">
            PagePilot
          </span>
          <span className="text-[10px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-400 border border-white/[0.08]">
            AI Studio
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onOpenDraft("presentation")}
            className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/[0.05]"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Open Sample Deck</span>
          </button>

          <button
            onClick={() => onOpenDraft("document")}
            className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/[0.05]"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Open Sample Doc</span>
          </button>
        </div>
      </header>

      {/* Central Hero Creation Area */}
      <main className="w-full max-w-2xl flex flex-col items-center text-center my-auto py-8 relative z-10">
        {/* Main Headline */}
        <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-white leading-tight">
          What do you want to build today?
        </h1>
        <p className="mt-3 text-sm sm:text-base text-zinc-400 max-w-lg leading-relaxed">
          Describe an idea, paste raw notes, or upload material. PagePilot structures, designs, and writes the complete draft automatically.
        </p>

        {/* The Natural Language Creation Box */}
        <div className="w-full mt-8 bg-[#14161d] border border-white/[0.1] rounded-3xl p-4 sm:p-5 shadow-2xl transition-all focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/30">
          <textarea
            rows={isPastingNotes ? 6 : 3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && prompt.trim()) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Describe what you want to create (e.g. 'A 5-slide presentation introducing quantum computing gates and error correction with clean visual cards')..."
            className="w-full bg-transparent text-sm sm:text-base text-zinc-100 placeholder:text-zinc-500 outline-none resize-none leading-relaxed"
          />

          {/* Uploaded File Pill Indicator */}
          {uploadedFileName && (
            <div className="mt-2 flex items-center gap-2 text-xs text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-xl w-fit">
              <Upload className="w-3.5 h-3.5" />
              <span>Attached: {uploadedFileName}</span>
              <button
                onClick={() => setUploadedFileName(null)}
                className="ml-1 text-zinc-400 hover:text-white"
              >
                ×
              </button>
            </div>
          )}

          {/* Lower Action Row inside Input Card */}
          <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-white/[0.06]">
            {/* Context Inputs: File Upload & Paste */}
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.markdown,.csv,.json,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
                title="Attach text, markdown, or data notes"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload notes</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPastingNotes(!isPastingNotes)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                  isPastingNotes
                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                    : "bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-zinc-200"
                }`}
                title="Expand editor to paste raw text"
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                <span>Paste content</span>
              </button>
            </div>

            {/* Quick Submit Prompt Button */}
            <button
              type="button"
              disabled={!prompt.trim()}
              onClick={() => handleSubmit()}
              className="flex items-center gap-2 px-5 py-2 bg-white text-zinc-950 hover:bg-zinc-200 disabled:opacity-30 disabled:pointer-events-none rounded-xl text-xs font-semibold shadow-md transition-all active:scale-[0.98]"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Format Selector: Slide Deck vs Document */}
        <div className="w-full mt-6 flex flex-col items-center">
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">
            Choose format to generate:
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
            {/* Slide Deck Option */}
            <button
              type="button"
              onClick={() => {
                setSelectedFormat("presentation");
                if (prompt.trim()) {
                  onStartCreation({ prompt: prompt.trim(), mode: "presentation" });
                }
              }}
              className={`p-4 rounded-2xl border text-left transition-all group flex items-start gap-3.5 ${
                selectedFormat === "presentation"
                  ? "bg-[#181a24] border-indigo-500/80 shadow-lg ring-1 ring-indigo-500/50"
                  : "bg-[#13151c] border-white/[0.08] hover:border-white/[0.18] hover:bg-[#181a22]"
              }`}
            >
              <div className="p-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/25 text-indigo-400 shrink-0 group-hover:scale-105 transition-transform">
                <Presentation className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Slide Deck</h3>
                  <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                    16:9 Widescreen
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                  Bite-sized visual cards, fluid layouts, and clear slide milestones.
                </p>
              </div>
            </button>

            {/* Document Option */}
            <button
              type="button"
              onClick={() => {
                setSelectedFormat("document");
                if (prompt.trim()) {
                  onStartCreation({ prompt: prompt.trim(), mode: "document" });
                }
              }}
              className={`p-4 rounded-2xl border text-left transition-all group flex items-start gap-3.5 ${
                selectedFormat === "document"
                  ? "bg-[#181a24] border-indigo-500/80 shadow-lg ring-1 ring-indigo-500/50"
                  : "bg-[#13151c] border-white/[0.08] hover:border-white/[0.18] hover:bg-[#181a22]"
              }`}
            >
              <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Document</h3>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    8.5 × 11 In
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                  Structured flowing pages, executive briefs, research reports, or study guides.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Curated Prompt Inspirations */}
        <div className="w-full mt-10 text-left">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Or start from an inspiration:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {curatedIdeas.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setPrompt(item.description);
                    setSelectedFormat(item.mode);
                    onStartCreation({ prompt: item.description, mode: item.mode });
                  }}
                  className="flex items-start gap-3 p-3.5 rounded-xl bg-[#13151c] hover:bg-[#191b24] border border-white/[0.06] hover:border-white/[0.14] text-left transition-all group"
                >
                  <div className="p-2 rounded-lg bg-zinc-800/80 border border-white/[0.08] text-zinc-300 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-colors shrink-0">
                    <IconComp className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-semibold text-zinc-200 group-hover:text-white truncate">
                        {item.title}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-zinc-400 uppercase shrink-0">
                        {item.category}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-zinc-400 line-clamp-1 leading-snug">
                      {item.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer / Status */}
      <footer className="w-full max-w-4xl flex items-center justify-between text-xs text-zinc-500 border-t border-white/[0.06] pt-4 relative z-10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>PagePilot Layout & KaTeX Engine Active</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Clean 16:9 & 8.5×11 Synthesis</span>
          <span>Zero Configuration</span>
        </div>
      </footer>
    </div>
  );
};
