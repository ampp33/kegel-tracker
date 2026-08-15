<template>
  <div class="app">
    <header class="masthead">
      <router-link to="/" class="logo">Hold<span class="logo__amp">&amp;</span>Release</router-link>
      <nav class="nav">
        <router-link class="nav__link" to="/" exact-active-class="nav__link--on">Train</router-link>
        <router-link class="nav__link" to="/stats" exact-active-class="nav__link--on">Stats</router-link>
      </nav>
    </header>

    <main class="app__body">
      <router-view />
    </main>
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
  max-width: 560px;
  margin: 0 auto;
  padding: 0 22px env(safe-area-inset-bottom);
}

.masthead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22px 0 18px;
}

.logo {
  font-family: var(--display);
  font-size: 14px;
  letter-spacing: -0.01em;
  text-transform: uppercase;
  text-decoration: none;
  color: var(--ink);
}

/* Playfair's italic ampersand — echoes the pink script cue on the timer.
   Sized up slightly: the serif reads smaller than Archivo Black at the same em. */
.logo__amp {
  font-family: var(--serif);
  font-style: italic;
  font-weight: 600;
  font-size: 1.15em;
  letter-spacing: 0;
  margin: 0 0.1em;
  color: var(--accent);
}

.nav {
  display: flex;
  gap: 4px;
}

.nav__link {
  display: inline-flex;
  align-items: center;
  padding: 8px 10px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  text-decoration: none;
  color: var(--muted);
  transition: color 0.15s ease;
}

.nav__link--on {
  color: var(--ink);
  box-shadow: inset 0 -2px 0 var(--accent);
}

.app__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
</style>
