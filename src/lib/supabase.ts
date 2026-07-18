import { createClient } from '@supabase/supabase-js'

const rawUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim()
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

function normalizeSupabaseUrl(value: string | undefined): string {
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value.replace(/\/+$/, '')
  return `https://${value}.supabase.co`
}

const supabaseUrl = normalizeSupabaseUrl(rawUrl)

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase env vars missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey ?? '')

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)
