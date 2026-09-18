# PagePilot — AI Visual Document Authoring System

PagePilot is an AI-powered visual document authoring application. Users describe any page they need, and Gemini creates, reasons through, calculates, and lays out polished, editable, and printable documents on an 8.5 x 11 inch paper canvas.

## Features

- **8.5 x 11 Inch Precision Canvas**: Print-accurate canvas with a 0.45" safe-margin boundary and snap-to-grid alignment.
- **Dual Representation Model**: Clear separation between semantic document structure and rendered layout geometry.
- **Multi-Element Support**: Headings, formulas with variable breakdowns, charts, cycle diagrams, callout blocks, ruled handwriting practice lines, and sketchpads.
- **Official Google GenAI SDK (`@google/genai`)**: Secure server-side route execution with configurable models (`GEMINI_MODEL`).
- **Signature Progressive Construction Animation**: Bottom-to-top unmasking with SVG stroke uncurling and quality check sweeps.
- **Automated Quality Control**: Deterministic collision checking, margin overflow validation, and readability auditing.
- **Native Browser Print Engine**: Custom `@media print` CSS isolating the 8.5x11 inch page without editor chrome.
- **Classroom Black & White Safe Mode**: High-contrast, photocopy-friendly rendering toggle.

---

## Quickstart & Installation

### 1. Clone & Install Dependencies

```bash
npm install