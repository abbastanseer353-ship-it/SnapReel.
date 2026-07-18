import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { isCloudinaryConfigured, uploadVideo } from '../../lib/cloudinary'
import { getFilter } from '../../lib/filters'
import { getTrack } from '../../lib/music'
import { useCreate } from '../../context/CreateContext'
import { captureThumbnail, renderEditedVideo } from '../../lib/render'
import { saveDraft } from '../../lib/drafts'

export default function Post() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { sourceBlob, edit, post, setPost, reset } = useCreate()

  const [busy, setBusy] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sourceBlob) navigate('/create', { replace: true })
  }, [sourceBlob, navigate])

  const renderFinal = async () => {
    return renderEditedVideo({
      source: sourceBlob as Blob,
      filterCss: getFilter(edit.filterId).css,
      trimStart: edit.trimStart,
      trimEnd: edit.trimEnd,
      speed: edit.speed,
      volume: edit.volume,
      muteOriginal: edit.muteOriginal,
      musicUrl: getTrack(edit.musicId)?.url ?? null,
      musicVolume: edit.musicVolume,
      texts: edit.texts,
      onProgress: setProgress,
    })
  }

  const handleDraft = async () => {
    if (!sourceBlob) return
    setBusy('Saving draft…')
    setError(null)
    try {
      const blob = await renderFinal()
      const thumbnail = await captureThumbnail(blob, edit.coverTime)
      await saveDraft({
        id: Math.random().toString(36).slice(2),
        createdAt: Date.now(),
        blob,
        thumbnail,
        caption: post.caption,
        filterId: edit.filterId,
        musicId: edit.musicId,
        link: post.link,
        location: post.location,
        visibility: post.visibility,
        allowComments: post.allowComments,
      })
      reset()
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Draft failed')
    } finally {
      setBusy(null)
      setProgress(0)
    }
  }

  const insertVideo = async (videoUrl: string, thumbnailUrl: string) => {
    const base = {
      user_id: user?.id,
      video_url: videoUrl,
      thumbnail_url: thumbnailUrl,
      caption: post.caption.trim() || null,
    }
    const extended = {
      ...base,
      music: getTrack(edit.musicId)?.name ?? null,
      link: post.link.trim() || null,
      location: post.location.trim() || null,
      visibility: post.visibility,
      allow_comments: post.allowComments,
    }
    const { error: extError } = await supabase.from('videos').insert(extended)
    if (!extError) return
    // Fallback if the extra columns haven't been migrated yet.
    const { error: baseError } = await supabase.from('videos').insert(base)
    if (baseError) throw baseError
  }

  const handleUpload = async () => {
    if (!sourceBlob || !user) return
    if (!isCloudinaryConfigured) {
      setError('Cloudinary abhi configured nahi hai. Upload preset add karne ke baad chalega.')
      return
    }
    setError(null)
    try {
      setBusy('Rendering…')
      const blob = await renderFinal()
      const file = new File([blob], `hunar-${Date.now()}.webm`, { type: blob.type })
      setBusy('Uploading…')
      const result = await uploadVideo(file, setProgress)
      setBusy('Publishing…')
      await insertVideo(result.url, result.thumbnailUrl)
      reset()
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setBusy(null)
      setProgress(0)
    }
  }

  const hashtags = post.caption.match(/#[\w\u0600-\u06FF]+/g) ?? []
  const mentions = post.caption.match(/@[\w.]+/g) ?? []

  return (
    <>
      <div className="creator-topbar">
        <button className="creator-close static" onClick={() => navigate('/create/edit')}>‹</button>
        <span>Post</span>
        <div style={{ width: 24 }} />
      </div>

      <div style={{ padding: 16, paddingBottom: 120 }}>
        {error && <div className="error-banner">{error}</div>}

        <div className="field">
          <label>Caption</label>
          <textarea
            className="input"
            rows={3}
            value={post.caption}
            onChange={(e) => setPost({ caption: e.target.value })}
            placeholder="Caption likhein… #hashtag @mention"
          />
          {(hashtags.length > 0 || mentions.length > 0) && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
              {hashtags.map((h) => <span key={h} className="chip" style={{ color: 'var(--accent-2)' }}>{h}</span>)}
              {mentions.map((m) => <span key={m} className="chip" style={{ color: 'var(--accent)' }}>{m}</span>)}
            </div>
          )}
        </div>

        <div className="field">
          <label>🔗 Link (optional)</label>
          <input className="input" value={post.link} onChange={(e) => setPost({ link: e.target.value })} placeholder="https://…" />
        </div>

        <div className="field">
          <label>📍 Location (optional)</label>
          <input className="input" value={post.location} onChange={(e) => setPost({ location: e.target.value })} placeholder="e.g. Karachi, Pakistan" />
        </div>

        <div className="field">
          <label>Who can watch</label>
          <div className="pill-group">
            <button className={`pill ${post.visibility === 'public' ? 'active' : ''}`} onClick={() => setPost({ visibility: 'public' })}>🌍 Public</button>
            <button className={`pill ${post.visibility === 'followers' ? 'active' : ''}`} onClick={() => setPost({ visibility: 'followers' })}>👥 Followers</button>
          </div>
        </div>

        <div className="editor-row" style={{ justifyContent: 'space-between' }}>
          <span>💬 Allow comments</span>
          <button className={`toggle ${post.allowComments ? 'on' : ''}`} onClick={() => setPost({ allowComments: !post.allowComments })}>
            <span className="toggle-knob" />
          </button>
        </div>

        {busy && (
          <div style={{ marginTop: 12 }}>
            <div style={{ height: 8, background: 'var(--surface-2)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: 'var(--accent)', transition: 'width 0.2s ease' }} />
            </div>
            <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>{busy} {progress}%</p>
          </div>
        )}
      </div>

      <div className="creator-bottom fixed">
        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={handleDraft} disabled={!!busy}>Draft</button>
        <button className="btn" style={{ flex: 2 }} onClick={handleUpload} disabled={!!busy}>Upload</button>
      </div>
    </>
  )
}
