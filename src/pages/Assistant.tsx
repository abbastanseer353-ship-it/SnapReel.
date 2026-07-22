import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { suggestedQuestions, getAssistantResponse } from '../lib/assistant'
import { appendAiMessage, clearAiChat, loadAiChat } from '../lib/aiChat'
import type { AiMessage } from '../lib/aiChat'

export default function Assistant() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [messages, setMessages] = useState<AiMessage[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [thinking, setThinking] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })

  useEffect(() => {
    if (!user) return
    loadAiChat(user.id).then((history) => {
      setMessages(history)
      setLoading(false)
      setTimeout(scrollToBottom, 50)
    })
  }, [user])

  const ask = async (question: string) => {
    const q = question.trim()
    if (!q || !user || thinking) return
    setText('')
    setThinking(true)

    const userMsg = await appendAiMessage(user.id, 'user', q)
    setMessages((prev) => [...prev, userMsg])
    setTimeout(scrollToBottom, 30)

    try {
      // Get AI response using Gemini API with premium/quota checking
      const answer = await getAssistantResponse(user.id, q)
      
      // small delay so it reads like a reply, not an instant echo
      await new Promise((r) => setTimeout(r, 350))
      const aiMsg = await appendAiMessage(user.id, 'assistant', answer)
      setMessages((prev) => [...prev, aiMsg])
    } catch (error) {
      console.error('Error getting AI response:', error)
      const errorMsg = await appendAiMessage(
        user.id,
        'assistant',
        'An error occurred while processing your request. Please try again.'
      )
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setThinking(false)
      setTimeout(scrollToBottom, 30)
    }
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    ask(text)
  }

  const onClear = async () => {
    if (!user) return
    await clearAiChat(user.id)
    setMessages([])
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)' }}>
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate(-1)} className="muted" style={{ fontSize: 22 }}>
            ‹
          </button>
          <h1 style={{ fontSize: 16 }}>🤖 Ask AI</h1>
        </div>
        {messages.length > 0 && (
          <button onClick={onClear} className="muted" style={{ fontSize: 13 }}>
            Clear
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          <div className="center-fill">
            <div className="spinner" />
          </div>
        ) : (
          <>
            {messages.length === 0 && (
              <div className="ai-intro">
                <div style={{ fontSize: 34 }}>🤖</div>
                <h3 style={{ margin: '8px 0 4px' }}>Hunar AI Guide</h3>
                <p className="muted" style={{ fontSize: 13 }}>
                  App ke bare mein kuch bhi poochho — kaun sa feature kahan hai, kaise kaam karta hai.
                </p>
              </div>
            )}

            {messages.map((m) => (
              <div
                key={m.id}
                className={`ai-bubble ${m.role === 'user' ? 'me' : 'ai'}`}
              >
                {m.content}
              </div>
            ))}

            {thinking && (
              <div className="ai-bubble ai typing">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {!loading && messages.length === 0 && (
        <div className="ai-suggestions">
          {suggestedQuestions.map((s) => (
            <button key={s} className="chip ai-suggestion" onClick={() => ask(s)}>
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={onSubmit}
        style={{ display: 'flex', gap: 8, padding: 12, borderTop: '1px solid var(--border)' }}
      >
        <input
          className="input"
          placeholder="Apna sawal likhein…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="btn" disabled={!text.trim() || thinking}>
          Send
        </button>
      </form>
    </div>
  )
}
