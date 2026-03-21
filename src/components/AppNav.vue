<!-- Top navigation bar — used by all protected pages -->
<template>
  <nav class="nav">
    <RouterLink class="nav-brand" to="/">{{ appTitle }}</RouterLink>
    <div class="nav-links">
      <RouterLink to="/dashboard">Dashboard</RouterLink>
      <RouterLink to="/profile">Profile</RouterLink>
    </div>
    <button class="nav-logout" @click="logout">Sign out</button>
  </nav>
</template>

<script setup>
import { RouterLink, useRouter } from 'vue-router'

const appTitle = import.meta.env.VITE_APP_TITLE || 'My App'
const router = useRouter()

function logout() {
  localStorage.removeItem('token')
  router.push('/login')
}
</script>

<style scoped>
.nav {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 0 1.5rem;
  height: 56px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  z-index: 10;
}
.nav-brand { font-weight: 700; text-decoration: none; color: #111; }
.nav-links  { display: flex; gap: 1.25rem; flex: 1; }
.nav-links a { text-decoration: none; color: #6b7280; font-size: 0.9rem; }
.nav-links a:hover, .nav-links .router-link-active { color: #2563eb; }
.nav-logout {
  margin-left: auto;
  background: none;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 0.25rem 0.75rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: #374151;
}
.nav-logout:hover { border-color: #2563eb; color: #2563eb; }
</style>
