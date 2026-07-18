import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Video } from '../lib/types'
import VideoCard from '../components/VideoCard'

interface RawVideo extends Video {
  likes?: { count: number }[]
  comments?: { count: number }[]
}

export default function Feed() {
  const { user } = useAuth()
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('videos')
      .select('*, profile:profiles(*), likes(count), comments(count)')
      .order('created_at', { ascending: false })
      .limit(30)

    const rows = (data as RawVideo[]) ?? []

    let likedIds = new Set<string>()
    if (user && rows.length > 0) {
      const { data: myLikes } = await supabase
        .from('likes')
        .select('video_id')
        .eq('user_id', user.id)
        .in(
          'video_id',
          rows.map((r) => r.id)
        )
      likedIds = new Set((myLikes ?? []).map((l) => l.video_id as string))
    }

    setVideos(
      rows.map((r) => ({
        ...r,
        likes_count: r.likes?.[0]?.count ?? 0,
        comments_count: r.comments?.[0]?.count ?? 0,
        liked_by_me: likedIds.has(r.id),
      }))
    )
    setLoading(false)
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <div className="center-fill">
        <div className="spinner" />
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <div className="center-fill">
        <h2>No videos yet 🎬</h2>
        <p className="muted">Be the first to share something!</p>
        <Link to="/upload" className="btn">
          Upload a video
        </Link>
      </div>
    )
  }

  return (
    <div
      style={{
        height: 'calc(100vh - 60px)',
        overflowY: 'scroll',
        scrollSnapType: 'y mandatory',
      }}
    >
      {videos.map((v) => (
        <VideoCard key={v.id} video={v} />
      ))}
    </div>
  )
}
