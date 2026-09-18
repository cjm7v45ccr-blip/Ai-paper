"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  DocumentModel,
  DocumentElement,
  DocumentMode,
  PageData,
  QualityCheckIssue,
  DesignReasoning,
  Operation,
} from "@/types/document";
import {
  INITIAL_SAMPLE_DOCUMENT,
  SAMPLE_PRESENTATION_DECK,
  SAMPLE_WORKSHEET,
  SAMPLE_ONE_PAGER,
} from "@/lib/sample-document";
import { applyOperations } from "@/lib/apply-operations";
import {
  runDeterministicQualityChecks,
  autoFixSafeMargins,
  autoFixOverlaps,
} from "@/lib/quality-checks";
import { triggerPrint } from "@/lib/print";
import {
  clampElementBounds,
  PAGE_WIDTH_INCHES,
  PAGE_HEIGHT_INCHES,
} from "@/lib/coordinates";

import { StudioHeader } from "@/components/editor/StudioHeader";
import { LeftSidebar } from "@/components/editor/LeftSidebar";
import { RightInspector } from "@/components/editor/RightInspector";
import { DocumentCanvas } from "@/components/editor/DocumentCanvas";
import { FloatingChatBar } from "@/components/ai/FloatingChatBar";
import { ChatPanel } from "@/components/ai/ChatPanel";
import { GenerationAnimation } from "@/components/ai/GenerationAnimation";
import { PrintPreviewModal } from "@/components/editor/PrintPreviewModal";
import { MarkdownMathModal } from "@/components/editor/MarkdownMathModal";

