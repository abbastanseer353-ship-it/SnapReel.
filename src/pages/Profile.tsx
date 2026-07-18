import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Profile as ProfileType, Video } from '../lib/types'

export default function Profile() {
  const { userId } = useParams()
  const { user, signOut, refreshProfile } = useAuth()
  const navigate = useNavigate()

  const targetId = userId ?? user?.id ?? ''
  const isMe = targetId === user?.id

  const [profile, setProfile] = useState<ProfileType | null>(null)
  const [videos, setVideos] = useState<Video[]>([])
  const [followers, setFollowers] = useState(0)
  const [following, setFollowing] = useState(0)
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)

  const load = useCallback(async () => {
    if (!targetId) return
    setLoading(true)
    const [{ data: prof }, { data: vids }, followersRes, followingRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', targetId).maybeSingle(),
      supabase.from('videos').select('*').eq('user_id', targetId).order('created_at', { ascending: false }),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', targetId),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', targetId),
    ])
    setProfile((prof as ProfileType) ?? null)
    setVideos((vids as Video[]) ?? [])
    setFollowers(followersRes.count ?? 0)
    setFollowing(followingRes.count ?? 0)

    if (user && !isMe) {
      const { data: rel } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', user.id)
        .eq('following_id', targetId)
        .maybeSingle()
      setIsFollowing(Boolean(rel))
    }
    setLoading(false)
  }, [targetId, user, isMe])

  useEffect(() => {
    load()
  }, [load])

  const toggleFollow = async () => {
    if (!user) return
    if (isFollowing) {
      setIsFollowing(false)
      setFollowers((n) => Math.max(0, n - 1))
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', targetId)
    } else {
      setIsFollowing(true)
      setFollowers((n) => n + 1)
      await supabase.from('follows').insert({ follower_id: user.id, following_id: targetId })
    }
  }

  if (loading) {
    return (
      <div className="center-fill">
        <div className="spinner" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="center-fill">
        <p className="muted">Profile not found.</p>
      </div>
    )
  }

  if (editing && isMe) {
    return (
      <EditProfile
        profile={profile}
        onDone={async () => {
          await refreshProfile()
          await load()
          setEditing(false)
        }}
        onCancel={() => setEditing(false)}
      />
    )
  }

  return (
    <>
      <div className="topbar">
        <h1>@{profile.username}</h1>
        {isMe && (
          <button className="btn-outline" style={{ padding: '6px 12px', borderRadius: 8 }} onClick={signOut}>
            Log out
          </button>
        )}
      </div>

      <div style={{ padding: 16, textAlign: 'center' }}>
        <div className="avatar" style={{ width: 84, height: 84, margin: '0 auto', fontSize: 32 }}>
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="avatar" style={{ width: 84, height: 84 }} />
          ) : (
            profile.username[0]?.toUpperCase()
          )}
        </div>
        <h2 style={{ marginTop: 10 }}>{profile.full_name || profile.username}</h2>
        <span className="chip" style={{ marginTop: 6 }}>
          {profile.role === 'both' ? 'Client & Worker' : profile.role}
        </span>

        {profile.bio && <p style={{ marginTop: 10, fontSize: 14 }}>{profile.bio}</p>}

        {profile.skills && profile.skills.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginTop: 10 }}>
            {profile.skills.map((s) => (
              <span key={s} className="chip">
                {s}
              </span>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', gap: 28, margin: '16px 0' }}>
          <Stat label="Videos" value={videos.length} />
          <Stat label="Followers" value={followers} />
          <Stat label="Following" value={following} />
        </div>

        {isMe ? (
          <button className="btn-ghost btn" style={{ width: '100%' }} onClick={() => setEditing(true)}>
            Edit profile
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" style={{ flex: 1 }} onClick={toggleFollow}>
              {isFollowing ? 'Following' : 'Follow'}
            </button>
            <button
              className="btn btn-outline"
              style={{ flex: 1 }}
              onClick={() => navigate(`/chat/${targetId}`)}
            >
              Message
            </button>
          </div>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 2,
          padding: 2,
        }}
      >
        {videos.map((v) => (
          <div key={v.id} style={{ position: 'relative', aspectRatio: '9 / 14', background: '#000' }}>
            <video
              src={v.video_url}
              poster={v.thumbnail_url ?? undefined}
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        ))}
      </div>
      {videos.length === 0 && (
        <p className="muted" style={{ textAlign: 'center', padding: 24 }}>
          No videos yet.
        </p>
      )}
    </>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 18 }}>{value}</div>
      <div className="muted" style={{ fontSize: 12 }}>
        {label}
      </div>
    </div>
  )
}

function EditProfile({
  profile,
  onDone,
  onCancel,
}: {
  profile: ProfileType
  onDone: () => void
  onCancel: () => void
}) {
  const [fullName, setFullName] = useState(profile.full_name ?? '')
  const [bio, setBio] = useState(profile.bio ?? '')
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? '')
  const [role, setRole] = useState(profile.role)
  const [skills, setSkills] = useState((profile.skills ?? []).join(', '))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim() || null,
        bio: bio.trim() || null,
        avatar_url: avatarUrl.trim() || null,
        role,
        skills: skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      })
      .eq('id', profile.id)
    setSaving(false)
    if (updateError) {
      setError(updateError.message)
      return
    }
    onDone()
  }

  return (
    <>
      <div className="topbar">
        <h1>Edit profile</h1>
        <button onClick={onCancel} className="muted">
          Cancel
        </button>
      </div>
      <form style={{ padding: 16 }} onSubmit={save}>
        {error && <div className="error-banner">{error}</div>}
        <div className="field">
          <label>Full name</label>
          <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div className="field">
          <label>Bio</label>
          <textarea className="input" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
        </div>
        <div className="field">
          <label>Avatar URL</label>
          <input
            className="input"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://…"
          />
        </div>
        <div className="field">
          <label>I am a…</label>
          <select
            className="input"
            value={role}
            onChange={(e) => setRole(e.target.value as ProfileType['role'])}
          >
            <option value="both">Client &amp; Worker</option>
            <option value="client">Client (I hire)</option>
            <option value="worker">Worker (I offer skills)</option>
          </select>
        </div>
        <div className="field">
          <label>Skills (comma separated)</label>
          <input
            className="input"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="e.g. video editing, graphic design"
          />
        </div>
        <button className="btn" style={{ width: '100%' }} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </form>
    </>
  )
}
