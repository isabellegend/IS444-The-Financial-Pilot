import { createRouter, createWebHistory } from 'vue-router'

const isLoggedIn = () => !!localStorage.getItem('token')
const getRole    = () => localStorage.getItem('role') || 'employee'

const routes = [
  // Public
  { path: '/login', component: () => import('./views/Login.vue') },

  // Employee shell — Dashboard, Profile, Chatbot, Debit Card
  {
    path: '/',
    component: () => import('./components/AppShell.vue'),
    meta: { auth: true, role: 'employee' },
    redirect: '/dashboard',
    children: [
      { path: 'dashboard',  name: 'Dashboard', component: () => import('./views/Dashboard.vue')  },
      { path: 'profile',    name: 'Profile',   component: () => import('./views/Profile.vue')    },
      { path: 'chatbot',    name: 'Chatbot',   component: () => import('./views/Chatbot.vue')    },
      { path: 'debit-card', name: 'DebitCard', component: () => import('./views/DebitCard.vue')  },
    ],
  },

  // Employer shell — Payroll portal
  {
    path: '/employer-portal',
    component: () => import('./components/EmployerShell.vue'),
    meta: { auth: true, role: 'employer' },
    children: [
      { path: '', name: 'EmployerPortal', component: () => import('./views/Employer.vue') },
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

// Auth + role guard
router.beforeEach((to, _from, next) => {
  const loggedIn = isLoggedIn()
  const role     = getRole()

  if (to.meta.auth && !loggedIn) return next('/login')

  if (to.path === '/login' && loggedIn) {
    return next(role === 'employer' ? '/employer-portal' : '/dashboard')
  }

  // Prevent employees from accessing employer portal and vice versa
  if (to.meta.role === 'employer' && loggedIn && role !== 'employer') return next('/dashboard')
  if (to.meta.role === 'employee' && loggedIn && role !== 'employee') return next('/employer-portal')

  next()
})

export default router
