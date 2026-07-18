import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import { CreateProvider } from './context/CreateContext'
import AuthPage from './pages/Auth'
import Feed from './pages/Feed'
import Profile from './pages/Profile'
import Earning from './pages/Earning'
import Messages from './pages/Messages'
import Chat from './pages/Chat'
import Record from './pages/create/Record'
import Edit from './pages/create/Edit'
import Post from './pages/create/Post'
import Drafts from './pages/create/Drafts'
import ConfigNotice from './components/ConfigNotice'
import { isSupabaseConfigured } from './lib/supabase'

function CreateLayout() {
  return (
    <CreateProvider>
      <div className="app-shell">
        <Outlet />
      </div>
    </CreateProvider>
  )
}

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
        <Route path="/earning" element={<Earning />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/chat/:userId" element={<Chat />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/:userId" element={<Profile />} />
      </Route>
      <Route
        element={
          <ProtectedRoute>
            <CreateLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/create" element={<Record />} />
        <Route path="/create/edit" element={<Edit />} />
        <Route path="/create/post" element={<Post />} />
        <Route path="/create/drafts" element={<Drafts />} />
      </Route>
      <Route path="/upload" element={<Navigate to="/create" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
