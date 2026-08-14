import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const SESSIONS_TABLE = import.meta.env.VITE_SUPABASE_TABLE || 'sessions'

export const isConfigured = Boolean(url && anonKey)

// `kegel` must be added to the exposed schemas list in Supabase
// (Settings -> API -> Exposed schemas) for these calls to resolve.
export const supabase = isConfigured
  ? createClient(url, anonKey, {
      db: { schema: 'kegel' },
      auth: { persistSession: false }
    })
  : null

function table() {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase.from(SESSIONS_TABLE)
}

/**
 * Log one completed session.
 * Note: the column is spelled `repititions` to match the existing table.
 */
export async function logSession({ squeezeS, relaxS, repetitions }) {
  const { data, error } = await table()
    .insert({ squeeze_s: squeezeS, relax_s: relaxS, repititions: repetitions })
    .select()
    .single()

  if (error) throw error
  return data
}

/** All sessions, newest first. */
export async function fetchSessions() {
  const { data, error } = await table()
    .select('created_at, squeeze_s, relax_s, repititions')
    .order('created_at', { ascending: false })
    .limit(2000)

  if (error) throw error
  return data || []
}
