import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn("⚠️  GEMINI_API_KEY is not set. AI workflow generation will not work.");
} else {
  console.log("✅ GEMINI_API_KEY is configured");
}

const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

/**
 * Generates content using Gemini API
 */
export async function generateContent(prompt: string): Promise<string> {
  if (!ai) {
    throw new Error("Gemini API is not configured. Please set GEMINI_API_KEY environment variable.");
  }

  try {
    console.log("🤖 Calling Gemini API with prompt length:", prompt.length);
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: prompt,
    });

    console.log("✅ Gemini API response received");
    return response.text || "";
  } catch (error: any) {
    console.error("❌ Gemini API error:", error?.message || error);
    throw new Error(`Failed to generate content from Gemini API: ${error?.message || error}`);
  }
}

/**
 * Generates JSON workflow using Gemini API with structured output
 */
export async function generateWorkflowJSON(prompt: string): Promise<any> {
  if (!ai) {
    throw new Error("Gemini API is not configured. Please set GEMINI_API_KEY environment variable.");
  }

  try {
    console.log("🤖 Calling Gemini API for workflow generation");

    // Define the schema for structured output
    const responseSchema = {
      type: "object",
      properties: {
        workflow_name: { type: "string" },
        tasks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              description: { type: "string" },
              output: { type: "array", items: { type: "string" } },
              deadline: { type: ["string", "null"] },
              status: { type: "string", enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "DONE"] },
              assignee: {
                type: "object",
                properties: {
                  name: { type: ["string", "null"] },
                  email: { type: ["string", "null"] },
                  role: { type: ["string", "null"] },
                  status: { type: "string", enum: ["assigned", "unassigned"] },
                },
                required: ["name", "email", "role", "status"],
              },
              notes: { type: ["string", "null"] },
            },
            required: ["id", "name", "description", "output", "deadline", "status", "assignee", "notes"],
          },
        },
        flows: {
          type: "array",
          items: {
            type: "object",
            properties: {
              from: { type: "string" },
              to: { type: "string" },
              type: { type: "string" },
            },
            required: ["from", "to", "type"],
          },
        },
        checks: {
          type: "object",
          properties: {
            is_dag: { type: "boolean" },
            has_unassigned: { type: "boolean" },
            messages: { type: "array", items: { type: "string" } },
          },
          required: ["is_dag", "has_unassigned", "messages"],
        },
      },
      required: ["workflow_name", "tasks", "flows", "checks"],
    };

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const jsonText = response.text;
    console.log("📝 Received JSON response from Gemini");

    if (!jsonText) {
      throw new Error("Empty response from Gemini API");
    }

    const parsedWorkflow = JSON.parse(jsonText);
    console.log("✅ Successfully generated workflow:", parsedWorkflow.workflow_name);

    return parsedWorkflow;
  } catch (error: any) {
    console.error("❌ Gemini API error:", error?.message || error);
    throw new Error(`Failed to generate workflow JSON from Gemini API: ${error?.message || error}`);
  }
}

/**
 * Checks if Gemini API is available
 */
export function isGeminiAvailable(): boolean {
  return ai !== null;
}
