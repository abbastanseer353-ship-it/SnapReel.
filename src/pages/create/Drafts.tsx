import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { deleteDraft, listDrafts, type Draft } from '../../lib/drafts'
import { useCreate } from '../../context/CreateContext'

export default function Drafts() {
  const navigate = useNavigate()
  const { setSource, setPost } = useCreate()
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      setDrafts(await listDrafts())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const resume = (d: Draft) => {
    setSource(d.blob)
    setPost({
      caption: d.caption,
      link: d.link,
      location: d.location,
      visibility: d.visibility,
      allowComments: d.allowComments,
    })
    navigate('/create/post')
  }

  const remove = async (id: string) => {
    await deleteDraft(id)
    void load()
  }

  return (
    <>
      <div className="creator-topbar">
        <button className="creator-close static" onClick={() => navigate('/create')}>‹</button>
        <span>Drafts</span>
        <div style={{ width: 24 }} />
      </div>

      <div style={{ padding: 16 }}>
        {loading && <p className="muted">Loading…</p>}
        {!loading && drafts.length === 0 && (
          <div className="center-fill">
            <p className="muted">Koi draft nahi hai.</p>
          </div>
        )}
        <div className="draft-grid">
          {drafts.map((d) => (
            <div key={d.id} className="draft-card">
              <button className="draft-thumb" onClick={() => resume(d)}>
                {d.thumbnail ? (
                  <img src={d.thumbnail} alt="draft" />
                ) : (
                  <span>🎬</span>
                )}
              </button>
              <p className="draft-caption">{d.caption || 'Untitled'}</p>
              <button className="draft-delete" onClick={() => remove(d.id)}>Delete</button>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
