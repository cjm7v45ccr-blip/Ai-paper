"use client";

import React, { useState, useEffect } from "react";
import { inchesToPx } from "@/lib/coordinates";

interface GoogleWorkspaceRulerProps {
  pageWidthInches: number;
  pageHeightInches: number;
  safeMarginInches?: number;
  zoom: number;
  selectedElementBounds?: { x: number; y: number; width: number; height: number } | null;
  cursorPos?: { xIn: number; yIn: number } | null;
  onUpdateMargins?: (marginInches: number) => void;
  showMargins?: boolean;
}

export const GoogleWorkspaceTopRuler: React.FC<{
  pageWidthInches: number;
  safeMarginInches?: number;
  zoom: number;
  selectedElementBounds?: { x: number; width: number } | null;
  cursorXIn?: number | null;
  onToggleMargins?: () => void;
}> = ({
  pageWidthInches = 8.5,
  safeMarginInches = 0.65,
  zoom,
  selectedElementBounds,
  cursorXIn,
  onToggleMargins,
}) => {
  const canvasWidthPx = inchesToPx(pageWidthInches);
  const leftMarginPx = inchesToPx(safeMarginInches);
  const rightMarginPx = inchesToPx(pageWidthInches - safeMarginInches);
  const centerPx = inchesToPx(pageWidthInches / 2);
  const rulerHeight = 22;

  // Generate inch markings
  const inchTicks: Array<{ inch: number; posPx: number }> = [];
  for (let i = 0; i <= Math.floor(pageWidthInches); i++) {
    inchTicks.push({ inch: i, posPx: inchesToPx(i) });
  }

  // Generate 1/8" sub-ticks
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

  // Selected element highlight range
  const selLeftPx = selectedElementBounds ? inchesToPx(selectedElementBounds.x) : null;
  const selWidthPx = selectedElementBounds ? inchesToPx(selectedElementBounds.width) : null;

  return (
    <div
      className="no-print relative select-none shrink-0 mb-1.5 transition-transform origin-top flex items-center justify-center"
      style={{
        width: `${canvasWidthPx * zoom}px`,
        height: `${rulerHeight}px`,
      }}
      title="Google Workspace Precision Horizontal Ruler"
    >
      <div
        className="relative w-full h-full bg-[#161822] border border-white/[0.08] rounded-md shadow-xs flex items-center overflow-hidden"
        style={{
          width: `${canvasWidthPx}px`,
          height: `${rulerHeight}px`,
          transform: `scale(${zoom})`,
          transformOrigin: "left top",
        }}
      >
        {/* Left Shaded Bleed Margin */}
        <div
          className="absolute left-0 top-0 bottom-0 bg-white/[0.03] border-r border-white/10 flex items-center justify-center z-10 cursor-pointer"
          style={{ width: `${leftMarginPx}px` }}
          onClick={onToggleMargins}
          title={`Left Margin: ${safeMarginInches}" (Click to toggle)`}
        >
          <span className="text-[8px] font-mono text-zinc-400">{safeMarginInches}"</span>
        </div>

        {/* Printable White/Active Track */}
        <div
          className="absolute top-0 bottom-0 bg-[#0f111a] z-0"
          style={{
            left: `${leftMarginPx}px`,
            width: `${Math.max(0, rightMarginPx - leftMarginPx)}px`,
          }}
        />

        {/* Selected Element Active Span Highlight on Ruler */}
        {selLeftPx !== null && selWidthPx !== null && (
          <div
            className="absolute top-0 bottom-0 bg-indigo-500/25 border-x border-indigo-500/60 z-10 transition-all pointer-events-none"
            style={{
              left: `${selLeftPx}px`,
              width: `${selWidthPx}px`,
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-indigo-400" />
          </div>
        )}

        {/* Center Optical Axis Marker */}
        <div
          className="absolute top-0 bottom-0 w-px bg-indigo-500/40 z-10 pointer-events-none"
          style={{ left: `${centerPx}px` }}
          title={`Center Axis: ${(pageWidthInches / 2).toFixed(2)}"`}
        />

        {/* Right Shaded Bleed Margin */}
        <div
          className="absolute right-0 top-0 bottom-0 bg-white/[0.03] border-l border-white/10 flex items-center justify-center z-10 cursor-pointer"
          style={{ width: `${canvasWidthPx - rightMarginPx}px` }}
          onClick={onToggleMargins}
          title={`Right Margin: ${safeMarginInches}" (Click to toggle)`}
        >
          <span className="text-[8px] font-mono text-zinc-400">{safeMarginInches}"</span>
        </div>

        {/* Sub-inch Tick Marks */}
        {subTicks.map((tick, idx) => (
          <div
            key={idx}
            className={`absolute top-0 w-px pointer-events-none z-10 ${
              tick.isHalf ? "bg-white/20" : "bg-white/10"
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
              className="absolute top-0 w-px bg-zinc-400/80 z-10 pointer-events-none"
              style={{ left: `${t.posPx}px`, height: "9px" }}
            />
            {t.inch > 0 && t.inch < pageWidthInches && (
              <span
                className="absolute top-2 text-[9px] font-mono font-medium text-zinc-400 -translate-x-1/2 pointer-events-none z-10 select-none"
                style={{ left: `${t.posPx}px` }}
              >
                {t.inch}
              </span>
            )}
          </React.Fragment>
        ))}

        {/* Google Docs Style First-Line Indent & Left Margin Slider Markers */}
        <div
          className="absolute top-0 z-20 flex flex-col items-center -translate-x-1/2 cursor-pointer group"
          style={{ left: `${leftMarginPx}px` }}
          onClick={onToggleMargins}
          title={`Left Margin Stop (${safeMarginInches}")`}
        >
          <div className="w-2.5 h-1 bg-indigo-400 border border-indigo-300 shadow-2xs group-hover:bg-indigo-300" />
          <div className="w-0 h-0 border-l-[4.5px] border-l-transparent border-r-[4.5px] border-r-transparent border-t-[5px] border-t-indigo-400 group-hover:border-t-indigo-300" />
        </div>

        {/* Right Margin Stop Slider */}
        <div
          className="absolute top-0 z-20 flex flex-col items-center -translate-x-1/2 cursor-pointer group"
          style={{ left: `${rightMarginPx}px` }}
          onClick={onToggleMargins}
          title={`Right Margin Stop (${safeMarginInches}")`}
        >
          <div className="w-0 h-0 border-l-[4.5px] border-l-transparent border-r-[4.5px] border-r-transparent border-t-[5px] border-t-indigo-400 group-hover:border-t-indigo-300" />
        </div>

        {/* Live Cursor Indicator on Top Ruler */}
        {cursorXIn !== undefined && cursorXIn !== null && (
          <div
            className="absolute top-0 bottom-0 w-px bg-cyan-400 z-30 pointer-events-none shadow-[0_0_4px_rgba(34,211,238,0.8)]"
            style={{ left: `${inchesToPx(cursorXIn)}px` }}
          />
        )}
      </div>
    </div>
  );
};

export const GoogleWorkspaceVerticalRuler: React.FC<{
  pageHeightInches: number;
  safeMarginInches?: number;
  zoom: number;
  selectedElementBounds?: { y: number; height: number } | null;
  cursorYIn?: number | null;
}> = ({
  pageHeightInches = 11,
  safeMarginInches = 0.65,
  zoom,
  selectedElementBounds,
  cursorYIn,
}) => {
  const canvasHeightPx = inchesToPx(pageHeightInches);
  const topMarginPx = inchesToPx(safeMarginInches);
  const bottomMarginPx = inchesToPx(pageHeightInches - safeMarginInches);
  const centerPx = inchesToPx(pageHeightInches / 2);
  const rulerWidth = 22;

  // Generate inch markings
  const inchTicks: Array<{ inch: number; posPx: number }> = [];
  for (let i = 0; i <= Math.floor(pageHeightInches); i++) {
    inchTicks.push({ inch: i, posPx: inchesToPx(i) });
  }

  // Generate 1/8" sub-ticks
  const subTicks: Array<{ posPx: number; width: number; isHalf: boolean }> = [];
  const totalEighths = Math.floor(pageHeightInches * 8);
  for (let i = 1; i < totalEighths; i++) {
    if (i % 8 === 0) continue;
    const posPx = inchesToPx(i / 8);
    const isHalf = i % 4 === 0;
    const isQuarter = i % 2 === 0;
    const width = isHalf ? 7 : isQuarter ? 5 : 3;
    subTicks.push({ posPx, width, isHalf });
  }

  const selTopPx = selectedElementBounds ? inchesToPx(selectedElementBounds.y) : null;
  const selHeightPx = selectedElementBounds ? inchesToPx(selectedElementBounds.height) : null;

  return (
    <div
      className="no-print absolute left-0 top-0 select-none shrink-0 transition-transform origin-top-left -translate-x-full pr-1.5"
      style={{
        width: `${rulerWidth}px`,
        height: `${canvasHeightPx * zoom}px`,
      }}
      title="Google Workspace Vertical Ruler"
    >
      <div
        className="relative w-full h-full bg-[#161822] border border-white/[0.08] rounded-md shadow-xs flex items-center overflow-hidden"
        style={{
          width: `${rulerWidth}px`,
          height: `${canvasHeightPx}px`,
          transform: `scale(${zoom})`,
          transformOrigin: "left top",
        }}
      >
        {/* Top Shaded Margin */}
        <div
          className="absolute top-0 left-0 right-0 bg-white/[0.03] border-b border-white/10 z-10"
          style={{ height: `${topMarginPx}px` }}
          title={`Top Margin: ${safeMarginInches}"`}
        />

        {/* Middle Printable Track */}
        <div
          className="absolute left-0 right-0 bg-[#0f111a] z-0"
          style={{
            top: `${topMarginPx}px`,
            height: `${Math.max(0, bottomMarginPx - topMarginPx)}px`,
          }}
        />

        {/* Selected Element Active Vertical Span */}
        {selTopPx !== null && selHeightPx !== null && (
          <div
            className="absolute left-0 right-0 bg-indigo-500/25 border-y border-indigo-500/60 z-10 transition-all pointer-events-none"
            style={{
              top: `${selTopPx}px`,
              height: `${selHeightPx}px`,
            }}
          >
            <div className="absolute top-0 bottom-0 left-0 w-0.5 bg-indigo-400" />
          </div>
        )}

        {/* Center Axis */}
        <div
          className="absolute left-0 right-0 h-px bg-indigo-500/40 z-10 pointer-events-none"
          style={{ top: `${centerPx}px` }}
          title={`Middle Axis: ${(pageHeightInches / 2).toFixed(2)}"`}
        />

        {/* Bottom Shaded Margin */}
        <div
          className="absolute bottom-0 left-0 right-0 bg-white/[0.03] border-t border-white/10 z-10"
          style={{ height: `${canvasHeightPx - bottomMarginPx}px` }}
          title={`Bottom Margin: ${safeMarginInches}"`}
        />

        {/* Sub-inch Ticks */}
        {subTicks.map((tick, idx) => (
          <div
            key={idx}
            className={`absolute left-0 h-px pointer-events-none z-10 ${
              tick.isHalf ? "bg-white/20" : "bg-white/10"
            }`}
            style={{
              top: `${tick.posPx}px`,
              width: `${tick.width}px`,
            }}
          />
        ))}

        {/* Major Inch Numbers */}
        {inchTicks.map((t) => (
          <React.Fragment key={t.inch}>
            <div
              className="absolute left-0 h-px bg-zinc-400/80 z-10 pointer-events-none"
              style={{ top: `${t.posPx}px`, width: "9px" }}
            />
            {t.inch > 0 && t.inch < pageHeightInches && (
              <span
                className="absolute left-2.5 text-[9px] font-mono font-medium text-zinc-400 -translate-y-1/2 pointer-events-none z-10 select-none"
                style={{ top: `${t.posPx}px` }}
              >
                {t.inch}
              </span>
            )}
          </React.Fragment>
        ))}

        {/* Live Cursor Indicator on Vertical Ruler */}
        {cursorYIn !== undefined && cursorYIn !== null && (
          <div
            className="absolute left-0 right-0 h-px bg-cyan-400 z-30 pointer-events-none shadow-[0_0_4px_rgba(34,211,238,0.8)]"
            style={{ top: `${inchesToPx(cursorYIn)}px` }}
          />
        )}
      </div>
    </div>
  );
};
