import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FILTERS, getFilter } from '../../lib/filters'
import { TRACKS, getTrack } from '../../lib/music'
import { useCreate } from '../../context/CreateContext'
import {
  captureThumbnail,
  downloadBlob,
  renderEditedVideo,
  type TextOverlay,
} from '../../lib/render'
import { saveDraft } from '../../lib/drafts'

const COLORS = ['#ffffff', '#fe2c55', '#25f4ee', '#ffd60a', '#000000']

export default function Edit() {
  const navigate = useNavigate()
  const { sourceBlob, sourceUrl, edit, setEdit, post } = useCreate()

  const videoRef = useRef<HTMLVideoElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const musicRef = useRef<HTMLAudioElement | null>(null)
  const [duration, setDuration] = useState(0)
  const [busy, setBusy] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)

  useEffect(() => {
    if (!sourceBlob) navigate('/create', { replace: true })
  }, [sourceBlob, navigate])

  const filter = getFilter(edit.filterId)
  const track = getTrack(edit.musicId)

  const onMeta = () => {
    const v = videoRef.current
    if (!v) return
    const d = v.duration && isFinite(v.duration) ? v.duration : 0
    setDuration(d)
    if (edit.trimEnd === 0 && d) setEdit({ trimEnd: d })
  }

  // keep preview looping within the trim window + apply speed
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    v.playbackRate = edit.speed
    v.volume = edit.muteOriginal ? 0 : edit.volume
    const onTime = () => {
      if (edit.trimEnd && v.currentTime >= edit.trimEnd) {
        v.currentTime = edit.trimStart
        if (musicRef.current) musicRef.current.currentTime = 0
      }
    }
    v.addEventListener('timeupdate', onTime)
    return () => v.removeEventListener('timeupdate', onTime)
  }, [edit.speed, edit.volume, edit.muteOriginal, edit.trimStart, edit.trimEnd])

  // background music preview
  useEffect(() => {
    if (musicRef.current) {
      musicRef.current.pause()
      musicRef.current = null
    }
    if (track) {
      const el = new Audio(track.url)
      el.loop = true
      el.volume = edit.musicVolume
      musicRef.current = el
      void el.play().catch(() => undefined)
    }
    return () => {
      musicRef.current?.pause()
      musicRef.current = null
    }
  }, [track, edit.musicVolume])

  const addText = () => {
    const t: TextOverlay = {
      id: Math.random().toString(36).slice(2),
      text: 'Tap to edit',
      xPct: 0.5,
      yPct: 0.5,
      color: '#ffffff',
      size: 0.07,
    }
    setEdit({ texts: [...edit.texts, t] })
  }

  const updateText = (id: string, update: Partial<TextOverlay>) => {
    setEdit({ texts: edit.texts.map((t) => (t.id === id ? { ...t, ...update } : t)) })
  }

  const removeText = (id: string) => {
    setEdit({ texts: edit.texts.filter((t) => t.id !== id) })
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragId || !stageRef.current) return
    const rect = stageRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    updateText(dragId, {
      xPct: Math.min(1, Math.max(0, x)),
      yPct: Math.min(1, Math.max(0, y)),
    })
  }

  const buildRenderOpts = (onProgress: (p: number) => void) => ({
    source: sourceBlob as Blob,
    filterCss: filter.css,
    trimStart: edit.trimStart,
    trimEnd: edit.trimEnd || duration,
    speed: edit.speed,
    volume: edit.volume,
    muteOriginal: edit.muteOriginal,
    musicUrl: track?.url ?? null,
    musicVolume: edit.musicVolume,
    texts: edit.texts,
    onProgress,
  })

  const handleSaveGallery = async () => {
    if (!sourceBlob) return
    setBusy('Rendering for gallery…')
    setError(null)
    try {
      const blob = await renderEditedVideo(buildRenderOpts(setProgress))
      downloadBlob(blob, `hunar-${Date.now()}.webm`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Render failed')
    } finally {
      setBusy(null)
      setProgress(0)
    }
  }

  const handleDraft = async () => {
    if (!sourceBlob) return
    setBusy('Saving draft…')
    setError(null)
    try {
      const blob = await renderEditedVideo(buildRenderOpts(setProgress))
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
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Draft failed')
    } finally {
      setBusy(null)
      setProgress(0)
    }
  }

  const stageStyle = useMemo(
    () => ({ filter: filter.css || 'none' }),
    [filter.css]
  )

  if (!sourceUrl) return null

  return (
    <div className="creator">
      <div className="creator-topbar">
        <button className="creator-close static" onClick={() => navigate('/create')}>‹</button>
        <span>Edit</span>
        <button className="btn" style={{ padding: '6px 16px' }} onClick={() => navigate('/create/post')}>
          Next
        </button>
      </div>

      <div
        className="creator-stage edit"
        ref={stageRef}
        onPointerMove={onPointerMove}
        onPointerUp={() => setDragId(null)}
        onPointerLeave={() => setDragId(null)}
      >
        <video
          ref={videoRef}
          src={sourceUrl}
          className="creator-canvas"
          style={stageStyle}
          autoPlay
          loop
          playsInline
          onLoadedMetadata={onMeta}
        />
        {edit.texts.map((t) => (
          <div
            key={t.id}
            className="text-overlay"
            style={{
              left: `${t.xPct * 100}%`,
              top: `${t.yPct * 100}%`,
              color: t.color,
              fontSize: `${t.size * 100}%`,
            }}
            onPointerDown={() => setDragId(t.id)}
          >
            {t.text || ' '}
            <button className="text-remove" onPointerDown={(e) => { e.stopPropagation(); removeText(t.id) }}>✕</button>
          </div>
        ))}
      </div>

      {busy && (
        <div className="render-overlay">
          <div className="spinner" />
          <p>{busy} {progress}%</p>
        </div>
      )}

      <div className="editor-panel">
        {error && <div className="error-banner">{error}</div>}

        <div className="filter-strip">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              className={`filter-chip ${f.id === edit.filterId ? 'active' : ''}`}
              onClick={() => setEdit({ filterId: f.id })}
            >
              {f.name}
            </button>
          ))}
        </div>

        <div className="editor-row">
          <span>Trim</span>
          <div className="trim-controls">
            <input
              type="range" min={0} max={duration || 0} step={0.1}
              value={edit.trimStart}
              onChange={(e) => setEdit({ trimStart: Math.min(Number(e.target.value), edit.trimEnd - 0.2) })}
            />
            <input
              type="range" min={0} max={duration || 0} step={0.1}
              value={edit.trimEnd}
              onChange={(e) => setEdit({ trimEnd: Math.max(Number(e.target.value), edit.trimStart + 0.2) })}
            />
          </div>
          <span className="muted">{edit.trimStart.toFixed(1)}–{(edit.trimEnd || duration).toFixed(1)}s</span>
        </div>

        <div className="editor-row">
          <span>Speed</span>
          <div className="pill-group">
            {[0.5, 1, 1.5, 2].map((s) => (
              <button key={s} className={`pill ${edit.speed === s ? 'active' : ''}`} onClick={() => setEdit({ speed: s })}>{s}x</button>
            ))}
          </div>
        </div>

        <div className="editor-row">
          <span>Volume</span>
          <input type="range" min={0} max={1} step={0.05} value={edit.volume} onChange={(e) => setEdit({ volume: Number(e.target.value) })} />
          <button className={`pill ${edit.muteOriginal ? 'active' : ''}`} onClick={() => setEdit({ muteOriginal: !edit.muteOriginal })}>
            {edit.muteOriginal ? 'Muted' : 'Mute'}
          </button>
        </div>

        <div className="editor-row">
          <span>Music</span>
          <select className="music-select" value={edit.musicId ?? ''} onChange={(e) => setEdit({ musicId: e.target.value || null })}>
            <option value="">No music</option>
            {TRACKS.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        <div className="editor-row">
          <span>Cover</span>
          <input type="range" min={0} max={duration || 0} step={0.1} value={edit.coverTime} onChange={(e) => setEdit({ coverTime: Number(e.target.value) })} />
          <span className="muted">{edit.coverTime.toFixed(1)}s</span>
        </div>

        <div className="editor-row">
          <button className="btn btn-ghost" onClick={addText}>+ Text</button>
          {edit.texts.length > 0 && (
            <div className="text-editors">
              {edit.texts.map((t) => (
                <div key={t.id} className="text-editor-item">
                  <input className="input" value={t.text} onChange={(e) => updateText(t.id, { text: e.target.value })} />
                  <div className="color-row">
                    {COLORS.map((c) => (
                      <button key={c} className={`color-dot ${t.color === c ? 'active' : ''}`} style={{ background: c }} onClick={() => updateText(t.id, { color: c })} />
                    ))}
                    <input type="range" min={0.04} max={0.15} step={0.005} value={t.size} onChange={(e) => updateText(t.id, { size: Number(e.target.value) })} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="creator-bottom">
          <button className="btn btn-outline" onClick={handleSaveGallery} disabled={!!busy}>⬇️ Gallery</button>
          <button className="btn btn-ghost" onClick={handleDraft} disabled={!!busy}>Draft</button>
          <button className="btn" onClick={() => navigate('/create/post')} disabled={!!busy}>Next</button>
        </div>
      </div>
    </div>
  )
}
