import { createRouter, createWebHistory } from 'vue-router'

const isLoggedIn    = () => !!localStorage.getItem('token')
const customerType  = () => localStorage.getItem('customerType') || 'Retail'
const defaultHome   = () => customerType() === 'Corporate' ? '/corporate-dashboard' : '/dashboard'

const routes = [
  // Public
  { path: '/login', component: () => import('./views/Login.vue') },

  // Retail app shell — Dashboard, Profile, Goals, Debit Card
  {
    path: '/',
    component: () => import('./components/AppShell.vue'),
    meta: { auth: true },
    redirect: () => defaultHome(),
    children: [
      { path: 'dashboard',          name: 'Dashboard',       component: () => import('./views/Dashboard.vue')         },
      { path: 'profile',            name: 'Profile',         component: () => import('./views/Profile.vue')           },
      { path: 'goal-optimisation',  name: 'GoalOptimisation',component: () => import('./views/GoalOptimisation.vue')  },
      { path: 'virtual-wallet',     name: 'VirtualWallet',   component: () => import('./views/VirtualWallet.vue')     },
    ],
  },

  // Corporate shell — Payroll portal
  {
    path: '/corporate-dashboard',
    component: () => import('./components/CorporateShell.vue'),
    meta: { auth: true },
    children: [
      { path: '', name: 'CorporateDashboard', component: () => import('./views/CorporateDashboard.vue') },
    ],
  },

  // 404
  { path: '/:pathMatch(.*)*', component: () => import('./views/NotFound.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

// Auth guard
router.beforeEach((to, _from, next) => {
  const loggedIn = isLoggedIn()

  if (to.meta.auth && !loggedIn) return next('/login')
  if (to.path === '/login' && loggedIn) return next(defaultHome())

  next()
})

export default router
