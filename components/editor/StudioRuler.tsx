"use client";

import React, { useState, useEffect } from "react";
import { inchesToPx } from "@/lib/coordinates";
import { Shield } from "lucide-react";

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
  const rulerHeight = 22;

  const [mousePosPx, setMousePosPx] = useState<number | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
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
    const height = isHalf ? 7 : isQuarter ? 5 : 3;
    subTicks.push({ posPx, height, isHalf });
  }

  return (
    <div
      className="no-print relative select-none shrink-0 mb-3 transition-transform origin-top"
      style={{
        width: `${canvasWidthPx * zoom}px`,
        height: `${rulerHeight}px`,
      }}
      title="Precision Spatial Guide — 8.5 × 11 inch (0.45 in print safe margins)"
    >
      {/* Precision Scale Bar */}
      <div
        className="relative w-full h-full bg-zinc-950 rounded border border-zinc-800 flex items-center overflow-hidden"
        style={{
          width: `${canvasWidthPx}px`,
          height: `${rulerHeight}px`,
          transform: `scale(${zoom})`,
          transformOrigin: "left top",
        }}
      >
        {/* Left 0.45" Safe Bleed Indicator */}
        <div
          className="absolute left-0 top-0 bottom-0 bg-zinc-900/80 border-r border-zinc-700/60 flex items-center justify-center z-10"
          style={{ width: `${leftMarginPx}px` }}
          title={`Print Bleed Margin (0 to ${safeMarginInches}")`}
        >
          <span className="text-[8px] font-mono text-zinc-400">0.45"</span>
        </div>

        {/* Safe Printable Zone Track */}
        <div
          className="absolute top-0 bottom-0 bg-zinc-950 z-0"
          style={{
            left: `${leftMarginPx}px`,
            width: `${rightMarginPx - leftMarginPx}px`,
          }}
        />

        {/* Center Optical Axis Marker (4.25") */}
        <div
          className="absolute top-0 bottom-0 w-px bg-zinc-700 z-10 pointer-events-none"
          style={{ left: `${centerPx}px` }}
          title="Center Axis (4.25 in)"
        />

        {/* Right 0.45" Safe Bleed Indicator */}
        <div
          className="absolute right-0 top-0 bottom-0 bg-zinc-900/80 border-l border-zinc-700/60 flex items-center justify-center z-10"
          style={{ width: `${canvasWidthPx - rightMarginPx}px` }}
          title={`Print Bleed Margin (8.05" to 8.5")`}
        >
          <span className="text-[8px] font-mono text-zinc-400">0.45"</span>
        </div>

        {/* Sub-inch Tick Marks */}
        {subTicks.map((tick, idx) => (
          <div
            key={idx}
            className={`absolute top-0 w-px pointer-events-none z-10 ${
              tick.isHalf ? "bg-zinc-600" : "bg-zinc-800"
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
              className="absolute top-0 w-px bg-zinc-500 z-10 pointer-events-none"
              style={{ left: `${t.posPx}px`, height: "10px" }}
            />
            {t.inch > 0 && t.inch < pageWidthInches && (
              <span
                className="absolute text-[9px] font-mono text-zinc-400 z-10 pointer-events-none"
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

        {/* Real-time Cursor Hairline Tracking */}
        {mousePosPx !== null && (
          <div
            className="absolute top-0 bottom-0 w-px bg-zinc-300 z-30 pointer-events-none"
            style={{ left: `${mousePosPx}px` }}
          >
            <div className="absolute top-0 -translate-x-1/2 -translate-y-full bg-zinc-800 text-zinc-200 px-1 py-0.5 rounded text-[8px] font-mono shadow">
              {(mousePosPx / 96).toFixed(2)}"
            </div>
          </div>
        )}

        {/* Quick Margin Guide Toggle Pill */}
        <button
          onClick={onToggleMargins}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 z-20 text-[9px] font-mono flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 hover:text-white transition-colors border border-zinc-700"
          title="Toggle 0.45 in Print Bleed Guidelines"
        >
          <Shield className="w-2.5 h-2.5 text-zinc-400" />
          <span>{showMargins ? "Bleed: ON" : "Bleed: OFF"}</span>
        </button>
      </div>
    </div>
  );
};
