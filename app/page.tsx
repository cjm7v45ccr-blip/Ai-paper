"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  DocumentModel,
  DocumentElement,
  DocumentMode,
  PageData,
  DocumentComment,
} from "@/types/document";
import {
  INITIAL_SAMPLE_DOCUMENT,
  SAMPLE_PRESENTATION_DECK,
} from "@/lib/sample-document";
import {
  getAllDocuments,
  saveDocument,
  deleteDocument,
  duplicateDocument,
} from "@/lib/document-storage";
import { buildComprehensiveDocumentFromPrompt } from "@/lib/smart-layout-architect";
import {
  turnPageIntoVisual,
  turnPageIntoDocumentFlow,
  balancePageLayout,
  autoPaginateDocument,
} from "@/lib/layout-engine";
import { triggerPrint } from "@/lib/print";
import { Sparkles } from "lucide-react";

import { GammaStyleHomepage, CreationParams } from "@/components/home/GammaStyleHomepage";
import { GenerationSteppedScreen } from "@/components/home/GenerationSteppedScreen";
import { MinimalTopNav } from "@/components/editor/MinimalTopNav";
import { SmartFormattingRibbon } from "@/components/editor/SmartFormattingRibbon";
import { MinimalLeftRail } from "@/components/editor/MinimalLeftRail";
import { HybridDocumentCanvas } from "@/components/editor/HybridDocumentCanvas";
import { RightInspector } from "@/components/editor/RightInspector";
import { MinimalAiPromptBar } from "@/components/editor/MinimalAiPromptBar";
import { PresenterModal } from "@/components/editor/PresenterModal";
import { PrintPreviewModal } from "@/components/editor/PrintPreviewModal";
import { FindReplaceBar } from "@/components/editor/FindReplaceBar";
import { CommentsDrawer } from "@/components/editor/CommentsDrawer";

