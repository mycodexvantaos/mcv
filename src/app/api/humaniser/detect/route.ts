import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-static";

/**
 * @fileoverview Humaniser Detection API Route
 *
 * POST /api/humaniser/detect
 * Accepts text input and returns AI content detection results.
 * Uses native detection by default, with optional LLM enhancement.
 */

export async function POST(request: NextRequest) {
  try {
    const body: { text?: string; source?: string; useLLM?: boolean } = await request.json();
    const { text, source = "text", useLLM = false } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Text input is required and must be a string" },
        { status: 400 }
      );
    }

    if (text.length > 100000) {
      return NextResponse.json(
        { error: "Text exceeds maximum length of 100,000 characters" },
        { status: 400 }
      );
    }

    // Dynamic import to avoid circular dependencies at module level
    const { HumaniserEngine } = await import("@mycodexvantaos/ai-humaniser");

    const engine = new HumaniserEngine({
      mode: useLLM ? "hybrid" : "native",
    });

    await engine.initialize();

    const result = await engine.detect(text, source);

    // If LLM enhancement is requested and API key is available
    if (useLLM && process.env.GEMINI_API_KEY) {
      try {
        const { humaniserDetectFlow } = await import("@/ai/flows/humaniser-detection-flow");
        const llmResult = await humaniserDetectFlow({
          text,
          nativeResult: {
            overallAiScore: result.aiScore,
            overallLabel: result.label,
          },
        });

        await engine.shutdown();

        // Merge LLM-enhanced results with native results
        return NextResponse.json({
          ...result,
          llmEnhanced: true,
          llmAnalysis: llmResult,
        });
      } catch {
        // LLM enhancement failed, return native results
        await engine.shutdown();
        return NextResponse.json({
          ...result,
          llmEnhanced: false,
          llmError: "LLM enhancement unavailable",
        });
      }
    }

    await engine.shutdown();

    return NextResponse.json({
      ...result,
      llmEnhanced: false,
    });
  } catch (error: any) {
    console.error("[Humaniser Detect API]", error);
    return NextResponse.json({ error: error.message || "Detection failed" }, { status: 500 });
  }
}
