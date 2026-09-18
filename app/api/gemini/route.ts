import { NextRequest, NextResponse } from "next/server";
import { callGeminiWithFallback } from "@/lib/gemini";
import { DocumentModel, DocumentElement, DocumentMode, PageData } from "@/types/document";

export const dynamic = "force-dynamic";

function cleanJson(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/i, "").replace(/\s*```$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  return cleaned;
}

const AI_CREATION_SYSTEM_PROMPT = `You are PagePilot, an elite hybrid document and presentation AI builder.
You combine the flexibility and continuous flow of a Google Docs-style document editor with the high aesthetic craft of an AI presentation tool.
All pages are strictly formatted for standard US Letter (8.5 inches wide by 11 inches tall, portrait orientation).

You must return strictly valid JSON matching this exact schema:
{
  "title": "String (engaging, professional title for the project)",
  "message": "String (1-2 sentences summarizing the generated content and structure)",
  "pages": [
    {
      "id": "page-1",
      "title": "String (e.g. Executive Summary, Technical Architecture, Empirical Results)",
      "elements": [
        {
          "id": "heading-1",
          "type": "heading",
          "layoutMode": "flow",
          "x": 0.65,
          "y": 0.65,
          "width": 7.2,
          "height": 1.0,
          "zIndex": 1,
          "content": {
            "title": "Clear Section Headline",
            "subtitle": "Informative 1-2 sentence narrative context.",
            "badge": "OPTIONAL CATEGORY"
          }
        },
        {
          "id": "card-1",
          "type": "callout",
          "layoutMode": "flow",
          "x": 0.65,
          "y": 1.8,
          "width": 7.2,
          "height": 1.5,
          "zIndex": 2,
          "content": {
            "title": "Key Insight Callout",
            "text": "Detailed, high-quality, factual content directly tailored to the topic."
          }
        }
      ]
    }
  ]
}

Supported element types:
- "heading": content has "title", "subtitle", "badge". layoutMode: "flow"
- "callout": content has "title", "text" or "body". layoutMode: "flow" or "canvas"
- "text": content has "title", "text". layoutMode: "flow"
- "formula": content has "title", "equation" (valid KaTeX LaTeX math string e.g. "A = P(1 + r/n)^{nt}"), "breakdown" (array of { "symbol": "...", "label": "..." }). layoutMode: "flow" or "canvas"
- "table": content has "title", "headers" (array of strings), "rows" (2D array of string cells). layoutMode: "flow"
- "chart": content has "title", "series" (array of { name, color, values: number[] }), "labels" (array of strings). layoutMode: "flow" or "canvas"
- "checkboxGroup": content has "title", "items" (array of { "text": string, "checked": boolean }). layoutMode: "flow"
- "writingLines": content has "title", "promptText", "lineCount" (number). layoutMode: "flow"

PAGE DIMENSIONS & MARGIN CONSTRAINTS:
- Page Width: 8.5 inches
- Page Height: 11.0 inches (US Letter Portrait)
- Safe Margins: 0.65 inches (leaving 7.2 inches of printable content width: 8.5 - 2*0.65 = 7.2)
- Flow elements must have width: 7.2 and x: 0.65.
- Canvas visual blocks can be side-by-side (e.g. two 3.5-inch cards with x: 0.65 and x: 4.35).
- Content on any single page must fit within 11 inches height. Distribute across 2 to 4 pages if needed.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      prompt,
      actionType,
      documentMode = "presentation",
      documentState,
      selectedElementId,
      activePageIndex = 0,
    } = body;

    const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error: "AI_API_KEY or GEMINI_API_KEY environment variable is not configured on the server.",
        },
        { status: 500 }
      );
    }

    // 1. PRIMARY FLOW: Create from natural language prompt
    if (actionType === "create_from_prompt" || (!actionType && prompt)) {
      const modeInstruction =
        documentMode === "presentation"
          ? "Create a 16:9 widescreen presentation deck (3-4 slides). Each slide represents a slide in a deck."
          : "Create an 8.5x11 publication document (2-3 structured sections).";

      const promptContents = `Format: ${documentMode.toUpperCase()}\n${modeInstruction}\n\nUSER TOPIC & INSTRUCTIONS:\n"${prompt}"\n\nGenerate the complete structured JSON with all pages and elements now.`;

      const rawJson = await callGeminiWithFallback({
        contents: promptContents,
        systemInstruction: AI_CREATION_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        temperature: 0.25,
      });

      const parsed = JSON.parse(cleanJson(rawJson));

      if (parsed.pages && Array.isArray(parsed.pages) && parsed.pages.length > 0) {
        // Ensure each page and element has valid layout IDs and default styling
        const sanitizedPages: PageData[] = parsed.pages.map((p: any, pIdx: number) => ({
          id: p.id || `page-${pIdx + 1}`,
          title: p.title || `Section ${pIdx + 1}`,
          elements: (p.elements || []).map((el: any, elIdx: number) => ({
            id: el.id || `elem-${pIdx + 1}-${elIdx + 1}`,
            type: el.type || "text",
            layoutMode: el.layoutMode || (el.width && el.width < 6.0 ? "canvas" : "flow"),
            x: typeof el.x === "number" ? el.x : 0.65,
            y: typeof el.y === "number" ? el.y : 0.65 + elIdx * 1.8,
            width: typeof el.width === "number" ? Math.min(el.width, 7.2) : 7.2,
            height: typeof el.height === "number" ? el.height : 1.8,
            zIndex: el.zIndex || elIdx + 1,
            content: el.content || {},
            style: el.style || {},
            metadata: el.metadata || {},
          })),
        }));

        const newDocument: DocumentModel = {
          id: `doc-${Date.now()}`,
          title: parsed.title || prompt.slice(0, 45),
          mode: documentMode,
          pages: sanitizedPages,
          elements: sanitizedPages[0]?.elements || [],
          page: {
            size: "letter",
            width: 8.5,
            height: 11.0,
            unit: "in",
            safeMargin: 0.65,
            background: "#ffffff",
          },
          theme: {
            name: "Editorial Serif",
            headingFont: "Playfair Display",
            bodyFont: "Inter",
            primaryColor: "#0f172a",
            accentColor: "#3b82f6",
            backgroundColor: "#ffffff",
          },
        };

        return NextResponse.json({
          message: parsed.message || `Generated ${sanitizedPages.length} slides for "${prompt}".`,
          document: newDocument,
        });
      }

      throw new Error("Invalid format received from AI model.");
    }

    // 2. CONVERSATIONAL / CONTEXTUAL AI PROMPT (Prompt bar commands, refinements)
    if (documentState) {
      const activeDoc: DocumentModel = documentState;
      const currentPage =
        activeDoc.pages?.[activePageIndex] || activeDoc.pages?.[0];

      const commandInstruction = `You are PagePilot. The user wants to modify an existing ${documentMode} in real-time.
Current Document Title: "${activeDoc.title}"
Active Page: "${currentPage?.title}"
Elements on Active Page: ${JSON.stringify(currentPage?.elements || [], null, 2)}
Selected Element ID: ${selectedElementId || "none"}

USER COMMAND: "${prompt}"

Return strictly valid JSON with:
{
  "message": "1-sentence summary of modifications applied",
  "updatedPage": {
    "id": "${currentPage?.id || "page-1"}",
    "title": "Page title",
    "elements": [ ...full updated list of elements for this page... ]
  }
}
Keep the structure intact, applying the user's specific request (e.g. rewrite concisely, add a comparison table, adjust tone, add a new element, etc.).`;

      const rawJson = await callGeminiWithFallback({
        contents: commandInstruction,
        systemInstruction: AI_CREATION_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        temperature: 0.2,
      });

      const parsed = JSON.parse(cleanJson(rawJson));

      if (parsed.updatedPage && Array.isArray(parsed.updatedPage.elements)) {
        const updatedPages = [...(activeDoc.pages || [])];
        const pageId = parsed.updatedPage.id || currentPage?.id || `page-${activePageIndex + 1}`;
        const pageTitle = parsed.updatedPage.title || currentPage?.title || `Slide ${activePageIndex + 1}`;
        updatedPages[activePageIndex] = {
          id: pageId,
          title: pageTitle,
          elements: parsed.updatedPage.elements,
        };

        return NextResponse.json({
          message: parsed.message || `Updated active page.`,
          document: {
            ...activeDoc,
            pages: updatedPages,
            elements: updatedPages[activePageIndex].elements,
          },
        });
      }
    }

    return NextResponse.json({ error: "No action performed" }, { status: 400 });
  } catch (error: any) {
    console.error("AI Generation Endpoint Error:", error);
    return NextResponse.json(
      {
        error: error?.message || "Failed to communicate with AI generation endpoint.",
      },
      { status: 500 }
    );
  }
}
