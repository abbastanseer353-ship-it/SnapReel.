import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Video } from '../lib/types'
import CommentsSheet from './CommentsSheet'
import { cacheVideoForOffline } from '../lib/offline'

export default function VideoCard({ video }: { video: Video }) {
  const { user } = useAuth()
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [liked, setLiked] = useState(Boolean(video.liked_by_me))
  const [likes, setLikes] = useState(video.likes_count ?? 0)
  const [commentsCount, setCommentsCount] = useState(video.comments_count ?? 0)
  const [showComments, setShowComments] = useState(false)
  const [playing, setPlaying] = useState(false)

  // Auto play/pause based on visibility + cache watched video for offline
  useEffect(() => {
    const el = containerRef.current
    const vid = videoRef.current
    if (!el || !vid) return

    let cacheTimer: ReturnType<typeof setTimeout> | undefined

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          vid.play().catch(() => undefined)
          setPlaying(true)
          cacheTimer = setTimeout(() => {
            cacheVideoForOffline(video).catch(() => undefined)
          }, 2500)
        } else {
          vid.pause()
          setPlaying(false)
          if (cacheTimer) clearTimeout(cacheTimer)
        }
      },
      { threshold: 0.6 }
    )
    observer.observe(el)
    return () => {
      observer.disconnect()
      if (cacheTimer) clearTimeout(cacheTimer)
    }
  }, [video])

  const togglePlay = () => {
    const vid = videoRef.current
    if (!vid) return
    if (vid.paused) {
      vid.play().catch(() => undefined)
      setPlaying(true)
    } else {
      vid.pause()
      setPlaying(false)
    }
  }

  const toggleLike = async () => {
    if (!user) return
    if (liked) {
      setLiked(false)
      setLikes((n) => Math.max(0, n - 1))
      await supabase.from('likes').delete().eq('video_id', video.id).eq('user_id', user.id)
    } else {
      setLiked(true)
      setLikes((n) => n + 1)
      await supabase.from('likes').insert({ video_id: video.id, user_id: user.id })
    }
  }

  const username = video.profile?.username ?? 'user'

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        height: 'calc(100vh - 60px)',
        scrollSnapAlign: 'start',
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <video
        ref={videoRef}
        src={video.video_url}
        poster={video.thumbnail_url ?? undefined}
        loop
        playsInline
        muted
        onClick={togglePlay}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />

      {!playing && (
        <div
          onClick={togglePlay}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 60,
            color: 'rgba(255,255,255,0.7)',
            pointerEvents: 'none',
          }}
        >
          ▶
        </div>
      )}

      {/* Right action rail */}
      <div
        style={{
          position: 'absolute',
          right: 12,
          bottom: 90,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          alignItems: 'center',
        }}
      >
        <Link to={`/profile/${video.user_id}`} className="avatar" style={{ width: 46, height: 46 }}>
          {video.profile?.avatar_url ? (
            <img
              src={video.profile.avatar_url}
              alt=""
              className="avatar"
              style={{ width: 46, height: 46 }}
            />
          ) : (
            username[0]?.toUpperCase()
          )}
        </Link>

        <button onClick={toggleLike} style={rail}>
          <span style={{ fontSize: 30 }}>{liked ? '❤️' : '🤍'}</span>
          <span style={railLabel}>{likes}</span>
        </button>

        <button onClick={() => setShowComments(true)} style={rail}>
          <span style={{ fontSize: 30 }}>💬</span>
          <span style={railLabel}>{commentsCount}</span>
        </button>

        <Link to={`/chat/${video.user_id}`} style={rail}>
          <span style={{ fontSize: 28 }}>✉️</span>
          <span style={railLabel}>Chat</span>
        </Link>
      </div>

      {/* Bottom caption */}
      <div
        style={{
          position: 'absolute',
          left: 12,
          right: 80,
          bottom: 20,
          textShadow: '0 1px 4px rgba(0,0,0,0.8)',
        }}
      >
        <Link to={`/profile/${video.user_id}`} style={{ fontWeight: 700, fontSize: 16 }}>
          @{username}
        </Link>
        {video.caption && (
          <p style={{ fontSize: 14, marginTop: 6, lineHeight: 1.35 }}>{video.caption}</p>
        )}
      </div>

      {showComments && (
        <CommentsSheet
          videoId={video.id}
          onClose={() => setShowComments(false)}
          onCountChange={setCommentsCount}
        />
      )}
    </div>
  )
}

const rail: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 2,
}

const railLabel: React.CSSProperties = {
  fontSize: 12,
  color: '#fff',
  textShadow: '0 1px 3px rgba(0,0,0,0.8)',
}
