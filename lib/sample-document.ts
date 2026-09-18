import { DocumentModel } from "@/types/document";

export const INITIAL_SAMPLE_DOCUMENT: DocumentModel = {
  page: {
    size: "letter",
    width: 8.5,
    height: 11,
    unit: "in",
    safeMargin: 0.45,
    background: "#ffffff",
  },
  theme: {
    name: "modern-educational",
    headingFont: "Inter",
    bodyFont: "Inter",
    primaryColor: "#0f172a",
    accentColor: "#4f46e5",
    backgroundColor: "#ffffff",
  },
  elements: [
    // Header Section
    {
      id: "doc-header",
      type: "heading",
      x: 0.55,
      y: 0.55,
      width: 7.4,
      height: 0.8,
      zIndex: 1,
      content: {
        title: "Compound Interest: The Engine of Growth",
        subtitle: "How consistent compounding transforms modest initial savings over a 10-year horizon.",
      },
      style: {
        color: "#0f172a",
        fontFamily: "Inter",
        fontSize: 24,
        fontWeight: 800,
        textAlign: "left",
      },
      metadata: { label: "Hero Title Header" },
    },
    // Formula Section
    {
      id: "formula-card",
      type: "formula",
      x: 0.55,
      y: 1.45,
      width: 4.25,
      height: 1.6,
      zIndex: 2,
      content: {
        equation: "A = P(1 + r/n)^{nt}",
        breakdown: [
          { symbol: "A", label: "Final Amount ($895.42)" },
          { symbol: "P", label: "Principal deposit ($500.00)" },
          { symbol: "r", label: "Annual Rate (6% = 0.06)" },
          { symbol: "t", label: "Tenure in Years (10 yrs)" },
        ],
      },
      style: {
        backgroundColor: "#f8fafc",
        borderColor: "#e2e8f0",
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
      },
      metadata: { label: "Mathematical Formula Card" },
    },
    // Highlight Callout Box
    {
      id: "takeaway-callout",
      type: "callout",
      x: 4.95,
      y: 1.45,
      width: 3.0,
      height: 1.6,
      zIndex: 2,
      content: {
        title: "The Exponential Edge",
        body: "Simple interest only yields $30 per year ($300 total). Compounding earns $395.42—granting a 31.8% bonus without extra deposits.",
        icon: "sparkles",
      },
      style: {
        backgroundColor: "#eef2ff",
        borderColor: "#818cf8",
        borderWidth: 1,
        borderRadius: 8,
        color: "#312e81",
        padding: 12,
      },
      metadata: { label: "Key Insight Callout" },
    },
    // Comparison Chart
    {
      id: "trajectory-chart",
      type: "chart",
      x: 0.55,
      y: 3.2,
      width: 7.4,
      height: 2.15,
      zIndex: 3,
      content: {
        title: "10-Year Trajectory: Compound vs. Flat Simple Growth ($500 @ 6%)",
        labels: ["Yr 0", "Yr 2", "Yr 4", "Yr 6", "Yr 8", "Yr 10"],
        series: [
          {
            name: "Compound Growth",
            color: "#4f46e5",
            values: [500, 561.8, 631.2, 709.3, 796.9, 895.4],
          },
          {
            name: "Simple Interest",
            color: "#94a3b8",
            values: [500, 560.0, 620.0, 680.0, 740.0, 800.0],
          },
        ],
      },
      style: {
        backgroundColor: "#ffffff",
        borderColor: "#e2e8f0",
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
      },
      metadata: { label: "10-Year Growth Comparison Chart", chartType: "line" },
    },
    // Concept Cycle Diagram
    {
      id: "concept-diagram",
      type: "diagram",
      x: 0.55,
      y: 5.5,
      width: 7.4,
      height: 1.55,
      zIndex: 2,
      content: {
        title: "The 3-Step Compounding Cycle",
        nodes: [
          { step: "01", title: "Principal Invested", desc: "Initial $500 capital base" },
          { step: "02", title: "Annual Interest Added", desc: "6% earned on full balance" },
          { step: "03", title: "Base Expands", desc: "Next year generates interest on interest" },
        ],
      },
      style: {
        backgroundColor: "#fdfbf7",
        borderColor: "#fde68a",
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
      },
      metadata: { label: "Cyclical Concept Diagram" },
    },
    // Guided Practice Handwriting Lines
    {
      id: "practice-writing",
      type: "writingLines",
      x: 0.55,
      y: 7.2,
      width: 4.4,
      height: 3.25,
      zIndex: 2,
      content: {
        title: "Hand-Copy Exercise: Calculate Year 11",
        promptText: "Step 1: Write out the Year 10 balance ($895.42)\nStep 2: Multiply by 1.06 to find Year 11 = $________",
        lineCount: 7,
        lineSpacing: 28,
      },
      style: {
        borderColor: "#cbd5e1",
        borderRadius: 8,
        borderWidth: 1,
        backgroundColor: "#ffffff",
        padding: 12,
      },
      metadata: { label: "Hand-Copy Ruled Practice Box" },
    },
    // Freeform Drawing & Scratch Area
    {
      id: "sketch-area",
      type: "drawingArea",
      x: 5.1,
      y: 7.2,
      width: 2.85,
      height: 3.25,
      zIndex: 2,
      content: {
        title: "Student Scratchpad",
        promptWatermark: "Draw your own growth curve or scratch math here...",
        gridStyle: "dots",
      },
      style: {
        borderColor: "#cbd5e1",
        borderStyle: "dashed",
        borderWidth: 1.5,
        borderRadius: 8,
        backgroundColor: "#fcfcfc",
        padding: 12,
      },
      metadata: { label: "Freehand Drawing Canvas Area" },
    },
  ],
};