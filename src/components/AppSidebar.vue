<template>
  <aside :class="['sidebar', { 'sidebar--collapsed': collapsed }]">
    <!-- Brand -->
    <div class="sidebar__brand">
      <div class="brand-icon">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path d="M14 2L26 8v12L14 26 2 20V8L14 2z" stroke="#00D4C8" stroke-width="1.5" fill="none"/>
          <path d="M14 7l7 3.5v7L14 21l-7-3.5v-7L14 7z" fill="#00D4C8" fill-opacity="0.2"/>
          <circle cx="14" cy="14" r="3" fill="#00D4C8"/>
        </svg>
      </div>
      <span class="brand-name">Financial Pilot</span>
    </div>

    <!-- Nav links -->
    <nav class="sidebar__nav">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="nav-item"
        active-class="nav-item--active"
      >
        <span class="nav-item__icon" v-html="item.icon" />
        <span class="nav-item__label">{{ item.label }}</span>
        <span v-if="item.badge" class="nav-item__badge">{{ item.badge }}</span>
      </RouterLink>
    </nav>

    <!-- User footer -->
    <div class="sidebar__footer">
      <div class="sidebar__user">
        <div class="user-avatar">{{ store.user.avatarInitials }}</div>
        <div class="user-info">
          <span class="user-name">{{ store.user.name.split(' ')[0] }}</span>
          <span class="user-role">{{ store.user.customerType }}</span>
        </div>
      </div>
      <button class="logout-btn" @click="logout" title="Sign out">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
      </button>
    </div>
  </aside>

  <!-- Mobile bottom nav -->
  <nav class="mobile-nav">
    <RouterLink
      v-for="item in navItems"
      :key="item.to + '-m'"
      :to="item.to"
      class="mobile-nav__item"
      active-class="mobile-nav__item--active"
    >
      <span v-html="item.icon" />
      <span>{{ item.shortLabel }}</span>
    </RouterLink>
  </nav>
</template>

<script setup>
import { RouterLink, useRouter } from 'vue-router'
import { ref, computed } from 'vue'
import { useFinanceStore } from '../stores/finance.js'

const store    = useFinanceStore()
const router   = useRouter()
const collapsed = ref(false)

const dashboardRoute = computed(() =>
  store.user.customerType === 'Corporate' ? '/corporate-dashboard' : '/dashboard'
)

const navItems = computed(() => [
  {
    to: dashboardRoute.value,
    label: 'Dashboard',
    shortLabel: 'Home',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>`,
  },
  {
    to: '/profile',
    label: 'Profile & Settings',
    shortLabel: 'Profile',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  },
  {
    to: '/goal-optimisation',
    label: 'Goal Optimisation',
    shortLabel: 'Goals',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
  },
  {
    to: '/virtual-wallet',
    label: 'Virtual Wallet',
    shortLabel: 'Wallet',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`,
  },
])

function logout() {
  const nric = sessionStorage.getItem('nric')
  if (nric) localStorage.removeItem(`fp_goal_${nric}`)
  sessionStorage.clear()
  localStorage.removeItem('token')
  localStorage.removeItem('role')
  localStorage.removeItem('customerType')
  store.initFromSession()
  router.push('/login')
}
</script>

<style scoped>
/* ── Sidebar ── */
.sidebar {
  width: var(--sidebar-w);
  min-height: 100vh;
  background: var(--surface);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0; top: 0;
  z-index: 100;
  transition: width var(--tr);
}

/* Brand */
.sidebar__brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem 1.25rem 1.25rem;
  border-bottom: 1px solid var(--border);
}
.brand-icon { flex-shrink: 0; }
.brand-name {
  font-family: var(--font-head);
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.01em;
  white-space: nowrap;
}

/* Nav */
.sidebar__nav {
  flex: 1;
  padding: 1rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.85rem;
  border-radius: 10px;
  color: var(--text-2);
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  transition: all var(--tr);
  position: relative;
}
.nav-item:hover {
  background: var(--surface-2);
  color: var(--text);
}
.nav-item--active {
  background: var(--teal-dim);
  color: var(--teal);
  border: 1px solid rgba(0, 212, 200, 0.2);
}
.nav-item--active .nav-item__icon { color: var(--teal); }
.nav-item__icon { flex-shrink: 0; display: flex; }
.nav-item__label { white-space: nowrap; }
.nav-item__badge {
  margin-left: auto;
  background: var(--teal);
  color: #0A0F1E;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 20px;
}

/* Footer */
.sidebar__footer {
  padding: 1rem 1rem 1.25rem;
  border-top: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.sidebar__user {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex: 1;
  min-width: 0;
}
.user-avatar {
  width: 32px; height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--teal), #0070a8);
  color: #0A0F1E;
  font-size: 0.7rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.user-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.user-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.user-role { font-size: 0.7rem; color: var(--text-3); }
.logout-btn {
  background: none;
  border: none;
  color: var(--text-3);
  padding: 4px;
  border-radius: 6px;
  display: flex;
  cursor: pointer;
  transition: all var(--tr);
  flex-shrink: 0;
}
.logout-btn:hover { color: var(--danger); background: rgba(239,68,68,0.1); }

/* ── Mobile nav ── */
.mobile-nav {
  display: none;
}

@media (max-width: 768px) {
  .sidebar { display: none; }
  .mobile-nav {
    display: flex;
    position: fixed;
    bottom: 0; left: 0; right: 0;
    background: var(--surface);
    border-top: 1px solid var(--border);
    z-index: 100;
    padding: 0.5rem 0;
  }
  .mobile-nav__item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    padding: 0.4rem 0.25rem;
    color: var(--text-3);
    font-size: 0.6rem;
    font-weight: 500;
    text-decoration: none;
    transition: color var(--tr);
  }
  .mobile-nav__item--active { color: var(--teal); }
}
</style>