export default function PagePilotEditor() {
  const [documentState, setDocumentState] = useState<DocumentModel>(INITIAL_SAMPLE_DOCUMENT);
  const [history, setHistory] = useState<DocumentModel[]>([INITIAL_SAMPLE_DOCUMENT]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [documentMode, setDocumentMode] = useState<DocumentMode>("document");
  const [activePageIndex, setActivePageIndex] = useState(0);

  const [zoom, setZoom] = useState(0.85);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isBlackAndWhite, setIsBlackAndWhite] = useState(false);
  const [showMargins, setShowMargins] = useState(true);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [isMarkdownMathOpen, setIsMarkdownMathOpen] = useState(false);
  const [designReasoning, setDesignReasoning] = useState<DesignReasoning | undefined>();

  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ sender: "user" | "ai"; text: string }[]>([
    {
      sender: "ai",
      text: "PagePilot workspace initialized. You can create documents, presentation slides, or worksheets. Ask me to structure content, format KaTeX equations, or optimize spacing.",
    },
  ]);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  const [qualityIssues, setQualityIssues] = useState<QualityCheckIssue[]>([]);

  // Ensure pages are populated
  const currentPages: PageData[] =
    documentState.pages && documentState.pages.length > 0
      ? documentState.pages
      : [
          {
            id: "page-1",
            title: "Page 1",
            elements: documentState.elements || [],
          },
        ];

  // Recalculate Quality Checks dynamically
  useEffect(() => {
    const issues = runDeterministicQualityChecks(documentState);
    setQualityIssues(issues);
  }, [documentState]);

  const pushToHistory = useCallback(
    (newDoc: DocumentModel) => {
      const nextHistory = history.slice(0, historyIndex + 1);
      nextHistory.push(newDoc);
      setHistory(nextHistory);
      setHistoryIndex(nextHistory.length - 1);
      setDocumentState(newDoc);
      try {
        localStorage.setItem("pagepilot_doc", JSON.stringify(newDoc));
      } catch (e) {
        console.warn("Storage quota exceeded", e);
      }
    },
    [history, historyIndex]
  );

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setDocumentState(history[historyIndex - 1]);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setDocumentState(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  // Mode Switching
  const handleModeChange = (mode: DocumentMode) => {
    setDocumentMode(mode);
    let updatedDoc = { ...documentState, mode };

    if (mode === "presentation") {
      // 16:9 Slide Dimensions
      updatedDoc.page = {
        ...updatedDoc.page,
        size: "presentation-16-9",
        width: 13.333,
        height: 7.5,
        safeMargin: 0.5,
      };
      setZoom(0.75);
    } else {
      // US Letter Standard
      updatedDoc.page = {
        ...updatedDoc.page,
        size: "letter",
        width: 8.5,
        height: 11.0,
        safeMargin: 0.45,
      };
      setZoom(0.85);
    }

    pushToHistory(updatedDoc);
  };

  // Preset Application
  const handleApplyPreset = (presetKey: string) => {
    let newDoc: DocumentModel;
    if (presetKey === "presentation-deck") {
      newDoc = JSON.parse(JSON.stringify(SAMPLE_PRESENTATION_DECK));
      setDocumentMode("presentation");
      setZoom(0.75);
    } else if (presetKey === "worksheet-calculus") {
      newDoc = JSON.parse(JSON.stringify(SAMPLE_WORKSHEET));
      setDocumentMode("worksheet");
      setZoom(0.85);
    } else if (presetKey === "executive-memo") {
      newDoc = JSON.parse(JSON.stringify(SAMPLE_ONE_PAGER));
      setDocumentMode("one-pager");
      setZoom(0.85);
    } else {
      newDoc = JSON.parse(JSON.stringify(INITIAL_SAMPLE_DOCUMENT));
      setDocumentMode("document");
      setZoom(0.85);
    }

    setActivePageIndex(0);
    setSelectedElementId(null);
    pushToHistory(newDoc);
  };

  // Page Management
  const handleAddPage = () => {
    const isPresentation = documentMode === "presentation";
    const newPage: PageData = {
      id: `page-${Date.now()}`,
      title: isPresentation ? `Slide ${currentPages.length + 1}` : `Page ${currentPages.length + 1}`,
      elements: [
        {
          id: `heading-${Date.now()}`,
          type: "heading",
          x: isPresentation ? 0.8 : 0.55,
          y: isPresentation ? 1.0 : 0.55,
          width: isPresentation ? 11.7 : 7.4,
          height: 0.85,
          zIndex: 1,
          content: {
            title: isPresentation ? `Slide ${currentPages.length + 1} Title` : `Section ${currentPages.length + 1}`,
            subtitle: "Add content or insert KaTeX equations, charts, and callouts.",
          },
          style: {
            fontSize: isPresentation ? 28 : 22,
            fontWeight: 700,
          },
        },
      ],
    };

    const updated = applyOperations(documentState, [{ action: "addPage", page: newPage }]);
    pushToHistory(updated);
    setActivePageIndex(updated.pages!.length - 1);
  };

  const handleDuplicatePage = (index: number) => {
    const targetPage = currentPages[index];
    if (!targetPage) return;

    const duplicatedPage: PageData = {
      id: `page-${Date.now()}`,
      title: `${targetPage.title || "Page"} (Copy)`,
      elements: targetPage.elements.map((el) => ({
        ...JSON.parse(JSON.stringify(el)),
        id: `el-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      })),
    };

    const nextPages = [...currentPages];
    nextPages.splice(index + 1, 0, duplicatedPage);
    const updated = { ...documentState, pages: nextPages };
    pushToHistory(updated);
    setActivePageIndex(index + 1);
  };

  const handleDeletePage = (index: number) => {
    if (currentPages.length <= 1) return;
    const nextPages = currentPages.filter((_, i) => i !== index);
    const updated = { ...documentState, pages: nextPages };
    pushToHistory(updated);
    setActivePageIndex(Math.max(0, index - 1));
  };

  const handleMovePage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= currentPages.length) return;
    const nextPages = [...currentPages];
    const [moved] = nextPages.splice(fromIndex, 1);
    nextPages.splice(toIndex, 0, moved);
    const updated = { ...documentState, pages: nextPages };
    pushToHistory(updated);
    setActivePageIndex(toIndex);
  };

  // Element Actions
  const handleUpdateElement = (id: string, changes: Partial<DocumentElement>, pageIndex = activePageIndex) => {
    const updated = applyOperations(documentState, [{ action: "update", id, changes, pageIndex }]);
    pushToHistory(updated);
  };

  const handleDeleteElement = (id: string, pageIndex = activePageIndex) => {
    const updated = applyOperations(documentState, [{ action: "delete", id, pageIndex }]);
    if (selectedElementId === id) setSelectedElementId(null);
    pushToHistory(updated);
  };

  const handleDuplicateElement = (id: string, pageIndex = activePageIndex) => {
    const updated = applyOperations(documentState, [{ action: "duplicate", id, pageIndex }]);
    pushToHistory(updated);
  };

  const handleReorderElement = (id: string, zIndex: number, pageIndex = activePageIndex) => {
    const updated = applyOperations(documentState, [{ action: "reorder", id, zIndex, pageIndex }]);
    pushToHistory(updated);
  };

  const handleAddElement = (element: DocumentElement, pageIndex = activePageIndex) => {
    const updated = applyOperations(documentState, [{ action: "add", element, pageIndex }]);
    pushToHistory(updated);
    setSelectedElementId(element.id);
  };

  // AI Chat & Modification API
  const handleSendMessage = async (prompt: string) => {
    if (!prompt.trim() || isAiLoading) return;

    setChatMessages((prev) => [...prev, { sender: "user", text: prompt }]);
    setIsAiLoading(true);
    setIsAnimating(true);

    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          documentState,
          selectedElementId,
          activePageIndex,
          documentMode,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI generation failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.operations && Array.isArray(data.operations) && data.operations.length > 0) {
        const updatedDoc = applyOperations(documentState, data.operations);
        pushToHistory(updatedDoc);
      }

      if (data.designReasoning) {
        setDesignReasoning(data.designReasoning);
      }

      setChatMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: data.message || "Applied design and content updates to the workspace.",
        },
      ]);
    } catch (err: any) {
      console.error("AI Error:", err);
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: `Could not complete modification: ${err.message || "Unknown error"}.`,
        },
      ]);
    } finally {
      setIsAiLoading(false);
      setIsAnimating(false);
    }
  };

  // Export handlers
  const handleExport = (format: "pdf" | "png" | "json" | "markdown") => {
    if (format === "pdf") {
      setIsPrintPreviewOpen(true);
    } else if (format === "json") {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(documentState, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `${(documentState.title || "document").toLowerCase().replace(/\s+/g, "_")}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } else if (format === "markdown") {
      let md = `# ${documentState.title || "PagePilot Document"}\n\n`;
      currentPages.forEach((page, pIdx) => {
        md += `## ${page.title || `Section ${pIdx + 1}`}\n\n`;
        page.elements.forEach((el) => {
          if (el.type === "heading") {
            md += `### ${el.content?.title || ""}\n${el.content?.subtitle ? `*${el.content.subtitle}*\n` : ""}\n`;
          } else if (el.type === "formula") {
            md += `$$\n${el.content?.equation || ""}\n$$\n\n`;
          } else if (el.type === "callout") {
            md += `> **${el.content?.title || "Key Insight"}**\n> ${el.content?.body || ""}\n\n`;
          } else if (typeof el.content === "string") {
            md += `${el.content}\n\n`;
          }
        });
      });

      navigator.clipboard?.writeText(md);
      alert("Markdown with LaTeX equations copied to clipboard!");
    }
  };

  // Selected element helper
  const selectedElement =
    currentPages[activePageIndex]?.elements?.find((el) => el.id === selectedElementId) ||
    currentPages.flatMap((p) => p.elements).find((el) => el.id === selectedElementId) ||
    null;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0c0d10] text-zinc-100 font-sans">
      {/* 1. TOP TOOLBAR NAVIGATION */}
      <StudioHeader
        title={documentState.title || "Untitled Document"}
        onTitleChange={(title) => {
          const updated = { ...documentState, title };
          pushToHistory(updated);
        }}
        documentMode={documentMode}
        onModeChange={handleModeChange}
        activePageIndex={activePageIndex}
        totalPages={currentPages.length}
        onPrevPage={() => setActivePageIndex(Math.max(0, activePageIndex - 1))}
        onNextPage={() => setActivePageIndex(Math.min(currentPages.length - 1, activePageIndex + 1))}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        zoom={zoom}
        onZoomChange={setZoom}
        onFitToScreen={() => setZoom(documentMode === "presentation" ? 0.75 : 0.85)}
        onPrint={() => triggerPrint()}
        onOpenPrintPreview={() => setIsPrintPreviewOpen(true)}
        onCheckPage={() => setIsChatPanelOpen(true)}
        issueCount={qualityIssues.length}
        isBlackAndWhite={isBlackAndWhite}
        onToggleBW={() => setIsBlackAndWhite(!isBlackAndWhite)}
        showMargins={showMargins}
        onToggleMargins={() => setShowMargins(!showMargins)}
        isPreviewMode={isPreviewMode}
        onTogglePreview={() => setIsPreviewMode(!isPreviewMode)}
        onOpenMarkdownMathModal={() => setIsMarkdownMathOpen(true)}
        onExport={handleExport}
      />

      {/* 2. MAIN 3-PANEL WORKSPACE */}
      <div className="flex flex-1 min-h-0 relative overflow-hidden">
        {/* Left Sidebar: Pages, Outline, Insert, Templates */}
        {!isPreviewMode && (
          <LeftSidebar
            document={documentState}
            documentMode={documentMode}
            activePageIndex={activePageIndex}
            onSelectPageIndex={setActivePageIndex}
            onAddPage={handleAddPage}
            onDuplicatePage={handleDuplicatePage}
            onDeletePage={handleDeletePage}
            onMovePage={handleMovePage}
            selectedElementId={selectedElementId}
            onSelectElement={setSelectedElementId}
            onAddElement={handleAddElement}
            onApplyPreset={handleApplyPreset}
          />
        )}

        {/* Center: Document & Slide Canvas */}
        <DocumentCanvas
          document={documentState}
          documentMode={documentMode}
          activePageIndex={activePageIndex}
          onSelectPageIndex={setActivePageIndex}
          onAddPage={handleAddPage}
          zoom={zoom}
          selectedElementId={selectedElementId}
          onSelectElement={setSelectedElementId}
          onUpdateElementPosition={(id, x, y, pIdx) =>
            handleUpdateElement(id, { x, y }, pIdx ?? activePageIndex)
          }
          onUpdateElementDimensions={(id, width, height, x, y, pIdx) => {
            const changes: Partial<DocumentElement> = { width, height };
            if (x !== undefined) changes.x = x;
            if (y !== undefined) changes.y = y;
            handleUpdateElement(id, changes, pIdx ?? activePageIndex);
          }}
          onUpdateElementRotation={(id, rotation, pIdx) =>
            handleUpdateElement(id, { rotation }, pIdx ?? activePageIndex)
          }
          onDeleteElement={handleDeleteElement}
          onDuplicateElement={handleDuplicateElement}
          isBlackAndWhite={isBlackAndWhite}
          showMargins={showMargins}
          onToggleMargins={() => setShowMargins(!showMargins)}
          isPreviewMode={isPreviewMode}
          isAnimating={isAnimating}
        />

        {/* Right Inspector: Element Properties & Page Setup */}
        {!isPreviewMode && (
          <RightInspector
            document={documentState}
            selectedElement={selectedElement}
            onUpdateElement={(id, changes) => handleUpdateElement(id, changes, activePageIndex)}
            onDeleteElement={(id) => handleDeleteElement(id, activePageIndex)}
            onDuplicateElement={(id) => handleDuplicateElement(id, activePageIndex)}
            onReorderElement={(id, zIndex) => handleReorderElement(id, zIndex, activePageIndex)}
            onUpdateDocumentPage={(changes) => {
              const updated = {
                ...documentState,
                page: { ...documentState.page, ...changes },
              };
              pushToHistory(updated);
            }}
            onUpdateDocumentTheme={(changes) => {
              const updated = {
                ...documentState,
                theme: { ...documentState.theme, ...changes },
              };
              pushToHistory(updated);
            }}
            onModeChange={handleModeChange}
            showMargins={showMargins}
            onToggleMargins={() => setShowMargins(!showMargins)}
            isBlackAndWhite={isBlackAndWhite}
            onToggleBW={() => setIsBlackAndWhite(!isBlackAndWhite)}
            onTriggerAIModification={(elemId, promptText) => {
              handleSendMessage(`For element ${elemId}: ${promptText}`);
            }}
          />
        )}
      </div>

      {/* 3. FLOATING AI INPUT BAR (BOTTOM CENTER) */}
      {!isPreviewMode && (
        <FloatingChatBar
          onSendMessage={handleSendMessage}
          isLoading={isAiLoading}
          onOpenExpandedPanel={() => setIsChatPanelOpen(!isChatPanelOpen)}
          isExpanded={isChatPanelOpen}
          selectedElementLabel={selectedElement?.metadata?.label || selectedElement?.type}
          documentMode={documentMode}
          activePageIndex={activePageIndex}
        />
      )}

      {/* 4. EXPANDABLE COPILOT & QUALITY AUDIT DRAWER */}
      <ChatPanel
        isOpen={isChatPanelOpen}
        messages={chatMessages}
        onSendMessage={handleSendMessage}
        isAiLoading={isAiLoading}
        onClose={() => setIsChatPanelOpen(false)}
        qualityIssues={qualityIssues}
        designReasoning={designReasoning}
        onAutoFixMargins={() => {
          const fixedDoc = autoFixSafeMargins(documentState);
          pushToHistory(fixedDoc);
        }}
        onAutoFixOverlaps={() => {
          const fixedDoc = autoFixOverlaps(documentState);
          pushToHistory(fixedDoc);
        }}
      />

      {/* 5. GENERATION ANIMATION OVERLAY */}
      <GenerationAnimation
        isAnimating={isAnimating}
        onSkip={() => setIsAnimating(false)}
      />

      {/* 6. PRINT PREVIEW MODAL */}
      <PrintPreviewModal
        isOpen={isPrintPreviewOpen}
        onClose={() => setIsPrintPreviewOpen(false)}
        documentModel={documentState}
        isBlackAndWhite={isBlackAndWhite}
        onToggleBW={() => setIsBlackAndWhite(!isBlackAndWhite)}
      />

      {/* 7. MARKDOWN + LATEX MODAL */}
      <MarkdownMathModal
        isOpen={isMarkdownMathOpen}
        onClose={() => setIsMarkdownMathOpen(false)}
        onApplyDocument={(newDoc) => pushToHistory(newDoc)}
      />
    </div>
  );
}
