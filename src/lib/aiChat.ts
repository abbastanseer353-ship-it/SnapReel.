import { supabase } from './supabase';

export interface AiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

export async function loadAiChat(userId: string): Promise<AiMessage[]> {
  try {
    const { data, error } = await supabase
      .from('ai_messages')
      .select('id, role, content, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading AI chat:', error.message);
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

export async function appendAiMessage(userId: string, role: 'user' | 'assistant', content: string): Promise<AiMessage[]> {
  try {
    const { error } = await supabase
      .from('ai_messages')
      .insert([
        { user_id: userId, role, content }
      ]);

    if (error) {
      console.error('Error saving AI message:', error.message);
      return appendLocalFallback(userId, role, content);
    }

    return await loadAiChat(userId);
  } catch (err) {
    console.error('Exception saving AI message:', err);
    return appendLocalFallback(userId, role, content);
  }
}

export async function clearAiChat(userId: string): Promise<void> {
  try {
    await supabase
      .from('ai_messages')
      .delete()
      .eq('user_id', userId);
  } catch (err) {
    console.error('Exception clearing AI chat:', err);
  }
  
  try {
    localStorage.removeItem(`snapreel_ai_chat_${userId}`);
  } catch (e) {
    // ignore
  }
}

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
