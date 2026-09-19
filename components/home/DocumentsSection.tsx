"use client";

import React, { useState } from "react";
import {
  Search,
  LayoutGrid,
  List,
  Plus,
  Clock,
  Trash2,
  Copy,
  ExternalLink,
  Presentation,
  FileText,
  Sparkles,
  ArrowUpDown,
  MoreVertical,
} from "lucide-react";
import { DocumentModel, DocumentMode } from "@/types/document";
import { DocumentCardPreview } from "./DocumentCardPreview";

interface DocumentsSectionProps {
  documents: DocumentModel[];
  onOpenDocument: (doc: DocumentModel) => void;
  onCreateNew: (mode: DocumentMode) => void;
  onDeleteDocument: (id: string, e: React.MouseEvent) => void;
  onDuplicateDocument: (id: string, e: React.MouseEvent) => void;
}

export const DocumentsSection: React.FC<DocumentsSectionProps> = ({
  documents,
  onOpenDocument,
  onCreateNew,
  onDeleteDocument,
  onDuplicateDocument,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "document" | "presentation">("all");
  const [viewStyle, setViewStyle] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"recent" | "title">("recent");
  const [menuOpenDocId, setMenuOpenDocId] = useState<string | null>(null);

  // Filter documents
  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      (doc.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.pages?.some((p) =>
        p.elements.some((el) =>
          JSON.stringify(el.content || "").toLowerCase().includes(searchQuery.toLowerCase())
        )
      );

    const matchesMode =
      filterMode === "all" ||
      (filterMode === "presentation" && doc.mode === "presentation") ||
      (filterMode === "document" && doc.mode !== "presentation");

    return matchesSearch && matchesMode;
  });

  return (
    <section className="w-full max-w-5xl mt-12 mb-16 text-left relative z-10 font-sans">
      {/* Header Row: Title, Filters & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight">
              Your Documents & Decks
            </h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-400 border border-white/[0.08]">
              {documents.length}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Auto-saved locally like Google Docs. Click any card to edit instantly.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents..."
              className="pl-8 pr-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.07] focus:bg-[#161822] text-xs text-zinc-200 placeholder:text-zinc-500 rounded-lg border border-white/[0.08] focus:border-indigo-500/60 outline-none w-44 sm:w-52 transition-colors"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center bg-white/[0.04] p-0.5 rounded-lg border border-white/[0.08]">
            <button
              onClick={() => setFilterMode("all")}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                filterMode === "all"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterMode("document")}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                filterMode === "document"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Docs
            </button>
            <button
              onClick={() => setFilterMode("presentation")}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                filterMode === "presentation"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Decks
            </button>
          </div>

          {/* View Toggle (Grid vs List) */}
          <div className="flex items-center bg-white/[0.04] p-0.5 rounded-lg border border-white/[0.08]">
            <button
              onClick={() => setViewStyle("grid")}
              className={`p-1.5 rounded-md transition-colors ${
                viewStyle === "grid"
                  ? "bg-white/[0.1] text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              title="Grid View with Visual Card Previews"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewStyle("list")}
              className={`p-1.5 rounded-md transition-colors ${
                viewStyle === "list"
                  ? "bg-white/[0.1] text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              title="Detailed List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* New Document Button */}
          <button
            onClick={() => onCreateNew("document")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>
      </div>

      {/* Empty State */}
      {filteredDocs.length === 0 && (
        <div className="py-16 text-center border border-dashed border-white/[0.1] rounded-2xl mt-6">
          <FileText className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
          <p className="text-sm text-zinc-300 font-medium">No documents match your query</p>
          <p className="text-xs text-zinc-500 mt-1">Try clearing search or create a new document above.</p>
        </div>
      )}

      {/* 1. GRID VIEW (Gamma & Google Docs Style with Miniature Live Content Blocks) */}
      {viewStyle === "grid" && filteredDocs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
          {filteredDocs.map((doc) => {
            const isPres = doc.mode === "presentation";
            const pageCount = doc.pages?.length || 1;
            const elementCount =
              doc.pages?.reduce((sum, p) => sum + (p.elements?.length || 0), 0) ||
              doc.elements?.length ||
              0;

            return (
              <div
                key={doc.id}
                onClick={() => onOpenDocument(doc)}
                className="group relative bg-[#14161f] border border-white/[0.08] hover:border-indigo-500/50 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all cursor-pointer flex flex-col"
              >
                {/* Visual Thumbnail Window (Shows real blocks preview) */}
                <div className="w-full bg-[#1c1e29] border-b border-white/[0.06] p-3 flex items-center justify-center relative overflow-hidden group-hover:bg-[#202330] transition-colors">
                  <div className="w-full max-w-[240px] shadow-md rounded-lg overflow-hidden border border-black/20 group-hover:scale-[1.02] transition-transform duration-200">
                    <DocumentCardPreview document={doc} />
                  </div>

                  {/* Format Pill Overlay */}
                  <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 bg-[#0f1118]/80 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/[0.1] text-[10px] text-zinc-300 font-mono">
                    {isPres ? (
                      <Presentation className="w-3 h-3 text-indigo-400" />
                    ) : (
                      <FileText className="w-3 h-3 text-emerald-400" />
                    )}
                    <span>{isPres ? "Deck" : "Doc"}</span>
                  </div>
                </div>

                {/* Card Information Footer */}
                <div className="p-3.5 flex flex-col justify-between flex-1">
                  <div>
                    <h3 className="text-xs sm:text-sm font-semibold text-zinc-100 group-hover:text-white line-clamp-1">
                      {doc.title || "Untitled Document"}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-500 font-mono">
                      <span>{pageCount} {pageCount === 1 ? "page" : "pages"}</span>
                      <span>•</span>
                      <span>{elementCount} blocks</span>
                    </div>
                  </div>

                  {/* Quick Action Buttons (Duplicate, Delete) */}
                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/[0.06]">
                    <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Auto-saved</span>
                    </span>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => onDuplicateDocument(doc.id!, e)}
                        title="Make a copy"
                        className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => onDeleteDocument(doc.id!, e)}
                        title="Delete document"
                        className="p-1 rounded-md text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. LIST VIEW (Google Docs Drive-style Table) */}
      {viewStyle === "list" && filteredDocs.length > 0 && (
        <div className="mt-6 bg-[#14161f] border border-white/[0.08] rounded-2xl overflow-hidden shadow-lg">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="border-b border-white/[0.08] bg-white/[0.02] text-[11px] font-mono uppercase text-zinc-400">
                <th className="py-3 px-4">Document Name</th>
                <th className="py-3 px-4 hidden sm:table-cell">Format</th>
                <th className="py-3 px-4 hidden md:table-cell">Pages & Blocks</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredDocs.map((doc) => {
                const isPres = doc.mode === "presentation";
                const pageCount = doc.pages?.length || 1;
                const elementCount =
                  doc.pages?.reduce((sum, p) => sum + (p.elements?.length || 0), 0) ||
                  doc.elements?.length ||
                  0;

                return (
                  <tr
                    key={doc.id}
                    onClick={() => onOpenDocument(doc)}
                    className="hover:bg-white/[0.04] transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg border ${
                            isPres
                              ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                              : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          }`}
                        >
                          {isPres ? (
                            <Presentation className="w-4 h-4" />
                          ) : (
                            <FileText className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-zinc-200 group-hover:text-white">
                            {doc.title || "Untitled Document"}
                          </div>
                          <div className="text-[10px] text-zinc-500 font-mono sm:hidden">
                            {isPres ? "Slide Deck" : "Document"} • {pageCount} pages
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 hidden sm:table-cell font-mono text-[11px] text-zinc-400">
                      {isPres ? "16:9 Slide Deck" : "8.5×11 Document"}
                    </td>

                    <td className="py-3 px-4 hidden md:table-cell font-mono text-[11px] text-zinc-500">
                      {pageCount} {pageCount === 1 ? "page" : "pages"} ({elementCount} elements)
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => onDuplicateDocument(doc.id!, e)}
                          title="Duplicate"
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08]"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => onDeleteDocument(doc.id!, e)}
                          title="Delete"
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
