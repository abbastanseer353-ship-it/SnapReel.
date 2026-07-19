import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { unreadByConversation } from '../lib/chatState'
import { formatChatTime } from '../lib/time'
import type { Message, Profile } from '../lib/types'

interface Convo {
  other: Profile
  last: Message
  unread: number
}

export default function Messages() {
  const { user } = useAuth()
  const [convos, setConvos] = useState<Convo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      const messages = (msgs as Message[]) ?? []
      const lastByOther = new Map<string, Message>()
      for (const m of messages) {
        const other = m.sender_id === user.id ? m.receiver_id : m.sender_id
        if (!lastByOther.has(other)) lastByOther.set(other, m)
      }

      const otherIds = [...lastByOther.keys()]
      if (otherIds.length === 0) {
        setConvos([])
        setLoading(false)
        return
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', otherIds)
      const profMap = new Map((profiles as Profile[] ?? []).map((p) => [p.id, p]))

      const unreadMap = unreadByConversation(messages, user.id)

      const list: Convo[] = otherIds
        .map((id) => {
          const other = profMap.get(id)
          const last = lastByOther.get(id)
          if (!other || !last) return null
          return { other, last, unread: unreadMap.get(id) ?? 0 }
        })
        .filter((c): c is Convo => c !== null)

      setConvos(list)
      setLoading(false)
    }
    load()
  }, [user])

  return (
    <>
      <div className="topbar">
        <h1>💬 Inbox</h1>
      </div>
      {loading ? (
        <div className="center-fill">
          <div className="spinner" />
        </div>
      ) : convos.length === 0 ? (
        <div className="center-fill">
          <h3>No messages yet</h3>
          <p className="muted">Start a chat from a video or an Earning post.</p>
        </div>
      ) : (
        <div>
          {convos.map((c) => (
            <Link
              key={c.other.id}
              to={`/chat/${c.other.id}`}
              style={{
                display: 'flex',
                gap: 12,
                padding: 14,
                borderBottom: '1px solid var(--border)',
                alignItems: 'center',
              }}
            >
              <div className="avatar" style={{ width: 48, height: 48 }}>
                {c.other.avatar_url ? (
                  <img src={c.other.avatar_url} alt="" className="avatar" style={{ width: 48, height: 48 }} />
                ) : (
                  c.other.username[0]?.toUpperCase()
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontWeight: 600 }}>@{c.other.username}</span>
                  <span className="muted" style={{ fontSize: 11 }}>
                    {formatChatTime(c.last.created_at)}
                  </span>
                </div>
                <div
                  className={c.unread > 0 ? '' : 'muted'}
                  style={{
                    fontSize: 13,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontWeight: c.unread > 0 ? 600 : 400,
                  }}
                >
                  {c.last.sender_id === user?.id ? 'You: ' : ''}
                  {c.last.content}
                </div>
              </div>
              {c.unread > 0 && <span className="unread-pill">{c.unread}</span>}
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
