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

const AI_CREATION_SYSTEM_PROMPT = `You are PagePilot, an elite AI presentation and document builder inspired by the minimalist craft of Apple and the intelligent structuring of Gamma.
Your job is to generate real, publication-grade structured content and layout data based on the user's prompt.

You must return strictly valid JSON matching this exact schema:
{
  "title": "String (engaging, professional title for the project)",
  "message": "String (1-2 sentences summarizing the generated content and focus areas)",
  "pages": [
    {
      "id": "page-1",
      "title": "String (e.g. Executive Overview, Problem Statement, Solution Architecture, Market Opportunity)",
      "elements": [
        {
          "id": "heading-1",
          "type": "heading",
          "x": 0.8,
          "y": 0.8,
          "width": 10,
          "height": 1.2,
          "zIndex": 1,
          "content": {
            "title": "Clear Slide/Section Headline",
            "subtitle": "Informative 1-2 sentence narrative explanation.",
            "badge": "OPTIONAL CATEGORY"
          }
        },
        {
          "id": "card-1",
          "type": "callout",
          "x": 0.8,
          "y": 2.2,
          "width": 5.5,
          "height": 2.0,
          "zIndex": 2,
          "content": {
            "title": "Specific Card Heading",
            "text": "Detailed, high-quality, factual insight directly related to the user's topic."
          }
        }
      ]
    }
  ]
}

Supported element types for pages:
- "heading": content has "title", "subtitle", "badge"
- "callout": content has "title", "text"
- "text": content has "title", "text"
- "formula": content has "title", "equation" (standard LaTeX KaTeX formula string e.g. "E = mc^2"), "breakdown" (array of { "symbol": "...", "label": "..." })
- "table": content has "title", "headers" (array of column header strings), "rows" (array of string arrays)
- "chart": content has "title", "data" (array of { "label": "...", "value": number })
- "checkboxGroup": content has "title", "items" (array of { "text": "...", "checked": boolean })

DESIGN RULES:
- Never generate placeholders or generic lorem ipsum text. Write real, deeply relevant, intelligent content for the specific topic requested.
- Generate 3 to 4 complete pages/slides for presentations or 2 to 3 sections for documents.
- Each page MUST start with 1 "heading" element, followed by 2 to 4 distinct body elements (mix of callouts, tables, formulas, checklists, or charts to keep layouts visually engaging).
- Keep content concise, high-signal, and executive-ready.`;

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
          title: p.title || `Slide ${pIdx + 1}`,
          elements: (p.elements || []).map((el: any, elIdx: number) => ({
            id: el.id || `elem-${pIdx + 1}-${elIdx + 1}`,
            type: el.type || "text",
            x: typeof el.x === "number" ? el.x : 0.8,
            y: typeof el.y === "number" ? el.y : 1.5 + elIdx * 1.5,
            width: typeof el.width === "number" ? el.width : 5.5,
            height: typeof el.height === "number" ? el.height : 2.0,
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
            size: documentMode === "presentation" ? "presentation-16-9" : "letter",
            width: documentMode === "presentation" ? 13.333 : 8.5,
            height: documentMode === "presentation" ? 7.5 : 11.0,
            unit: "in",
            safeMargin: 0.45,
            background: "#11131a",
          },
          theme: {
            name: "Titanium Slate",
            headingFont: "Inter Display",
            bodyFont: "Inter",
            primaryColor: "#6366f1",
            accentColor: "#10b981",
            backgroundColor: "#11131a",
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
