import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import AuthPage from './pages/Auth'
import Feed from './pages/Feed'
import Upload from './pages/Upload'
import Profile from './pages/Profile'
import Earning from './pages/Earning'
import Messages from './pages/Messages'
import Chat from './pages/Chat'
import ConfigNotice from './components/ConfigNotice'
import { isSupabaseConfigured } from './lib/supabase'

export default function App() {
  const { loading } = useAuth()

  if (!isSupabaseConfigured) {
    return <ConfigNotice />
  }

  if (loading) {
    return (
      <div className="app-shell">
        <div className="center-fill">
          <div className="spinner" />
          <p className="muted">Loading…</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Feed />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/earning" element={<Earning />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/chat/:userId" element={<Chat />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/:userId" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
