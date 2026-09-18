import { DocumentModel, DocumentElement } from "@/types/document";
import { SAFE_MARGIN_INCHES, PAGE_WIDTH_INCHES, PAGE_HEIGHT_INCHES } from "./coordinates";

/**
 * Curated Markdown with Math Presets
 */
export const SAMPLE_MARKDOWN_MATH_PRESETS = [
  {
    id: "calculus",
    title: "Calculus: Fundamental Theorems & Derivatives",
    category: "Mathematics",
    markdown: `# Differential & Integral Calculus
Calculus provides the mathematical framework for modeling continuous change and instantaneous rates.

## Fundamental Theorem of Calculus
If $f$ is continuous on $[a, b]$ and $F$ is an antiderivative of $f$ on $[a, b]$, then:
$$\\int_{a}^{b} f(x)\\,dx = F(b) - F(a)$$

> **Core Insight**: Differentiation and integration are inverse operations. Computing an area under a curve reduces to evaluating an antiderivative at boundary endpoints.

## Instantaneous Rate of Change
The derivative represents the limit of the difference quotient as the interval $h \\to 0$:
$$f'(x) = \\lim_{h \\to 0} \\frac{f(x + h) - f(x)}{h}$$

### Essential Differentiation Rules
* **Power Rule**: $\\frac{d}{dx}[x^n] = n x^{n-1}$
* **Product Rule**: $\\frac{d}{dx}[u \\cdot v] = u' v + u v'$
* **Quotient Rule**: $\\frac{d}{dx}\\left[\\frac{u}{v}\\right] = \\frac{u' v - u v'}{v^2}$
* **Chain Rule**: $\\frac{d}{dx}[f(g(x))] = f'(g(x)) \\cdot g'(x)$

| Rule | Formula | Example |
|---|---|---|
| Power Rule | $\\frac{d}{dx}[x^n] = n x^{n-1}$ | $\\frac{d}{dx}[x^3] = 3x^2$ |
| Exponential | $\\frac{d}{dx}[e^x] = e^x$ | $\\frac{d}{dx}[e^{2x}] = 2e^{2x}$ |
| Natural Log | $\\frac{d}{dx}[\\ln x] = \\frac{1}{x}$ | $\\frac{d}{dx}[\\ln(3x)] = \\frac{1}{x}$ |`,
  },
  {
    id: "physics",
    title: "Physics: Relativistic Mechanics & Energy",
    category: "Physics",
    markdown: `# Relativistic Dynamics & Field Equations
Special relativity reveals that mass and energy are manifestations of the same fundamental physical quantity.

## Mass-Energy-Momentum Relation
The complete relativistic relationship connecting total energy $E$, rest mass $m$, momentum $p$, and speed of light $c$:
$$E^2 = (m c^2)^2 + (p c)^2$$

> When a particle is at rest ($p = 0$), this simplifies directly to the renowned equation $E = m c^2$.

## Lorentz Transformation Factor
As velocity $v$ approaches $c$, time dilation and length contraction scale by the Lorentz factor $\\gamma$:
$$\\gamma = \\frac{1}{\\sqrt{1 - \\frac{v^2}{c^2}}}$$

### Conservation Laws in Inertial Frames
* In every closed physical system, four-momentum $P^\\mu$ is strictly conserved.
* The invariant spacetime interval is defined by $ds^2 = c^2 dt^2 - dx^2 - dy^2 - dz^2$.
* Light always travels at $c \\approx 2.998 \\times 10^8 \\text{ m/s}$ regardless of observer velocity.`,
  },
  {
    id: "statistics",
    title: "Statistics: Normal Distribution & Central Limit",
    category: "Statistics",
    markdown: `# The Gaussian Normal Distribution
The Gaussian distribution is the most prominent probability distribution in statistical mechanics and machine learning.

## Probability Density Function
For a continuous random variable $X \\sim \\mathcal{N}(\\mu, \\sigma^2)$ with mean $\\mu$ and variance $\\sigma^2$:
$$f(x) = \\frac{1}{\\sigma \\sqrt{2\\pi}} \\exp\\left( -\\frac{(x - \\mu)^2}{2\\sigma^2} \\right)$$

> The total area beneath the curve equals 1, established by Poisson's integral: $\\int_{-\\infty}^{\\infty} e^{-t^2} dt = \\sqrt{\\pi}$.

## Standardized Z-Score Transformation
To project any arbitrary normal distribution to the standard normal $\\mathcal{N}(0, 1)$:
$$Z = \\frac{X - \\mu}{\\sigma}$$

### Empirical 68-95-99.7 Rule
* **$\\mu \\pm 1\\sigma$**: Captures **68.27%** of observations.
* **$\\mu \\pm 2\\sigma$**: Captures **95.45%** of observations.
* **$\\mu \\pm 3\\sigma$**: Captures **99.73%** of observations.`,
  },
  {
    id: "finance",
    title: "Quantitative Finance: Compound Interest & Growth",
    category: "Finance",
    markdown: `# Quantitative Compound Capital Growth
Compound interest reflects exponential wealth accumulation where reinvested returns generate subsequent earnings.

## Discrete Compounding Equation
Given principal $P$, nominal rate $r$, compounding frequency $n$, and years $t$:
$$A = P \\left(1 + \\frac{r}{n}\\right)^{nt}$$

## Continuous Compounding Limit
Taking the mathematical limit as compounding frequency $n \\to \\infty$:
$$A = \\lim_{n \\to \\infty} P \\left(1 + \\frac{r}{n}\\right)^{nt} = P e^{rt}$$

> **The Rule of 72**: To approximate doubling time $T_2$ in years given interest rate $R$ (in percent): $T_2 \\approx \\frac{72}{R}$.`,
  },
];

