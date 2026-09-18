"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  DocumentModel,
  DocumentElement,
  DocumentMode,
  PageData,
} from "@/types/document";
import {
  INITIAL_SAMPLE_DOCUMENT,
  SAMPLE_PRESENTATION_DECK,
} from "@/lib/sample-document";
import { buildComprehensiveDocumentFromPrompt } from "@/lib/smart-layout-architect";
import { triggerPrint } from "@/lib/print";

import { GammaStyleHomepage } from "@/components/home/GammaStyleHomepage";
import { GenerationSteppedScreen } from "@/components/home/GenerationSteppedScreen";
import { MinimalTopNav } from "@/components/editor/MinimalTopNav";
import { MinimalLeftRail } from "@/components/editor/MinimalLeftRail";
import { AdaptiveContentCanvas } from "@/components/editor/AdaptiveContentCanvas";
import { MinimalAiPromptBar } from "@/components/editor/MinimalAiPromptBar";
import { PresenterModal } from "@/components/editor/PresenterModal";
import { PrintPreviewModal } from "@/components/editor/PrintPreviewModal";

export default function PagePilotApp() {
  // Navigation views: "home" | "generating" | "editor"
  const [currentView, setCurrentView] = useState<"home" | "generating" | "editor">("home");

  // Active Document State
  const [documentState, setDocumentState] = useState<DocumentModel>(SAMPLE_PRESENTATION_DECK);
  const [documentMode, setDocumentMode] = useState<DocumentMode>("presentation");
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  // Undo / Redo History Stack
  const [history, setHistory] = useState<DocumentModel[]>([SAMPLE_PRESENTATION_DECK]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // AI & Generation States
  const [activePrompt, setActivePrompt] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Presentation & Export Modals
  const [isPresenterOpen, setIsPresenterOpen] = useState(false);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);

  // Push new state to history for undo/redo
  const pushToHistory = useCallback((newDoc: DocumentModel) => {
    setHistory((prev) => {
      const upToCurrent = prev.slice(0, historyIndex + 1);
      return [...upToCurrent, newDoc];
    });
    setHistoryIndex((prev) => prev + 1);
    setDocumentState(newDoc);
  }, [historyIndex]);

  // Undo / Redo Actions
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const nextIndex = historyIndex - 1;
      setHistoryIndex(nextIndex);
      setDocumentState(history[nextIndex]);
      setSelectedElementId(null);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setDocumentState(history[nextIndex]);
      setSelectedElementId(null);
    }
  }, [history, historyIndex]);

  // Global Keyboard Shortcuts (⌘Z, ⌘⇧Z, ⌘P, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedo();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        setIsPresenterOpen(true);
      } else if (e.key === "Escape") {
        setSelectedElementId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Pages normalization
  const currentPages: PageData[] =
    documentState.pages && documentState.pages.length > 0
      ? documentState.pages
      : [
          {
            id: "page-1",
            title: "Slide 1",
            elements: documentState.elements || [],
          },
        ];

  // 1. Initial Creation Flow Triggered from Homepage
  const handleStartCreation = async ({
    prompt,
    mode,
  }: {
    prompt: string;
    mode: DocumentMode;
  }) => {
    setActivePrompt(prompt);
    setDocumentMode(mode);
    setCurrentView("generating");
    setIsAiLoading(true);

    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          actionType: "create_from_prompt",
          documentMode: mode,
          documentState,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.document) {
          setDocumentState(data.document);
          setHistory([data.document]);
          setHistoryIndex(0);
          setActivePageIndex(0);
          setSelectedElementId(null);
        }
      } else {
        // Deterministic fallback
        const fallback = buildComprehensiveDocumentFromPrompt(prompt, mode);
        setDocumentState(fallback);
        setHistory([fallback]);
        setHistoryIndex(0);
        setActivePageIndex(0);
      }
    } catch (err) {
      console.warn("AI generation network fallback:", err);
      const fallback = buildComprehensiveDocumentFromPrompt(prompt, mode);
      setDocumentState(fallback);
      setHistory([fallback]);
      setHistoryIndex(0);
      setActivePageIndex(0);
    } finally {
      // Small pause so the user perceives the finish of generation smoothly
      setTimeout(() => {
        setIsAiLoading(false);
        setCurrentView("editor");
      }, 1200);
    }
  };

  // 2. Open Existing Sample Project
  const handleOpenDraft = (mode: DocumentMode) => {
    const docToOpen = mode === "presentation" ? SAMPLE_PRESENTATION_DECK : INITIAL_SAMPLE_DOCUMENT;
    setDocumentState(docToOpen);
    setDocumentMode(mode);
    setHistory([docToOpen]);
    setHistoryIndex(0);
    setActivePageIndex(0);
    setSelectedElementId(null);
    setCurrentView("editor");
  };

  // 3. Page / Slide Management
  const handleAddPage = () => {
    const isPres = documentMode === "presentation";
    const newPage: PageData = {
      id: `page-${Date.now()}`,
      title: `${isPres ? "Slide" : "Section"} ${currentPages.length + 1}`,
      elements: [
        {
          id: `heading-${Date.now()}`,
          type: "heading",
          x: 0.8,
          y: 0.8,
          width: 8,
          height: 1.2,
          zIndex: 1,
          content: {
            title: `${isPres ? "Slide" : "Section"} ${currentPages.length + 1}`,
            subtitle: "Click to write your narrative and key insights.",
          },
          metadata: { badge: isPres ? "SLIDE" : "SECTION" },
        },
        {
          id: `card-${Date.now()}`,
          type: "callout",
          x: 0.8,
          y: 2.2,
          width: 5.5,
          height: 1.8,
          zIndex: 2,
          content: {
            title: "Core Concept",
            text: "Add an introductory thought or data summary here.",
          },
        },
      ],
    };

    const updatedDoc: DocumentModel = {
      ...documentState,
      pages: [...currentPages, newPage],
    };
    pushToHistory(updatedDoc);
    setActivePageIndex(currentPages.length);
  };

  const handleDuplicatePage = (idx: number) => {
    const targetPage = currentPages[idx];
    if (!targetPage) return;

    const clonedPage: PageData = {
      ...targetPage,
      id: `page-${Date.now()}`,
      title: `${targetPage.title || "Slide"} (Copy)`,
      elements: targetPage.elements.map((el) => ({
        ...el,
        id: `${el.id}-copy-${Date.now()}`,
      })),
    };

    const updatedPages = [...currentPages];
    updatedPages.splice(idx + 1, 0, clonedPage);

    pushToHistory({
      ...documentState,
      pages: updatedPages,
    });
    setActivePageIndex(idx + 1);
  };

  const handleDeletePage = (idx: number) => {
    if (currentPages.length <= 1) return;
    const updatedPages = currentPages.filter((_, i) => i !== idx);

    pushToHistory({
      ...documentState,
      pages: updatedPages,
    });
    setActivePageIndex((prev) => (prev >= updatedPages.length ? updatedPages.length - 1 : prev));
  };

  const handleReorderPages = (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx || fromIdx < 0 || toIdx >= currentPages.length) return;
    const updatedPages = [...currentPages];
    const [moved] = updatedPages.splice(fromIdx, 1);
    updatedPages.splice(toIdx, 0, moved);

    pushToHistory({
      ...documentState,
      pages: updatedPages,
    });
    setActivePageIndex(toIdx);
  };

  // 4. Element Manipulation on Active Page
  const handleUpdateElementContent = (id: string, newContent: any) => {
    const updatedPages = [...currentPages];
    const page = updatedPages[activePageIndex];
    if (!page) return;

    page.elements = page.elements.map((el) =>
      el.id === id ? { ...el, content: newContent } : el
    );

    pushToHistory({
      ...documentState,
      pages: updatedPages,
      elements: page.elements,
    });
  };

  const handleUpdateElementStyle = (id: string, styleUpdates: Record<string, any>) => {
    const updatedPages = [...currentPages];
    const page = updatedPages[activePageIndex];
    if (!page) return;

    page.elements = page.elements.map((el) =>
      el.id === id ? { ...el, style: { ...el.style, ...styleUpdates } } : el
    );

    pushToHistory({
      ...documentState,
      pages: updatedPages,
      elements: page.elements,
    });
  };

  const handleDuplicateElement = (id: string) => {
    const page = currentPages[activePageIndex];
    if (!page) return;

    const target = page.elements.find((el) => el.id === id);
    if (!target) return;

    const cloned: DocumentElement = {
      ...target,
      id: `${target.id}-copy-${Date.now()}`,
      content:
        typeof target.content === "object" ? { ...target.content } : target.content,
      style: { ...target.style },
    };

    const updatedPages = [...currentPages];
    updatedPages[activePageIndex] = {
      ...page,
      elements: [...page.elements, cloned],
    };

    pushToHistory({
      ...documentState,
      pages: updatedPages,
      elements: updatedPages[activePageIndex].elements,
    });
    setSelectedElementId(cloned.id);
  };

  // Delete Element (Cleans up layout without gaps!)
  const handleDeleteElement = (id: string) => {
    const page = currentPages[activePageIndex];
    if (!page) return;

    const updatedElements = page.elements.filter((el) => el.id !== id);

    const updatedPages = [...currentPages];
    updatedPages[activePageIndex] = {
      ...page,
      elements: updatedElements,
    };

    pushToHistory({
      ...documentState,
      pages: updatedPages,
      elements: updatedElements,
    });
    setSelectedElementId(null);
  };

  const handleReorderElements = (fromIdx: number, toIdx: number) => {
    const page = currentPages[activePageIndex];
    if (!page) return;

    const updatedElements = [...page.elements];
    const [moved] = updatedElements.splice(fromIdx, 1);
    updatedElements.splice(toIdx, 0, moved);

    const updatedPages = [...currentPages];
    updatedPages[activePageIndex] = {
      ...page,
      elements: updatedElements,
    };

    pushToHistory({
      ...documentState,
      pages: updatedPages,
      elements: updatedElements,
    });
  };

  const handleAddBlock = (type: "text" | "callout" | "formula" | "table" | "chart" | "checkboxGroup") => {
    const page = currentPages[activePageIndex];
    if (!page) return;

    let newElement: DocumentElement;
    const now = Date.now();

    if (type === "formula") {
      newElement = {
        id: `formula-${now}`,
        type: "formula",
        x: 1,
        y: 3,
        width: 5,
        height: 2,
        zIndex: 2,
        content: {
          title: "Model Formulation",
          equation: "\\mathcal{L}(\\theta) = \\mathbb{E}_{x \\sim p}[-\\log p_\\theta(x)]",
          breakdown: [
            { symbol: "\\mathcal{L}", label: "Objective Loss" },
            { symbol: "\\theta", label: "Model Parameters" },
          ],
        },
      };
    } else if (type === "callout") {
      newElement = {
        id: `callout-${now}`,
        type: "callout",
        x: 1,
        y: 3,
        width: 5,
        height: 1.8,
        zIndex: 2,
        content: {
          title: "Strategic Takeaway",
          text: "Highlight critical observations or guidelines with high visual emphasis.",
        },
      };
    } else if (type === "table") {
      newElement = {
        id: `table-${now}`,
        type: "table",
        x: 1,
        y: 3,
        width: 6,
        height: 2,
        zIndex: 2,
        content: {
          title: "Evaluation Metrics",
          headers: ["Phase", "Milestone", "Status"],
          rows: [
            ["Phase 1", "Core Synthesis & KaTeX Math", "Complete"],
            ["Phase 2", "Multi-Agent Orchestration", "In Progress"],
          ],
        },
      };
    } else if (type === "checkboxGroup") {
      newElement = {
        id: `checklist-${now}`,
        type: "checkboxGroup",
        x: 1,
        y: 3,
        width: 5,
        height: 2,
        zIndex: 2,
        content: {
          title: "Execution Checklist",
          items: [
            { text: "Verify typography hierarchy & contrast.", checked: true },
            { text: "Confirm safe printing margin boundaries.", checked: false },
          ],
        },
      };
    } else {
      newElement = {
        id: `text-${now}`,
        type: "text",
        x: 1,
        y: 3,
        width: 5,
        height: 1.5,
        zIndex: 2,
        content: {
          title: "New Section",
          text: "Write your analysis, background narrative, or recommendations.",
        },
      };
    }

    const updatedPages = [...currentPages];
    updatedPages[activePageIndex] = {
      ...page,
      elements: [...page.elements, newElement],
    };

    pushToHistory({
      ...documentState,
      pages: updatedPages,
      elements: updatedPages[activePageIndex].elements,
    });
    setSelectedElementId(newElement.id);
  };

  // 5. AI Prompt Bar & Refinements
  const handleAiPromptSubmit = async (command: string) => {
    setIsAiLoading(true);
    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: command,
          selectedElementId,
          activePageIndex,
          documentMode,
          documentState,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.document) {
          pushToHistory(data.document);
        }
      }
    } catch (err) {
      console.warn("AI prompt error:", err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAiRefineElement = (id: string, actionType: string) => {
    setSelectedElementId(id);
    const command =
      actionType === "concise"
        ? "Make this more concise"
        : actionType === "professional"
        ? "Use a more professional tone"
        : "Refine and polish this content";
    handleAiPromptSubmit(command);
  };

  // 6. Regenerate Complete First Draft
  const handleRegenerateDraft = () => {
    const promptToUse = activePrompt || documentState.title || "Executive Strategy Presentation";
    handleStartCreation({ prompt: promptToUse, mode: documentMode });
  };

  // 7. Export Handlers
  const handleExport = (format: "pdf" | "png" | "json" | "markdown") => {
    if (format === "pdf") {
      setIsPrintPreviewOpen(true);
    } else if (format === "markdown") {
      let md = `# ${documentState.title || "Document"}\n\n`;
      currentPages.forEach((p, idx) => {
        md += `## ${p.title || `Section ${idx + 1}`}\n\n`;
        p.elements.forEach((el) => {
          if (el.type === "heading") {
            md += `### ${el.content?.title || ""}\n${el.content?.subtitle || ""}\n\n`;
          } else if (el.type === "formula") {
            md += `$$${el.content?.equation || ""}$$\n\n`;
          } else if (el.type === "callout" || el.type === "quote") {
            md += `> **${el.content?.title || ""}**: ${el.content?.text || ""}\n\n`;
          } else {
            md += `${typeof el.content === "string" ? el.content : el.content?.text || ""}\n\n`;
          }
        });
      });
      const blob = new Blob([md], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(documentState.title || "project").toLowerCase().replace(/\s+/g, "-")}.md`;
      a.click();
    } else if (format === "json") {
      const blob = new Blob([JSON.stringify(documentState, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(documentState.title || "project").toLowerCase().replace(/\s+/g, "-")}.json`;
      a.click();
    }
  };

  // VIEW 1: Minimalist AI Homepage (Inspired by Gamma)
  if (currentView === "home") {
    return (
      <GammaStyleHomepage
        onStartCreation={handleStartCreation}
        onOpenDraft={handleOpenDraft}
      />
    );
  }

  // VIEW 2: Stepped Generation Loading Screen
  if (currentView === "generating") {
    return (
      <GenerationSteppedScreen
        prompt={activePrompt}
        mode={documentMode}
      />
    );
  }

  // VIEW 3: Clean, Focused Editor
  return (
    <div className="h-screen w-screen flex flex-col bg-[#0b0c10] text-zinc-100 overflow-hidden select-none font-sans">
      {/* 1. Minimal Top Navigation Bar */}
      <MinimalTopNav
        title={documentState.title || "Untitled Project"}
        onUpdateTitle={(newTitle) =>
          pushToHistory({ ...documentState, title: newTitle })
        }
        documentMode={documentMode}
        onChangeMode={(newMode) => {
          setDocumentMode(newMode);
          pushToHistory({ ...documentState, mode: newMode });
        }}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onAddSectionOrSlide={handleAddPage}
        onRegenerate={handleRegenerateDraft}
        onOpenPresenter={() => setIsPresenterOpen(true)}
        onBackToHome={() => setCurrentView("home")}
        onExport={handleExport}
      />

      {/* 2. Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Subtle Left Navigation Rail */}
        <MinimalLeftRail
          pages={currentPages}
          activePageIndex={activePageIndex}
          onSelectPageIndex={(idx) => {
            setActivePageIndex(idx);
            setSelectedElementId(null);
          }}
          onAddPage={handleAddPage}
          onDuplicatePage={handleDuplicatePage}
          onDeletePage={handleDeletePage}
          onReorderPages={handleReorderPages}
          documentMode={documentMode}
        />

        {/* Central Intelligent Adaptive Canvas */}
        <AdaptiveContentCanvas
          document={documentState}
          documentMode={documentMode}
          activePageIndex={activePageIndex}
          selectedElementId={selectedElementId}
          onSelectElement={setSelectedElementId}
          onUpdateElementContent={handleUpdateElementContent}
          onUpdateElementStyle={handleUpdateElementStyle}
          onDuplicateElement={handleDuplicateElement}
          onDeleteElement={handleDeleteElement}
          onReorderElements={handleReorderElements}
          onAddBlock={handleAddBlock}
          onAiRefineElement={handleAiRefineElement}
          isAiLoading={isAiLoading}
        />
      </div>

      {/* 3. Floating Bottom AI Prompt Bar */}
      <MinimalAiPromptBar
        onSubmitPrompt={handleAiPromptSubmit}
        isLoading={isAiLoading}
      />

      {/* 4. Fullscreen Presenter Modal */}
      <PresenterModal
        isOpen={isPresenterOpen}
        onClose={() => setIsPresenterOpen(false)}
        document={documentState}
        initialSlideIndex={activePageIndex}
      />

      {/* 5. Print Preview Modal */}
      <PrintPreviewModal
        isOpen={isPrintPreviewOpen}
        onClose={() => setIsPrintPreviewOpen(false)}
        documentModel={documentState}
        isBlackAndWhite={false}
        onToggleBW={() => {}}
      />
    </div>
  );
}
