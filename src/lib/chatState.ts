import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { useAuth } from '../context/AuthContext'
import type { Message } from './types'

const SEEN_EVENT = 'hunar-seen'

function seenKey(userId: string, otherId: string): string {
  return `hunar_seen_${userId}_${otherId}`
}

export function getLastSeen(userId: string, otherId: string): number {
  const raw = localStorage.getItem(seenKey(userId, otherId))
  return raw ? Number(raw) : 0
}

export function markConversationSeen(userId: string, otherId: string): void {
  try {
    localStorage.setItem(seenKey(userId, otherId), String(Date.now()))
  } catch {
    // ignore storage errors
  }
  window.dispatchEvent(new CustomEvent(SEEN_EVENT))
}

/** Unread count per other-user id, based on incoming messages newer than last seen. */
export function unreadByConversation(
  messages: Message[],
  userId: string
): Map<string, number> {
  const counts = new Map<string, number>()
  for (const m of messages) {
    if (m.receiver_id !== userId) continue
    const other = m.sender_id
    if (new Date(m.created_at).getTime() > getLastSeen(userId, other)) {
      counts.set(other, (counts.get(other) ?? 0) + 1)
    }
  }
  return counts
}

/** Total unread messages for the current user, kept live via realtime + seen events. */
export function useUnreadTotal(): number {
  const { user } = useAuth()
  const [total, setTotal] = useState(0)

  useEffect(() => {
    if (!user) {
      setTotal(0)
      return
    }
    let active = true

    const recompute = async () => {
      const { data } = await supabase
        .from('messages')
        .select('sender_id, receiver_id, created_at')
        .eq('receiver_id', user.id)
        .order('created_at', { ascending: false })
        .limit(200)
      if (!active) return
      const counts = unreadByConversation((data as Message[]) ?? [], user.id)
      let sum = 0
      for (const n of counts.values()) sum += n
      setTotal(sum)
    }

    recompute()

    const onSeen = () => recompute()
    window.addEventListener(SEEN_EVENT, onSeen)

    const channel = supabase
      .channel(`unread:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` },
        () => recompute()
      )
      .subscribe()

    return () => {
      active = false
      window.removeEventListener(SEEN_EVENT, onSeen)
      supabase.removeChannel(channel)
    }
  }, [user])

  return total
}
