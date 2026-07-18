import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { isCloudinaryConfigured, uploadVideo } from '../lib/cloudinary'

export default function Upload() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.type.startsWith('video/')) {
      setError('Please choose a video file')
      return
    }
    setError(null)
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !user) return
    if (!isCloudinaryConfigured) {
      setError('Cloudinary is not configured. Add the env vars to enable uploads.')
      return
    }
    setUploading(true)
    setError(null)
    try {
      const result = await uploadVideo(file, setProgress)
      const { error: insertError } = await supabase.from('videos').insert({
        user_id: user.id,
        video_url: result.url,
        thumbnail_url: result.thumbnailUrl,
        caption: caption.trim() || null,
      })
      if (insertError) throw insertError
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <div className="topbar">
        <h1>Upload</h1>
      </div>
      <div style={{ padding: 16 }}>
        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={submit}>
          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              border: '2px dashed var(--border)',
              borderRadius: 12,
              padding: preview ? 8 : 40,
              marginBottom: 16,
              cursor: 'pointer',
            }}
          >
            {preview ? (
              <video
                src={preview}
                controls
                style={{ width: '100%', borderRadius: 8, maxHeight: 360 }}
              />
            ) : (
              <>
                <span style={{ fontSize: 40 }}>⬆️</span>
                <span>Select a video to upload</span>
                <span className="muted" style={{ fontSize: 12 }}>
                  MP4, MOV, WebM
                </span>
              </>
            )}
            <input
              type="file"
              accept="video/*"
              onChange={onFile}
              style={{ display: 'none' }}
            />
          </label>

          <div className="field">
            <label>Caption</label>
            <textarea
              className="input"
              rows={3}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Say something about your video…"
            />
          </div>

          {uploading && (
            <div style={{ marginBottom: 12 }}>
              <div
                style={{
                  height: 8,
                  background: 'var(--surface-2)',
                  borderRadius: 999,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${progress}%`,
                    height: '100%',
                    background: 'var(--accent)',
                    transition: 'width 0.2s ease',
                  }}
                />
              </div>
              <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                Uploading… {progress}%
              </p>
            </div>
          )}

          <button className="btn" style={{ width: '100%' }} disabled={!file || uploading}>
            {uploading ? 'Uploading…' : 'Post'}
          </button>
        </form>
      </div>
    </>
  )
}
