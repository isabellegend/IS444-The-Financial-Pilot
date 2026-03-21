<template>
  <div class="center">
    <p class="code">404</p>
    <h1>Page not found</h1>
    <RouterLink to="/">Go home</RouterLink>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'
</script>

<style scoped>
.center { text-align: center; padding: 6rem 1rem; }
.code   { font-size: 5rem; font-weight: 800; color: #e5e7eb; margin: 0; }
h1      { font-size: 1.5rem; margin-bottom: 1rem; }
a       { color: #2563eb; }
</style>
