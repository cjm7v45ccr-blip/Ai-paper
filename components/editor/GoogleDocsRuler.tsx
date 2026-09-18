"use client";

import React from "react";
import { inchesToPx } from "@/lib/coordinates";

interface GoogleDocsRulerProps {
  pageWidthInches: number; // 8.5
  safeMarginInches: number; // 0.45
  zoom: number;
  showMargins: boolean;
  onToggleMargins?: () => void;
}

export const GoogleDocsRuler: React.FC<GoogleDocsRulerProps> = ({
  pageWidthInches = 8.5,
  safeMarginInches = 0.45,
  zoom,
  showMargins,
  onToggleMargins,
}) => {
  const canvasWidthPx = inchesToPx(pageWidthInches); // 816px at 96 DPI
  const leftMarginPx = inchesToPx(safeMarginInches); // 43.2px
  const rightMarginPx = inchesToPx(pageWidthInches - safeMarginInches); // 772.8px
  const rulerHeight = 22;

  // Generate inch markings from 0 to 8
  const inchTicks: Array<{ inch: number; posPx: number }> = [];
  for (let i = 0; i <= Math.floor(pageWidthInches); i++) {
    inchTicks.push({ inch: i, posPx: inchesToPx(i) });
  }

  // Generate 1/8" sub-ticks
  const subTicks: Array<{ posPx: number; height: number }> = [];
  const totalEighths = Math.floor(pageWidthInches * 8);
  for (let i = 1; i < totalEighths; i++) {
    if (i % 8 === 0) continue; // Whole inch handled separately
    const posPx = inchesToPx(i / 8);
    let height = 3;
    if (i % 4 === 0) height = 7; // Half inch
    else if (i % 2 === 0) height = 5; // Quarter inch
    subTicks.push({ posPx, height });
  }

  return (
    <div
      className="no-print relative select-none shrink-0 mb-2.5 transition-transform origin-top"
      style={{
        width: `${canvasWidthPx * zoom}px`,
        height: `${rulerHeight}px`,
      }}
      title="Google Docs Document Ruler — 8.5 x 11 inch US Letter with 0.45 in print safe margins"
    >
      {/* Inner Ruler Scaled Container */}
      <div
        className="relative w-full h-full bg-[#f1f3f4] border-y border-slate-300 shadow-2xs flex items-center overflow-hidden"
        style={{
          width: `${canvasWidthPx}px`,
          height: `${rulerHeight}px`,
          transform: `scale(${zoom})`,
          transformOrigin: "left top",
        }}
      >
        {/* Left Margin Shaded Zone (0 to 0.45") */}
        <div
          className="absolute left-0 top-0 bottom-0 bg-slate-200/90 border-r border-slate-300/80 z-10"
          style={{ width: `${leftMarginPx}px` }}
          title={`Left print safe margin (${safeMarginInches}")`}
        />

        {/* Printable White Track (0.45" to 8.05") */}
        <div
          className="absolute top-0 bottom-0 bg-white z-0"
          style={{
            left: `${leftMarginPx}px`,
            width: `${rightMarginPx - leftMarginPx}px`,
          }}
        />

        {/* Right Margin Shaded Zone (8.05" to 8.5") */}
        <div
          className="absolute right-0 top-0 bottom-0 bg-slate-200/90 border-l border-slate-300/80 z-10"
          style={{ width: `${canvasWidthPx - rightMarginPx}px` }}
          title={`Right print safe margin (${safeMarginInches}")`}
        />

        {/* Sub-inch Tick Marks */}
        {subTicks.map((tick, idx) => (
          <div
            key={idx}
            className="absolute top-0 w-px bg-slate-400/80 pointer-events-none z-10"
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
              className="absolute top-0 w-px bg-slate-600 h-2.5 pointer-events-none z-10"
              style={{ left: `${t.posPx}px` }}
            />
            {t.inch > 0 && t.inch < pageWidthInches && (
              <span
                className="absolute top-1 text-[9px] font-sans font-medium text-slate-600 -translate-x-1/2 pointer-events-none z-10 select-none"
                style={{ left: `${t.posPx}px` }}
              >
                {t.inch}
              </span>
            )}
          </React.Fragment>
        ))}

        {/* Left Margin Indicator (Google Docs Blue Triangle & Rectangle) */}
        <div
          className="absolute top-0 z-20 flex flex-col items-center -translate-x-1/2 cursor-pointer group"
          style={{ left: `${leftMarginPx}px` }}
          onClick={onToggleMargins}
          title="Left Safe Margin Guide (0.45 in) — Click to toggle overlay"
        >
          {/* Top Rectangle (First line indent) */}
          <div className="w-2.5 h-1 bg-[#1a73e8] border border-blue-700 shadow-2xs group-hover:bg-blue-700" />
          {/* Downward Triangle (Left margin stop) */}
          <div
            className="w-0 h-0 border-l-[4.5px] border-l-transparent border-r-[4.5px] border-r-transparent border-t-[6px] border-t-[#1a73e8] group-hover:border-t-blue-700"
          />
        </div>

        {/* Right Margin Indicator (Google Docs Blue Triangle) */}
        <div
          className="absolute top-0 z-20 flex flex-col items-center -translate-x-1/2 cursor-pointer group"
          style={{ left: `${rightMarginPx}px` }}
          onClick={onToggleMargins}
          title="Right Safe Margin Guide (0.45 in) — Click to toggle overlay"
        >
          <div
            className="w-0 h-0 border-l-[4.5px] border-l-transparent border-r-[4.5px] border-r-transparent border-t-[6px] border-t-[#1a73e8] group-hover:border-t-blue-700"
          />
        </div>
      </div>
    </div>
  );
};
