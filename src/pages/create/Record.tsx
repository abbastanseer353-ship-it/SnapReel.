import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FILTERS } from '../../lib/filters'
import { TRACKS } from '../../lib/music'
import { useCreate } from '../../context/CreateContext'

const MAX_SECONDS = 60

export default function Record() {
  const navigate = useNavigate()
  const { setSource, setEdit } = useCreate()

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const rafRef = useRef<number>(0)
  const filterIndexRef = useRef(0)
  const musicElRef = useRef<HTMLAudioElement | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)

  const [filterIndex, setFilterIndex] = useState(0)
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [facing, setFacing] = useState<'user' | 'environment'>('user')
  const [musicId, setMusicId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  filterIndexRef.current = filterIndex

  const startCamera = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 720 }, height: { ideal: 1280 } },
        audio: true,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setReady(true)
    } catch {
      setError('Camera access nahi mila. Aap gallery se video import kar sakte hain.')
      setReady(false)
    }
  }, [facing])

  useEffect(() => {
    void startCamera()
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      cancelAnimationFrame(rafRef.current)
    }
  }, [startCamera])

  useEffect(() => {
    const canvas = canvasRef.current
    const video = videoRef.current
    if (!canvas || !video) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const draw = () => {
      if (video.videoWidth) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.filter = FILTERS[filterIndexRef.current].css || 'none'
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      }
      rafRef.current = requestAnimationFrame(draw)
    }
    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [ready])

  useEffect(() => {
    if (!recording) return
    const id = window.setInterval(() => {
      setElapsed((e) => {
        if (e + 1 >= MAX_SECONDS) {
          stopRecording()
          return MAX_SECONDS
        }
        return e + 1
      })
    }, 1000)
    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recording])

  const buildRecordStream = (): MediaStream => {
    const canvas = canvasRef.current
    if (!canvas) throw new Error('no canvas')
    const canvasStream = canvas.captureStream(30)
    const audioTracks: MediaStreamTrack[] = []
    const track = musicId ? TRACKS.find((t) => t.id === musicId) : null

    if (track) {
      const audioCtx = new AudioContext()
      audioCtxRef.current = audioCtx
      const dest = audioCtx.createMediaStreamDestination()
      const mic = streamRef.current
      if (mic && mic.getAudioTracks().length) {
        const micSrc = audioCtx.createMediaStreamSource(mic)
        micSrc.connect(dest)
      }
      const musicEl = new Audio(track.url)
      musicEl.loop = true
      musicElRef.current = musicEl
      const musicSrc = audioCtx.createMediaElementSource(musicEl)
      const gain = audioCtx.createGain()
      gain.gain.value = 0.6
      musicSrc.connect(gain)
      gain.connect(dest)
      void audioCtx.resume()
      void musicEl.play().catch(() => undefined)
      audioTracks.push(...dest.stream.getAudioTracks())
    } else if (streamRef.current) {
      audioTracks.push(...streamRef.current.getAudioTracks())
    }

    return new MediaStream([...canvasStream.getVideoTracks(), ...audioTracks])
  }

  const startRecording = () => {
    try {
      const stream = buildRecordStream()
      const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : 'video/webm'
      const recorder = new MediaRecorder(stream, { mimeType: mime })
      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mime })
        musicElRef.current?.pause()
        audioCtxRef.current?.close().catch(() => undefined)
        setSource(blob)
        setEdit({ filterId: FILTERS[filterIndexRef.current].id, musicId })
        navigate('/create/edit')
      }
      recorderRef.current = recorder
      recorder.start(100)
      setElapsed(0)
      setRecording(true)
    } catch {
      setError('Recording start nahi ho saki.')
    }
  }

  const stopRecording = () => {
    setRecording(false)
    recorderRef.current?.stop()
  }

  const onImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.type.startsWith('video/')) {
      setError('Please choose a video file')
      return
    }
    setSource(f)
    navigate('/create/edit')
  }

  const changeFilter = (dir: number) => {
    setFilterIndex((i) => (i + dir + FILTERS.length) % FILTERS.length)
  }

  const touchStartX = useRef<number | null>(null)
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 40) changeFilter(dx < 0 ? 1 : -1)
    touchStartX.current = null
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') changeFilter(-1)
      if (e.key === 'ArrowRight') changeFilter(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="creator">
      <video ref={videoRef} playsInline muted style={{ display: 'none' }} />

      <div
        className="creator-stage"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <canvas ref={canvasRef} className="creator-canvas" />

        {error && (
          <div className="creator-error">
            {error}
          </div>
        )}

        <button className="creator-close" onClick={() => navigate('/')}>✕</button>

        <div className="creator-side">
          <button className="creator-side-btn" onClick={() => setFacing((f) => (f === 'user' ? 'environment' : 'user'))}>
            🔄<span>Flip</span>
          </button>
          <label className="creator-side-btn">
            🖼️<span>Upload</span>
            <input type="file" accept="video/*" onChange={onImport} style={{ display: 'none' }} />
          </label>
          <button className="creator-side-btn" onClick={() => navigate('/create/drafts')}>
            📄<span>Drafts</span>
          </button>
        </div>

        <div className="creator-filtername">← {FILTERS[filterIndex].name} →</div>

        {recording && (
          <div className="creator-timer">● {elapsed}s / {MAX_SECONDS}s</div>
        )}
      </div>

      <div className="creator-controls">
        <div className="filter-strip">
          {FILTERS.map((f, i) => (
            <button
              key={f.id}
              className={`filter-chip ${i === filterIndex ? 'active' : ''}`}
              onClick={() => setFilterIndex(i)}
            >
              {f.name}
            </button>
          ))}
        </div>

        <div className="creator-actions">
          <select
            className="music-select"
            value={musicId ?? ''}
            onChange={(e) => setMusicId(e.target.value || null)}
            disabled={recording}
          >
            <option value="">🎵 No music</option>
            {TRACKS.map((t) => (
              <option key={t.id} value={t.id}>🎵 {t.name}</option>
            ))}
          </select>

          <button
            className={`record-btn ${recording ? 'recording' : ''}`}
            onClick={recording ? stopRecording : startRecording}
            disabled={!ready}
            aria-label={recording ? 'Stop' : 'Record'}
          >
            <span className="record-dot" />
          </button>

          <div style={{ width: 90 }} />
        </div>
      </div>
    </div>
  )
}
