import { getAiResponse } from './geminiHelper';

export async function getAssistantResponse(userMessage: string, history: { role: 'user' | 'assistant'; content: string }[] = []): Promise<string> {
  try {
    const response = await getAiResponse(userMessage, history);
    return response;
  } catch (error: any) {
    console.error("Assistant Error:", error);
    return "Maazrat, abhi AI se rabta nahi ho pa raha. Barah-e-karam apni API key check karein.";
  }
}
