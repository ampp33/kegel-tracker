import { reactive } from 'vue'
import { fetchSessions, isConfigured, logSession } from './supabase'
import { countsByDay, currentStreak, dayKey, longestStreak } from './stats'

const SETTINGS_KEY = 'kegel-tracker:settings'

function loadSettings() {
  const defaults = { squeezeS: 3, relaxS: 3, repetitions: 12 }
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') }
  } catch {
    return defaults
  }
}

export const store = reactive({
  sessions: [],
  loading: false,
  loaded: false,
  error: '',
  configured: isConfigured,
  settings: loadSettings(),

  get counts() {
    return countsByDay(this.sessions)
  },
  get currentStreak() {
    return currentStreak(this.counts)
  },
  get longestStreak() {
    return longestStreak(this.counts)
  },
  get todayCount() {
    return this.counts[dayKey(new Date())] || 0
  }
})

export function saveSettings(settings) {
  store.settings = { ...store.settings, ...settings }
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(store.settings))
}

export async function loadSessions({ force = false } = {}) {
  if (!store.configured) {
    store.error = 'Supabase is not configured — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
    return
  }
  if (store.loading || (store.loaded && !force)) return

  store.loading = true
  store.error = ''
  try {
    store.sessions = await fetchSessions()
    store.loaded = true
  } catch (err) {
    store.error = err.message || 'Could not load sessions.'
  } finally {
    store.loading = false
  }
}

/** Persist a finished session and fold it into the in-memory list. */
export async function recordSession({ squeezeS, relaxS, repetitions }) {
  if (!store.configured) {
    store.error = 'Session finished, but Supabase is not configured so it was not saved.'
    return null
  }
  try {
    const row = await logSession({ squeezeS, relaxS, repetitions })
    store.sessions = [row, ...store.sessions]
    store.error = ''
    return row
  } catch (err) {
    store.error = err.message || 'Could not save that session.'
    return null
  }
}
