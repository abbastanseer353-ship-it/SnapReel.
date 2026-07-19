import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const guide: { icon: string; title: string; body: string }[] = [
  {
    icon: '🏠',
    title: 'Home (Feed)',
    body: 'TikTok jaisa upar-neeche video scroll. Tap se play/pause, right side se like ❤️, comment 💬 aur chat ✉️.',
  },
  {
    icon: '💼',
    title: 'Earning (Marketplace)',
    body: 'Skill "Offer" ya "Request" posts — category aur budget ke saath. Poster se seedha chat shuru karo.',
  },
  {
    icon: '➕',
    title: 'Create (Studio)',
    body: 'Camera se record ya gallery import, live filters (swipe), music, phir Edit (trim/speed/text/cover), phir caption/hashtag/link/location ke saath Draft ya Upload.',
  },
  {
    icon: '💬',
    title: 'Inbox (Chat)',
    body: 'Real-time 1-to-1 messaging with unread badges. Kisi profile ya video se "Message" dabao.',
  },
  {
    icon: '👤',
    title: 'Profile',
    body: 'Avatar, role (Client/Worker/Both), bio, skills aur video grid. "Edit profile", "Ask AI", aur "Offline" videos yahin hain.',
  },
  {
    icon: '📥',
    title: 'Offline Videos',
    body: 'Jo videos aap dekhte ho woh khud offline save ho jati hain — internet na ho tab bhi Profile ke Offline tab se dobara dekho.',
  },
  {
    icon: '🤖',
    title: 'Ask AI',
    body: 'Profile ka AI guide — app ke kisi bhi feature ke bare mein poochho aur foran jawab lo.',
  },
]

export default function Settings() {
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()

  return (
    <>
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate(-1)} className="muted" style={{ fontSize: 22 }}>
            ‹
          </button>
          <h1>Settings</h1>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <section className="settings-group">
          <h3 className="settings-title">Account</h3>
          <div className="settings-card">
            <div className="settings-row">
              <span className="muted">Signed in as</span>
              <span style={{ fontWeight: 600 }}>@{profile?.username ?? '—'}</span>
            </div>
            {profile?.role && (
              <div className="settings-row">
                <span className="muted">Role</span>
                <span>{profile.role === 'both' ? 'Client & Worker' : profile.role}</span>
              </div>
            )}
          </div>
        </section>

        <section className="settings-group">
          <h3 className="settings-title">App guide — kya cheez kahan hai</h3>
          <div className="settings-card">
            {guide.map((g) => (
              <div key={g.title} className="guide-item">
                <div style={{ fontSize: 22 }}>{g.icon}</div>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>{g.title}</div>
                  <div className="muted" style={{ fontSize: 13, lineHeight: 1.4 }}>
                    {g.body}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="settings-group">
          <h3 className="settings-title">About</h3>
          <div className="settings-card">
            <div className="settings-row">
              <span className="muted">App</span>
              <span>Hunar</span>
            </div>
            <div className="settings-row">
              <span className="muted">Version</span>
              <span>1.0.0</span>
            </div>
            <div className="settings-row">
              <span className="muted">Backend</span>
              <span>Supabase + Cloudinary</span>
            </div>
          </div>
        </section>

        <button className="btn btn-outline" style={{ width: '100%' }} onClick={signOut}>
          Log out
        </button>
      </div>
    </>
  )
}
