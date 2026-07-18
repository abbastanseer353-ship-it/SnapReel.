import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Message, Profile } from '../lib/types'

export default function Chat() {
  const { userId } = useParams()
  const { user } = useAuth()
  const [other, setOther] = useState<Profile | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (!user || !userId) return

    const load = async () => {
      const [{ data: prof }, { data: msgs }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase
          .from('messages')
          .select('*')
          .or(
            `and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`
          )
          .order('created_at', { ascending: true }),
      ])
      setOther((prof as Profile) ?? null)
      setMessages((msgs as Message[]) ?? [])
      setLoading(false)
      setTimeout(scrollToBottom, 50)
    }
    load()

    const channel = supabase
      .channel(`chat:${[user.id, userId].sort().join(':')}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const m = payload.new as Message
          const involved =
            (m.sender_id === user.id && m.receiver_id === userId) ||
            (m.sender_id === userId && m.receiver_id === user.id)
          if (!involved) return
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]))
          setTimeout(scrollToBottom, 50)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, userId])

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || !user || !userId) return
    const content = text.trim()
    setText('')
    const { data, error } = await supabase
      .from('messages')
      .insert({ sender_id: user.id, receiver_id: userId, content })
      .select()
      .single()
    if (!error && data) {
      setMessages((prev) => (prev.some((x) => x.id === data.id) ? prev : [...prev, data as Message]))
      setTimeout(scrollToBottom, 50)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)' }}>
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link to="/messages" className="muted" style={{ fontSize: 22 }}>
            ‹
          </Link>
          {other && (
            <Link
              to={`/profile/${other.id}`}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <div className="avatar" style={{ width: 34, height: 34 }}>
                {other.avatar_url ? (
                  <img src={other.avatar_url} alt="" className="avatar" style={{ width: 34, height: 34 }} />
                ) : (
                  other.username[0]?.toUpperCase()
                )}
              </div>
              <h1 style={{ fontSize: 16 }}>@{other.username}</h1>
            </Link>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading ? (
          <div className="center-fill">
            <div className="spinner" />
          </div>
        ) : messages.length === 0 ? (
          <p className="muted" style={{ textAlign: 'center', marginTop: 20 }}>
            Say hello 👋
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === user?.id
            return (
              <div
                key={m.id}
                style={{
                  alignSelf: mine ? 'flex-end' : 'flex-start',
                  background: mine ? 'var(--accent)' : 'var(--surface-2)',
                  color: '#fff',
                  padding: '8px 12px',
                  borderRadius: 14,
                  maxWidth: '75%',
                  fontSize: 14,
                }}
              >
                {m.content}
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={send}
        style={{ display: 'flex', gap: 8, padding: 12, borderTop: '1px solid var(--border)' }}
      >
        <input
          className="input"
          placeholder="Type a message…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="btn" disabled={!text.trim()}>
          Send
        </button>
      </form>
    </div>
  )
}
