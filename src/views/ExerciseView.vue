<template>
  <div class="screen">
    <section class="marks">
      <div class="mark">
        <span class="mark__n display">{{ pad(store.currentStreak) }}</span>
        <span class="mark__l micro">Streak</span>
      </div>
      <div class="mark">
        <span class="mark__n display">{{ pad(store.todayCount) }}</span>
        <span class="mark__l micro">Today</span>
      </div>
      <div class="mark">
        <span class="mark__n display">{{ pad(store.longestStreak) }}</span>
        <span class="mark__l micro">Best ever</span>
      </div>
    </section>

    <p class="eyebrow micro">{{ eyebrow }}</p>

    <section class="stage">
      <div class="orb-wrap">
        <div class="orb" :class="`orb--${orbState}`" :style="{ transform: `scale(${scale})` }">
          <span v-if="isActive" class="orb__n display">{{ secondsLeft }}</span>
        </div>
      </div>

      <h1 class="cue" :class="cueScript ? 'script' : 'display'">{{ cue }}</h1>
    </section>

    <div class="tick" aria-hidden="true">
      <span class="tick__fill" :style="{ width: `${sessionProgress * 100}%` }"></span>
    </div>

    <section class="controls">
      <button v-if="status === 'idle'" class="btn" @click="start">Begin</button>

      <button v-else-if="status === 'running'" class="btn" @click="pause">Pause</button>

      <template v-else-if="status === 'paused'">
        <button class="btn" @click="resume">Resume</button>
        <button class="btn btn--text" @click="reset">Reset</button>
      </template>

      <template v-else>
        <button class="btn" @click="start">Go again</button>
        <button class="btn btn--text" @click="reset">Reset</button>
      </template>
    </section>

    <p v-if="store.error" class="notice">{{ store.error }}</p>

    <transition name="collapse">
      <section v-if="!inSession" class="settings">
        <div v-for="field in fields" :key="field.key" class="settings__row">
          <span class="settings__label micro">{{ field.label }}</span>
          <div class="stepper">
            <button
              class="stepper__btn"
              :aria-label="`Decrease ${field.label}`"
              :disabled="settings[field.key] <= field.min"
              @click="step(field, -field.step)"
            >
              &minus;
            </button>
            <span class="stepper__value display">{{ settings[field.key] }}{{ field.unit }}</span>
            <button
              class="stepper__btn"
              :aria-label="`Increase ${field.label}`"
              :disabled="settings[field.key] >= field.max"
              @click="step(field, field.step)"
            >
              +
            </button>
          </div>
        </div>
      </section>
    </transition>

    <aside v-if="isActive" class="spine" aria-hidden="true">
      <span class="spine__text micro">{{ phase === 'squeeze' ? 'Hold' : 'Release' }}</span>
      <span class="spine__rule"></span>
    </aside>
  </div>
</template>

<script>
import { store, saveSettings, recordSession } from '../lib/store'

const FIELDS = [
  { key: 'squeezeS', label: 'Hold', unit: 's', min: 1, max: 30, step: 1 },
  { key: 'relaxS', label: 'Release', unit: 's', min: 1, max: 30, step: 1 },
  { key: 'repetitions', label: 'Reps', unit: '', min: 1, max: 60, step: 1 }
]

