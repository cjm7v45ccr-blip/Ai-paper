"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, CheckCircle2, Loader2, Layout, FileText, Presentation } from "lucide-react";
import { DocumentMode } from "@/types/document";

interface GenerationSteppedScreenProps {
  prompt: string;
  mode: DocumentMode;
}

export const GenerationSteppedScreen: React.FC<GenerationSteppedScreenProps> = ({
  prompt,
  mode,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const steps = [
    { title: "Analyzing intent & structuring outline", duration: 800 },
    { title: "Composing structured sections & narrative flow", duration: 1000 },
    { title: "Synthesizing KaTeX formulas & data models", duration: 900 },
    { title: "Applying balanced typography & bento layouts", duration: 700 },
    { title: "Finalizing print-safe margins & export geometry", duration: 600 },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStepIndex((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 900);
    return () => clearInterval(timer);
  }, [steps.length]);

  return (
    <div className="min-h-screen bg-[#0d0f14] text-zinc-100 flex flex-col items-center justify-center p-6 select-none relative overflow-hidden font-sans">
      {/* Decorative center ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg bg-[#13151c]/90 border border-white/[0.1] rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative z-10 flex flex-col items-center text-center">
        {/* Animated AI Icon */}
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            {mode === "presentation" ? (
              <Presentation className="w-8 h-8 animate-pulse" />
            ) : (
              <FileText className="w-8 h-8 animate-pulse" />
            )}
          </div>
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center shadow-lg">
            <Sparkles className="w-3 h-3 text-white animate-spin" />
          </div>
        </div>

        <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
          Generating your {mode === "presentation" ? "Slide Deck" : "Document"}
        </h2>

        <p className="mt-2 text-xs sm:text-sm text-zinc-400 line-clamp-2 px-2">
          &ldquo;{prompt}&rdquo;
        </p>

        {/* Stepper Progress */}
        <div className="w-full mt-8 space-y-3 text-left">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div
                key={idx}
                className={`flex items-center gap-3 p-2.5 rounded-xl transition-all duration-300 ${
                  isCurrent
                    ? "bg-white/[0.08] border border-white/[0.12] text-white"
                    : isCompleted
                    ? "text-zinc-400"
                    : "text-zinc-600 opacity-60"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-zinc-700 shrink-0" />
                )}

                <span className="text-xs font-medium tracking-wide">
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Subtle Status Bar */}
        <div className="w-full mt-6 pt-4 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-zinc-500 font-mono">
          <span>Target: {mode === "presentation" ? "16:9 Widescreen" : "8.5 × 11 In"}</span>
          <span>Adaptive Layout Engine</span>
        </div>
      </div>
    </div>
  );
};
