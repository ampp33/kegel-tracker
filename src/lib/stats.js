/** Local-time YYYY-MM-DD key for a Date (or ISO string). */
export function dayKey(value) {
  const d = value instanceof Date ? value : new Date(value)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

/** Map of dayKey -> number of sessions completed that day. */
export function countsByDay(sessions) {
  const counts = {}
  for (const s of sessions) {
    const key = dayKey(s.created_at)
    counts[key] = (counts[key] || 0) + 1
  }
  return counts
}

/**
 * Consecutive days with at least one session, counting back from today.
 * Today not being done yet doesn't break the streak — yesterday still anchors it.
 */
export function currentStreak(counts, today = new Date()) {
  let cursor = new Date(today)
  if (!counts[dayKey(cursor)]) {
    cursor = addDays(cursor, -1)
    if (!counts[dayKey(cursor)]) return 0
  }

  let streak = 0
  while (counts[dayKey(cursor)]) {
    streak += 1
    cursor = addDays(cursor, -1)
  }
  return streak
}

/** Longest run of consecutive active days in the whole history. */
export function longestStreak(counts) {
  const days = Object.keys(counts).sort()
  let best = 0
  let run = 0
  let prev = null

  for (const key of days) {
    const date = new Date(`${key}T00:00:00`)
    run = prev && dayKey(addDays(prev, 1)) === key ? run + 1 : 1
    best = Math.max(best, run)
    prev = date
  }
  return best
}

/**
 * 6x7 grid of cells covering the month, padded with neighbouring days so
 * every week row is full. Weeks start on Sunday.
 */
export function monthGrid(year, month) {
  const first = new Date(year, month, 1)
  const start = addDays(first, -first.getDay())
  const cells = []

  for (let i = 0; i < 42; i += 1) {
    const date = addDays(start, i)
    cells.push({
      date,
      key: dayKey(date),
      day: date.getDate(),
      inMonth: date.getMonth() === month
    })
  }
  return cells
}
