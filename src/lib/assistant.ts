import { getAiResponse } from './geminiHelper';

export interface AssistantTopic {
  id: string;
  keywords: string[];
  answer: string;
}

// Predefined quick topics/answers for fast fallback or common questions
export const suggestedQuestions = [
  "How to create trending short videos?",
  "What filters work best for reels?",
  "How to grow my followers?",
  "Best audio and music tips"
];

export async function getAssistantResponse(userMessage: string): Promise<string> {
  try {
    const reply = await getAiResponse(userMessage, []);
    return reply;
  } catch (error: any) {
    console.error("Assistant response error:", error);
    return "Maaf kijiye, abhi AI se rabta nahi ho pa raha. Baraye meharbani thodi der baad koshish karein.";
  }
}

export async function getVideoEditingAdvice(userMessage: string): Promise<string> {
  try {
    const videoPrompt = `You are an expert video editing AI assistant for a short-video app like TikTok/Reels. Give short, punchy, professional advice about video editing, templates, transitions, and effects for this query: ${userMessage}`;
    const reply = await getAiResponse(videoPrompt, []);
    return reply;
  } catch (error: any) {
    console.error("Video editing AI error:", error);
    return "Video editing ke liye trendy transition aur upbeat music use karein!";
  }
}
