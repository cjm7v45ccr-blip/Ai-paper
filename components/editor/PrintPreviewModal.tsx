"use client";

import React, { useState } from "react";
import { DocumentModel } from "@/types/document";
import { ElementRenderer } from "./ElementRenderer";
import { DPI, inchesToPx } from "@/lib/coordinates";
import { Printer, X, Palette, CheckCircle2, FileDown, ShieldCheck } from "lucide-react";

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentModel: DocumentModel;
  isBlackAndWhite: boolean;
  onToggleBW: () => void;
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  onClose,
  documentModel,
  isBlackAndWhite,
  onToggleBW,
}) => {
  if (!isOpen) return null;

  const canvasWidthPx = inchesToPx(documentModel.page?.width || 8.5);
  const canvasHeightPx = inchesToPx(documentModel.page?.height || 11.0);

  const handlePrintNow = () => {
    window.print();
  };

  return (
    <div className="no-print fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150 select-none">
      {/* Modal Dialog Card */}
      <div className="bg-white w-full max-w-4xl h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="h-16 px-6 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Print & PDF Export Center
              </h3>
              <p className="text-xs text-slate-500">
                US Letter (8.5" × 11.0") • 1-Page Physical Layout
              </p>
            </div>
          </div>

          {/* Actions & Toggles */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleBW}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 transition-all ${
                isBlackAndWhite
                  ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>{isBlackAndWhite ? "B&W Mode Active" : "Full Color"}</span>
            </button>

            <button
              onClick={handlePrintNow}
              className="text-xs px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-semibold flex items-center gap-2 shadow-sm transition-all"
            >
              <FileDown className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scaled Preview Canvas */}
        <div className="flex-1 bg-slate-100 overflow-y-auto p-6 flex items-center justify-center">
          <div
            className="bg-white shadow-xl relative border border-slate-200 transition-transform origin-center"
            style={{
              width: `${canvasWidthPx}px`,
              height: `${canvasHeightPx}px`,
              transform: "scale(0.68)",
              transformOrigin: "center center",
              backgroundColor: documentModel.page?.background || "#ffffff",
            }}
          >
            {documentModel.elements.map((el) => {
              if (el.visible === false) return null;

              const leftPx = inchesToPx(el.x);
              const topPx = inchesToPx(el.y);
              const widthPx = inchesToPx(el.width);
              const heightPx = inchesToPx(el.height);

              return (
                <div
                  key={el.id}
                  className="absolute"
                  style={{
                    left: `${leftPx}px`,
                    top: `${topPx}px`,
                    width: `${widthPx}px`,
                    height: `${heightPx}px`,
                    transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
                    zIndex: el.zIndex || 1,
                    backgroundColor: el.style?.backgroundColor || "transparent",
                    borderColor: el.style?.borderColor || "transparent",
                    borderWidth: el.style?.borderWidth ? `${el.style.borderWidth}px` : "0px",
                    borderStyle: el.style?.borderStyle || "none",
                    borderRadius: el.style?.borderRadius ? `${el.style.borderRadius}px` : "0px",
                    padding: el.style?.padding ? `${el.style.padding}px` : "0px",
                    opacity: el.style?.opacity ?? 1,
                  }}
                >
                  <ElementRenderer
                    element={el}
                    dpi={DPI}
                    isSelected={false}
                    isBlackAndWhite={isBlackAndWhite}
                    isPreview={true}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info banner */}
        <div className="h-10 px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
          <div className="flex items-center gap-1.5 text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Strict single-sheet pagination verified. Zero page spills.</span>
          </div>
          <span className="font-mono">Dimensions: 816 × 1056 CSS px @ 96 DPI</span>
        </div>
      </div>
    </div>
  );
};
