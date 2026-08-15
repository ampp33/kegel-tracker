<template>
  <div class="screen">
    <p class="eyebrow micro">Stats — all time</p>

    <h1 class="hero">
      <span class="display hero__n">{{ pad(store.currentStreak) }}</span>
      <span class="script hero__w">days.</span>
    </h1>
    <p class="hero__label micro">Current streak</p>

    <section class="figures">
      <div class="figure">
        <span class="figure__n display">{{ pad(store.longestStreak) }}</span>
        <span class="micro">Longest</span>
      </div>
      <div class="figure">
        <span class="figure__n display">{{ pad(store.todayCount) }}</span>
        <span class="micro">Today</span>
      </div>
      <div class="figure">
        <span class="figure__n display">{{ store.sessions.length }}</span>
        <span class="micro">Sessions</span>
      </div>
    </section>

    <section class="calendar">
      <div class="calendar__head">
        <h2 class="calendar__title display">
          {{ monthName }} <span class="calendar__year">{{ year }}</span>
        </h2>
        <div class="calendar__nav">
          <button aria-label="Previous month" @click="shiftMonth(-1)">&larr;</button>
          <button aria-label="Next month" :disabled="atCurrentMonth" @click="shiftMonth(1)">
            &rarr;
          </button>
        </div>
      </div>

      <div class="calendar__weekdays">
        <span v-for="(d, i) in weekdays" :key="i" class="micro">{{ d }}</span>
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

      <p class="calendar__foot micro">
        {{ monthSessions }} session{{ monthSessions === 1 ? '' : 's' }} — {{ monthDays }} day{{
          monthDays === 1 ? '' : 's'
        }}
      </p>
    </section>

    <footer class="foot">
      <button class="btn btn--text foot__refresh" :disabled="store.loading" @click="refresh">
        {{ store.loading ? 'Loading' : 'Refresh' }}
      </button>
      <span v-if="store.error" class="notice">{{ store.error }}</span>
    </footer>
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
    monthName() {
      return new Date(this.year, this.month, 1).toLocaleDateString(undefined, { month: 'long' })
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
    pad(n) {
      return String(n).padStart(2, '0')
    },
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
  padding-bottom: 28px;
}

.eyebrow {
  margin: 0;
  padding: 16px 0 26px;
  border-top: 1px solid var(--rule);
  font-size: 9.5px;
}

/* --- hero streak ------------------------------------------------------ */

.hero {
  margin: 0;
  display: flex;
  align-items: baseline;
  gap: 0.16em;
  flex-wrap: wrap;
}

.hero__n {
  font-size: clamp(76px, 24vw, 128px);
}

.hero__w {
  font-size: clamp(64px, 21vw, 112px);
}

.hero__label {
  margin: 14px 0 26px;
  font-size: 9.5px;
}

/* --- secondary figures ------------------------------------------------ */

.figures {
  display: flex;
  border-top: 1px solid var(--rule);
  border-bottom: 1px solid var(--rule);
}

.figure {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 16px 0;
}

.figure + .figure {
  border-left: 1px solid var(--rule);
  padding-left: 16px;
}

.figure__n {
  font-size: 26px;
  font-variant-numeric: tabular-nums;
}

.figure .micro {
  font-size: 9px;
  letter-spacing: 0.18em;
}

/* --- calendar --------------------------------------------------------- */

.calendar {
  padding-top: 30px;
}

.calendar__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 18px;
}

.calendar__title {
  margin: 0;
  font-size: 34px;
  font-weight: 400;
}

.calendar__year {
  font-size: 14px;
  color: var(--muted);
  letter-spacing: 0.02em;
  margin-left: 4px;
}

.calendar__nav {
  display: flex;
  gap: 2px;
}

.calendar__nav button {
  width: 44px;
  height: 44px;
  font-size: 16px;
  color: var(--ink);
}

.calendar__nav button:disabled {
  opacity: 0.22;
  cursor: default;
}

.calendar__weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--rule);
}

.calendar__weekdays .micro {
  font-size: 9px;
  letter-spacing: 0.08em;
}

.calendar__grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 11px 0 9px;
  min-height: 48px;
}

.cell__day {
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.cell--muted {
  opacity: 0.24;
}

.cell--today .cell__day {
  position: relative;
  font-weight: 600;
}

.cell--today .cell__day::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -4px;
  width: 12px;
  height: 1.5px;
  background: var(--accent);
  transform: translateX(-50%);
}

.cell__dots {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 3px;
  max-width: 28px;
}

.dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--accent);
}

.cell__more {
  font-size: 8px;
  font-style: normal;
  font-weight: 600;
  color: var(--accent);
  line-height: 1;
}

.calendar__foot {
  margin: 18px 0 0;
  padding-top: 16px;
  border-top: 1px solid var(--rule);
  font-size: 9px;
}

/* --- foot ------------------------------------------------------------- */

.foot {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: auto;
  padding-top: 22px;
}

.foot__refresh {
  padding: 0;
  min-height: 44px;
}

.notice {
  font-size: 10px;
  line-height: 1.5;
  color: var(--muted);
}
</style>
