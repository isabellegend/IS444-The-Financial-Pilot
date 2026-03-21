<template>
  <div class="page-center">
    <h1>{{ appTitle }}</h1>
    <p>Your tagline goes here.</p>
    <RouterLink to="/login"><button class="btn">Sign In</button></RouterLink>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'
const appTitle = import.meta.env.VITE_APP_TITLE || 'My App'
</script>

<style scoped>
.page-center { text-align: center; padding: 6rem 1rem; }
h1 { font-size: 2.5rem; font-weight: 800; margin-bottom: 1rem; }
p  { color: #6b7280; margin-bottom: 2rem; }
.btn { background: #2563eb; color: #fff; border: none; padding: 0.6rem 1.5rem; border-radius: 6px; cursor: pointer; font-size: 1rem; }
</style>
