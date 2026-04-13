<template>
  <div class="shell">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar__brand">
        <div class="brand-icon">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M14 2L26 8v12L14 26 2 20V8L14 2z" stroke="#00D4C8" stroke-width="1.5" fill="none"/>
            <path d="M14 7l7 3.5v7L14 21l-7-3.5v-7L14 7z" fill="#00D4C8" fill-opacity="0.2"/>
            <circle cx="14" cy="14" r="3" fill="#00D4C8"/>
          </svg>
        </div>
        <div>
          <span class="brand-name">Financial Pilot</span>
          <span class="brand-sub">Corporate Portal</span>
        </div>
      </div>

      <nav class="sidebar__nav">
        <RouterLink to="/corporate-dashboard" class="nav-item" active-class="nav-item--active">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <rect x="2" y="7" width="20" height="14" rx="2"/>
            <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
          </svg>
          <span>Payroll</span>
        </RouterLink>
      </nav>

      <div class="sidebar__footer">
        <div class="sidebar__user">
          <div class="user-avatar">{{ store.company.avatarInitials }}</div>
          <div class="user-info">
            <span class="user-name">{{ store.company.name.split(' ')[0] }}</span>
            <span class="user-role">Corporate</span>
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

    <!-- Mobile top bar -->
    <div class="mobile-topbar">
      <div class="brand-icon-sm">
        <svg width="18" height="18" viewBox="0 0 28 28" fill="none">
          <path d="M14 2L26 8v12L14 26 2 20V8L14 2z" stroke="#00D4C8" stroke-width="1.5" fill="none"/>
          <circle cx="14" cy="14" r="2.5" fill="#00D4C8"/>
        </svg>
      </div>
      <span class="mobile-brand">Financial Pilot</span>
      <button class="logout-btn" @click="logout">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
      </button>
    </div>

    <main class="shell__main">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { RouterView, RouterLink, useRouter } from 'vue-router'
import { useCorporateStore } from '../stores/corporate.js'

const store  = useCorporateStore()
const router = useRouter()

function logout() {
  sessionStorage.clear()
  localStorage.removeItem('token')
  localStorage.removeItem('role')
  localStorage.removeItem('customerType')
  store.initFromSession()
  router.push('/login')
}
</script>

<style scoped>
.shell {
  display: flex;
  min-height: 100vh;
}

/* Sidebar */
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
}

.sidebar__brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem 1.25rem 1.25rem;
  border-bottom: 1px solid var(--border);
}
.brand-icon { flex-shrink: 0; }
.brand-name {
  display: block;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text);
  line-height: 1.2;
}
.brand-sub {
  display: block;
  font-size: 0.65rem;
  font-weight: 500;
  color: var(--teal);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-top: 1px;
}

.sidebar__nav {
  flex: 1;
  padding: 1rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 2px;
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
}
.nav-item:hover { background: var(--surface-2); color: var(--text); }
.nav-item--active {
  background: var(--teal-dim);
  color: var(--teal);
  border: 1px solid rgba(0,212,200,0.2);
}

.sidebar__footer {
  padding: 1rem 1rem 1.25rem;
  border-top: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.sidebar__user { display: flex; align-items: center; gap: 0.6rem; flex: 1; min-width: 0; }
.user-avatar {
  width: 32px; height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--gold), #c9961a);
  color: #0A0F1E;
  font-size: 0.7rem;
  font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.user-info { display: flex; flex-direction: column; min-width: 0; }
.user-name { font-size: 0.8rem; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.user-role { font-size: 0.7rem; color: var(--gold); }
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

/* Main content */
.shell__main {
  margin-left: var(--sidebar-w);
  flex: 1;
  min-width: 0;
  padding: 2rem 2.5rem;
  overflow-x: hidden;
}

/* Mobile */
.mobile-topbar { display: none; }

@media (max-width: 768px) {
  .sidebar { display: none; }
  .mobile-topbar {
    display: flex;
    position: fixed;
    top: 0; left: 0; right: 0;
    height: 52px;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    align-items: center;
    padding: 0 1rem;
    gap: 0.6rem;
    z-index: 100;
  }
  .brand-icon-sm { display: flex; }
  .mobile-brand { font-size: 0.9rem; font-weight: 700; color: var(--text); flex: 1; }
  .shell__main {
    margin-left: 0;
    padding: 5rem 1rem 2rem;
  }
}
</style>