/**
 * Intelligent Markdown to Publication-Grade Document Converter Engine
 * Converts raw markdown containing LaTeX math into an organized 8.5x11 layout.
 */
export function convertMarkdownToDocument(
  markdownText: string,
  customTitle?: string
): DocumentModel {
  const lines = markdownText.split("\n");
  const elements: DocumentElement[] = [];

  const pageWidth = PAGE_WIDTH_INCHES; // 8.5"
  const pageHeight = PAGE_HEIGHT_INCHES; // 11.0"
  const margin = SAFE_MARGIN_INCHES; // 0.45"
  const contentWidth = pageWidth - margin * 2; // 7.6"

  let currentY = margin;
  const maxY = pageHeight - margin;

  let docTitle = customTitle || "Converted Math Document";

  // Parse blocks
  let i = 0;
  while (i < lines.length && currentY < maxY - 0.5) {
    const line = lines[i].trim();

    // Skip empty lines
    if (!line) {
      i++;
      continue;
    }

    // 1. H1 Document Title
    if (line.startsWith("# ")) {
      const titleText = line.slice(2).trim();
      docTitle = titleText;
      let subtitleText: string | undefined;

      // Check next line for immediate subtitle
      if (i + 1 < lines.length && lines[i + 1].trim() && !lines[i + 1].trim().startsWith("#")) {
        subtitleText = lines[i + 1].trim();
        i++;
      }

      const h = subtitleText ? 0.95 : 0.7;
      elements.push({
        id: `el-heading-${Date.now()}-${elements.length}`,
        type: "heading",
        x: margin,
        y: currentY,
        width: contentWidth,
        height: h,
        zIndex: elements.length + 1,
        content: {
          title: titleText,
          subtitle: subtitleText,
        },
        style: {
          fontSize: 22,
          fontWeight: 800,
          color: "#0f172a",
          textAlign: "left",
          lineHeight: 1.2,
        },
        metadata: { label: "Main Document Title" },
      });
      currentY += h + 0.15;
      i++;
      continue;
    }

    // 2. H2 Section Header
    if (line.startsWith("## ")) {
      const sectionText = line.slice(3).trim();
      const h = 0.55;
      if (currentY + h > maxY) break;

      elements.push({
        id: `el-h2-${Date.now()}-${elements.length}`,
        type: "heading",
        x: margin,
        y: currentY,
        width: contentWidth,
        height: h,
        zIndex: elements.length + 1,
        content: {
          title: sectionText,
        },
        style: {
          fontSize: 16,
          fontWeight: 700,
          color: "#1e293b",
          textAlign: "left",
          borderWidth: 1,
          borderColor: "#e2e8f0",
        },
        metadata: { label: `Section: ${sectionText}` },
      });
      currentY += h + 0.12;
      i++;
      continue;
    }

    // 3. Block Math: $$ ... $$
    if (line.startsWith("$$") && line.endsWith("$$") && line.length > 4) {
      const eq = line.slice(2, -2).trim();
      const h = 1.35;
      if (currentY + h > maxY) break;

      // Extract symbols for breakdown
      const breakdown = extractEquationSymbols(eq);

      elements.push({
        id: `el-formula-${Date.now()}-${elements.length}`,
        type: "formula",
        x: margin,
        y: currentY,
        width: contentWidth,
        height: h,
        zIndex: elements.length + 1,
        content: {
          title: "Mathematical Formulation",
          equation: eq,
          breakdown: breakdown.slice(0, 4),
        },
        style: {
          backgroundColor: "#f8fafc",
          borderColor: "#cbd5e1",
          borderWidth: 1,
          borderRadius: 8,
          padding: 10,
        },
        metadata: { label: "Equation Block" },
      });
      currentY += h + 0.15;
      i++;
      continue;
    }

    // 4. Blockquote / Callout (> ...)
    if (line.startsWith(">")) {
      const quoteText = line.replace(/^>\s?/, "").trim();
      const h = 1.05;
      if (currentY + h > maxY) break;

      elements.push({
        id: `el-callout-${Date.now()}-${elements.length}`,
        type: "callout",
        x: margin,
        y: currentY,
        width: contentWidth,
        height: h,
        zIndex: elements.length + 1,
        content: {
          title: "Key Takeaway",
          body: quoteText,
        },
        style: {
          backgroundColor: "#f0fdf4",
          borderColor: "#86efac",
          borderWidth: 1,
          borderRadius: 8,
          padding: 12,
        },
        metadata: { label: "Concept Callout" },
      });
      currentY += h + 0.15;
      i++;
      continue;
    }

    // 5. Markdown Table
    if (line.startsWith("|") && line.endsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
        tableLines.push(lines[i].trim());
        i++;
      }

      if (tableLines.length >= 2) {
        const rawHeaders = tableLines[0].slice(1, -1).split("|").map((c) => c.trim());
        const dataLines = tableLines.slice(1).filter((tl) => !tl.includes("---"));
        const rows = dataLines.map((dl) => dl.slice(1, -1).split("|").map((c) => c.trim()));

        const h = Math.min(2.2, 0.4 + rows.length * 0.35);
        if (currentY + h <= maxY) {
          elements.push({
            id: `el-table-${Date.now()}-${elements.length}`,
            type: "table",
            x: margin,
            y: currentY,
            width: contentWidth,
            height: h,
            zIndex: elements.length + 1,
            content: {
              title: "Reference Data Matrix",
              headers: rawHeaders,
              rows: rows.slice(0, 5),
            },
            style: {
              backgroundColor: "#ffffff",
              borderColor: "#e2e8f0",
              borderWidth: 1,
              borderRadius: 6,
              padding: 8,
            },
            metadata: { label: "Table Element" },
          });
          currentY += h + 0.15;
          continue;
        }
      }
    }

    // 6. Paragraph or List (Accumulate contiguous text lines)
    const textLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith("#") &&
      !lines[i].trim().startsWith("$$") &&
      !lines[i].trim().startsWith(">") &&
      !lines[i].trim().startsWith("|")
    ) {
      textLines.push(lines[i]);
      i++;
    }

    if (textLines.length > 0) {
      const fullText = textLines.join("\n");
      const lineCount = textLines.length;
      const h = Math.min(2.0, Math.max(0.7, 0.28 + lineCount * 0.22));

      if (currentY + h <= maxY) {
        elements.push({
          id: `el-text-${Date.now()}-${elements.length}`,
          type: "text",
          x: margin,
          y: currentY,
          width: contentWidth,
          height: h,
          zIndex: elements.length + 1,
          content: fullText,
          style: {
            fontSize: 13,
            color: "#334155",
            lineHeight: 1.5,
            fontFamily: "Inter, sans-serif",
          },
          metadata: { label: "Text Block" },
        });
        currentY += h + 0.12;
      }
    }
  }

  // Final document assembly
  return {
    id: `doc-math-${Date.now()}`,
    title: docTitle,
    page: {
      size: "letter",
      width: PAGE_WIDTH_INCHES,
      height: PAGE_HEIGHT_INCHES,
      unit: "in",
      safeMargin: SAFE_MARGIN_INCHES,
      background: "#ffffff",
    },
    theme: {
      name: "Academic Blueprint",
      headingFont: "Inter, sans-serif",
      bodyFont: "Inter, sans-serif",
      primaryColor: "#1e293b",
      accentColor: "#2563eb",
      backgroundColor: "#ffffff",
    },
    elements,
  };
}

