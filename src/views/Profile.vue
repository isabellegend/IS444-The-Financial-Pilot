<template>
  <div>
    <AppNav />
    <main class="page">
      <h2>My Profile</h2>
      <form class="form" @submit.prevent="handleSave">
        <div class="field">
          <label>Display Name</label>
          <input v-model="form.displayName" type="text" placeholder="Your name" />
        </div>
        <div class="field">
          <label>Email</label>
          <input v-model="form.email" type="email" placeholder="your@email.com" />
        </div>
        <p v-if="message" :class="['msg', msgType]">{{ message }}</p>
        <button type="submit" :disabled="saving">
          {{ saving ? 'Saving…' : 'Save Changes' }}
        </button>
      </form>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AppNav from '@/components/AppNav.vue'
// import { users } from '@/api/index.js'  ← uncomment when you have the endpoint

const form    = ref({ displayName: '', email: '' })
const saving  = ref(false)
const message = ref('')
const msgType = ref('success')

async function handleSave() {
  saving.value  = true
  message.value = ''
  try {
    // await users.updateProfile(form.value)  ← replace with real call
    await new Promise(r => setTimeout(r, 600))  // remove this fake delay
    message.value = 'Profile saved!'
    msgType.value = 'success'
  } catch {
    message.value = 'Failed to save. Please try again.'
    msgType.value = 'error'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.page  { max-width: 520px; margin: 0 auto; padding: 2rem 1.5rem; }
h2     { font-size: 1.5rem; font-weight: 700; margin-bottom: 1.75rem; }
.form  { display: flex; flex-direction: column; gap: 1rem; }
.field { display: flex; flex-direction: column; gap: 0.3rem; }
label  { font-size: 0.875rem; font-weight: 500; color: #374151; }
input  { padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.95rem; outline: none; }
input:focus { border-color: #2563eb; }
button { align-self: flex-end; background: #2563eb; color: #fff; border: none; padding: 0.55rem 1.5rem; border-radius: 6px; cursor: pointer; font-size: 0.95rem; }
button:disabled { opacity: 0.6; cursor: not-allowed; }
.msg         { font-size: 0.875rem; padding: 0.5rem 0.75rem; border-radius: 6px; }
.msg.success { background: #d1fae5; color: #065f46; }
.msg.error   { background: #fef2f2; color: #dc2626; }
</style>
