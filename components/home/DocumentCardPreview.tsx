"use client";

import React from "react";
import { DocumentModel } from "@/types/document";

interface DocumentCardPreviewProps {
  document: DocumentModel;
  className?: string;
}

export const DocumentCardPreview: React.FC<DocumentCardPreviewProps> = ({
  document,
  className = "",
}) => {
  const page = document.pages?.[0];
  const elements = page?.elements || document.elements || [];
  const isPresentation = document.mode === "presentation";

  // Grab the first 2-4 primary elements to build a miniature visual thumbnail
  const headingElem = elements.find((el) => el.type === "heading");
  const calloutElem = elements.find((el) => el.type === "callout");
  const formulaElem = elements.find((el) => el.type === "formula");
  const tableElem = elements.find((el) => el.type === "table");
  const chartElem = elements.find((el) => el.type === "chart");

  const titleText =
    headingElem?.content?.title ||
    document.title ||
    "Untitled Document";
  const subtitleText =
    headingElem?.content?.subtitle ||
    calloutElem?.content?.title ||
    "Document overview and visual layout";

  return (
    <div
      className={`w-full h-full bg-white text-zinc-900 overflow-hidden relative select-none flex flex-col p-2.5 sm:p-3 text-[9px] leading-tight font-sans transition-transform ${className}`}
      style={{
        aspectRatio: isPresentation ? "16 / 9" : "8.5 / 11",
      }}
    >
      {/* Mini top border line / margin simulation */}
      <div className="flex items-center justify-between border-b border-zinc-200 pb-1 mb-1.5 opacity-80">
        <div className="flex items-center gap-1">
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              isPresentation ? "bg-indigo-500" : "bg-emerald-500"
            }`}
          />
          <span className="font-mono text-[7px] uppercase tracking-wider text-zinc-500">
            {isPresentation ? "16:9 Slide" : "8.5×11 Letter"}
          </span>
        </div>
        <span className="text-[7px] font-mono text-zinc-400">
          Page 1 of {document.pages?.length || 1}
        </span>
      </div>

      {/* Mini Header Block */}
      <div className="mb-2">
        <div className="h-1.5 w-10 bg-indigo-500/20 rounded-full mb-1" />
        <h4 className="font-bold text-zinc-900 text-[10px] leading-tight line-clamp-2">
          {titleText}
        </h4>
        <p className="text-[7.5px] text-zinc-500 line-clamp-1 mt-0.5">
          {subtitleText}
        </p>
      </div>

      {/* Miniature Visual Blocks Representation */}
      <div className="flex-1 flex flex-col gap-1.5 overflow-hidden">
        {/* Formula Block Preview */}
        {formulaElem && (
          <div className="bg-zinc-50 border border-zinc-200 rounded p-1">
            <div className="flex items-center justify-between">
              <span className="text-[7px] font-bold text-zinc-700">Formula</span>
              <span className="text-[6.5px] font-mono text-indigo-600 font-semibold">KaTeX</span>
            </div>
            <div className="font-mono text-[7.5px] text-zinc-800 bg-white border border-zinc-100 rounded px-1 py-0.5 my-0.5 truncate">
              {formulaElem.content?.equation || "E = mc^2"}
            </div>
          </div>
        )}

        {/* Callout / Key Insight Block */}
        {calloutElem && (
          <div className="bg-indigo-50/60 border border-indigo-200/70 rounded p-1">
            <span className="text-[7px] font-semibold text-indigo-900 block truncate">
              {calloutElem.content?.title || "Key Insight"}
            </span>
            <span className="text-[6.5px] text-zinc-600 line-clamp-1">
              {calloutElem.content?.text || calloutElem.content?.body || "Summary analysis"}
            </span>
          </div>
        )}

        {/* Table Block Preview */}
        {tableElem && (
          <div className="bg-zinc-50 border border-zinc-200 rounded p-1">
            <div className="grid grid-cols-3 gap-0.5 text-[6px] font-semibold text-zinc-700 border-b border-zinc-200 pb-0.5">
              <span>Metric</span>
              <span>Baseline</span>
              <span>Target</span>
            </div>
            <div className="grid grid-cols-3 gap-0.5 text-[5.5px] text-zinc-500 pt-0.5">
              <span>Throughput</span>
              <span>120/mo</span>
              <span className="text-emerald-600 font-bold">4.9k</span>
            </div>
          </div>
        )}

        {/* Chart Block Preview */}
        {chartElem && (
          <div className="bg-zinc-50 border border-zinc-200 rounded p-1 flex items-end gap-1 h-8">
            <div className="w-1.5 bg-indigo-300 rounded-t h-[40%]" />
            <div className="w-1.5 bg-indigo-400 rounded-t h-[65%]" />
            <div className="w-1.5 bg-indigo-500 rounded-t h-[90%]" />
            <div className="w-1.5 bg-indigo-600 rounded-t h-[100%]" />
            <div className="flex-1 text-[6.5px] text-zinc-500 self-center pl-1 font-mono">
              Trajectory
            </div>
          </div>
        )}

        {/* Generic wireframe lines if minimal elements */}
        {!formulaElem && !tableElem && !chartElem && (
          <div className="space-y-1 pt-1 opacity-70">
            <div className="h-1.5 bg-zinc-200 rounded-full w-full" />
            <div className="h-1.5 bg-zinc-200 rounded-full w-[85%]" />
            <div className="h-1.5 bg-zinc-100 rounded-full w-[65%]" />
          </div>
        )}
      </div>

      {/* Tiny Footer Accent */}
      <div className="mt-auto pt-1 flex items-center justify-between text-[6.5px] text-zinc-400 border-t border-zinc-100">
        <span>PagePilot Engine</span>
        <span className="font-mono">
          {elements.length} blocks
        </span>
      </div>
    </div>
  );
};
