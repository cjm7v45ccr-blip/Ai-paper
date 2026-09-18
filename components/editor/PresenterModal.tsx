"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DocumentModel, PageData } from "@/types/document";
import { ElementRenderer } from "./ElementRenderer";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Clock,
  Sparkles,
} from "lucide-react";
import { inchesToPx } from "@/lib/coordinates";

interface PresenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentModel;
  initialSlideIndex?: number;
}

export const PresenterModal: React.FC<PresenterModalProps> = ({
  isOpen,
  onClose,
  document: doc,
  initialSlideIndex = 0,
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(initialSlideIndex);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const pages: PageData[] =
    doc.pages && doc.pages.length > 0
      ? doc.pages
      : [
          {
            id: "page-1",
            title: "Slide 1",
            elements: doc.elements || [],
          },
        ];

  // Sync initial slide index
  useEffect(() => {
    if (isOpen) {
      setCurrentSlideIndex(initialSlideIndex);
      setElapsedSeconds(0);
    }
  }, [isOpen, initialSlideIndex]);

  // Timer counter
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleNext = useCallback(() => {
    if (currentSlideIndex < pages.length - 1) {
      setCurrentSlideIndex((prev) => prev + 1);
    }
  }, [currentSlideIndex, pages.length]);

  const handlePrev = useCallback(() => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex((prev) => prev - 1);
    }
  }, [currentSlideIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleNext, handlePrev, onClose]);

  if (!isOpen) return null;

  const currentSlide = pages[currentSlideIndex] || pages[0];
  const is169 = doc.page?.size === "presentation-16-9" || doc.mode === "presentation";
  const slideWidth = is169 ? 13.333 : doc.page?.width || 8.5;
  const slideHeight = is169 ? 7.5 : doc.page?.height || 11.0;

  const slideWidthPx = inchesToPx(slideWidth);
  const slideHeightPx = inchesToPx(slideHeight);

  return (
    <div className="fixed inset-0 z-50 bg-[#07080a] flex flex-col items-center justify-between p-4 md:p-8 select-none overflow-hidden animate-in fade-in duration-200">
      {/* Top Floating Chrome */}
      <div className="w-full max-w-6xl flex items-center justify-between px-4 py-2 bg-[#121318]/80 backdrop-blur-md border border-white/[0.08] rounded-2xl text-zinc-300 z-10 shadow-xl">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-white tracking-wide truncate max-w-[200px] sm:max-w-md">
            {doc.title || "Presentation"}
          </span>
          <span className="text-[11px] font-mono text-zinc-400 bg-white/[0.06] px-2 py-0.5 rounded-md">
            Slide {currentSlideIndex + 1} of {pages.length}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Timer */}
          <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 bg-white/[0.04] px-2.5 py-1 rounded-lg">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span>{formatTime(elapsedSeconds)}</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
            title="Exit Presentation (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Slide Canvas Container (Auto Scaled) */}
      <div className="flex-1 w-full flex items-center justify-center p-4 relative overflow-hidden">
        <div
          className="relative shadow-2xl rounded-2xl overflow-hidden transition-all duration-300"
          style={{
            width: `${slideWidthPx}px`,
            height: `${slideHeightPx}px`,
            maxHeight: "82vh",
            maxWidth: is169 ? "88vw" : "65vw",
            aspectRatio: `${slideWidth} / ${slideHeight}`,
            backgroundColor: currentSlide.background || doc.page?.background || "#ffffff",
          }}
        >
          {currentSlide.elements?.map((el) => {
            const xPx = inchesToPx(el.x);
            const yPx = inchesToPx(el.y);
            const wPx = inchesToPx(el.width);
            const hPx = inchesToPx(el.height);
            const rot = el.rotation || 0;

            return (
              <div
                key={el.id}
                className="absolute select-none"
                style={{
                  left: `${xPx}px`,
                  top: `${yPx}px`,
                  width: `${wPx}px`,
                  height: `${hPx}px`,
                  transform: rot ? `rotate(${rot}deg)` : undefined,
                  zIndex: el.zIndex || 1,
                }}
              >
                <ElementRenderer
                  element={el}
                  isBlackAndWhite={false}
                  isPreview={true}
                  isPresentation={is169}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Slide Controller */}
      <div className="flex items-center gap-3 bg-[#121318]/90 backdrop-blur-md border border-white/[0.08] px-4 py-2 rounded-2xl shadow-2xl z-10">
        <button
          onClick={handlePrev}
          disabled={currentSlideIndex <= 0}
          className="p-1.5 rounded-xl text-zinc-300 hover:text-white hover:bg-white/[0.08] disabled:opacity-20 disabled:pointer-events-none transition-colors"
          title="Previous Slide (← Arrow)"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Slide navigation dots */}
        <div className="flex items-center gap-1.5 px-2">
          {pages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlideIndex(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === currentSlideIndex
                  ? "w-8 bg-indigo-500"
                  : "w-2 bg-zinc-600 hover:bg-zinc-400"
              }`}
              title={`Jump to slide ${idx + 1}`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          disabled={currentSlideIndex >= pages.length - 1}
          className="p-1.5 rounded-xl text-zinc-300 hover:text-white hover:bg-white/[0.08] disabled:opacity-20 disabled:pointer-events-none transition-colors"
          title="Next Slide (→ Arrow)"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
