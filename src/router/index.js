import { createRouter, createWebHashHistory } from 'vue-router'
import ExerciseView from '../views/ExerciseView.vue'
import StatsView from '../views/StatsView.vue'

// Hash history: GitHub Pages has no server-side rewrite, so a deep link with
// history mode would 404 on refresh.
export default createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'exercise', component: ExerciseView },
    { path: '/stats', name: 'stats', component: StatsView },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ]
})
