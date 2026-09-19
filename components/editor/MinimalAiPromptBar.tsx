"use client";

import React, { useState, useRef, useCallback } from "react";
import { Sparkles, ArrowRight, Loader2, X, ChevronUp, Image as ImageIcon, Paperclip } from "lucide-react";

export interface AttachedImage {
  id: string;
  name: string;
  dataUrl: string;
}

interface MinimalAiPromptBarProps {
  onSubmitPrompt: (command: string, images?: AttachedImage[]) => void;
  isLoading?: boolean;
  isOpen?: boolean;
  onToggleOpen?: (open: boolean) => void;
}

export const MinimalAiPromptBar: React.FC<MinimalAiPromptBarProps> = ({
  onSubmitPrompt,
  isLoading = false,
  isOpen,
  onToggleOpen,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [attachedImages, setAttachedImages] = useState<AttachedImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isBarOpen = isOpen !== undefined ? isOpen : internalOpen;
  const setBarOpen = (val: boolean) => {
    if (onToggleOpen) onToggleOpen(val);
    else setInternalOpen(val);
  };

  const quickPills = [
    "Make concise",
    "Rebalance layout",
    "Add comparison card",
    "Professional tone",
  ];

  const processImageFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        const newImg: AttachedImage = {
          id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: file.name || "pasted-image.png",
          dataUrl: result,
        };
        setAttachedImages((prev) => [...prev, newImg]);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      let foundImage = false;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) {
            foundImage = true;
            processImageFile(file);
          }
        }
      }
      if (foundImage) {
        // Automatically make sure the bar is open when user pastes an image
        setBarOpen(true);
      }
    },
    [processImageFile, setBarOpen]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(processImageFile);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachedImage = (id: string) => {
    setAttachedImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleSend = (textToSend?: string) => {
    const finalPrompt = textToSend || prompt;
    if ((!finalPrompt.trim() && attachedImages.length === 0) || isLoading) return;
    const promptText = finalPrompt.trim() || "Analyze and incorporate the attached image into the document.";
    onSubmitPrompt(promptText, attachedImages);
    if (!textToSend) {
      setPrompt("");
      setAttachedImages([]);
    }
  };

  // If closed / docked: show a subtle floating trigger pill at bottom right that NEVER blocks content
  if (!isBarOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-40 select-none pointer-events-auto">
        <button
          type="button"
          onClick={() => setBarOpen(true)}
          className="group flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-[#12141c]/95 hover:bg-[#181a24] border border-white/[0.12] hover:border-indigo-500/50 text-xs text-zinc-300 hover:text-white shadow-xl backdrop-blur-md transition-all active:scale-[0.98]"
          title="Open AI Assistant"
        >
          <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            {isLoading ? (
              <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
          </div>
          <span className="font-medium text-[11px] tracking-tight">AI Assistant</span>
          {attachedImages.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-indigo-500 text-white text-[9px] font-mono">
              {attachedImages.length}
            </span>
          )}
          <ChevronUp className="w-3 h-3 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
        </button>
      </div>
    );
  }

  // If open: render a refined, non-intrusive floating card
  return (
    <div
      onPaste={handlePaste}
      className="fixed bottom-6 right-6 z-40 select-none pointer-events-auto w-[92vw] sm:w-[420px] animate-in fade-in-50 zoom-in-95 duration-150"
    >
      <div className="bg-[#12141c]/95 border border-white/[0.12] rounded-2xl shadow-2xl backdrop-blur-xl p-3 ring-1 ring-white/[0.04]">
        {/* Header bar of AI floating card */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
              {isLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Sparkles className="w-3 h-3" />
              )}
            </div>
            <span className="text-xs font-semibold text-white">AI Assistant</span>
            <span className="text-[10px] font-mono text-zinc-500">Gemini</span>
          </div>

          <button
            type="button"
            onClick={() => setBarOpen(false)}
            className="p-1 rounded-md text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors"
            title="Minimize AI Assistant"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Attached Images Tag Badges / Chips */}
        {attachedImages.length > 0 && (
          <div className="flex items-center gap-1.5 mb-2 overflow-x-auto pb-1 scrollbar-none">
            {attachedImages.map((img) => (
              <div
                key={img.id}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-indigo-600/15 border border-indigo-500/30 text-indigo-200 text-[11px] shrink-0 animate-in fade-in-50"
              >
                <img
                  src={img.dataUrl}
                  alt={img.name}
                  className="w-4 h-4 rounded object-cover border border-white/20"
                />
                <span className="max-w-[120px] truncate font-mono text-[10px]">
                  {img.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeAttachedImage(img.id)}
                  className="p-0.5 rounded hover:bg-white/10 text-indigo-300 hover:text-white"
                  title="Remove image"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input box with paste & attach support */}
        <div className="relative flex items-center">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onPaste={handlePaste}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={
              attachedImages.length > 0
                ? "Describe what to do with this image..."
                : "Ask AI or paste image (Ctrl+V)..."
            }
            disabled={isLoading}
            autoFocus
            className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-indigo-500/60 rounded-xl pl-3 pr-16 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 outline-none transition-colors"
          />

          {/* Action buttons inside input */}
          <div className="absolute right-1.5 flex items-center gap-1">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
              title="Attach image or screenshot"
            >
              <ImageIcon className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              disabled={(!prompt.trim() && attachedImages.length === 0) || isLoading}
              onClick={() => handleSend()}
              className="w-6 h-6 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-20 disabled:pointer-events-none flex items-center justify-center transition-all shadow-xs"
              title="Send"
            >
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 scrollbar-none">
          {quickPills.map((pill, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isLoading}
              onClick={() => handleSend(pill)}
              className="px-2 py-0.5 rounded-full bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-[10px] text-zinc-400 hover:text-zinc-200 whitespace-nowrap transition-colors"
            >
              {pill}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
