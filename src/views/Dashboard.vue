<template>
  <div>
    <AppNav />
    <main class="page">
      <h2>Dashboard</h2>
      <p class="sub">Welcome back{{ user ? ', ' + user.UserName : '' }}.</p>

      <!-- Loading / error states -->
      <p v-if="loading">Loading…</p>
      <p v-if="error" class="error">{{ error }}</p>

      <!-- Replace this grid with real OutSystems data -->
      <div class="cards">
        <div class="card" v-for="item in stats" :key="item.label">
          <p class="card-value">{{ item.value }}</p>
          <p class="card-label">{{ item.label }}</p>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AppNav from '@/components/AppNav.vue'
import { auth } from '@/api/index.js'

const user    = ref(null)
const loading = ref(false)
const error   = ref('')

// Placeholder stats — swap with a real useFetch call to OutSystems
const stats = [
  { label: 'Orders',   value: '—' },
  { label: 'Points',   value: '—' },
  { label: 'Requests', value: '—' },
]

onMounted(async () => {
  loading.value = true
  try {
    const { data } = await auth.getMe()
    user.value = data
  } catch {
    error.value = 'Could not load user data.'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.page  { max-width: 900px; margin: 0 auto; padding: 2rem 1.5rem; }
h2     { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.25rem; }
.sub   { color: #6b7280; margin-bottom: 2rem; }
.error { color: #dc2626; }
.cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 1rem; }
.card  { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 1.25rem; text-align: center; }
.card-value { font-size: 1.75rem; font-weight: 700; margin-bottom: 0.25rem; }
.card-label { font-size: 0.85rem; color: #6b7280; }
</style>
