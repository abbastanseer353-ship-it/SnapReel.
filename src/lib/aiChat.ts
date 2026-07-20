import { supabase } from './supabase'

export interface AiMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

interface AiRow {
  id: string
  role: string
  content: string
  created_at: string
}

function localKey(userId: string): string {
  return `hunar_ai_chat_${userId}`
}

function readLocal(userId: string): AiMessage[] {
  try {
    const raw = localStorage.getItem(localKey(userId))
    return raw ? (JSON.parse(raw) as AiMessage[]) : []
  } catch {
    return []
  }
}

function writeLocal(userId: string, messages: AiMessage[]): void {
  try {
    localStorage.setItem(localKey(userId), JSON.stringify(messages.slice(-100)))
  } catch {
    // storage full / disabled — ignore, chat still works in memory
  }
}

/**
 * Loads AI chat history. Prefers Supabase (cloud sync across devices) and
 * falls back to localStorage when the ai_messages table isn't provisioned.
 */
export async function loadAiChat(userId: string): Promise<AiMessage[]> {
  const { data, error } = await supabase
    .from('ai_messages')
    .select('id, role, content, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) return readLocal(userId)

  return ((data as AiRow[]) ?? []).map((r) => ({
    id: r.id,
    role: r.role === 'assistant' ? 'assistant' : 'user',
    content: r.content,
    created_at: r.created_at,
  }))
}

/** Persists one message. Uses Supabase when available, else localStorage. */
export async function appendAiMessage(
  userId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<AiMessage> {
  const { data, error } = await supabase
    .from('ai_messages')
    .insert({ user_id: userId, role, content })
    .select('id, role, content, created_at')
    .single()

  if (!error && data) {
    const row = data as AiRow
    return {
      id: row.id,
      role: row.role === 'assistant' ? 'assistant' : 'user',
      content: row.content,
      created_at: row.created_at,
    }
  }

  const msg: AiMessage = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    created_at: new Date().toISOString(),
  }
  const all = [...readLocal(userId), msg]
  writeLocal(userId, all)
  return msg
}

export async function clearAiChat(userId: string): Promise<void> {
  await supabase.from('ai_messages').delete().eq('user_id', userId)
  try {
    localStorage.removeItem(localKey(userId))
  } catch {
    // ignore
  }
}
