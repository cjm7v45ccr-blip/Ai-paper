"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { DocumentModel, DocumentElement, QualityCheckIssue, DesignReasoning } from "@/types/document";
import { INITIAL_SAMPLE_DOCUMENT } from "@/lib/sample-document";
import { applyOperations } from "@/lib/apply-operations";
import {
  runDeterministicQualityChecks,
  autoFixSafeMargins,
  autoFixOverlaps,
} from "@/lib/quality-checks";
import { triggerPrint } from "@/lib/print";
import {
  clampElementBounds,
  clampPosition,
  clampDimensions,
  PAGE_WIDTH_INCHES,
  PAGE_HEIGHT_INCHES,
} from "@/lib/coordinates";
import { buildChemistryMeasurementGuide, autoDesignDocument } from "@/lib/smart-layout-architect";

import { CanvasToolbar } from "@/components/editor/CanvasToolbar";
import { LeftSidebar } from "@/components/editor/LeftSidebar";
import { RightInspector } from "@/components/editor/RightInspector";
import { DocumentCanvas } from "@/components/editor/DocumentCanvas";
import { FloatingChatBar } from "@/components/ai/FloatingChatBar";
import { ChatPanel } from "@/components/ai/ChatPanel";
import { GenerationAnimation } from "@/components/ai/GenerationAnimation";
import { PrintPreviewModal } from "@/components/editor/PrintPreviewModal";
import { MarkdownMathModal } from "@/components/editor/MarkdownMathModal";
import { MATH_PRESETS } from "@/lib/math-markdown-engine";

