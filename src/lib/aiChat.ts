import { supabase } from './supabase';

export interface AiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

// Load chat history from Supabase database
export async function loadAiChat(userId: string): Promise<AiMessage[]> {
  try {
    const { data, error } = await supabase
      .from('ai_messages')
      .select('id, role, content, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading AI chat from Supabase:', error.message);
      return loadLocalFallback(userId);
    }

    if (data && data.length > 0) {
      return data.map(item => ({
        id: item.id,
        role: item.role as 'user' | 'assistant',
        content: item.content,
        created_at: item.created_at,
      }));
    }

    return [];
  } catch (err) {
    console.error('Exception loading AI chat:', err);
    return loadLocalFallback(userId);
  }
}

// Append/Save new message to Supabase database
export async function appendAiMessage(userId: string, role: 'user' | 'assistant', content: string): Promise<AiMessage[]> {
  try {
    const { data, error } = await supabase
      .from('ai_messages')
      .insert([
        { user_id: userId, role, content }
      ])
      .select('id, role, content, created_at');

    if (error) {
      console.error('Error saving AI message to Supabase:', error.message);
      return appendLocalFallback(userId, role, content);
    }

    // Reload full history after successful insert
    return await loadAiChat(userId);
  } catch (err) {
    console.error('Exception saving AI message:', err);
    return appendLocalFallback(userId, role, content);
  }
}

// Clear chat history for user
export async function clearAiChat(userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('ai_messages')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error clearing chat from Supabase:', error.message);
    }
  } catch (err) {
    console.error('Exception clearing AI chat:', err);
  }
  
  // Also clear local storage fallback
  try {
    localStorage.removeItem(`snapreel_ai_chat_${userId}`);
  } catch (e) {
    // ignore
  }
}

// Fallback methods using localStorage in case Supabase is unreachable
function getLocalKey(userId: string): string {
  return `snapreel_ai_chat_${userId}`;
}

function loadLocalFallback(userId: string): AiMessage[] {
  try {
    const raw = localStorage.getItem(getLocalKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function appendLocalFallback(userId: string, role: 'user' | 'assistant', content: string): AiMessage[] {
  try {
    const history = loadLocalFallback(userId);
    const newMessage: AiMessage = {
      id: Math.random().toString(36).substring(2, 9),
      role,
      content,
      created_at: new Date().toISOString()
    };
    history.push(newMessage);
    localStorage.setItem(getLocalKey(userId), JSON.stringify(history));
    return history;
  } catch (e) {
    return [];
  }
}