export default {
  name: 'ExerciseView',
  data() {
    return {
      store,
      fields: FIELDS,
      status: 'idle', // idle | running | paused | done
      phase: 'squeeze',
      rep: 1,
      phaseEndsAt: 0,
      remainingMs: 0,
      frame: null
    }
  },
  computed: {
    settings() {
      return store.settings
    },
    isActive() {
      return this.status === 'running' || this.status === 'paused'
    },
    inSession() {
      return this.isActive
    },
    phaseMs() {
      return (this.phase === 'squeeze' ? this.settings.squeezeS : this.settings.relaxS) * 1000
    },
    orbState() {
      if (!this.isActive) return 'idle'
      return this.phase
    },
    cue() {
      if (this.status === 'idle') return 'Ready'
      if (this.status === 'done') return 'nice.'
      return this.phase === 'squeeze' ? 'Squeeze' : 'release.'
    },
    /** Relax and finish get the pink italic serif; squeeze gets the slab. */
    cueScript() {
      return this.status === 'done' || (this.isActive && this.phase === 'relax')
    },
    eyebrow() {
      if (this.status === 'done') return 'Session complete'
      if (this.isActive) return `Rep ${this.pad(this.rep)} / ${this.pad(this.settings.repetitions)}`
      return `${this.settings.repetitions} reps — ${this.settings.squeezeS}s / ${this.settings.relaxS}s — ${this.totalLabel}`
    },
    secondsLeft() {
      return Math.max(1, Math.ceil(this.remainingMs / 1000))
    },
    /** 0 -> 1 through the current phase. */
    phaseProgress() {
      if (!this.isActive) return 0
      return Math.min(1, Math.max(0, 1 - this.remainingMs / this.phaseMs))
    },
    /** Squeeze contracts the orb, release expands it, both eased over the phase. */
    scale() {
      if (!this.isActive) return 0.78
      const eased = 0.5 - 0.5 * Math.cos(Math.PI * this.phaseProgress)
      return this.phase === 'squeeze' ? 1 - 0.45 * eased : 0.55 + 0.45 * eased
    },
    sessionProgress() {
      if (this.status === 'done') return 1
      if (!this.isActive) return 0
      const total = this.settings.repetitions * (this.settings.squeezeS + this.settings.relaxS)
      const before = (this.rep - 1) * (this.settings.squeezeS + this.settings.relaxS)
      const inRep =
        this.phase === 'squeeze'
          ? this.settings.squeezeS * this.phaseProgress
          : this.settings.squeezeS + this.settings.relaxS * this.phaseProgress
      return Math.min(1, (before + inRep) / total)
    },
    totalLabel() {
      const total = this.settings.repetitions * (this.settings.squeezeS + this.settings.relaxS)
      const m = Math.floor(total / 60)
      const s = total % 60
      return m ? `${m}m ${s ? `${s}s` : ''}`.trim() : `${s}s`
    }
  },
  beforeUnmount() {
    this.stopLoop()
  },
  methods: {
    pad(n) {
      return String(n).padStart(2, '0')
    },
    step(field, delta) {
      const next = Math.min(field.max, Math.max(field.min, this.settings[field.key] + delta))
      saveSettings({ [field.key]: next })
    },
    start() {
      this.status = 'running'
      this.phase = 'squeeze'
      this.rep = 1
      this.remainingMs = this.settings.squeezeS * 1000
      this.phaseEndsAt = Date.now() + this.remainingMs
      this.buzz(20)
      this.startLoop()
    },
    pause() {
      if (this.status !== 'running') return
      this.status = 'paused'
      this.remainingMs = Math.max(0, this.phaseEndsAt - Date.now())
      this.stopLoop()
    },
    resume() {
      if (this.status !== 'paused') return
      this.status = 'running'
      this.phaseEndsAt = Date.now() + this.remainingMs
      this.startLoop()
    },
    reset() {
      this.stopLoop()
      this.status = 'idle'
      this.phase = 'squeeze'
      this.rep = 1
      this.remainingMs = 0
    },
    startLoop() {
      this.stopLoop()
      const tick = () => {
        this.tick()
        if (this.status === 'running') this.frame = requestAnimationFrame(tick)
      }
      this.frame = requestAnimationFrame(tick)
    },
    stopLoop() {
      if (this.frame) cancelAnimationFrame(this.frame)
      this.frame = null
    },
    tick() {
      this.remainingMs = this.phaseEndsAt - Date.now()
      // Loop rather than branch: a backgrounded tab can skip past several phases.
      while (this.remainingMs <= 0 && this.status === 'running') {
        this.advance()
      }
    },
    advance() {
      if (this.phase === 'squeeze') {
        this.phase = 'relax'
        this.phaseEndsAt += this.settings.relaxS * 1000
        this.buzz(20)
      } else if (this.rep >= this.settings.repetitions) {
        this.finish()
        return
      } else {
        this.rep += 1
        this.phase = 'squeeze'
        this.phaseEndsAt += this.settings.squeezeS * 1000
        this.buzz(20)
      }
      this.remainingMs = this.phaseEndsAt - Date.now()
    },
    finish() {
      this.stopLoop()
      this.status = 'done'
      this.remainingMs = 0
      this.buzz([40, 60, 40])
      recordSession({
        squeezeS: this.settings.squeezeS,
        relaxS: this.settings.relaxS,
        repetitions: this.settings.repetitions
      })
    },
    buzz(pattern) {
      if (navigator.vibrate) navigator.vibrate(pattern)
    }
  }
}
</script>

