import { createRouter, createWebHistory } from 'vue-router'

const isLoggedIn = () => !!localStorage.getItem('token')

const routes = [
  // Public pages
  { path: '/',       component: () => import('./views/Home.vue')  },
  { path: '/login',  component: () => import('./views/Login.vue') },

  // Protected pages — add more here as needed
  { path: '/dashboard', component: () => import('./views/Dashboard.vue'), meta: { auth: true } },
  { path: '/profile',   component: () => import('./views/Profile.vue'),   meta: { auth: true } },

  // 404
  { path: '/:pathMatch(.*)*', component: () => import('./views/NotFound.vue') }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

// Auth guard — redirect to login if not logged in
router.beforeEach((to, _from, next) => {
  if (to.meta.auth && !isLoggedIn()) return next('/login')
  if (to.path === '/login' && isLoggedIn()) return next('/dashboard')
  next()
})

export default router
