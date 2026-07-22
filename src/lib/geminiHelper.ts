import { supabase } from './supabase';

const SYSTEM_PROMPT = `You are Hunar AI, a friendly, intelligent assistant similar to ChatGPT, specialized in general conversation and helping creators make stunning, engaging short-form videos.`;

export async function getAiResponse(userMessage: string, history: { role: 'user' | 'assistant'; content: string }[] = []): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Gemini API key is missing. Please check your Vercel environment variables.");
  }

  // Format history for Gemini API
  const contents = history.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  // Add current user message
  contents.push({
    role: 'user',
    parts: [{ text: userMessage }]
  });

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: SYSTEM_PROMPT }]
      },
      contents: contents,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || "Error calling Gemini API.");
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("No response received from Gemini.");
  }

  return text;
}