export default function PagePilotEditor() {
  const [documentState, setDocumentState] = useState<DocumentModel>(INITIAL_SAMPLE_DOCUMENT);
  const [history, setHistory] = useState<DocumentModel[]>([INITIAL_SAMPLE_DOCUMENT]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [documentTitle, setDocumentTitle] = useState("Compound Interest Study Guide");
  const [zoom, setZoom] = useState(0.88);
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
      text: "Hey! 👋 I'm PagePilot, your AI document designer. I can create stunning layouts, fix margins, add charts, formulas, study guides — basically anything. Just tell me what you want, or ask me anything!",
    },
  ]);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  const [qualityIssues, setQualityIssues] = useState<QualityCheckIssue[]>([]);

  const workspaceRef = useRef<HTMLDivElement>(null);

  // Local Storage Persistence with boundary safety migration
  useEffect(() => {
    const saved = localStorage.getItem("pagepilot_doc");
    if (saved) {
      try {
        const parsed: DocumentModel = JSON.parse(saved);
        if (parsed?.elements && Array.isArray(parsed.elements)) {
          // Clamp all elements to guarantee no boundary spills from corrupted storage
          const sanitizedElements = parsed.elements.map((el) =>
            clampElementBounds(el, parsed.page?.width || PAGE_WIDTH_INCHES, parsed.page?.height || PAGE_HEIGHT_INCHES)
          );
          const sanitizedDoc = { ...parsed, elements: sanitizedElements };
          setDocumentState(sanitizedDoc);
          setHistory([sanitizedDoc]);
          return;
        }
      } catch (e) {
        console.error("Failed to load document from storage", e);
      }
    }
  }, []);

  // Recalculate Quality Checks dynamically when document elements change
  useEffect(() => {
    const issues = runDeterministicQualityChecks(documentState);
    setQualityIssues(issues);
  }, [documentState]);

  const pushToHistory = useCallback((newDoc: DocumentModel) => {
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
  }, [history, historyIndex]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevDoc = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setDocumentState(prevDoc);
      localStorage.setItem("pagepilot_doc", JSON.stringify(prevDoc));
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextDoc = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setDocumentState(nextDoc);
      localStorage.setItem("pagepilot_doc", JSON.stringify(nextDoc));
    }
  }, [history, historyIndex]);

  // Insert Equation from Google Docs Equation Toolbar
  const handleInsertEquation = useCallback((preset?: any) => {
    const eqString = preset?.equation || "\\int_{a}^{b} f(x)\\,dx = F(b) - F(a)";
    const eqTitle = preset?.title || "Mathematical Equation";
    const eqBreakdown = preset?.breakdown || [
      { symbol: "f(x)", label: "Integrand function" },
      { symbol: "dx", label: "Differential element" },
      { symbol: "F(x)", label: "Antiderivative" },
    ];

    const newId = `el-formula-${Date.now()}`;
    const lastEl = documentState.elements[documentState.elements.length - 1];
    const yPos = lastEl ? Math.min(8.8, lastEl.y + lastEl.height + 0.15) : 3.5;

    const newElement: DocumentElement = {
      id: newId,
      type: "formula",
      x: 0.55,
      y: yPos,
      width: 7.4,
      height: 1.35,
      zIndex: documentState.elements.length + 1,
      content: {
        title: eqTitle,
        equation: eqString,
        breakdown: eqBreakdown,
      },
      style: {
        backgroundColor: "#f8fafc",
        borderColor: "#cbd5e1",
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
      },
      metadata: { label: eqTitle },
    };

    pushToHistory({
      ...documentState,
      elements: [...documentState.elements, newElement],
    });
    setSelectedElementId(newId);
  }, [documentState, pushToHistory]);

  // Insert Element by type from Menu
  const handleInsertElement = useCallback((type: string) => {
    const newId = `el-${type}-${Date.now()}`;
    const lastEl = documentState.elements[documentState.elements.length - 1];
    const yPos = lastEl ? Math.min(9.0, lastEl.y + lastEl.height + 0.15) : 3.0;

    let newElement: DocumentElement;
    if (type === "table") {
      newElement = {
        id: newId,
        type: "table",
        x: 0.55,
        y: yPos,
        width: 7.4,
        height: 1.6,
        zIndex: documentState.elements.length + 1,
        content: {
          title: "Data Matrix",
          headers: ["Parameter", "Formula", "Description"],
          rows: [
            ["Derivation", "$f'(x) = \\lim_{h \\to 0} \\frac{f(x+h)-f(x)}{h}$", "Instantaneous rate of change"],
            ["Integral", "$\\int f(x) dx = F(x) + C$", "Accumulation / area under curve"],
          ],
        },
        style: { backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderWidth: 1, borderRadius: 8, padding: 10 },
      };
    } else if (type === "callout") {
      newElement = {
        id: newId,
        type: "callout",
        x: 0.55,
        y: yPos,
        width: 7.4,
        height: 1.1,
        zIndex: documentState.elements.length + 1,
        content: {
          title: "Fundamental Concept",
          body: "Continuous mathematical models provide analytical precision when analyzing complex systems.",
        },
        style: { backgroundColor: "#f0fdf4", borderColor: "#86efac", borderWidth: 1, borderRadius: 8, padding: 12 },
      };
    } else {
      newElement = {
        id: newId,
        type: "text",
        x: 0.55,
        y: yPos,
        width: 7.4,
        height: 1.1,
        zIndex: documentState.elements.length + 1,
        content: "New markdown notes block. Supports **bold**, *italic*, and LaTeX equations like $E=mc^2$ or $$\\sum_{i=1}^n x_i$$.",
        style: { fontSize: 14, color: "#334155", lineHeight: 1.5 },
      };
    }

    pushToHistory({
      ...documentState,
      elements: [...documentState.elements, newElement],
    });
    setSelectedElementId(newId);
  }, [documentState, pushToHistory]);

  // Fit to screen uniform scaling calculation
  const handleFitToScreen = useCallback(() => {
    if (!workspaceRef.current) return;
    const ws = workspaceRef.current;
    const availableWidth = ws.clientWidth - 64;
    const availableHeight = ws.clientHeight - 130;

    const canvasWidthPx = (documentState.page?.width || PAGE_WIDTH_INCHES) * 96;
    const canvasHeightPx = (documentState.page?.height || PAGE_HEIGHT_INCHES) * 96;

    const scaleX = availableWidth / canvasWidthPx;
    const scaleY = availableHeight / canvasHeightPx;
    const uniformScale = Math.min(scaleX, scaleY);

    const clampedZoom = Math.max(0.4, Math.min(1.5, Math.round(uniformScale * 100) / 100));
    setZoom(clampedZoom);
  }, [documentState.page]);

  // Auto-fit on initial mount
  useEffect(() => {
    const timer = setTimeout(() => {
      handleFitToScreen();
    }, 150);
    return () => clearTimeout(timer);
  }, [handleFitToScreen]);

  // Global Keyboard Shortcuts for Undo / Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

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
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Quality Verification Handler
  const handleCheckPage = () => {
    const issues = runDeterministicQualityChecks(documentState);
    setQualityIssues(issues);
    setIsChatPanelOpen(true);
  };

  // Auto-Repair Safe Margins
  const handleAutoFixMargins = () => {
    const fixed = autoFixSafeMargins(documentState);
    pushToHistory(fixed);
    setChatMessages((prev) => [
      ...prev,
      {
        sender: "ai",
        text: "Auto-Repair: Clamped all elements safely inside the 0.45\" print margin boundary.",
      },
    ]);
  };

  // Auto-Resolve Collisions
  const handleAutoFixOverlaps = () => {
    const resolved = autoFixOverlaps(documentState);
    pushToHistory(resolved);
    setChatMessages((prev) => [
      ...prev,
      {
        sender: "ai",
        text: "Auto-Repair: Shifted overlapping elements down to restore visual spacing.",
      },
    ]);
  };

  // AI Prompt Interaction via Gemini
  const handleSendMessage = async (promptText: string) => {
    setIsAiLoading(true);
    setIsChatPanelOpen(true); // Auto-open chat panel to show the conversation
    setChatMessages((prev) => [...prev, { sender: "user", text: promptText }]);

    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptText,
          currentDocument: documentState,
          selectedElementId,
          mode: "director",
          chatHistory: chatMessages,
        }),
      });

      const data = await response.json();

      if (!response.ok && !data.operations) {
        throw new Error(data.error || "Failed to communicate with layout engine");
      }

      // Apply Operations returned by Gemini / fallback engine
      if (data.operations && Array.isArray(data.operations)) {
        const updatedDoc = applyOperations(documentState, data.operations);
        pushToHistory(updatedDoc);

        // Trigger Construction Animation
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 2200);
      }

      if (data.designReasoning) {
        setDesignReasoning(data.designReasoning);
      }

      setChatMessages((prev) => [
        ...prev,
        { sender: "ai", text: data.message || "Document successfully updated." },
      ]);

      if (data.qualityChecks?.length) {
        setQualityIssues(data.qualityChecks);
      }
    } catch (err: any) {
      console.error(err);
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: `Notice: ${err.message}.`,
        },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleQuickAIEdit = (id: string, instruction: string) => {
    handleSendMessage(`Modify element "${id}": ${instruction}`);
  };

  // AI Architect Direct Layout Redesign
  const handleAutoDesign = (mode: string) => {
    if (mode === "chemistry") {
      const result = buildChemistryMeasurementGuide();
      pushToHistory(result.document);
      setDesignReasoning(result.reasoning);
      setDocumentTitle(result.document.title || "Chemistry Reference Guide");
      setSelectedElementId(null);
      setChatMessages((prev) => [
        ...prev,
        { sender: "user", text: "Transform to Chemistry Lab Guide" },
        { sender: "ai", text: result.message },
      ]);
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 2000);
    } else if (mode === "margins") {
      handleAutoFixMargins();
    } else if (mode === "balance") {
      handleSendMessage("Auto-balance two-column layout and equalize section card heights");
    } else {
      // Direct client-side smart architect execution for instant responsiveness
      const result = autoDesignDocument(documentState);
      pushToHistory(result.document);
      setDesignReasoning(result.reasoning);
      setSelectedElementId(null);
      setChatMessages((prev) => [
        ...prev,
        { sender: "user", text: "Auto-Design Document Layout" },
        { sender: "ai", text: result.message },
      ]);
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 2000);
    }
  };

  // Preset Templates
  const handleApplyPreset = (
    preset: "compound-interest" | "photosynthesis" | "quiz" | "physics" | "executive" | "chemistry"
  ) => {
    if (preset === "chemistry") {
      handleAutoDesign("chemistry");
      return;
    }

    if (preset === "compound-interest") {
      pushToHistory(INITIAL_SAMPLE_DOCUMENT);
      setDocumentTitle("Compound Interest Study Guide");
    } else if (preset === "photosynthesis") {
      const bioDoc: DocumentModel = {
        ...INITIAL_SAMPLE_DOCUMENT,
        elements: [
          {
            id: "bio-title",
            type: "heading",
            x: 0.55,
            y: 0.55,
            width: 7.4,
            height: 0.8,
            zIndex: 1,
            content: {
              title: "Photosynthesis: Solar Energy to Chemical Bonds",
              subtitle: "The dual-stage biochemical process powering Earth's biosphere.",
            },
          },
          {
            id: "bio-equation",
            type: "formula",
            x: 0.55,
            y: 1.45,
            width: 7.4,
            height: 1.4,
            zIndex: 2,
            content: {
              equation: "6CO_2 + 6H_2O + photons -> C_6H_{12}O_6 + 6O_2",
              breakdown: [
                { symbol: "CO2", label: "Carbon Dioxide (Stomata)" },
                { symbol: "H2O", label: "Water absorbed by roots" },
                { symbol: "C6H12O6", label: "Glucose output" },
                { symbol: "O2", label: "Oxygen byproduct" },
              ],
            },
            style: {
              backgroundColor: "#f0fdf4",
              borderColor: "#bbf7d0",
              borderWidth: 1,
              borderRadius: 8,
              padding: 12,
            },
          },
          {
            id: "bio-diagram",
            type: "diagram",
            x: 0.55,
            y: 3.0,
            width: 7.4,
            height: 1.8,
            zIndex: 2,
            content: {
              title: "Reaction Progression",
              nodes: [
                { step: "01", title: "Light Phase", desc: "Thylakoid splits H2O to ATP & NADPH" },
                { step: "02", title: "Calvin Cycle", desc: "Stroma utilizes ATP to fix carbon into G3P" },
                { step: "03", title: "Sugar Storage", desc: "Polymerized into starch reserves" },
              ],
            },
            style: {
              backgroundColor: "#fdfbf7",
              borderColor: "#fde68a",
              borderWidth: 1,
              borderRadius: 8,
              padding: 10,
            },
          },
          {
            id: "bio-lines",
            type: "writingLines",
            x: 0.55,
            y: 5.0,
            width: 7.4,
            height: 5.4,
            zIndex: 2,
            content: {
              title: "Student Synthesis & Comprehension Notes",
              promptText: "Explain how stomatal closure during drought directly halts the Calvin cycle:",
              lineCount: 12,
            },
            style: {
              borderColor: "#cbd5e1",
              borderRadius: 8,
              borderWidth: 1,
              backgroundColor: "#ffffff",
              padding: 12,
            },
          },
        ],
      };
      pushToHistory(bioDoc);
      setDocumentTitle("Photosynthesis Biology One-Pager");
    } else if (preset === "physics") {
      const physDoc: DocumentModel = {
        ...INITIAL_SAMPLE_DOCUMENT,
        elements: [
          {
            id: "phys-title",
            type: "heading",
            x: 0.55,
            y: 0.55,
            width: 7.4,
            height: 0.8,
            zIndex: 1,
            content: {
              title: "Classical Kinetics & Trajectory Dynamics",
              subtitle: "Constant acceleration kinematics and energy conservation principles.",
            },
          },
          {
            id: "phys-formula",
            type: "formula",
            x: 0.55,
            y: 1.45,
            width: 4.25,
            height: 1.6,
            zIndex: 2,
            content: {
              equation: "v^2 = v_0^2 + 2a(x - x_0)",
              breakdown: [
                { symbol: "v", label: "Final Velocity (m/s)" },
                { symbol: "v0", label: "Initial Velocity (m/s)" },
                { symbol: "a", label: "Constant Acceleration (m/s²)" },
                { symbol: "Δx", label: "Displacement (meters)" },
              ],
            },
          },
          {
            id: "phys-callout",
            type: "callout",
            x: 4.95,
            y: 1.45,
            width: 3.0,
            height: 1.6,
            zIndex: 2,
            content: {
              title: "Zero-Time Independence",
              body: "This equation solves for velocity without requiring elapsed time (t), useful for projectile summits and braking distances.",
            },
          },
          {
            id: "phys-chart",
            type: "chart",
            x: 0.55,
            y: 3.2,
            width: 7.4,
            height: 2.15,
            zIndex: 2,
            content: {
              title: "Parabolic Trajectory: Elevation vs Range (v0 = 30 m/s)",
              labels: ["0m", "20m", "40m", "60m", "80m", "92m"],
              series: [
                { name: "45° Launch", color: "#4f46e5", values: [0, 16.5, 23.0, 21.5, 11.2, 0] },
                { name: "30° Launch", color: "#64748b", values: [0, 9.8, 14.5, 12.0, 4.0, 0] },
              ],
            },
          },
          {
            id: "phys-lines",
            type: "writingLines",
            x: 0.55,
            y: 5.5,
            width: 4.4,
            height: 4.95,
            zIndex: 2,
            content: {
              title: "Kinematic Derivation Steps",
              promptText: "1. Integrate a = dv/dt to find v(t)\n2. Integrate v(t) to find x(t)\n3. Eliminate parameter t:",
              lineCount: 11,
            },
          },
          {
            id: "phys-scratch",
            type: "drawingArea",
            x: 5.1,
            y: 5.5,
            width: 2.85,
            height: 4.95,
            zIndex: 2,
            content: {
              title: "Free-Body Diagram Frame",
              promptWatermark: "Draw normal forces and vectors...",
            },
          },
        ],
      };
      pushToHistory(physDoc);
      setDocumentTitle("Physics Motion & Kinetics Sheet");
    } else if (preset === "quiz") {
      const quizDoc: DocumentModel = {
        ...INITIAL_SAMPLE_DOCUMENT,
        elements: [
          {
            id: "quiz-title",
            type: "heading",
            x: 0.55,
            y: 0.55,
            width: 7.4,
            height: 0.8,
            zIndex: 1,
            content: {
              title: "Unit Assessment: Exponential Models",
              subtitle: "Name: ____________________   Date: _________   Score: ___ / 100",
            },
          },
          {
            id: "quiz-check",
            type: "checkboxGroup",
            x: 0.55,
            y: 1.45,
            width: 7.4,
            height: 1.4,
            zIndex: 2,
            content: {
              title: "Part A: Theoretical Fundamentals",
              items: [
                { text: "1. Distinguish between simple and compound interest compounding frequencies.", checked: false },
                { text: "2. State why increasing compounding periods (n -> inf) approaches continuous growth (e^rt).", checked: false },
                { text: "3. Identify the principal base parameter in standard amortization tables.", checked: false },
              ],
            },
          },
          {
            id: "quiz-lines",
            type: "writingLines",
            x: 0.55,
            y: 3.0,
            width: 7.4,
            height: 7.45,
            zIndex: 2,
            content: {
              title: "Part B: Multi-Step Word Problem Calculations",
              promptText: "A principal sum of $2,000 is invested at 7.5% annual interest compounded monthly for 8 years.\nShow all intermediate steps and state your final balance to the nearest cent:",
              lineCount: 17,
            },
          },
        ],
      };
      pushToHistory(quizDoc);
      setDocumentTitle("Exponential Models Diagnostic Exam");
    }

    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 2000);
  };

  // Canvas element update callbacks
  const handleUpdateElementPosition = (id: string, x: number, y: number) => {
    const updated = documentState.elements.map((el) => {
      if (el.id === id) {
        const clamped = clampPosition(
          x,
          y,
          el.width,
          el.height,
          documentState.page?.width,
          documentState.page?.height
        );
        return { ...el, x: clamped.x, y: clamped.y };
      }
      return el;
    });
    setDocumentState({ ...documentState, elements: updated });
  };

  const handleUpdateElementDimensions = (
    id: string,
    width: number,
    height: number,
    x?: number,
    y?: number
  ) => {
    const updated = documentState.elements.map((el) => {
      if (el.id === id) {
        const nextX = x !== undefined ? x : el.x;
        const nextY = y !== undefined ? y : el.y;
        const clampedDims = clampDimensions(
          nextX,
          nextY,
          width,
          height,
          documentState.page?.width,
          documentState.page?.height
        );
        const clampedPos = clampPosition(
          nextX,
          nextY,
          clampedDims.width,
          clampedDims.height,
          documentState.page?.width,
          documentState.page?.height
        );
        return {
          ...el,
          x: clampedPos.x,
          y: clampedPos.y,
          width: clampedDims.width,
          height: clampedDims.height,
        };
      }
      return el;
    });
    setDocumentState({ ...documentState, elements: updated });
  };

  const handleUpdateElementRotation = (id: string, rotation: number) => {
    const updated = documentState.elements.map((el) =>
      el.id === id ? { ...el, rotation } : el
    );
    setDocumentState({ ...documentState, elements: updated });
  };

  const handleDeleteElement = (id: string) => {
    const filtered = documentState.elements.filter((el) => el.id !== id);
    setSelectedElementId(null);
    pushToHistory({ ...documentState, elements: filtered });
  };

  const handleDuplicateElement = (id: string) => {
    const target = documentState.elements.find((el) => el.id === id);
    if (!target) return;
    const maxZ = documentState.elements.reduce((m, e) => Math.max(m, e.zIndex || 1), 1);
    const offsetPos = clampPosition(
      target.x + 0.2,
      target.y + 0.2,
      target.width,
      target.height,
      documentState.page?.width,
      documentState.page?.height
    );

    const dup: DocumentElement = {
      ...JSON.parse(JSON.stringify(target)),
      id: `el-${Date.now()}`,
      x: offsetPos.x,
      y: offsetPos.y,
      zIndex: maxZ + 1,
      metadata: {
        ...(target.metadata || {}),
        label: target.metadata?.label ? `${target.metadata.label} (Copy)` : undefined,
      },
    };

    pushToHistory({ ...documentState, elements: [...documentState.elements, dup] });
    setSelectedElementId(dup.id);
  };

  const handleReorderElement = (id: string, newZIndex: number) => {
    const updated = documentState.elements.map((el) =>
      el.id === id ? { ...el, zIndex: newZIndex } : el
    );
    pushToHistory({ ...documentState, elements: updated });
  };

  const selectedElement =
    documentState.elements.find((el) => el.id === selectedElementId) || null;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#f3f4f6]">
      {/* Top Application Toolbar */}
      <CanvasToolbar
        title={documentTitle}
        onTitleChange={setDocumentTitle}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        zoom={zoom}
        onZoomChange={setZoom}
        onFitToScreen={handleFitToScreen}
        onPrint={triggerPrint}
        onOpenPrintPreview={() => setIsPrintPreviewOpen(true)}
        onCheckPage={handleCheckPage}
        issueCount={qualityIssues.length}
        isBlackAndWhite={isBlackAndWhite}
        onToggleBW={() => setIsBlackAndWhite(!isBlackAndWhite)}
        showMargins={showMargins}
        onToggleMargins={() => setShowMargins(!showMargins)}
        isPreviewMode={isPreviewMode}
        onTogglePreview={() => setIsPreviewMode(!isPreviewMode)}
        onOpenMarkdownMathModal={() => setIsMarkdownMathOpen(true)}
        onInsertEquation={handleInsertEquation}
        onInsertElement={handleInsertElement}
        onAutoDesign={handleAutoDesign}
      />

      {/* Main Workspace with Left Sidebar, Document Canvas, and Right Inspector */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Component Library & Document Outline */}
        {!isPreviewMode && (
          <LeftSidebar
            document={documentState}
            selectedElementId={selectedElementId}
            onSelectElement={setSelectedElementId}
            onAddElement={(el) =>
              pushToHistory({
                ...documentState,
                elements: [...documentState.elements, el],
              })
            }
            onApplyTemplate={handleApplyPreset}
          />
        )}

        {/* Central Document Workspace Canvas */}
        <main
          ref={workspaceRef}
          className="flex-1 overflow-auto relative bg-[#f3f4f6]"
        >
          <DocumentCanvas
            document={documentState}
            zoom={zoom}
            selectedElementId={selectedElementId}
            onSelectElement={setSelectedElementId}
            onUpdateElementPosition={handleUpdateElementPosition}
            onUpdateElementDimensions={handleUpdateElementDimensions}
            onUpdateElementRotation={handleUpdateElementRotation}
            onDeleteElement={handleDeleteElement}
            onDuplicateElement={handleDuplicateElement}
            isBlackAndWhite={isBlackAndWhite}
            showMargins={showMargins}
            onToggleMargins={() => setShowMargins(!showMargins)}
            isPreviewMode={isPreviewMode}
            isAnimating={isAnimating}
          />
        </main>

        {/* Right Inspector & Page Setup */}
        {!isPreviewMode && (
          <RightInspector
            selectedElement={selectedElement}
            documentModel={documentState}
            onUpdateElement={(id, changes) => {
              const updated = documentState.elements.map((el) =>
                el.id === id ? { ...el, ...changes } : el
              );
              pushToHistory({ ...documentState, elements: updated });
            }}
            onDeleteElement={handleDeleteElement}
            onDuplicateElement={handleDuplicateElement}
            onReorderElement={handleReorderElement}
            onUpdatePageSettings={(settings) =>
              pushToHistory({
                ...documentState,
                page: { ...documentState.page, ...settings },
              })
            }
            onUpdateTheme={(theme) =>
              pushToHistory({
                ...documentState,
                theme: { ...documentState.theme, ...theme },
              })
            }
            onAIQuickEdit={handleQuickAIEdit}
            isAiLoading={isAiLoading}
            isBlackAndWhite={isBlackAndWhite}
            onToggleBW={() => setIsBlackAndWhite(!isBlackAndWhite)}
            showMargins={showMargins}
            onToggleMargins={() => setShowMargins(!showMargins)}
          />
        )}
      </div>

      {/* Generation Construction Animation Indicator */}
      <GenerationAnimation
        isAnimating={isAnimating}
        onSkip={() => setIsAnimating(false)}
      />

      {/* Floating AI Command Pill */}
      {!isPreviewMode && (
        <FloatingChatBar
          onSendMessage={handleSendMessage}
          isLoading={isAiLoading}
          onOpenExpandedPanel={() => setIsChatPanelOpen(!isChatPanelOpen)}
          isExpanded={isChatPanelOpen}
        />
      )}

      {/* Expanded AI Co-Pilot & Quality Audit Drawer */}
      <ChatPanel
        isOpen={isChatPanelOpen}
        onClose={() => setIsChatPanelOpen(false)}
        messages={chatMessages}
        qualityIssues={qualityIssues}
        designReasoning={designReasoning}
        isAiLoading={isAiLoading}
        onAutoFixMargins={handleAutoFixMargins}
        onAutoFixOverlaps={handleAutoFixOverlaps}
        onSendMessage={handleSendMessage}
        onTransformDocument={handleAutoDesign}
      />

      {/* High-Fidelity Print & PDF Preview Modal */}
      <PrintPreviewModal
        isOpen={isPrintPreviewOpen}
        onClose={() => setIsPrintPreviewOpen(false)}
        documentModel={documentState}
        isBlackAndWhite={isBlackAndWhite}
        onToggleBW={() => setIsBlackAndWhite(!isBlackAndWhite)}
      />

      {/* Markdown to Math Publication Engine Modal */}
      <MarkdownMathModal
        isOpen={isMarkdownMathOpen}
        onClose={() => setIsMarkdownMathOpen(false)}
        onApplyDocument={(newDoc) => {
          pushToHistory(newDoc);
          if (newDoc.title) {
            setDocumentTitle(newDoc.title);
          }
          setSelectedElementId(null);
        }}
      />
    </div>
  );
}