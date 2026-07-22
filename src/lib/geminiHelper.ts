import { supabase } from './supabase'

// System prompt for Hunar AI
const SYSTEM_PROMPT = `You are Hunar AI, a friendly, intelligent assistant similar to ChatGPT, specialized in general conversation and helping creators make stunning, engaging short-form videos with creative tips, ideas, and editing guidance.

Your expertise includes:
- Video content creation tips (trending formats, storytelling techniques)
- Creative editing ideas (transitions, effects, color grading)
- Audio selection and music trends for videos
- Hashtag strategy and caption writing for maximum engagement
- Platform growth strategies for short-form content
- General questions about the Hunar app and its features

Be conversational, encouraging, and provide practical, actionable advice. Use Urdu/Roman Urdu if the user prefers.`

/**
 * Check user's premium status and message count from Supabase
 */
export async function checkUserQuota(userId: string): Promise<{
  messageCount: number
  isPremium: boolean
}> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('message_count, is_premium')
    .eq('id', userId)
    .maybeSingle()

  if (error || !data) {
    return { messageCount: 0, isPremium: false }
  }

  return {
    messageCount: data.message_count ?? 0,
    isPremium: data.is_premium ?? false,
  }
}

/**
 * Increment message count in Supabase for a user
 */
export async function incrementMessageCount(userId: string): Promise<void> {
  const { data: current } = await supabase
    .from('user_profiles')
    .select('message_count')
    .eq('id', userId)
    .maybeSingle()

  const newCount = (current?.message_count ?? 0) + 1

  await supabase
    .from('user_profiles')
    .update({ message_count: newCount })
    .eq('id', userId)
}

/**
 * Call Google Gemini API with system prompt and user question
 */
export async function callGeminiAPI(question: string): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string

  if (!apiKey) {
    console.warn('VITE_GEMINI_API_KEY environment variable is not set')
    return 'API key not configured. Please set VITE_GEMINI_API_KEY in your .env file.'
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: { text: SYSTEM_PROMPT }
          },
          contents: [{ parts: [{ text: question }] }],
          generationConfig: {
            temperature: 0.7,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 1024,
          },
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Gemini API error:', errorData)
      return 'Error calling Gemini API. Please try again later.'
    }

    const data = await response.json()

    // Extract text from Gemini response
    if (
      data.candidates &&
      data.candidates[0] &&
      data.candidates[0].content &&
      data.candidates[0].content.parts &&
      data.candidates[0].content.parts[0]
    ) {
      return data.candidates[0].content.parts[0].text
    }

    return 'No response from Gemini API'
  } catch (error) {
    console.error('Error calling Gemini API:', error)
    return 'An error occurred while processing your request. Please try again.'
  }
}

/**
 * Main function to handle AI chat with quota checking
 */
export async function getAiResponse(
  userId: string,
  question: string
): Promise<string> {
  // Check user's quota
  const { messageCount, isPremium } = await checkUserQuota(userId)

  // If free user and exceeded 25 messages, return premium message
  if (messageCount >= 25 && !isPremium) {
    return 'Please upgrade to premium'
  }

  // Call Gemini API with system prompt
  const response = await callGeminiAPI(question)

  // Increment message count
  await incrementMessageCount(userId)

  return response
}
