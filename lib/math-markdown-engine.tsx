"use client";

import React, { useMemo } from "react";
import katex from "katex";

/**
 * Safely render LaTeX math string to HTML using KaTeX
 */
export function renderKatexToHtml(latex: string, displayMode: boolean = false): string {
  if (!latex || typeof latex !== "string") return "";
  try {
    return katex.renderToString(latex.trim(), {
      displayMode,
      throwOnError: false,
      output: "htmlAndMathml",
      strict: false,
    });
  } catch (err) {
    console.warn("KaTeX render warning:", err);
    // Fallback escaped text
    return `<span class="katex-error text-amber-700 font-mono text-xs bg-amber-50 px-1 py-0.5 rounded border border-amber-200" title="${String(err)}">${escapeHtml(
      latex
    )}</span>`;
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * MathRenderer component for rendering raw LaTeX expressions
 */
interface MathRendererProps {
  latex: string;
  displayMode?: boolean;
  className?: string;
}

export const MathRenderer: React.FC<MathRendererProps> = ({
  latex,
  displayMode = false,
  className = "",
}) => {
  const html = useMemo(() => renderKatexToHtml(latex, displayMode), [latex, displayMode]);

  return (
    <span
      className={`inline-block ${displayMode ? "block my-2 text-center overflow-x-auto py-1" : ""} ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

/**
 * Parses markdown text that can contain inline math `$math$` and block math `$$math$$`
 */
export const MarkdownWithMath: React.FC<{
  content: string;
  className?: string;
  style?: React.CSSProperties;
}> = ({ content, className = "", style }) => {
  const renderedElements = useMemo(() => {
    if (!content) return null;

    // Process lines and blocks
    const lines = content.split("\n");
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    let listItems: React.ReactNode[] = [];
    let listType: "ul" | "ol" | null = null;
    let tableRows: string[][] = [];
    let inTable = false;

    const flushList = () => {
      if (listItems.length > 0 && listType) {
        if (listType === "ul") {
          elements.push(
            <ul key={`ul-${elements.length}`} className="list-disc pl-5 my-1.5 space-y-1">
              {listItems}
            </ul>
          );
        } else {
          elements.push(
            <ol key={`ol-${elements.length}`} className="list-decimal pl-5 my-1.5 space-y-1">
              {listItems}
            </ol>
          );
        }
        listItems = [];
        listType = null;
      }
    };

    const flushTable = () => {
      if (tableRows.length > 0) {
        const headers = tableRows[0];
        const body = tableRows.slice(1);
        elements.push(
          <div key={`table-${elements.length}`} className="my-2 overflow-x-auto">
            <table className="min-w-full border-collapse border border-slate-200 text-xs">
              <thead>
                <tr className="bg-slate-100">
                  {headers.map((h, i) => (
                    <th key={i} className="border border-slate-200 px-2.5 py-1.5 font-semibold text-slate-800 text-left">
                      {parseInlineFormatting(h.trim())}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {body.map((row, rIdx) => (
                  <tr key={rIdx} className={rIdx % 2 === 0 ? "bg-white" : "bg-slate-50/70"}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="border border-slate-200 px-2.5 py-1.5 text-slate-700">
                        {parseInlineFormatting(cell.trim())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableRows = [];
        inTable = false;
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Code blocks
      if (line.trim().startsWith("```")) {
        if (inCodeBlock) {
          elements.push(
            <pre
              key={`code-${elements.length}`}
              className="bg-slate-900 text-slate-100 p-2.5 rounded-md font-mono text-xs my-2 overflow-x-auto leading-relaxed"
            >
              <code>{codeBlockContent.join("\n")}</code>
            </pre>
          );
          codeBlockContent = [];
          inCodeBlock = false;
        } else {
          flushList();
          flushTable();
          inCodeBlock = true;
        }
        continue;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        continue;
      }

      // Block math: $$ ... $$ on a single line or starting
      if (line.trim().startsWith("$$") && line.trim().endsWith("$$") && line.trim().length > 4) {
        flushList();
        flushTable();
        const mathExpr = line.trim().slice(2, -2).trim();
        elements.push(
          <div key={`math-block-${elements.length}`} className="my-2.5 p-2 bg-slate-50/80 rounded border border-slate-200/80 flex justify-center overflow-x-auto select-text">
            <MathRenderer latex={mathExpr} displayMode={true} />
          </div>
        );
        continue;
      }

      // Markdown Table row: | cell | cell |
      if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
        flushList();
        const cells = line
          .trim()
          .slice(1, -1)
          .split("|")
          .map((c) => c.trim());

        // Skip separator row |---|---|
        if (cells.every((c) => /^[:-]+$/.test(c))) {
          continue;
        }

        tableRows.push(cells);
        inTable = true;
        continue;
      } else if (inTable) {
        flushTable();
      }

      // Unordered list
      const ulMatch = line.match(/^(\s*)[-*+]\s+(.*)$/);
      if (ulMatch) {
        flushTable();
        listType = "ul";
        const contentStr = ulMatch[2];
        listItems.push(
          <li key={`li-${listItems.length}`} className="leading-snug">
            {parseInlineFormatting(contentStr)}
          </li>
        );
        continue;
      }

      // Ordered list
      const olMatch = line.match(/^(\s*)\d+\.\s+(.*)$/);
      if (olMatch) {
        flushTable();
        listType = "ol";
        const contentStr = olMatch[2];
        listItems.push(
          <li key={`li-${listItems.length}`} className="leading-snug">
            {parseInlineFormatting(contentStr)}
          </li>
        );
        continue;
      }

      // End of list if normal line
      flushList();

      // Horizontal Rule
      if (/^(---|\*\*\*|___)\s*$/.test(line.trim())) {
        elements.push(<hr key={`hr-${elements.length}`} className="my-3 border-slate-200" />);
        continue;
      }

      // Blockquote
      if (line.trim().startsWith(">")) {
        const quoteText = line.replace(/^>\s?/, "");
        elements.push(
          <blockquote
            key={`quote-${elements.length}`}
            className="border-l-4 border-indigo-400 bg-indigo-50/40 pl-3 py-1.5 my-2 italic text-slate-700 rounded-r text-xs leading-relaxed"
          >
            {parseInlineFormatting(quoteText)}
          </blockquote>
        );
        continue;
      }

      // Headings
      if (line.startsWith("### ")) {
        elements.push(
          <h3 key={`h3-${elements.length}`} className="text-sm font-bold text-slate-900 mt-3 mb-1">
            {parseInlineFormatting(line.slice(4))}
          </h3>
        );
        continue;
      }
      if (line.startsWith("## ")) {
        elements.push(
          <h2 key={`h2-${elements.length}`} className="text-base font-extrabold text-slate-900 mt-3.5 mb-1.5 border-b border-slate-100 pb-1">
            {parseInlineFormatting(line.slice(3))}
          </h2>
        );
        continue;
      }
      if (line.startsWith("# ")) {
        elements.push(
          <h1 key={`h1-${elements.length}`} className="text-lg font-black text-slate-900 mt-4 mb-2">
            {parseInlineFormatting(line.slice(2))}
          </h1>
        );
        continue;
      }

      // Empty line -> spacing
      if (!line.trim()) {
        elements.push(<div key={`empty-${elements.length}`} className="h-1.5" />);
        continue;
      }

      // Paragraph
      elements.push(
        <p key={`p-${elements.length}`} className="my-1 leading-relaxed break-words">
          {parseInlineFormatting(line)}
        </p>
      );
    }

    flushList();
    flushTable();

    return elements;
  }, [content]);

  return (
    <div className={`markdown-math-content ${className}`} style={style}>
      {renderedElements}
    </div>
  );
};

