import { createRouter, createWebHistory } from 'vue-router'

const isLoggedIn = () => !!localStorage.getItem('token')

const routes = [
  // Public
  { path: '/login', component: () => import('./views/Login.vue') },

  // App shell — Dashboard, Profile, Chatbot, Debit Card
  {
    path: '/',
    component: () => import('./components/AppShell.vue'),
    meta: { auth: true },
    redirect: '/dashboard',
    children: [
      { path: 'dashboard',  name: 'Dashboard', component: () => import('./views/Dashboard.vue')  },
      { path: 'profile',    name: 'Profile',   component: () => import('./views/Profile.vue')    },
      { path: 'chatbot',    name: 'Chatbot',   component: () => import('./views/Chatbot.vue')    },
      { path: 'debit-card', name: 'DebitCard', component: () => import('./views/DebitCard.vue')  },
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
  if (to.path === '/login' && loggedIn) return next('/dashboard')

  next()
})

export default router