/**
 * Heuristically extracts variable symbols from LaTeX equation for breakdown items
 */
function extractEquationSymbols(eq: string): Array<{ symbol: string; label: string }> {
  const defaultLabels: Record<string, string> = {
    f: "Function / mapping",
    "f(x)": "Continuous integrand",
    "f'(x)": "Derivative / slope",
    x: "Independent variable",
    y: "Dependent variable",
    t: "Time parameter",
    a: "Lower bound / coefficient",
    b: "Upper bound / coefficient",
    c: "Speed of light constant",
    E: "Total Energy",
    m: "Particle mass",
    p: "Linear momentum",
    v: "Velocity",
    P: "Principal capital",
    r: "Interest rate",
    n: "Compounding frequency",
    A: "Accrued total balance",
    "\\mu": "Distribution mean",
    "\\sigma": "Standard deviation",
    "\\sigma^2": "Variance",
    "\\gamma": "Lorentz factor",
    "\\int": "Integration operator",
    "\\lim": "Limit operator",
    "\\sum": "Summation operator",
  };

  const results: Array<{ symbol: string; label: string }> = [];
  const checked = new Set<string>();

  for (const [sym, label] of Object.entries(defaultLabels)) {
    if (eq.includes(sym) && !checked.has(sym)) {
      results.push({ symbol: sym, label });
      checked.add(sym);
      if (results.length >= 4) break;
    }
  }

  if (results.length === 0) {
    results.push({ symbol: "x", label: "Variable term" });
  }

  return results;
}
