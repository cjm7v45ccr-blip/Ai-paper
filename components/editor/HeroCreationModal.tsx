"use client";

import React, { useState } from "react";
import {
  Sparkles,
  FileText,
  Presentation,
  CheckSquare,
  FileCode,
  ArrowRight,
  Layers,
  Zap,
  BookOpen,
  TrendingUp,
  Cpu,
  Atom,
  X,
  Compass,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { DocumentMode } from "@/types/document";

interface HeroCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (params: {
    prompt: string;
    mode: DocumentMode;
    generateOutlineFirst: boolean;
    theme?: string;
  }) => void;
  isLoading: boolean;
}

interface InspirationPrompt {
  title: string;
  category: string;
  mode: DocumentMode;
  prompt: string;
  icon: any;
  badge: string;
}

const INSPIRATION_PROMPTS: InspirationPrompt[] = [
  {
    title: "Quantum Computing & Qubit Gates",
    category: "Presentation",
    mode: "presentation",
    prompt: "Create an executive 6-slide presentation explaining Quantum Computing, superposition, qubit gates, and decoherence time comparisons with clean 16:9 layouts.",
    icon: Atom,
    badge: "16:9 Deck",
  },
  {
    title: "Enzyme Kinetics & Michaelis-Menten",
    category: "Document",
    mode: "document",
    prompt: "Design an 8.5x11 study guide on Biochemistry Enzyme Kinetics, featuring Michaelis-Menten velocity equations, Lineweaver-Burk plots, and KaTeX mathematical formulas.",
    icon: Sparkles,
    badge: "Study Guide",
  },
  {
    title: "Q3 SaaS Infrastructure Strategy",
    category: "Executive Report",
    mode: "report",
    prompt: "A polished strategic executive brief on cloud migration: Capex allocation, Kafka partitioning metrics, query latency SLAs, and leadership sign-off criteria.",
    icon: TrendingUp,
    badge: "Executive Brief",
  },
  {
    title: "Calculus Kinematics & Mechanics",
    category: "Worksheet",
    mode: "worksheet",
    prompt: "Create a STEM calculus and physics problem set with integral work-energy theorem equations, velocity diagrams, and ruled student handwriting solution lines.",
    icon: BookOpen,
    badge: "Worksheet",
  },
  {
    title: "Autonomous AI Agent Architecture",
    category: "Visual Explanation",
    mode: "document",
    prompt: "Build a comprehensive technical report on multi-agent LLM systems: planning loops, tool execution protocols, memory stores, and latency benchmarks.",
    icon: Cpu,
    badge: "Infographic",
  },
];

export const HeroCreationModal: React.FC<HeroCreationModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  isLoading,
}) => {
  const [prompt, setPrompt] = useState("");
  const [selectedMode, setSelectedMode] = useState<DocumentMode>("document");
  const [generateOutlineFirst, setGenerateOutlineFirst] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>("");

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    onCreate({
      prompt: prompt.trim(),
      mode: selectedMode,
      generateOutlineFirst,
    });
  };

  const handleSelectInspiration = (insp: InspirationPrompt) => {
    setPrompt(insp.prompt);
    setSelectedMode(insp.mode);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-xl animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-3xl bg-[#121318]/95 border border-white/[0.1] rounded-3xl shadow-2xl overflow-hidden flex flex-col text-zinc-100">
        {/* Subtle decorative glow */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-52 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-white/[0.08] border border-white/[0.12] flex items-center justify-center text-zinc-200">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <span className="text-xs font-semibold tracking-wide text-zinc-300 uppercase font-mono">
              PagePilot AI Creation Studio
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main Content Area */}
        <div className="p-6 sm:p-10 flex flex-col items-center text-center relative z-10">
          {/* Main Title */}
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-white max-w-xl">
            What do you want to create?
          </h2>
          <p className="mt-2 text-sm text-zinc-400 max-w-lg leading-relaxed">
            Describe a document, presentation, worksheet, or visual page. PagePilot structures content, layout geometry, formulas, and diagrams automatically.
          </p>

          {/* Mode Format Selector (Apple-like segmented pill) */}
          <div className="mt-6 flex items-center p-1 bg-[#1a1b22] border border-white/[0.08] rounded-2xl gap-1">
            <button
              type="button"
              onClick={() => setSelectedMode("document")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                selectedMode === "document"
                  ? "bg-zinc-800 text-white shadow-xs border border-white/[0.1]"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>Document</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMode("presentation")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                selectedMode === "presentation"
                  ? "bg-zinc-800 text-white shadow-xs border border-white/[0.1]"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Presentation className="w-3.5 h-3.5 text-emerald-400" />
              <span>Presentation (16:9)</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMode("worksheet")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                selectedMode === "worksheet"
                  ? "bg-zinc-800 text-white shadow-xs border border-white/[0.1]"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
              <span>Worksheet</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMode("report")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                selectedMode === "report"
                  ? "bg-zinc-800 text-white shadow-xs border border-white/[0.1]"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-violet-400" />
              <span>Executive Report</span>
            </button>
          </div>

          {/* Large Prompt Input Box */}
          <div className="w-full mt-6">
            <form onSubmit={handleSubmit} className="relative">
              <textarea
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                disabled={isLoading}
                placeholder="Describe what you want to create (e.g. 'A 6-slide deck on AI agent systems with architecture diagrams, benchmarks, and comparison matrix')..."
                className="w-full bg-[#181920]/90 border border-white/[0.12] focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 rounded-2xl p-4 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none resize-none transition-all shadow-inner leading-relaxed"
              />

              {/* Action row below textarea */}
              <div className="flex items-center justify-between mt-3 px-1">
                {/* Generation Options */}
                <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer hover:text-zinc-200 transition-colors">
                  <input
                    type="checkbox"
                    checked={generateOutlineFirst}
                    onChange={(e) => setGenerateOutlineFirst(e.target.checked)}
                    className="w-3.5 h-3.5 rounded bg-zinc-800 border-zinc-700 text-indigo-600 focus:ring-0"
                  />
                  <span>Generate structured outline first</span>
                </label>

                {/* Primary Submit Button */}
                <button
                  type="submit"
                  disabled={!prompt.trim() || isLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white text-zinc-950 hover:bg-zinc-200 disabled:opacity-30 disabled:pointer-events-none rounded-xl text-xs font-semibold shadow-md transition-all active:scale-[0.98]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating with Gemini...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Create {selectedMode === "presentation" ? "Deck" : "Document"}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-600" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Prompt Inspirations */}
          <div className="w-full mt-8 text-left">
            <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 mb-3">
              <Compass className="w-3.5 h-3.5 text-zinc-400" />
              <span>Or start from a curated idea:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {INSPIRATION_PROMPTS.map((item, idx) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectInspiration(item)}
                    className="flex items-start gap-3 p-3 rounded-xl bg-[#17181f]/80 hover:bg-[#20222a] border border-white/[0.06] hover:border-white/[0.14] text-left transition-all group"
                  >
                    <div className="p-2 rounded-lg bg-zinc-800/80 border border-white/[0.08] text-zinc-300 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-colors shrink-0">
                      <IconComponent className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-semibold text-zinc-200 group-hover:text-white truncate">
                          {item.title}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-zinc-400 uppercase shrink-0">
                          {item.badge}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-zinc-400 line-clamp-1 leading-snug">
                        {item.prompt}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
