/**
 * @fileOverview AI flow for Month 3: Global Pulse Sensing & Autonomous Task Generation.
 * Sensing global data streams, detecting anomalies, and self-generating tasks.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";

const PulseSensingInputSchema = z.object({
  region: z.string().optional().describe("Geographic or digital region to focus sensing."),
  dataStreams: z
    .array(z.string())
    .describe("List of data streams to ingest (Financial, Tech, Social, Geopolitical)."),
});

const AnomalySchema = z.object({
  source: z.string().describe("Source of the anomaly (e.g., Twitter, GitHub, Bloomberg)."),
  anomaly_score: z.number().describe("Score between 0 and 1, where 0 is extreme anomaly."),
  description: z.string().describe("Detailed description of the pulse shift."),
  suggestedAction: z.string().describe("Initial organic response strategy."),
});

const PulseSensingOutputSchema = z.object({
  globalSentiment: z.string().describe("Overall assessment of global network stability."),
  detectedAnomalies: z.array(AnomalySchema),
  emergentGoals: z
    .array(
      z.object({
        task_id: z.string(),
        description: z.string(),
        expertise_required: z.string(),
        priority: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
      })
    )
    .describe("Autonomous tasks generated in response to the environment."),
});

export type PulseSensingInput = z.infer<typeof PulseSensingInputSchema>;
export type PulseSensingOutput = z.infer<typeof PulseSensingOutputSchema>;

export async function senseGlobalPulse(input: PulseSensingInput): Promise<PulseSensingOutput> {
  const { output } = await ai.generate({
    output: { schema: PulseSensingOutputSchema },
    prompt: `You are the Global Pulse Monitor (Month 3 Protocol). 
    Your goal is to detect foundational instabilities in the provided data streams.
    
    1. Analyze the streams and assign an Anomaly Score (0.0 to 1.0, lower is more anomalous).
    2. If Score < 0.3, trigger an Autonomous Investigation Task.
    3. Generate Emergent Goals that the network should independently pursue.

    Streams: ${input.dataStreams.map((s) => "- " + s).join("\n")}
    Region: ${input.region ?? "Global"}`,
  });
  return output!;
}
