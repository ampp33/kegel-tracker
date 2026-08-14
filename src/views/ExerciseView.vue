<template>
  <div class="screen">
    <header class="streaks">
      <div class="streaks__item">
        <span class="streaks__value">{{ store.currentStreak }}</span>
        <span class="streaks__label">day streak</span>
      </div>
      <div class="streaks__divider"></div>
      <div class="streaks__item">
        <span class="streaks__value">{{ store.longestStreak }}</span>
        <span class="streaks__label">best streak</span>
      </div>
    </header>

    <section class="stage">
      <p class="stage__rep">
        <template v-if="status === 'idle'">{{ settings.repetitions }} reps &middot; {{ totalLabel }}</template>
        <template v-else-if="status === 'done'">Session complete</template>
        <template v-else>Rep {{ rep }} of {{ settings.repetitions }}</template>
      </p>

      <div class="circle-wrap">
        <div
          class="circle"
          :class="[`circle--${visualPhase}`, { 'circle--idle': !isActive }]"
          :style="{ transform: `scale(${scale})` }"
        >
          <div class="circle__inner">
            <span class="circle__cue">{{ cue }}</span>
            <span v-if="isActive" class="circle__count">{{ secondsLeft }}</span>
          </div>
        </div>
      </div>

      <div class="progress">
        <div class="progress__bar" :style="{ width: `${sessionProgress * 100}%` }"></div>
      </div>
    </section>

    <section class="controls">
      <button v-if="status === 'idle'" class="btn btn--primary" @click="start">Start</button>

      <button v-else-if="status === 'running'" class="btn btn--primary" @click="pause">Pause</button>

      <template v-else-if="status === 'paused'">
        <button class="btn btn--primary" @click="resume">Resume</button>
        <button class="btn btn--ghost" @click="reset">Reset</button>
      </template>

      <template v-else>
        <button class="btn btn--primary" @click="start">Go again</button>
        <button class="btn btn--ghost" @click="reset">Reset</button>
      </template>
    </section>

    <p v-if="store.error" class="notice">{{ store.error }}</p>

    <transition name="fade">
      <section v-if="!inSession" class="settings">
        <div v-for="field in fields" :key="field.key" class="settings__row">
          <span class="settings__label">{{ field.label }}</span>
          <div class="stepper">
            <button
              class="stepper__btn"
              :disabled="settings[field.key] <= field.min"
              @click="step(field, -field.step)"
            >
              &minus;
            </button>
            <span class="stepper__value">{{ settings[field.key] }}{{ field.unit }}</span>
            <button
              class="stepper__btn"
              :disabled="settings[field.key] >= field.max"
              @click="step(field, field.step)"
            >
              +
            </button>
          </div>
        </div>
      </section>
    </transition>
  </div>
</template>

<script>
import { store, saveSettings, recordSession } from '../lib/store'

const FIELDS = [
  { key: 'squeezeS', label: 'Squeeze', unit: 's', min: 1, max: 30, step: 1 },
  { key: 'relaxS', label: 'Relax', unit: 's', min: 1, max: 30, step: 1 },
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
    visualPhase() {
      return this.isActive ? this.phase : 'rest'
    },
    cue() {
      if (this.status === 'idle') return 'Ready'
      if (this.status === 'done') return 'Nice work'
      return this.phase === 'squeeze' ? 'Squeeze' : 'Relax'
    },
    secondsLeft() {
      return Math.max(1, Math.ceil(this.remainingMs / 1000))
    },
    /** 0 -> 1 through the current phase. */
    phaseProgress() {
      if (!this.isActive) return 0
      return Math.min(1, Math.max(0, 1 - this.remainingMs / this.phaseMs))
    },
    /** Squeeze contracts the circle, relax expands it, both eased over the phase. */
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
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px 20px 8px;
  gap: 16px;
}

.streaks {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 12px 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.streaks__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 84px;
}

.streaks__value {
  font-size: 26px;
  font-weight: 700;
  line-height: 1.1;
}

.streaks__label {
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted);
}

.streaks__divider {
  width: 1px;
  align-self: stretch;
  background: var(--border);
}

.stage {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
  min-height: 0;
}

.stage__rep {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--muted);
}

.circle-wrap {
  display: grid;
  place-items: center;
  width: min(72vw, 260px);
  height: min(72vw, 260px);
}

.circle {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--accent-soft);
  border: 2px solid var(--accent);
  color: var(--accent);
  transition: background 0.4s ease, border-color 0.4s ease, color 0.4s ease;
  will-change: transform;
}

.circle--squeeze {
  background: color-mix(in srgb, var(--squeeze) 14%, transparent);
  border-color: var(--squeeze);
  color: var(--squeeze);
}

.circle--relax {
  background: color-mix(in srgb, var(--relax) 14%, transparent);
  border-color: var(--relax);
  color: var(--relax);
}

.circle--idle {
  animation: breathe 4s ease-in-out infinite;
}

@keyframes breathe {
  0%,
  100% {
    opacity: 0.85;
  }
  50% {
    opacity: 1;
  }
}

.circle__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.circle__cue {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.circle__count {
  font-size: 34px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.progress {
  width: 100%;
  max-width: 260px;
  height: 4px;
  border-radius: 999px;
  background: var(--surface-2);
  overflow: hidden;
}

.progress__bar {
  height: 100%;
  background: var(--accent);
  border-radius: 999px;
}

.controls {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.controls .btn {
  flex: 1;
  max-width: 220px;
}

.notice {
  margin: 0;
  text-align: center;
  font-size: 12px;
  color: var(--muted);
}

.settings {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 14px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.settings__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
}

.settings__row + .settings__row {
  border-top: 1px solid var(--border);
}

.settings__label {
  font-size: 15px;
  font-weight: 600;
}

.stepper {
  display: flex;
  align-items: center;
  gap: 4px;
}

.stepper__btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--surface-2);
  font-size: 18px;
  font-weight: 700;
  line-height: 1;
}

.stepper__btn:disabled {
  opacity: 0.35;
  cursor: default;
}

.stepper__value {
  min-width: 52px;
  text-align: center;
  font-size: 15px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

/* Collapse rather than pop, so the circle slides into place instead of jumping. */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease, max-height 0.35s ease, margin 0.35s ease,
    padding 0.35s ease, border-width 0.35s ease;
  overflow: hidden;
  max-height: 200px;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
  border-width: 0;
}
</style>
