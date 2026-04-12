<template>
  <div class="dashboard">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Dashboard</h1>
        <p class="page-sub">Welcome back, {{ store.user.name.split(' ')[0] }}</p>
      </div>
      <button
        class="btn btn-outline"
        :disabled="store.isRefreshing"
        @click="store.refreshDashboard()"
      >
        <span v-if="store.isRefreshing" class="spinner" />
        <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
        </svg>
        {{ store.isRefreshing ? 'Refreshing…' : 'Refresh' }}
      </button>
    </div>

    <!-- Bucket Cards -->
    <section class="buckets">
      <BucketCard
        v-for="b in buckets"
        :key="b.key"
        :bucket="b"
        :balance="store.balances[b.key]"
        :pct="store.splitSettings[b.key]"
      />
    </section>

    <!-- Split Summary + Goal -->
    <div class="lower-grid">
      <!-- This Month's Split -->
      <div class="card split-card">
        <div class="split-card__header">
          <div>
            <h3>This Month's Split</h3>
            <p class="label-sm">Salary credited {{ store.lastSplitEvent.date }}</p>
          </div>
          <span class="gross-badge mono">S$ {{ fmt(store.lastSplitEvent.gross) }}</span>
        </div>
        <div class="split-rows">
          <div v-for="row in splitRows" :key="row.key" class="split-row">
            <div class="split-row__left">
              <span class="dot" :style="{ background: row.color }" />
              <span>{{ row.label }}</span>
            </div>
            <div class="split-row__right">
              <div class="split-bar-track">
                <div
                  class="split-bar-fill"
                  :style="{
                    width: store.splitSettings[row.key] + '%',
                    background: row.color,
                    boxShadow: `0 0 8px ${row.color}55`,
                  }"
                />
              </div>
              <span class="mono split-amount">S$ {{ fmt(store.lastSplitEvent[row.key]) }}</span>
              <span class="mono split-pct">{{ store.splitSettings[row.key] }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Goal Progress -->
      <div class="card goal-card">
        <div class="goal-card__header">
          <span class="goal-emoji">{{ store.primaryGoal.emoji }}</span>
          <div>
            <h3>{{ store.primaryGoal.name }}</h3>
            <p class="label-sm">Target by {{ store.primaryGoal.deadline }}</p>
          </div>
        </div>
        <div class="goal-amounts">
          <span class="mono goal-current">S$ {{ fmtK(store.primaryGoal.current) }}</span>
          <span class="goal-sep">/</span>
          <span class="mono goal-target">S$ {{ fmtK(store.primaryGoal.target) }}</span>
        </div>
        <div class="goal-bar-track">
          <div
            class="goal-bar-fill"
            :style="{ width: store.primaryGoalPct + '%' }"
          />
        </div>
        <div class="goal-footer">
          <span class="mono goal-pct-label">{{ store.primaryGoalPct }}% reached</span>
          <span class="goal-remaining">S$ {{ fmtK(store.primaryGoal.target - store.primaryGoal.current) }} to go</span>
        </div>
        <!-- Second goal mini -->
        <div v-if="store.goals[1]" class="mini-goal">
          <span>{{ store.goals[1].emoji }} {{ store.goals[1].name }}</span>
          <div class="mini-goal-bar">
            <div
              class="mini-goal-fill"
              :style="{ width: Math.round((store.goals[1].current / store.goals[1].target) * 100) + '%' }"
            />
          </div>
          <span class="mono mini-goal-pct">{{ Math.round((store.goals[1].current / store.goals[1].target) * 100) }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useFinanceStore } from '../stores/finance.js'
import BucketCard from '../components/BucketCard.vue'

const store = useFinanceStore()

onMounted(() => store.refreshDashboard())

const buckets = [
  { key: 'save',   label: 'Save',   color: '#00D4C8', dim: 'rgba(0,212,200,0.1)',   glow: 'rgba(0,212,200,0.2)'  },
  { key: 'invest', label: 'Invest', color: '#F5C842', dim: 'rgba(245,200,66,0.1)',  glow: 'rgba(245,200,66,0.2)' },
  { key: 'spend',  label: 'Spend',  color: '#A855F7', dim: 'rgba(168,85,247,0.1)',  glow: 'rgba(168,85,247,0.2)' },
]

const splitRows = [
  { key: 'save',   label: 'Save',   color: '#00D4C8' },
  { key: 'invest', label: 'Invest', color: '#F5C842' },
  { key: 'spend',  label: 'Spend',  color: '#A855F7' },
]

function fmt(n) {
  return Number(n).toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtK(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return fmt(n)
}
</script>

<style scoped>
.dashboard { max-width: 1100px; }

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 2rem;
  gap: 1rem;
  flex-wrap: wrap;
}
.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-bottom: 0.2rem;
}
.page-sub { color: var(--text-2); font-size: 0.875rem; }

/* Buckets */
.buckets {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}
@media (max-width: 900px) { .buckets { grid-template-columns: 1fr; } }
@media (min-width: 640px) and (max-width: 900px) { .buckets { grid-template-columns: 1fr 1fr; } }

/* Lower grid */
.lower-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
}
@media (max-width: 820px) { .lower-grid { grid-template-columns: 1fr; } }

/* Split card */
.split-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}
.split-card__header h3 { font-size: 1rem; margin-bottom: 0.2rem; }
.label-sm { font-size: 0.75rem; color: var(--text-3); }
.gross-badge {
  background: var(--teal-dim);
  color: var(--teal);
  border: 1px solid rgba(0,212,200,0.2);
  font-size: 0.85rem;
  padding: 0.3rem 0.75rem;
  border-radius: 20px;
  white-space: nowrap;
}
.split-rows { display: flex; flex-direction: column; gap: 1.1rem; }
.split-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}
.split-row__left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--text-2);
  min-width: 58px;
}
.dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.split-row__right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}
.split-bar-track {
  flex: 1;
  height: 5px;
  background: var(--border);
  border-radius: 3px;
  overflow: hidden;
}
.split-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
}
.split-amount { font-size: 0.78rem; color: var(--text); min-width: 75px; text-align: right; }
.split-pct    { font-size: 0.72rem; color: var(--text-3); min-width: 28px; text-align: right; }

/* Goal card */
.goal-card__header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}
.goal-emoji { font-size: 1.75rem; }
.goal-card__header h3 { font-size: 1rem; margin-bottom: 0.2rem; }
.goal-amounts {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  margin-bottom: 0.75rem;
}
.goal-current { font-size: 1.5rem; color: var(--gold); font-weight: 500; }
.goal-sep     { color: var(--text-3); }
.goal-target  { font-size: 0.9rem; color: var(--text-2); }
.goal-bar-track {
  height: 8px;
  background: var(--border);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.6rem;
}
.goal-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--gold), #ffb800);
  border-radius: 4px;
  box-shadow: 0 0 10px rgba(245,200,66,0.35);
  transition: width 1.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.goal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}
.goal-pct-label { font-size: 0.8rem; color: var(--gold); }
.goal-remaining { font-size: 0.75rem; color: var(--text-3); }

.mini-goal {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
  font-size: 0.8rem;
  color: var(--text-2);
}
.mini-goal-bar {
  flex: 1;
  height: 4px;
  background: var(--border);
  border-radius: 2px;
  overflow: hidden;
}
.mini-goal-fill {
  height: 100%;
  background: var(--teal);
  border-radius: 2px;
  transition: width 1s ease;
}
.mini-goal-pct { font-size: 0.75rem; color: var(--teal); white-space: nowrap; }
</style>
