<template>
  <div class="login-wrap">
    <div class="login-box">
      <h2>Sign In</h2>
      <form @submit.prevent="handleLogin">
        <div class="field">
          <label>Username</label>
          <input v-model="username" type="text" placeholder="Enter username" required />
        </div>
        <div class="field">
          <label>Password</label>
          <input v-model="password" type="password" placeholder="Enter password" required />
        </div>
        <p v-if="error" class="error">{{ error }}</p>
        <button type="submit" :disabled="loading">
          {{ loading ? 'Signing in…' : 'Sign In' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '@/api/index.js'

const router   = useRouter()
const username = ref('')
const password = ref('')
const loading  = ref(false)
const error    = ref('')

async function handleLogin() {
  loading.value = true
  error.value   = ''
  try {
    const { data } = await auth.login({ Username: username.value, Password: password.value })
    localStorage.setItem('token', data.Token)
    router.push('/dashboard')
  } catch (err) {
    error.value = err.response?.data?.Errors?.[0] || 'Login failed. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f9fafb; }
.login-box  { background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 2.5rem; width: 100%; max-width: 380px; box-shadow: 0 4px 12px rgb(0 0 0 / 0.06); }
h2 { font-size: 1.4rem; font-weight: 700; margin-bottom: 1.75rem; }
.field { display: flex; flex-direction: column; gap: 0.3rem; margin-bottom: 1rem; }
label { font-size: 0.875rem; font-weight: 500; color: #374151; }
input { padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.95rem; outline: none; }
input:focus { border-color: #2563eb; }
button { width: 100%; background: #2563eb; color: #fff; border: none; padding: 0.6rem; border-radius: 6px; font-size: 1rem; cursor: pointer; margin-top: 0.5rem; }
button:disabled { opacity: 0.6; cursor: not-allowed; }
.error { color: #dc2626; font-size: 0.85rem; background: #fef2f2; padding: 0.5rem 0.75rem; border-radius: 6px; margin-bottom: 0.5rem; }
</style>
