export default function ConfigNotice() {
  return (
    <div className="app-shell">
      <div className="center-fill">
        <h1>⚙️ Hunar setup needed</h1>
        <p className="muted">
          Supabase environment variables are missing. Create a <code>.env</code> file in the
          project root (copy <code>.env.example</code>) and fill in:
        </p>
        <div
          style={{
            textAlign: 'left',
            background: 'var(--surface-2)',
            padding: 12,
            borderRadius: 8,
            fontSize: 13,
            width: '100%',
          }}
        >
          <div>VITE_SUPABASE_URL=…</div>
          <div>VITE_SUPABASE_ANON_KEY=…</div>
          <div>VITE_CLOUDINARY_CLOUD_NAME=…</div>
          <div>VITE_CLOUDINARY_UPLOAD_PRESET=…</div>
        </div>
        <p className="muted" style={{ fontSize: 13 }}>
          Then run the SQL in <code>supabase/schema.sql</code> and restart the dev server.
        </p>
      </div>
    </div>
  )
}
