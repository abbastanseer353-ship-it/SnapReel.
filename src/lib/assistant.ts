import { getAiResponse } from './geminiHelper';

export const suggestedQuestions = [
  "How to get more views?",
  "Best time to post?",
  "Video editing tips"
];

export async function getAssistantResponse(userMessage: string, history: any[] = []) {
  try {
    const response = await getAiResponse(userMessage, history);
    return response;
  } catch (error) {
    console.error("Assistant Error:", error);
    return "Maazrat, abhi AI se rabta nahi ho pa raha. Barah-e-karam apni API key check karein.";
  }
}
