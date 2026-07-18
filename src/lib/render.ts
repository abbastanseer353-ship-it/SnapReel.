export interface TextOverlay {
  id: string
  text: string
  /** center position as a fraction of width/height (0..1) */
  xPct: number
  yPct: number
  color: string
  /** font size as a fraction of video height (e.g. 0.06) */
  size: number
}

export interface RenderOptions {
  source: Blob
  filterCss: string
  trimStart: number
  trimEnd: number
  speed: number
  volume: number
  muteOriginal: boolean
  musicUrl: string | null
  musicVolume: number
  texts: TextOverlay[]
  onProgress?: (percent: number) => void
}

function pickMimeType(): string {
  const candidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ]
  for (const c of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(c)) {
      return c
    }
  }
  return 'video/webm'
}

function drawTexts(
  ctx: CanvasRenderingContext2D,
  texts: TextOverlay[],
  width: number,
  height: number
) {
  for (const t of texts) {
    if (!t.text) continue
    const fontPx = Math.max(12, Math.round(t.size * height))
    ctx.font = `700 ${fontPx}px system-ui, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.lineWidth = Math.max(2, fontPx * 0.08)
    ctx.strokeStyle = 'rgba(0,0,0,0.55)'
    ctx.fillStyle = t.color
    const x = t.xPct * width
    const y = t.yPct * height
    ctx.strokeText(t.text, x, y)
    ctx.fillText(t.text, x, y)
  }
}

/**
 * Renders an edited video (filter, trim, speed, volume, music, text overlays)
 * into a new WebM Blob by re-drawing frames onto a canvas and mixing audio
 * through the Web Audio API.
 */
export async function renderEditedVideo(opts: RenderOptions): Promise<Blob> {
  const video = document.createElement('video')
  video.src = URL.createObjectURL(opts.source)
  video.playsInline = true
  video.crossOrigin = 'anonymous'

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve()
    video.onerror = () => reject(new Error('Could not load video for rendering'))
  })

  const maxWidth = 720
  const scale = video.videoWidth > maxWidth ? maxWidth / video.videoWidth : 1
  const width = Math.round(video.videoWidth * scale) || 480
  const height = Math.round(video.videoHeight * scale) || 854

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D not available')

  const audioCtx = new AudioContext()
  const dest = audioCtx.createMediaStreamDestination()

  const originalGain = audioCtx.createGain()
  originalGain.gain.value = opts.muteOriginal ? 0 : opts.volume
  try {
    const src = audioCtx.createMediaElementSource(video)
    src.connect(originalGain)
    originalGain.connect(dest)
  } catch {
    // no audio track – ignore
  }

  let musicEl: HTMLAudioElement | null = null
  if (opts.musicUrl) {
    musicEl = document.createElement('audio')
    musicEl.src = opts.musicUrl
    musicEl.loop = true
    musicEl.crossOrigin = 'anonymous'
    const musicGain = audioCtx.createGain()
    musicGain.gain.value = opts.musicVolume
    const msrc = audioCtx.createMediaElementSource(musicEl)
    msrc.connect(musicGain)
    musicGain.connect(dest)
  }

  const canvasStream = canvas.captureStream(30)
  const tracks: MediaStreamTrack[] = [
    ...canvasStream.getVideoTracks(),
    ...dest.stream.getAudioTracks(),
  ]
  const stream = new MediaStream(tracks)

  const mimeType = pickMimeType()
  const recorder = new MediaRecorder(stream, { mimeType })
  const chunks: BlobPart[] = []
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data)
  }

  const trimEnd = opts.trimEnd > opts.trimStart ? opts.trimEnd : video.duration
  const total = Math.max(0.1, trimEnd - opts.trimStart)

  const result = new Promise<Blob>((resolve) => {
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: mimeType }))
    }
  })

  video.currentTime = opts.trimStart
  await new Promise<void>((resolve) => {
    video.onseeked = () => resolve()
  })

  video.playbackRate = opts.speed
  video.muted = false
  recorder.start(100)
  await audioCtx.resume()
  await video.play()
  if (musicEl) {
    musicEl.currentTime = 0
    await musicEl.play().catch(() => undefined)
  }

  await new Promise<void>((resolve) => {
    const draw = () => {
      ctx.filter = opts.filterCss || 'none'
      ctx.drawImage(video, 0, 0, width, height)
      ctx.filter = 'none'
      drawTexts(ctx, opts.texts, width, height)

      const elapsed = video.currentTime - opts.trimStart
      if (opts.onProgress) {
        opts.onProgress(Math.min(100, Math.round((elapsed / total) * 100)))
      }

      if (video.currentTime >= trimEnd || video.ended) {
        resolve()
        return
      }
      requestAnimationFrame(draw)
    }
    requestAnimationFrame(draw)
  })

  video.pause()
  if (musicEl) musicEl.pause()
  recorder.stop()
  const blob = await result
  audioCtx.close().catch(() => undefined)
  URL.revokeObjectURL(video.src)
  return blob
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function captureThumbnail(blob: Blob, atSeconds: number): Promise<string | null> {
  const video = document.createElement('video')
  video.src = URL.createObjectURL(blob)
  video.muted = true
  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve()
      video.onerror = () => reject(new Error('thumb load failed'))
    })
    video.currentTime = Math.min(atSeconds, Math.max(0, video.duration - 0.1))
    await new Promise<void>((resolve) => {
      video.onseeked = () => resolve()
    })
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 480
    canvas.height = video.videoHeight || 854
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.7)
  } catch {
    return null
  } finally {
    URL.revokeObjectURL(video.src)
  }
}
