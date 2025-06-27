import { httpAction } from "./_generated/server";
import { google } from "@ai-sdk/google";
import { streamText } from "ai";

// HTTP action for streaming AI chat
export const chat = httpAction(async (ctx, request) => {
  try {
    const { messages } = await request.json();
    
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Invalid messages format" }), {
        status: 400,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // Clean up message format - remove any extra properties that might cause issues
    const cleanMessages = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Initialize Google Generative AI with gemini-2.5-flash-preview-04-17 model
    const result = await streamText({
      model: google("gemini-2.5-flash-preview-04-17"),
      messages: cleanMessages,
      temperature: 0.7,
      maxTokens: 2000,
    });

    // Return the streaming response with exact headers from official guide
    return result.toDataStreamResponse({
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'none',
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  } catch (error) {
    console.error("AI chat error:", error);
    
    return new Response(JSON.stringify({ 
      error: "Failed to generate AI response",
      details: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});

// OPTIONS handler for CORS preflight
export const chatOptions = httpAction(async (ctx, request) => {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}); 