<style scoped>
.screen {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  padding-bottom: 18px;
}

/* --- streak marks ---------------------------------------------------- */

.marks {
  display: flex;
  gap: 34px;
  padding: 16px 0;
  border-top: 1px solid var(--rule);
}

.mark {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mark__n {
  font-size: 30px;
}

.mark__l {
  font-size: 9px;
  letter-spacing: 0.2em;
}

.eyebrow {
  margin: 0;
  padding: 14px 0;
  border-top: 1px solid var(--rule);
  font-size: 9.5px;
}

/* --- stage ----------------------------------------------------------- */

.stage {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 26px;
  min-height: 0;
  padding: 10px 0 22px;
}

.orb-wrap {
  align-self: center;
  display: grid;
  place-items: center;
  width: min(52vw, 200px);
  height: min(52vw, 200px);
}

.orb {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: grid;
  place-items: center;
  border: 1.5px solid var(--rule);
  transition: background-color 0.45s ease, border-color 0.45s ease, color 0.45s ease;
  will-change: transform;
}

.orb--squeeze {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

.orb--relax {
  background: transparent;
  border-color: var(--ink);
  color: var(--ink);
}

.orb__n {
  font-size: 54px;
  letter-spacing: -0.04em;
  font-variant-numeric: tabular-nums;
}

/* The headline: the whole point of the layout. Fixed box height so the slab
   and the taller italic swap without shunting the orb up and down. */
.cue {
  margin: 0;
  width: 100%;
  display: flex;
  align-items: flex-end;
  min-height: clamp(72px, 23vw, 118px);
  font-size: clamp(54px, 17vw, 92px);
}

.cue.script {
  font-size: clamp(64px, 21vw, 108px);
  margin-left: -0.03em;
}

/* --- progress hairline ----------------------------------------------- */

.tick {
  position: relative;
  height: 1px;
  background: var(--rule);
  margin-bottom: 22px;
}

.tick__fill {
  position: absolute;
  inset: 0 auto 0 0;
  height: 100%;
  background: var(--accent);
}

/* --- controls -------------------------------------------------------- */

.controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.controls .btn:first-child {
  flex: 1;
  max-width: 260px;
}

.notice {
  margin: 14px 0 0;
  font-size: 11px;
  line-height: 1.5;
  color: var(--muted);
}

/* --- settings -------------------------------------------------------- */

.settings {
  margin-top: 22px;
  border-top: 1px solid var(--rule);
}

.settings__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0;
}

.settings__row + .settings__row {
  border-top: 1px solid var(--rule);
}

.settings__label {
  font-size: 9.5px;
}

.stepper {
  display: flex;
  align-items: center;
}

.stepper__btn {
  width: 46px;
  height: 46px;
  font-size: 19px;
  line-height: 1;
  color: var(--ink);
  transition: opacity 0.15s ease;
}

.stepper__btn:disabled {
  opacity: 0.22;
  cursor: default;
}

.stepper__value {
  min-width: 62px;
  text-align: center;
  font-size: 20px;
  font-variant-numeric: tabular-nums;
}

/* Collapse instead of popping, so the headline slides rather than jumps. */
.collapse-enter-active,
.collapse-leave-active {
  transition: opacity 0.25s ease, max-height 0.35s ease, margin 0.35s ease,
    border-width 0.35s ease;
  overflow: hidden;
  max-height: 200px;
}

.collapse-enter-from,
.collapse-leave-to {
  opacity: 0;
  max-height: 0;
  margin-top: 0;
  border-top-width: 0;
}

/* --- vertical spine label (wide screens only) ------------------------- */

.spine {
  position: absolute;
  top: 34%;
  right: -14px;
  display: none;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.spine__text {
  writing-mode: vertical-rl;
  font-size: 9px;
  letter-spacing: 0.3em;
}

.spine__rule {
  width: 1px;
  height: 64px;
  background: var(--rule);
}

@media (min-width: 460px) {
  .spine {
    display: flex;
  }
}
</style>
