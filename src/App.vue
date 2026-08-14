<template>
  <div class="app">
    <main class="app__body">
      <router-view />
    </main>

    <nav class="tabs">
      <router-link class="tabs__item" to="/" exact-active-class="tabs__item--on">
        <span class="tabs__icon">◉</span>
        <span>Exercise</span>
      </router-link>
      <router-link class="tabs__item" to="/stats" exact-active-class="tabs__item--on">
        <span class="tabs__icon">▦</span>
        <span>Stats</span>
      </router-link>
    </nav>
  </div>
</template>

<script>
import { loadSessions } from './lib/store'

export default {
  name: 'App',
  mounted() {
    loadSessions()
  }
}
</script>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-height: 100dvh;
  max-width: 520px;
  margin: 0 auto;
}

.app__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.tabs {
  position: sticky;
  bottom: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: var(--surface);
  border-top: 1px solid var(--border);
  padding-bottom: env(safe-area-inset-bottom);
}

.tabs__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 10px 0 12px;
  text-decoration: none;
  color: var(--muted);
  font-size: 12px;
  font-weight: 600;
}

.tabs__item--on {
  color: var(--accent);
}

.tabs__icon {
  font-size: 18px;
  line-height: 1;
}
</style>