/**
 * Parses inline formatting: $inline math$, **bold**, *italic*, `code`, ~~strikethrough~~
 */
export function parseInlineFormatting(text: string): React.ReactNode[] {
  if (!text) return [];

  // Tokenize by $math$ first to protect math from markdown asterisks and underscores
  const tokens: Array<{ type: "text" | "math"; content: string }> = [];
  let remaining = text;

  while (remaining.length > 0) {
    const mathStart = remaining.indexOf("$");
    if (mathStart === -1) {
      tokens.push({ type: "text", content: remaining });
      break;
    }

    // Check if it's double $$
    if (remaining.startsWith("$$", mathStart)) {
      const endDouble = remaining.indexOf("$$", mathStart + 2);
      if (endDouble !== -1) {
        if (mathStart > 0) {
          tokens.push({ type: "text", content: remaining.slice(0, mathStart) });
        }
        tokens.push({ type: "math", content: remaining.slice(mathStart + 2, endDouble) });
        remaining = remaining.slice(endDouble + 2);
        continue;
      }
    }

    // Single $
    const mathEnd = remaining.indexOf("$", mathStart + 1);
    if (mathEnd === -1) {
      tokens.push({ type: "text", content: remaining });
      break;
    }

    if (mathStart > 0) {
      tokens.push({ type: "text", content: remaining.slice(0, mathStart) });
    }
    tokens.push({ type: "math", content: remaining.slice(mathStart + 1, mathEnd) });
    remaining = remaining.slice(mathEnd + 1);
  }

  // Now process text tokens for bold, italic, code
  const resultNodes: React.ReactNode[] = [];

  tokens.forEach((token, tIdx) => {
    if (token.type === "math") {
      resultNodes.push(
        <MathRenderer key={`m-${tIdx}`} latex={token.content} displayMode={false} />
      );
    } else {
      // Process simple markdown inline formatting
      const parts = parseMarkdownText(token.content, `t-${tIdx}`);
      resultNodes.push(...parts);
    }
  });

  return resultNodes;
}

