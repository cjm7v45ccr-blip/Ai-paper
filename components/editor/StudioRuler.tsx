"use client";

import React, { useState, useEffect } from "react";
import { inchesToPx } from "@/lib/coordinates";
import { Shield, Sparkles } from "lucide-react";

interface StudioRulerProps {
  pageWidthInches: number; // 8.5
  safeMarginInches: number; // 0.45
  zoom: number;
  showMargins: boolean;
  onToggleMargins?: () => void;
}

export const StudioRuler: React.FC<StudioRulerProps> = ({
  pageWidthInches = 8.5,
  safeMarginInches = 0.45,
  zoom,
  showMargins,
  onToggleMargins,
}) => {
  const canvasWidthPx = inchesToPx(pageWidthInches); // 816px at 96 DPI
  const leftMarginPx = inchesToPx(safeMarginInches); // 43.2px
  const rightMarginPx = inchesToPx(pageWidthInches - safeMarginInches); // 772.8px
  const centerPx = inchesToPx(pageWidthInches / 2); // 408px
  const rulerHeight = 24;

  const [mousePosPx, setMousePosPx] = useState<number | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Find canvas container
      const canvasEl = document.getElementById("studio-document-canvas");
      if (canvasEl) {
        const rect = canvasEl.getBoundingClientRect();
        const relativeX = (e.clientX - rect.left) / zoom;
        if (relativeX >= 0 && relativeX <= canvasWidthPx) {
          setMousePosPx(relativeX);
        } else {
          setMousePosPx(null);
        }
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [canvasWidthPx, zoom]);

  // Generate inch markings from 0 to 8
  const inchTicks: Array<{ inch: number; posPx: number }> = [];
  for (let i = 0; i <= Math.floor(pageWidthInches); i++) {
    inchTicks.push({ inch: i, posPx: inchesToPx(i) });
  }

  // Generate sub-inch ticks (1/8 inch = 0.125")
  const subTicks: Array<{ posPx: number; height: number; isHalf: boolean }> = [];
  const totalEighths = Math.floor(pageWidthInches * 8);
  for (let i = 1; i < totalEighths; i++) {
    if (i % 8 === 0) continue;
    const posPx = inchesToPx(i / 8);
    const isHalf = i % 4 === 0;
    const isQuarter = i % 2 === 0;
    const height = isHalf ? 8 : isQuarter ? 5 : 3;
    subTicks.push({ posPx, height, isHalf });
  }

  return (
    <div
      className="no-print relative select-none shrink-0 mb-3 transition-transform origin-top"
      style={{
        width: `${canvasWidthPx * zoom}px`,
        height: `${rulerHeight}px`,
      }}
      title="Dia Spatial Guide — 8.5 x 11 inch with 0.45 in print safe boundaries"
    >
      {/* Precision Scale Bar */}
      <div
        className="relative w-full h-full bg-slate-900/95 backdrop-blur-md rounded-md border border-slate-800 shadow-sm flex items-center overflow-hidden"
        style={{
          width: `${canvasWidthPx}px`,
          height: `${rulerHeight}px`,
          transform: `scale(${zoom})`,
          transformOrigin: "left top",
        }}
      >
        {/* Left 0.45" Safe Bleed Indicator */}
        <div
          className="absolute left-0 top-0 bottom-0 bg-rose-950/40 border-r border-rose-500/50 flex items-center justify-center z-10"
          style={{ width: `${leftMarginPx}px` }}
          title={`Bleed Zone (0 to ${safeMarginInches}")`}
        >
          <span className="text-[8px] font-mono font-bold text-rose-400 opacity-80 scale-75">
            0.45"
          </span>
        </div>

        {/* Safe Printable Zone Track */}
        <div
          className="absolute top-0 bottom-0 bg-slate-950/60 z-0"
          style={{
            left: `${leftMarginPx}px`,
            width: `${rightMarginPx - leftMarginPx}px`,
          }}
        />

        {/* Center Optical Axis Marker (4.25") */}
        <div
          className="absolute top-0 bottom-0 w-px bg-cyan-400/40 z-10 pointer-events-none"
          style={{ left: `${centerPx}px` }}
          title="Optical Center Axis (4.25 in)"
        />

        {/* Right 0.45" Safe Bleed Indicator */}
        <div
          className="absolute right-0 top-0 bottom-0 bg-rose-950/40 border-l border-rose-500/50 flex items-center justify-center z-10"
          style={{ width: `${canvasWidthPx - rightMarginPx}px` }}
          title={`Bleed Zone (8.05" to 8.5")`}
        >
          <span className="text-[8px] font-mono font-bold text-rose-400 opacity-80 scale-75">
            0.45"
          </span>
        </div>

        {/* Sub-inch Tick Marks */}
        {subTicks.map((tick, idx) => (
          <div
            key={idx}
            className={`absolute top-0 w-px pointer-events-none z-10 ${
              tick.isHalf ? "bg-slate-500" : "bg-slate-700"
            }`}
            style={{
              left: `${tick.posPx}px`,
              height: `${tick.height}px`,
            }}
          />
        ))}

        {/* Major Inch Numbers & Main Ticks */}
        {inchTicks.map((t) => (
          <React.Fragment key={t.inch}>
            <div
              className="absolute top-0 w-px bg-slate-400 z-10 pointer-events-none"
              style={{ left: `${t.posPx}px`, height: "11px" }}
            />
            {t.inch > 0 && t.inch < pageWidthInches && (
              <span
                className="absolute text-[9px] font-mono font-semibold text-slate-300 z-10 pointer-events-none"
                style={{
                  left: `${t.posPx + 3}px`,
                  top: "2px",
                  lineHeight: "1",
                }}
              >
                {t.inch}"
              </span>
            )}
          </React.Fragment>
        ))}

        {/* Real-time Cursor Optical Hairline Tracking */}
        {mousePosPx !== null && (
          <div
            className="absolute top-0 bottom-0 w-px bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] z-30 pointer-events-none transition-all duration-75"
            style={{ left: `${mousePosPx}px` }}
          >
            <div className="absolute top-0 -translate-x-1/2 -translate-y-full bg-cyan-500 text-slate-950 px-1 py-0.5 rounded text-[8px] font-mono font-bold tracking-tight shadow">
              {(mousePosPx / 96).toFixed(2)}"
            </div>
          </div>
        )}

        {/* Quick Margin Guide Toggle Pill */}
        <button
          onClick={onToggleMargins}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 z-20 text-[9px] font-mono font-semibold flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all border border-slate-700"
          title="Toggle 0.45 in Print Bleed Guidelines"
        >
          <Shield className="w-2.5 h-2.5 text-emerald-400" />
          <span>{showMargins ? "Bleed: ON" : "Bleed: OFF"}</span>
        </button>
      </div>
    </div>
  );
};
