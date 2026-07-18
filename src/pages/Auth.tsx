import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function AuthPage() {
  const { session } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (session) return <Navigate to="/" replace />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setLoading(true)

    try {
      if (mode === 'signup') {
        if (!username.trim()) throw new Error('Username is required')
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username: username.trim(), full_name: fullName.trim() },
          },
        })
        if (signUpError) throw signUpError
        setInfo(
          'Account created! If email confirmation is on, check your inbox. Otherwise you can log in now.'
        )
        setMode('login')
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (signInError) throw signInError
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-shell">
      <div className="center-fill" style={{ minHeight: '100vh' }}>
        <div style={{ width: '100%', maxWidth: 360 }}>
          <h1
            style={{
              fontSize: 34,
              fontWeight: 800,
              textAlign: 'center',
              background: 'linear-gradient(90deg, var(--accent-2), var(--accent))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: 6,
            }}
          >
            Hunar
          </h1>
          <p className="muted" style={{ textAlign: 'center', marginBottom: 24 }}>
            Watch. Share. Earn with your skills.
          </p>

          {error && <div className="error-banner">{error}</div>}
          {info && (
            <div
              className="error-banner"
              style={{
                background: 'rgba(34,197,94,0.12)',
                borderColor: 'var(--success)',
                color: '#bbf7d0',
              }}
            >
              {info}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <>
                <div className="field">
                  <label>Username</label>
                  <input
                    className="input"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. abbas353"
                    autoComplete="username"
                  />
                </div>
                <div className="field">
                  <label>Full name (optional)</label>
                  <input
                    className="input"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
              </>
            )}
            <div className="field">
              <label>Email</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>
            <div className="field">
              <label>Password</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                minLength={6}
                required
              />
            </div>

            <button className="btn" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Sign up'}
            </button>
          </form>

          <p className="muted" style={{ textAlign: 'center', marginTop: 18, fontSize: 14 }}>
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login')
                setError(null)
                setInfo(null)
              }}
              style={{ color: 'var(--accent)', fontWeight: 600 }}
            >
              {mode === 'login' ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
