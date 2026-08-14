<template>
  <div class="screen">
    <header class="head">
      <h1 class="head__title">Stats</h1>
      <button class="head__refresh" :disabled="store.loading" @click="refresh">
        {{ store.loading ? 'Loading…' : 'Refresh' }}
      </button>
    </header>

    <section class="tiles">
      <div class="tile">
        <span class="tile__value">{{ store.currentStreak }}</span>
        <span class="tile__label">Current streak</span>
      </div>
      <div class="tile">
        <span class="tile__value">{{ store.longestStreak }}</span>
        <span class="tile__label">Longest streak</span>
      </div>
      <div class="tile">
        <span class="tile__value">{{ store.todayCount }}</span>
        <span class="tile__label">Today</span>
      </div>
      <div class="tile">
        <span class="tile__value">{{ store.sessions.length }}</span>
        <span class="tile__label">All sessions</span>
      </div>
    </section>

    <section class="card calendar">
      <div class="calendar__head">
        <button class="calendar__nav" aria-label="Previous month" @click="shiftMonth(-1)">‹</button>
        <span class="calendar__title">{{ monthLabel }}</span>
        <button
          class="calendar__nav"
          aria-label="Next month"
          :disabled="atCurrentMonth"
          @click="shiftMonth(1)"
        >
          ›
        </button>
      </div>

      <div class="calendar__weekdays">
        <span v-for="d in weekdays" :key="d">{{ d }}</span>
      </div>

      <div class="calendar__grid">
        <div
          v-for="cell in cells"
          :key="cell.key"
          class="cell"
          :class="{ 'cell--muted': !cell.inMonth, 'cell--today': cell.key === todayKey }"
        >
          <span class="cell__day">{{ cell.day }}</span>
          <span class="cell__dots">
            <i v-for="n in Math.min(counts[cell.key] || 0, 4)" :key="n" class="dot"></i>
            <i v-if="(counts[cell.key] || 0) > 4" class="cell__more">
              +{{ (counts[cell.key] || 0) - 4 }}
            </i>
          </span>
        </div>
      </div>

      <p class="calendar__foot">
        {{ monthSessions }} session{{ monthSessions === 1 ? '' : 's' }} this month across
        {{ monthDays }} day{{ monthDays === 1 ? '' : 's' }}
      </p>
    </section>

    <p v-if="store.error" class="notice">{{ store.error }}</p>
  </div>
</template>

<script>
import { store, loadSessions } from '../lib/store'
import { dayKey, monthGrid } from '../lib/stats'

export default {
  name: 'StatsView',
  data() {
    const now = new Date()
    return {
      store,
      weekdays: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
      year: now.getFullYear(),
      month: now.getMonth()
    }
  },
  computed: {
    cells() {
      return monthGrid(this.year, this.month)
    },
    // Cached here so the 42-cell render doesn't rebuild store's map per lookup.
    counts() {
      return store.counts
    },
    monthLabel() {
      return new Date(this.year, this.month, 1).toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric'
      })
    },
    todayKey() {
      return dayKey(new Date())
    },
    atCurrentMonth() {
      const now = new Date()
      return this.year === now.getFullYear() && this.month === now.getMonth()
    },
    monthCells() {
      return this.cells.filter((c) => c.inMonth)
    },
    monthSessions() {
      return this.monthCells.reduce((sum, c) => sum + (this.counts[c.key] || 0), 0)
    },
    monthDays() {
      return this.monthCells.filter((c) => this.counts[c.key]).length
    }
  },
  mounted() {
    loadSessions()
  },
  methods: {
    shiftMonth(delta) {
      const d = new Date(this.year, this.month + delta, 1)
      this.year = d.getFullYear()
      this.month = d.getMonth()
    },
    refresh() {
      loadSessions({ force: true })
    }
  }
}
</script>

<style scoped>
.screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px 20px 20px;
}

.head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.head__title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
}

.head__refresh {
  font-size: 13px;
  font-weight: 600;
  color: var(--accent);
}

.head__refresh:disabled {
  color: var(--muted);
  cursor: default;
}

.tiles {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.tile {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 14px 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.tile__value {
  font-size: 24px;
  font-weight: 700;
  line-height: 1.1;
}

.tile__label {
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted);
}

.calendar {
  padding: 14px;
}

.calendar__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.calendar__title {
  font-size: 16px;
  font-weight: 700;
}

.calendar__nav {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--surface-2);
  font-size: 18px;
  line-height: 1;
}

.calendar__nav:disabled {
  opacity: 0.3;
  cursor: default;
}

.calendar__weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  color: var(--muted);
  margin-bottom: 4px;
}

.calendar__grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 5px 0 6px;
  border-radius: 10px;
  min-height: 44px;
}

.cell--muted {
  opacity: 0.3;
}

.cell--today {
  background: var(--accent-soft);
  outline: 1px solid var(--accent);
}

.cell__day {
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.cell__dots {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 2px;
  max-width: 26px;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
}

.cell__more {
  font-size: 9px;
  font-style: normal;
  font-weight: 700;
  color: var(--accent);
  line-height: 1;
}

.calendar__foot {
  margin: 12px 0 0;
  text-align: center;
  font-size: 12px;
  color: var(--muted);
}

.notice {
  margin: 0;
  text-align: center;
  font-size: 12px;
  color: var(--muted);
}
</style>