function parseMarkdownText(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // Regex to match **bold**, *italic*, `code`, ~~strike~~
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|~~[^~]+~~)/g;
  const parts = text.split(regex);

  parts.forEach((part, idx) => {
    const key = `${keyPrefix}-${idx}`;
    if (part.startsWith("**") && part.endsWith("**")) {
      nodes.push(
        <strong key={key} className="font-bold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    } else if (part.startsWith("*") && part.endsWith("*")) {
      nodes.push(
        <em key={key} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    } else if (part.startsWith("`") && part.endsWith("`")) {
      nodes.push(
        <code
          key={key}
          className="bg-slate-100 text-indigo-700 px-1 py-0.5 rounded font-mono text-[0.9em] border border-slate-200"
        >
          {part.slice(1, -1)}
        </code>
      );
    } else if (part.startsWith("~~") && part.endsWith("~~")) {
      nodes.push(
        <del key={key} className="line-through text-slate-400">
          {part.slice(2, -2)}
        </del>
      );
    } else if (part) {
      nodes.push(<span key={key}>{part}</span>);
    }
  });

  return nodes;
}

/**
 * Standard Math Presets Library
 */
export interface MathPreset {
  id: string;
  category: "Algebra" | "Calculus" | "Physics" | "Statistics" | "Geometry" | "Finance";
  title: string;
  equation: string;
  breakdown: Array<{ symbol: string; label: string }>;
}

export const MATH_PRESETS: MathPreset[] = [
  {
    id: "quadratic",
    category: "Algebra",
    title: "Quadratic Formula",
    equation: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
    breakdown: [
      { symbol: "x", label: "Roots / Solutions" },
      { symbol: "b", label: "Linear coefficient" },
      { symbol: "a", label: "Quadratic coefficient" },
      { symbol: "c", label: "Constant term" },
    ],
  },
  {
    id: "compound-interest",
    category: "Finance",
    title: "Compound Interest",
    equation: "A = P\\left(1 + \\frac{r}{n}\\right)^{nt}",
    breakdown: [
      { symbol: "A", label: "Final Accrued Amount" },
      { symbol: "P", label: "Principal Sum ($)" },
      { symbol: "r", label: "Annual Nominal Rate" },
      { symbol: "n", label: "Compounding frequency" },
      { symbol: "t", label: "Time in Years" },
    ],
  },
  {
    id: "calculus-ftc",
    category: "Calculus",
    title: "Fundamental Theorem of Calculus",
    equation: "\\int_a^b f(x)\\,dx = F(b) - F(a)",
    breakdown: [
      { symbol: "\\int", label: "Definite Integral" },
      { symbol: "f(x)", label: "Continuous integrand" },
      { symbol: "F", label: "Antiderivative of f" },
      { symbol: "[a,b]", label: "Integration interval" },
    ],
  },
  {
    id: "gaussian-integral",
    category: "Calculus",
    title: "Gaussian Integral",
    equation: "\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}",
    breakdown: [
      { symbol: "e", label: "Euler's base" },
      { symbol: "\\pi", label: "Archimedes' constant" },
      { symbol: "\\infty", label: "Infinite domain" },
    ],
  },
  {
    id: "normal-dist",
    category: "Statistics",
    title: "Gaussian Normal Distribution",
    equation: "f(x) = \\frac{1}{\\sigma \\sqrt{2\\pi}} e^{-\\frac{1}{2}\\left(\\frac{x - \\mu}{\\sigma}\\right)^2}",
    breakdown: [
      { symbol: "\\mu", label: "Population mean" },
      { symbol: "\\sigma", label: "Standard deviation" },
      { symbol: "\\sigma^2", label: "Variance" },
      { symbol: "x", label: "Observed value" },
    ],
  },
  {
    id: "einstein-energy",
    category: "Physics",
    title: "Mass-Energy Equivalence",
    equation: "E^2 = (mc^2)^2 + (pc)^2",
    breakdown: [
      { symbol: "E", label: "Total relativistic energy" },
      { symbol: "m", label: "Rest mass" },
      { symbol: "c", label: "Speed of light (2.998e8 m/s)" },
      { symbol: "p", label: "Momentum" },
    ],
  },
  {
    id: "pythagorean",
    category: "Geometry",
    title: "Pythagorean Theorem",
    equation: "a^2 + b^2 = c^2",
    breakdown: [
      { symbol: "a, b", label: "Perpendicular leg lengths" },
      { symbol: "c", label: "Hypotenuse length" },
    ],
  },
  {
    id: "euler-identity",
    category: "Algebra",
    title: "Euler's Identity",
    equation: "e^{i\\pi} + 1 = 0",
    breakdown: [
      { symbol: "e", label: "Base of natural logarithm" },
      { symbol: "i", label: "Imaginary unit (\\sqrt{-1})" },
      { symbol: "\\pi", label: "Ratio of circumference to diameter" },
    ],
  },
  {
    id: "matrix-2x2-inv",
    category: "Algebra",
    title: "2×2 Matrix Inversion",
    equation: "\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}^{-1} = \\frac{1}{ad - bc} \\begin{pmatrix} d & -b \\\\ -c & a \\end{pmatrix}",
    breakdown: [
      { symbol: "ad - bc", label: "Determinant |A|" },
      { symbol: "A^{-1}", label: "Inverse Matrix" },
    ],
  },
  {
    id: "limit-def",
    category: "Calculus",
    title: "Derivative Limit Definition",
    equation: "f'(x) = \\lim_{h \\to 0} \\frac{f(x + h) - f(x)}{h}",
    breakdown: [
      { symbol: "f'(x)", label: "Instantaneous rate of change" },
      { symbol: "h", label: "Infinitesimal increment" },
      { symbol: "\\lim", label: "Cauchy limit operator" },
    ],
  },
];

/**
 * Google Docs Style Equation Symbols & Operators Palette
 */
export interface MathSymbolGroup {
  name: string;
  symbols: Array<{ label: string; latex: string; preview: string }>;
}

export const GOOGLE_DOCS_MATH_PALETTE: MathSymbolGroup[] = [
  {
    name: "Greek Letters",
    symbols: [
      { label: "alpha", latex: "\\alpha", preview: "α" },
      { label: "beta", latex: "\\beta", preview: "β" },
      { label: "gamma", latex: "\\gamma", preview: "γ" },
      { label: "delta", latex: "\\delta", preview: "δ" },
      { label: "epsilon", latex: "\\epsilon", preview: "ε" },
      { label: "theta", latex: "\\theta", preview: "θ" },
      { label: "lambda", latex: "\\lambda", preview: "λ" },
      { label: "mu", latex: "\\mu", preview: "μ" },
      { label: "pi", latex: "\\pi", preview: "π" },
      { label: "sigma", latex: "\\sigma", preview: "σ" },
      { label: "tau", latex: "\\tau", preview: "τ" },
      { label: "phi", latex: "\\phi", preview: "φ" },
      { label: "omega", latex: "\\omega", preview: "ω" },
      { label: "Delta", latex: "\\Delta", preview: "Δ" },
      { label: "Sigma", latex: "\\Sigma", preview: "Σ" },
      { label: "Omega", latex: "\\Omega", preview: "Ω" },
    ],
  },
  {
    name: "Operations & Symbols",
    symbols: [
      { label: "plus-minus", latex: "\\pm", preview: "±" },
      { label: "minus-plus", latex: "\\mp", preview: "∓" },
      { label: "times", latex: "\\times", preview: "×" },
      { label: "divide", latex: "\\div", preview: "÷" },
      { label: "dot", latex: "\\cdot", preview: "·" },
      { label: "approx", latex: "\\approx", preview: "≈" },
      { label: "not equal", latex: "\\neq", preview: "≠" },
      { label: "less equal", latex: "\\le", preview: "≤" },
      { label: "greater equal", latex: "\\ge", preview: "≥" },
      { label: "much less", latex: "\\ll", preview: "≪" },
      { label: "much greater", latex: "\\gg", preview: "≫" },
      { label: "infinity", latex: "\\infty", preview: "∞" },
      { label: "proportional", latex: "\\propto", preview: "∝" },
      { label: "element of", latex: "\\in", preview: "∈" },
      { label: "not element", latex: "\\notin", preview: "∉" },
      { label: "subset", latex: "\\subset", preview: "⊂" },
      { label: "union", latex: "\\cup", preview: "∪" },
      { label: "intersection", latex: "\\cap", preview: "∩" },
      { label: "for all", latex: "\\forall", preview: "∀" },
      { label: "exists", latex: "\\exists", preview: "∃" },
    ],
  },
  {
    name: "Math Structures",
    symbols: [
      { label: "fraction", latex: "\\frac{a}{b}", preview: "a/b" },
      { label: "square root", latex: "\\sqrt{x}", preview: "√x" },
      { label: "nth root", latex: "\\sqrt[n]{x}", preview: "ⁿ√x" },
      { label: "superscript", latex: "x^{2}", preview: "x²" },
      { label: "subscript", latex: "x_{i}", preview: "xᵢ" },
      { label: "integral", latex: "\\int_{a}^{b} f(x)\\,dx", preview: "∫" },
      { label: "summation", latex: "\\sum_{i=1}^{n} x_i", preview: "∑" },
      { label: "product", latex: "\\prod_{i=1}^{n} x_i", preview: "∏" },
      { label: "limit", latex: "\\lim_{x \\to 0}", preview: "lim" },
      { label: "derivative", latex: "\\frac{df}{dx}", preview: "df/dx" },
      { label: "partial", latex: "\\frac{\\partial f}{\\partial x}", preview: "∂f/∂x" },
      { label: "parentheses", latex: "\\left( x \\right)", preview: "(x)" },
      { label: "brackets", latex: "\\left[ x \\right]", preview: "[x]" },
      { label: "curly braces", latex: "\\left\\{ x \\right\\}", preview: "{x}" },
      { label: "absolute value", latex: "|x|", preview: "|x|" },
      { label: "matrix 2x2", latex: "\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}", preview: "[matrix]" },
    ],
  },
  {
    name: "Arrows",
    symbols: [
      { label: "right arrow", latex: "\\rightarrow", preview: "→" },
      { label: "left arrow", latex: "\\leftarrow", preview: "←" },
      { label: "implies", latex: "\\implies", preview: "⇒" },
      { label: "iff", latex: "\\iff", preview: "⇔" },
      { label: "up arrow", latex: "\\uparrow", preview: "↑" },
      { label: "down arrow", latex: "\\downarrow", preview: "↓" },
    ],
  },
];
