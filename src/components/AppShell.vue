<template>
  <div class="shell">
    <AppSidebar />
    <main class="shell__main">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { RouterView } from 'vue-router'
import AppSidebar from './AppSidebar.vue'
</script>

<style scoped>
.shell {
  display: flex;
  min-height: 100vh;
}
.shell__main {
  margin-left: var(--sidebar-w);
  flex: 1;
  min-width: 0;
  padding: 2rem 2.5rem;
  overflow-x: hidden;
}

@media (max-width: 768px) {
  .shell__main {
    margin-left: 0;
    padding: 1.25rem 1rem 5rem; /* bottom padding for mobile nav */
  }
}
</style>