export default function PagePilotApp() {
  // Navigation views: "home" | "generating" | "editor"
  const [currentView, setCurrentView] = useState<"home" | "generating" | "editor">("home");

  // All Saved Documents State (Google Docs style persistence)
  const [allDocuments, setAllDocuments] = useState<DocumentModel[]>([]);

  // Active Document State - Defaults to standard 8.5x11 inch US Letter Hybrid Document
  const [documentState, setDocumentState] = useState<DocumentModel>(INITIAL_SAMPLE_DOCUMENT);
  const [documentMode, setDocumentMode] = useState<DocumentMode>("document");
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  // Auto-save active document whenever it changes in editor
  const [isInitialized, setIsInitialized] = useState(false);

  // Load documents on initial client mount
  useEffect(() => {
    const loaded = getAllDocuments();
    setAllDocuments(loaded);
    if (loaded.length > 0) {
      setDocumentState(loaded[0]);
      setDocumentMode(loaded[0].mode || "document");
    }
    setIsInitialized(true);
  }, []);

  // Auto-save active document ONLY when modified in editor view
  useEffect(() => {
    if (!isInitialized) return;
    if (currentView !== "editor") return;
    if (documentState && documentState.title && documentState.id) {
      const updated = saveDocument(documentState);
      setAllDocuments((prev) => {
        const idx = prev.findIndex((d) => d.id === updated.id);
        if (idx >= 0) {
          const clone = [...prev];
          clone[idx] = updated;
          return clone;
        }
        return [updated, ...prev];
      });
    }
  }, [documentState, isInitialized, currentView]);

  // Canvas View & Zoom State
  const [zoom, setZoom] = useState(0.85);
  const [viewMode, setViewMode] = useState<"stacked" | "single">("stacked");
  const [showMargins, setShowMargins] = useState(true);
  const [isBlackAndWhite, setIsBlackAndWhite] = useState(false);

  // Undo / Redo History Stack
  const [history, setHistory] = useState<DocumentModel[]>([INITIAL_SAMPLE_DOCUMENT]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // AI & Generation States
  const [activePrompt, setActivePrompt] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Presentation & Export Modals
  const [isPresenterOpen, setIsPresenterOpen] = useState(false);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [isAiBarOpen, setIsAiBarOpen] = useState(false);
  const [isInspectorCollapsed, setIsInspectorCollapsed] = useState(true);

  // Comments & Find-Replace Panels State
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isFindOpen, setIsFindOpen] = useState(false);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);
  const [matchedElementIds, setMatchedElementIds] = useState<string[]>([]);

  // Calculate live word count and character count across all elements
  const { wordCount, charCount } = React.useMemo(() => {
    let words = 0;
    let chars = 0;

    const extractText = (content: any): string => {
      if (!content) return "";
      if (typeof content === "string") return content;
      if (typeof content === "object") {
        let str = "";
        if (content.title) str += content.title + " ";
        if (content.subtitle) str += content.subtitle + " ";
        if (content.text) str += content.text + " ";
        if (content.description) str += content.description + " ";
        if (Array.isArray(content.items)) {
          str += content.items.map((it: any) => (typeof it === "string" ? it : it.text || it.title || "")).join(" ");
        }
        if (Array.isArray(content.rows)) {
          str += content.rows.map((r: any) => (Array.isArray(r) ? r.join(" ") : "")).join(" ");
        }
        return str;
      }
      return "";
    };

    const allPages = documentState.pages && documentState.pages.length > 0
      ? documentState.pages
      : [{ id: "p1", elements: documentState.elements || [] }];

    for (const p of allPages) {
      for (const el of p.elements || []) {
        const text = extractText(el.content);
        if (text) {
          chars += text.length;
          const w = text.trim().split(/\s+/).filter(Boolean);
          words += w.length;
        }
      }
    }

    return { wordCount: words, charCount: chars };
  }, [documentState]);

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

  // Global Keyboard Shortcuts (⌘Z, ⌘⇧Z, ⌘P, ⌘F, Escape)
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
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setIsFindOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setSelectedElementId(null);
        setIsFindOpen(false);
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
  const handleStartCreation = async (params: CreationParams) => {
    setActivePrompt(params.prompt);
    setDocumentMode(params.mode);
    setCurrentView("generating");
    setIsAiLoading(true);

    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: params.prompt,
          actionType: "create_from_prompt",
          documentMode: params.mode,
          audience: params.audience,
          desiredLength: params.desiredLength,
          visualTheme: params.visualTheme,
          sourceContent: params.sourceContent,
          referenceLinks: params.referenceLinks,
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
          if (data.message) {
            setStatusMessage(data.message);
            setTimeout(() => setStatusMessage(null), 4000);
          }
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.warn("AI generation endpoint error:", errorData);
        // Fallback for resilient offline experience
        const fallback = buildComprehensiveDocumentFromPrompt(params.prompt, params.mode);
        setDocumentState(fallback);
        setHistory([fallback]);
        setHistoryIndex(0);
        setActivePageIndex(0);
        setStatusMessage("Generated draft using offline layout architect.");
        setTimeout(() => setStatusMessage(null), 4000);
      }
    } catch (err: any) {
      console.warn("AI generation network fallback:", err);
      const fallback = buildComprehensiveDocumentFromPrompt(params.prompt, params.mode);
      setDocumentState(fallback);
      setHistory([fallback]);
      setHistoryIndex(0);
      setActivePageIndex(0);
      setStatusMessage("Generated draft using offline layout architect.");
      setTimeout(() => setStatusMessage(null), 4000);
    } finally {
      setIsAiLoading(false);
      setCurrentView("editor");
    }
  };

  // 2. Open Existing Sample Project
  const handleOpenDraft = (mode: DocumentMode) => {
    const docToOpen = mode === "presentation" ? SAMPLE_PRESENTATION_DECK : INITIAL_SAMPLE_DOCUMENT;
    const cloned = { ...docToOpen, id: `doc-${Date.now()}` };
    saveDocument(cloned);
    setDocumentState(cloned);
    setDocumentMode(mode);
    setHistory([cloned]);
    setHistoryIndex(0);
    setActivePageIndex(0);
    setSelectedElementId(null);
    setCurrentView("editor");
  };

  // Open Document from Saved Documents List
  const handleOpenExistingDocument = (doc: DocumentModel) => {
    setDocumentState(doc);
    setDocumentMode(doc.mode || "document");
    setHistory([doc]);
    setHistoryIndex(0);
    setActivePageIndex(0);
    setSelectedElementId(null);
    setCurrentView("editor");
  };

  // Delete Document from Saved Documents List
  const handleDeleteDocumentFromList = (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = deleteDocument(docId);
    setAllDocuments(updated);
    if (documentState.id === docId && updated.length > 0) {
      setDocumentState(updated[0]);
    }
  };

  // Duplicate Document from Saved Documents List
  const handleDuplicateDocumentFromList = (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newDoc = duplicateDocument(docId);
    if (newDoc) {
      setAllDocuments(getAllDocuments());
    }
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

  // 4. Element Manipulation & Positioning
  const handleUpdateElementPosition = (
    id: string,
    x: number,
    y: number,
    pageIdx: number = activePageIndex
  ) => {
    const updatedPages = [...currentPages];
    const page = updatedPages[pageIdx] || updatedPages[activePageIndex];
    if (!page) return;

    page.elements = page.elements.map((el) =>
      el.id === id ? { ...el, x, y } : el
    );

    pushToHistory({
      ...documentState,
      pages: updatedPages,
      elements: updatedPages[0]?.elements || [],
    });
  };

  const handleUpdateElementDimensions = (
    id: string,
    width: number,
    height: number,
    x?: number,
    y?: number,
    pageIdx: number = activePageIndex
  ) => {
    const updatedPages = [...currentPages];
    const page = updatedPages[pageIdx] || updatedPages[activePageIndex];
    if (!page) return;

    page.elements = page.elements.map((el) => {
      if (el.id === id) {
        return {
          ...el,
          width,
          height,
          ...(x !== undefined ? { x } : {}),
          ...(y !== undefined ? { y } : {}),
        };
      }
      return el;
    });

    pushToHistory({
      ...documentState,
      pages: updatedPages,
      elements: updatedPages[0]?.elements || [],
    });
  };

  const handleUpdateElement = (id: string, changes: Partial<DocumentElement>) => {
    const updatedPages = [...currentPages];
    let found = false;
    for (let pIdx = 0; pIdx < updatedPages.length; pIdx++) {
      const page = updatedPages[pIdx];
      const elIdx = page.elements.findIndex((el) => el.id === id);
      if (elIdx !== -1) {
        page.elements[elIdx] = { ...page.elements[elIdx], ...changes };
        found = true;
        break;
      }
    }
    if (found) {
      pushToHistory({
        ...documentState,
        pages: updatedPages,
        elements: updatedPages[0]?.elements || [],
      });
    }
  };

  const handleTransformPage = (action: "visual" | "flow" | "balance" | "paginate") => {
    if (action === "paginate") {
      const paginated = autoPaginateDocument(documentState);
      pushToHistory(paginated);
      setStatusMessage("Recalculated 8.5×11\" pagination across all pages.");
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }

    const updatedPages = [...currentPages];
    const targetPage = updatedPages[activePageIndex] || updatedPages[0];
    if (!targetPage) return;

    if (action === "visual") {
      updatedPages[activePageIndex] = turnPageIntoVisual(targetPage);
      setStatusMessage("Transformed page into a high-density visual presentation layout.");
    } else if (action === "flow") {
      updatedPages[activePageIndex] = turnPageIntoDocumentFlow(targetPage);
      setStatusMessage("Converted page elements to standard document flow.");
    } else if (action === "balance") {
      updatedPages[activePageIndex] = balancePageLayout(targetPage);
      setStatusMessage("Balanced vertical distribution and reduced whitespace.");
    }

    pushToHistory({
      ...documentState,
      pages: updatedPages,
      elements: updatedPages[0]?.elements || [],
    });
    setTimeout(() => setStatusMessage(null), 3000);
  };

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

  const handleAddBlock = (type: any) => {
    const page = currentPages[activePageIndex];
    if (!page) return;

    let newElement: DocumentElement;
    const now = Date.now();

    if (type === "card") {
      newElement = {
        id: `card-${now}`,
        type: "card",
        x: 0.65,
        y: 2.5,
        width: 7.2,
        height: 2.2,
        zIndex: 2,
        content: {
          title: "Core Strategic Pillars",
          cards: [
            { badge: "01", title: "Smart Architecture", description: "Modular semantic blocks engineered for print and presentation.", highlight: true },
            { badge: "02", title: "Sub-Millimeter Snap", description: "Precision guidelines, dot grids, and collision prevention.", highlight: false },
            { badge: "03", title: "Apple Typography", description: "Curated mathematical ratios and high-contrast styling.", highlight: false },
          ],
        },
      };
    } else if (type === "metric") {
      newElement = {
        id: `metric-${now}`,
        type: "metric",
        x: 0.65,
        y: 2.5,
        width: 7.2,
        height: 1.8,
        zIndex: 2,
        content: {
          title: "Executive Performance Metrics",
          metrics: [
            { value: "99.4%", label: "Accuracy Rate", change: "+4.8%", isPositive: true },
            { value: "$3.8M", label: "ARR Projected", change: "+42%", isPositive: true },
            { value: "<15ms", label: "Render Latency", change: "-58%", isPositive: true },
          ],
        },
      };
    } else if (type === "timeline") {
      newElement = {
        id: `timeline-${now}`,
        type: "timeline",
        x: 0.65,
        y: 2.5,
        width: 7.2,
        height: 2.0,
        zIndex: 2,
        content: {
          title: "Milestone Execution Roadmap",
          events: [
            { phase: "Phase 1", title: "Architecture & Math", status: "completed", desc: "Core grid engine with sub-pixel snap" },
            { phase: "Phase 2", title: "AI Generation", status: "in-progress", desc: "Gamma-grade layout transformations" },
            { phase: "Phase 3", title: "Production Deploy", status: "planned", desc: "Real-time exports and live presentation" },
          ],
        },
      };
    } else if (type === "heading") {
      newElement = {
        id: `heading-${now}`,
        type: "heading",
        x: 0.65,
        y: 1.0,
        width: 7.2,
        height: 1.2,
        zIndex: 2,
        content: {
          title: "Executive Strategic Overview",
          subtitle: "Clear direction, actionable insights, and structured milestones.",
          badge: "STRATEGY",
        },
      };
    } else if (type === "formula") {
      newElement = {
        id: `formula-${now}`,
        type: "formula",
        x: 0.65,
        y: 3,
        width: 5.5,
        height: 2,
        zIndex: 2,
        content: {
          title: "Mathematical Optimization Formulation",
          equation: "\\mathcal{L}(\\theta) = \\mathbb{E}_{x \\sim p}[-\\log p_\\theta(x)] + \\lambda \\|\\theta\\|^2",
          breakdown: [
            { symbol: "\\mathcal{L}", label: "Total Loss Objective" },
            { symbol: "\\theta", label: "Model Weight Parameters" },
            { symbol: "\\lambda", label: "Regularization Coefficient" },
          ],
        },
      };
    } else if (type === "callout") {
      newElement = {
        id: `callout-${now}`,
        type: "callout",
        x: 0.65,
        y: 3,
        width: 7.2,
        height: 1.8,
        zIndex: 2,
        content: {
          title: "Strategic Key Finding",
          text: "Accelerating execution cycle time while preserving strict margin boundaries yields higher editorial impact.",
        },
      };
    } else if (type === "table") {
      newElement = {
        id: `table-${now}`,
        type: "table",
        x: 0.65,
        y: 3,
        width: 7.2,
        height: 2.2,
        zIndex: 2,
        content: {
          title: "Quarterly Evaluation Matrix",
          headers: ["Initiative", "Owner", "Target Date", "Status"],
          rows: [
            ["Sub-Millimeter Snap", "Engineering", "Q1 2026", "Shipped"],
            ["AI Transformation Engine", "Design Team", "Q2 2026", "In Progress"],
            ["Enterprise PDF Export", "Core Platform", "Q3 2026", "Active"],
          ],
        },
      };
    } else if (type === "chart") {
      newElement = {
        id: `chart-${now}`,
        type: "chart",
        x: 0.65,
        y: 3,
        width: 7.2,
        height: 2.5,
        zIndex: 2,
        content: {
          title: "Quarterly Growth Velocity",
          labels: ["Q1", "Q2", "Q3", "Q4"],
          series: [
            { name: "Active Users (k)", color: "#4f46e5", values: [120, 240, 480, 890] },
            { name: "Documents Created (k)", color: "#10b981", values: [80, 180, 390, 720] },
          ],
        },
      };
    } else if (type === "checkboxGroup") {
      newElement = {
        id: `checklist-${now}`,
        type: "checkboxGroup",
        x: 0.65,
        y: 3,
        width: 7.2,
        height: 2,
        zIndex: 2,
        content: {
          title: "Pre-Launch Review Checklist",
          items: [
            { text: "Verify typography hierarchy & contrast ratios.", checked: true },
            { text: "Confirm safe printing margin boundaries (0.65\").", checked: true },
            { text: "Validate snap guidelines and alignment accuracy.", checked: false },
          ],
        },
      };
    } else if (type === "divider") {
      newElement = {
        id: `divider-${now}`,
        type: "divider",
        x: 0.65,
        y: 3,
        width: 7.2,
        height: 0.3,
        zIndex: 1,
        content: {},
      };
    } else {
      newElement = {
        id: `text-${now}`,
        type: "richText",
        x: 0.65,
        y: 3,
        width: 7.2,
        height: 1.5,
        zIndex: 2,
        content: {
          text: "PagePilot combines structured document flow with absolute layout precision, empowering teams to create high-craft presentations and reports.",
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

  const handleApplyThemePreset = (themeName: string) => {
    const THEME_MAP: Record<string, NonNullable<DocumentModel["theme"]>> = {
      "Minimalist Titanium": {
        name: "Minimalist Titanium",
        headingFont: "Inter",
        bodyFont: "Inter",
        primaryColor: "#09090b",
        accentColor: "#4f46e5",
        backgroundColor: "#ffffff",
      },
      "Silicon Valley Tech": {
        name: "Silicon Valley Tech",
        headingFont: "Plus Jakarta Sans",
        bodyFont: "Inter",
        primaryColor: "#0f172a",
        accentColor: "#2563eb",
        backgroundColor: "#f8fafc",
      },
      "Editorial Broadside": {
        name: "Editorial Broadside",
        headingFont: "Playfair Display",
        bodyFont: "Merriweather",
        primaryColor: "#1c1917",
        accentColor: "#9a3412",
        backgroundColor: "#fdfbf7",
      },
      "Emerald Executive": {
        name: "Emerald Executive",
        headingFont: "Outfit",
        bodyFont: "DM Sans",
        primaryColor: "#064e3b",
        accentColor: "#059669",
        backgroundColor: "#f0fdf4",
      },
      "Monochrome Swiss": {
        name: "Monochrome Swiss",
        headingFont: "Space Grotesk",
        bodyFont: "Inter",
        primaryColor: "#000000",
        accentColor: "#52525b",
        backgroundColor: "#ffffff",
      },
      "Obsidian Night": {
        name: "Obsidian Night",
        headingFont: "Outfit",
        bodyFont: "Inter",
        primaryColor: "#fafafa",
        accentColor: "#818cf8",
        backgroundColor: "#0f172a",
      },
    };

    const targetTheme = THEME_MAP[themeName];
    if (targetTheme) {
      const updated: DocumentModel = {
        ...documentState,
        theme: targetTheme,
      };
      pushToHistory(updated);
      setStatusMessage(`Applied theme: ${themeName}`);
      setTimeout(() => setStatusMessage(null), 3000);
    }
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
          if (data.message) {
            setStatusMessage(data.message);
            setTimeout(() => setStatusMessage(null), 4000);
          }
        }
      } else {
        const err = await response.json().catch(() => ({}));
        setStatusMessage(err.error || "AI modification failed. Please try again.");
        setTimeout(() => setStatusMessage(null), 4000);
      }
    } catch (err: any) {
      console.warn("AI prompt error:", err);
      setStatusMessage("Network error communicating with AI endpoint.");
      setTimeout(() => setStatusMessage(null), 4000);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAiRefineElement = (id: string, actionType: string) => {
    setSelectedElementId(id);
    let command = "Refine and polish this element";
    if (actionType === "card_grid") {
      command = "Transform this element into a 3-column feature comparison card grid with concise bullet points and category badges";
    } else if (actionType === "stat_metric") {
      command = "Transform this element into high-impact KPI stat metric cards with large bold numbers, labels, and delta percentage changes";
    } else if (actionType === "timeline") {
      command = "Transform this element into a chronological roadmap timeline with phase badges and milestones";
    } else if (actionType === "fix_grammar") {
      command = "Fix all spelling, grammar, and typography flaws in this element";
    } else if (actionType === "concise") {
      command = "Make this element ultra concise, punchy, and impactful";
    } else if (actionType === "professional") {
      command = "Polish this element with an executive, high-stakes presentation tone";
    }
    handleAiPromptSubmit(command);
  };

  // 6. Mode Transformation Engine (Unified Workspace Doc <-> Slide <-> Report)
  const handleTransformDocumentMode = async (targetMode: DocumentMode) => {
    setIsAiLoading(true);
    setStatusMessage(`Transforming project to ${targetMode}...`);
    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionType: "transform_document_mode",
          documentMode: targetMode,
          documentState,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.document) {
          setDocumentMode(targetMode);
          pushToHistory({
            ...data.document,
            mode: targetMode,
          });
          setStatusMessage(data.message || `Transformed to ${targetMode}`);
          setTimeout(() => setStatusMessage(null), 3000);
          return;
        }
      }
    } catch (e) {
      console.warn("Transform API fallback:", e);
    } finally {
      setIsAiLoading(false);
    }

    // Fallback offline transformation
    setDocumentMode(targetMode);
    const updatedPages = currentPages.map((p) => {
      if (targetMode === "presentation") {
        return turnPageIntoVisual(p);
      } else if (targetMode === "document") {
        return turnPageIntoDocumentFlow(p);
      } else {
        return { ...p, layoutType: targetMode };
      }
    });

    pushToHistory({
      ...documentState,
      mode: targetMode,
      pages: updatedPages,
    });
    setStatusMessage(`Transformed layout to ${targetMode}`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // 7. Comments Management Handlers
  const handleAddComment = (text: string, elementId?: string) => {
    const newComment: DocumentComment = {
      id: `comment-${Date.now()}`,
      elementId: elementId || undefined,
      author: "Editor",
      text,
      createdAt: new Date().toISOString(),
      resolved: false,
    };
    const updatedComments = [...(documentState.comments || []), newComment];
    pushToHistory({
      ...documentState,
      comments: updatedComments,
    });
  };

  const handleResolveComment = (id: string) => {
    const updatedComments = (documentState.comments || []).map((c) =>
      c.id === id ? { ...c, resolved: !c.resolved } : c
    );
    pushToHistory({
      ...documentState,
      comments: updatedComments,
    });
  };

  const handleDeleteComment = (id: string) => {
    const updatedComments = (documentState.comments || []).filter((c) => c.id !== id);
    pushToHistory({
      ...documentState,
      comments: updatedComments,
    });
  };

  // 8. Find & Replace Handlers
  const handleFind = useCallback((searchTerm: string, matchCase: boolean) => {
    if (!searchTerm.trim()) {
      setTotalMatches(0);
      setCurrentMatchIndex(0);
      setMatchedElementIds([]);
      return;
    }

    const ids: string[] = [];
    const query = matchCase ? searchTerm : searchTerm.toLowerCase();

    for (const page of currentPages) {
      for (const el of page.elements) {
        const contentStr = typeof el.content === "string" ? el.content : JSON.stringify(el.content || {});
        const target = matchCase ? contentStr : contentStr.toLowerCase();
        if (target.includes(query)) {
          ids.push(el.id);
        }
      }
    }

    setMatchedElementIds(ids);
    setTotalMatches(ids.length);
    setCurrentMatchIndex(ids.length > 0 ? 0 : -1);
    if (ids.length > 0) {
      setSelectedElementId(ids[0]);
    }
  }, [currentPages]);

  const handleNextMatch = () => {
    if (matchedElementIds.length === 0) return;
    const nextIdx = (currentMatchIndex + 1) % matchedElementIds.length;
    setCurrentMatchIndex(nextIdx);
    setSelectedElementId(matchedElementIds[nextIdx]);
  };

  const handlePrevMatch = () => {
    if (matchedElementIds.length === 0) return;
    const prevIdx = (currentMatchIndex - 1 + matchedElementIds.length) % matchedElementIds.length;
    setCurrentMatchIndex(prevIdx);
    setSelectedElementId(matchedElementIds[prevIdx]);
  };

  const handleReplace = (searchTerm: string, replaceTerm: string, matchCase: boolean) => {
    if (!selectedElementId || !searchTerm) return;
    const page = currentPages[activePageIndex];
    if (!page) return;

    const replaceInContent = (content: any): any => {
      if (typeof content === "string") {
        const flags = matchCase ? "g" : "gi";
        return content.replace(new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), flags), replaceTerm);
      }
      if (content && typeof content === "object") {
        const clone = { ...content };
        for (const key of Object.keys(clone)) {
          clone[key] = replaceInContent(clone[key]);
        }
        return clone;
      }
      return content;
    };

    const updatedElements = page.elements.map((el) => {
      if (el.id === selectedElementId) {
        return { ...el, content: replaceInContent(el.content) };
      }
      return el;
    });

    const updatedPages = [...currentPages];
    updatedPages[activePageIndex] = { ...page, elements: updatedElements };
    pushToHistory({
      ...documentState,
      pages: updatedPages,
      elements: updatedElements,
    });
  };

  const handleReplaceAll = (searchTerm: string, replaceTerm: string, matchCase: boolean) => {
    if (!searchTerm) return;

    const replaceInContent = (content: any): any => {
      if (typeof content === "string") {
        const flags = matchCase ? "g" : "gi";
        return content.replace(new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), flags), replaceTerm);
      }
      if (content && typeof content === "object") {
        const clone = { ...content };
        for (const key of Object.keys(clone)) {
          clone[key] = replaceInContent(clone[key]);
        }
        return clone;
      }
      return content;
    };

    const updatedPages = currentPages.map((page) => ({
      ...page,
      elements: page.elements.map((el) => ({
        ...el,
        content: replaceInContent(el.content),
      })),
    }));

    pushToHistory({
      ...documentState,
      pages: updatedPages,
    });
    setStatusMessage("Replaced all occurrences");
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // 9. Regenerate Complete First Draft
  const handleRegenerateDraft = () => {
    const promptToUse = activePrompt || documentState.title || "Executive Strategy Presentation";
    handleStartCreation({
      prompt: promptToUse,
      mode: documentMode,
    });
  };

  // 10. Export Handlers
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
        documents={allDocuments}
        onStartCreation={handleStartCreation}
        onOpenDraft={handleOpenDraft}
        onOpenDocument={handleOpenExistingDocument}
        onDeleteDocument={handleDeleteDocumentFromList}
        onDuplicateDocument={handleDuplicateDocumentFromList}
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
        onTransformMode={handleTransformDocumentMode}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onAddSectionOrSlide={handleAddPage}
        onRegenerate={handleRegenerateDraft}
        onOpenPresenter={() => setIsPresenterOpen(true)}
        onBackToHome={() => setCurrentView("home")}
        onExport={handleExport}
        zoom={zoom}
        onUpdateZoom={setZoom}
        viewMode={viewMode}
        onToggleViewMode={() =>
          setViewMode((prev) => (prev === "stacked" ? "single" : "stacked"))
        }
        isAiBarOpen={isAiBarOpen}
        onToggleAiBar={() => setIsAiBarOpen((prev) => !prev)}
        isInspectorCollapsed={isInspectorCollapsed}
        onToggleInspector={() => setIsInspectorCollapsed((prev) => !prev)}
        wordCount={wordCount}
        charCount={charCount}
        commentsCount={documentState.comments?.filter((c) => !c.resolved).length || 0}
        isCommentsOpen={isCommentsOpen}
        onToggleComments={() => setIsCommentsOpen((prev) => !prev)}
        isFindOpen={isFindOpen}
        onToggleFind={() => setIsFindOpen((prev) => !prev)}
      />

      {/* 2. Apple / Google Docs & Slides Grade Smart Formatting Ribbon */}
      <SmartFormattingRibbon
        document={documentState}
        selectedElement={
          currentPages[activePageIndex]?.elements.find(
            (el) => el.id === selectedElementId
          ) || null
        }
        onUpdateElement={(id, changes) => {
          const page = currentPages[activePageIndex];
          if (!page) return;
          const updatedElements = page.elements.map((el) =>
            el.id === id ? { ...el, ...changes } : el
          );
          const updatedPages = [...currentPages];
          updatedPages[activePageIndex] = { ...page, elements: updatedElements };
          pushToHistory({
            ...documentState,
            pages: updatedPages,
            elements: updatedElements,
          });
        }}
        onUpdateElementStyle={(id, styleUpdates) => {
          handleUpdateElementStyle(id, styleUpdates);
        }}
        onAddBlock={handleAddBlock}
        onDuplicateElement={(id) => {
          handleDuplicateElement(id);
        }}
        onDeleteElement={(id) => {
          handleDeleteElement(id);
        }}
        onAiRefineElement={(id, actionType) => {
          handleAiRefineElement(id, actionType);
        }}
        onApplyThemePreset={handleApplyThemePreset}
        documentMode={documentMode}
        isAiLoading={isAiLoading}
      />

      {/* 3. Main Workspace Layout */}
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

        {/* Central Intelligent Hybrid 8.5"x11" Document Canvas */}
        <HybridDocumentCanvas
          document={documentState}
          documentMode={documentMode}
          activePageIndex={activePageIndex}
          onSelectPageIndex={setActivePageIndex}
          onAddPage={handleAddPage}
          zoom={zoom}
          onUpdateZoom={setZoom}
          viewMode={viewMode}
          onToggleViewMode={() =>
            setViewMode((prev) => (prev === "stacked" ? "single" : "stacked"))
          }
          selectedElementId={selectedElementId}
          onSelectElement={setSelectedElementId}
          onUpdateElementPosition={handleUpdateElementPosition}
          onUpdateElementDimensions={handleUpdateElementDimensions}
          onUpdateElementContent={handleUpdateElementContent}
          onUpdateElementStyle={handleUpdateElementStyle}
          onDuplicateElement={handleDuplicateElement}
          onDeleteElement={handleDeleteElement}
          onReorderElements={handleReorderElements}
          onAddBlock={handleAddBlock}
          onAiRefineElement={handleAiRefineElement}
          onApplyDocumentUpdate={pushToHistory}
          showMargins={showMargins}
          onToggleMargins={() => setShowMargins((prev) => !prev)}
          isBlackAndWhite={isBlackAndWhite}
          isAiLoading={isAiLoading}
        />

        {/* Right Properties & AI Intelligence Inspector */}
        <RightInspector
          document={documentState}
          selectedElement={
            currentPages[activePageIndex]?.elements.find((el) => el.id === selectedElementId) ||
            currentPages.flatMap((p) => p.elements).find((el) => el.id === selectedElementId) ||
            null
          }
          onUpdateElement={handleUpdateElement}
          onDeleteElement={handleDeleteElement}
          onDuplicateElement={handleDuplicateElement}
          onReorderElement={(id, zIndex) => handleUpdateElement(id, { zIndex })}
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
          onModeChange={(newMode) => {
            setDocumentMode(newMode);
            pushToHistory({ ...documentState, mode: newMode });
          }}
          showMargins={showMargins}
          onToggleMargins={() => setShowMargins((prev) => !prev)}
          isBlackAndWhite={isBlackAndWhite}
          onToggleBW={() => setIsBlackAndWhite((prev) => !prev)}
          onTriggerAIModification={handleAiRefineElement}
          onTransformPage={handleTransformPage}
          isCollapsed={isInspectorCollapsed}
          onToggleCollapsed={setIsInspectorCollapsed}
        />

        {/* Floating Comments & Review Drawer */}
        <CommentsDrawer
          isOpen={isCommentsOpen}
          onClose={() => setIsCommentsOpen(false)}
          comments={documentState.comments || []}
          activeElementId={selectedElementId}
          onAddComment={handleAddComment}
          onResolveComment={handleResolveComment}
          onDeleteComment={handleDeleteComment}
        />
      </div>

      {/* Floating Find & Replace Bar */}
      <FindReplaceBar
        isOpen={isFindOpen}
        onClose={() => setIsFindOpen(false)}
        onFind={handleFind}
        onReplace={handleReplace}
        onReplaceAll={handleReplaceAll}
        totalMatches={totalMatches}
        currentMatchIndex={currentMatchIndex}
        onNextMatch={handleNextMatch}
        onPrevMatch={handlePrevMatch}
      />

      {/* Real-time AI Status Notification */}
      {statusMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#161822]/95 border border-indigo-500/30 text-white text-xs px-4 py-2.5 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* 3. Floating Bottom AI Prompt Bar - Dockable & Non-intrusive */}
      <MinimalAiPromptBar
        onSubmitPrompt={handleAiPromptSubmit}
        isLoading={isAiLoading}
        isOpen={isAiBarOpen}
        onToggleOpen={setIsAiBarOpen}
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
        isBlackAndWhite={isBlackAndWhite}
        onToggleBW={() => setIsBlackAndWhite((prev) => !prev)}
      />
    </div>
  );
}
