"use client";

import React, { useState } from "react";
import { MessageSquare, Plus, Check, Trash2, X, Send, User } from "lucide-react";
import { DocumentComment } from "@/types/document";

interface CommentsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  comments: DocumentComment[];
  activeElementId: string | null;
  onAddComment: (text: string, elementId?: string) => void;
  onResolveComment: (id: string) => void;
  onDeleteComment: (id: string) => void;
}

export const CommentsDrawer: React.FC<CommentsDrawerProps> = ({
  isOpen,
  onClose,
  comments,
  activeElementId,
  onAddComment,
  onResolveComment,
  onDeleteComment,
}) => {
  const [newCommentText, setNewCommentText] = useState("");
  const [authorName, setAuthorName] = useState("Editor");
  const [filterResolved, setFilterResolved] = useState(false);

  if (!isOpen) return null;

  const filteredComments = comments.filter((c) =>
    filterResolved ? true : !c.resolved
  );

  const handleAdd = () => {
    if (!newCommentText.trim()) return;
    onAddComment(newCommentText.trim(), activeElementId || undefined);
    setNewCommentText("");
  };

  return (
    <div className="w-80 border-l border-white/[0.08] bg-[#0d0f17] flex flex-col h-full z-20 shrink-0 text-zinc-200 select-none animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-3.5 border-b border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold text-white">Comments & Review</span>
          <span className="text-[10px] bg-white/[0.08] text-zinc-400 px-1.5 py-0.5 rounded-full font-mono">
            {comments.filter((c) => !c.resolved).length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-white/[0.06] text-zinc-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Filter resolved toggle */}
      <div className="px-3.5 py-2 border-b border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-400 bg-black/20">
        <span>Show resolved</span>
        <input
          type="checkbox"
          checked={filterResolved}
          onChange={(e) => setFilterResolved(e.target.checked)}
          className="rounded bg-zinc-800 border-zinc-700 text-indigo-500 focus:ring-0 w-3.5 h-3.5"
        />
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {filteredComments.length === 0 ? (
          <div className="text-center py-10 px-4 text-zinc-500 text-xs">
            <MessageSquare className="w-6 h-6 mx-auto mb-2 opacity-40 text-indigo-400" />
            <p>No open comments.</p>
            <p className="text-[11px] mt-1 text-zinc-600">
              Select an element or type below to add review feedback.
            </p>
          </div>
        ) : (
          filteredComments.map((c) => (
            <div
              key={c.id}
              className={`p-3 rounded-xl border text-xs transition-all ${
                c.resolved
                  ? "bg-white/[0.02] border-white/[0.04] opacity-60"
                  : "bg-[#141724] border-white/[0.08] shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 font-medium text-white text-[11px]">
                  <div className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-300 flex items-center justify-center text-[10px]">
                    {c.author.charAt(0).toUpperCase()}
                  </div>
                  <span>{c.author}</span>
                </div>
                <span className="text-[10px] text-zinc-500">{c.timestamp}</span>
              </div>

              <p className="text-zinc-300 text-xs leading-relaxed break-words">{c.text}</p>

              {c.elementId && (
                <div className="mt-2 text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md w-fit font-mono">
                  Attached to element
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-2.5 pt-2 border-t border-white/[0.06] flex items-center justify-end gap-1.5">
                <button
                  onClick={() => onResolveComment(c.id)}
                  className={`p-1 px-2 rounded-lg text-[10px] font-medium transition-colors flex items-center gap-1 ${
                    c.resolved
                      ? "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                      : "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                  }`}
                  title={c.resolved ? "Reopen comment" : "Mark as resolved"}
                >
                  <Check className="w-3 h-3" />
                  <span>{c.resolved ? "Resolved" : "Resolve"}</span>
                </button>
                <button
                  onClick={() => onDeleteComment(c.id)}
                  className="p-1 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Delete comment"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Comment Input Box */}
      <div className="p-3 border-t border-white/[0.08] bg-[#11131d]">
        {activeElementId && (
          <div className="text-[10px] text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-md mb-2 flex items-center gap-1">
            <span>Adding comment to selected element</span>
          </div>
        )}
        <div className="flex gap-2">
          <textarea
            rows={2}
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleAdd();
              }
            }}
            placeholder="Write a comment or review suggestion..."
            className="flex-1 bg-black/40 text-xs text-zinc-100 placeholder:text-zinc-500 border border-white/[0.1] focus:border-indigo-500 rounded-xl p-2 outline-none resize-none"
          />
          <button
            onClick={handleAdd}
            disabled={!newCommentText.trim()}
            className="self-end p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:pointer-events-none text-white rounded-xl transition-colors shadow-md"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
