<template>
  <div class="dashboard">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Dashboard</h1>
        <p class="page-sub">Welcome back, {{ store.user.name.split(' ')[0] }}</p>
      </div>
      <div class="header-actions">
        <div class="total-balance">
          <span class="total-balance__label">Total Balance</span>
          <span class="total-balance__val mono">S$ {{ fmt(store.totalBalance) }}</span>
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
    </div>

    <!-- Bucket Cards -->
    <section class="buckets">
      <BucketCard
        v-for="b in buckets"
        :key="b.key"
        :bucket="b"
        :balance="store.balances[b.key]"
        :pct="store.splitSettings[b.key]"
        :pending-invest="b.key === 'invest' && store.pendingInvestAmount > 0
          ? { amount: store.pendingInvestAmount, ...store.pendingInvestInfo }
          : null"
      />
    </section>

    <!-- Row 2: Wallet Allocation + Goal Progress -->
    <div class="lower-grid">

      <!-- Wallet Allocation card (donut + breakdown) -->
      <div class="card split-card">
        <div class="card-head-row">
          <div>
            <h3>Wallet Allocation</h3>
            <p class="label-sm">Last Updated on {{ store.lastSplitEvent.date }}</p>
          </div>
          <span class="gross-badge mono">S$ {{ fmt(store.lastSplitEvent.gross) }}</span>
        </div>
        <div class="split-body">
          <!-- Donut chart -->
          <div class="donut-wrap">
            <svg viewBox="0 0 100 100" class="donut-svg">
              <!-- Track -->
              <circle cx="50" cy="50" r="36" fill="none" stroke-width="12"
                class="donut-track" />
              <!-- Segments -->
              <circle
                v-for="seg in donutSegments" :key="seg.key"
                cx="50" cy="50" r="36"
                fill="none"
                :stroke="seg.color"
                stroke-width="12"
                :stroke-dasharray="`${seg.length} ${CIRCUMFERENCE - seg.length}`"
                :transform="`rotate(${seg.startAngle}, 50, 50)`"
                class="donut-seg"
                :class="{ 'donut-seg--active': activeSeg === seg.key }"
                @mouseenter="activeSeg = seg.key"
                @mouseleave="activeSeg = null"
              />

              <!-- Center Text -->
              <g class="donut-center-text" v-if="activeSegInfo">
                <text x="50" y="48" text-anchor="middle" class="center-pct mono" :style="{ fill: activeSegInfo.color }">
                  {{ activeSegInfo.pct }}%
                </text>
                <text x="50" y="62" text-anchor="middle" class="center-label">
                  {{ activeSegInfo.label }}
                </text>
              </g>
            </svg>
          </div>

          <!-- Breakdown rows -->
          <div class="split-rows">
            <div 
              v-for="row in splitRows" :key="row.key" 
              class="split-row"
              :class="{ 'split-row--active': activeSeg === row.key }"
              @mouseenter="activeSeg = row.key"
              @mouseleave="activeSeg = null"
            >
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
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Goal Progress card (radial arc) -->
      <div class="card goal-card">
        <div class="goal-card__header">
          <span class="goal-emoji">{{ store.primaryGoal.emoji }}</span>
          <div>
            <h3>{{ store.primaryGoal.name }}</h3>
            <p class="label-sm">Target by {{ store.primaryGoal.deadline }}</p>
          </div>
        </div>

        <div class="goal-radial-wrap">
          <!-- Radial arc -->
          <div class="goal-radial">
            <svg viewBox="0 0 100 100" class="goal-radial-svg">
              <circle cx="50" cy="50" r="38" fill="none" stroke-width="9" class="donut-track" />
              <circle cx="50" cy="50" r="38"
                fill="none" stroke="#F5C842" stroke-width="9" stroke-linecap="round"
                :stroke-dasharray="`${goalArcLength} ${GOAL_CIRCUMFERENCE - goalArcLength}`"
                transform="rotate(-90, 50, 50)"
                class="goal-arc"
              />
              <text x="50" y="46" text-anchor="middle" font-size="14"
                font-family="'Courier New', monospace" font-weight="700" fill="#F5C842">
                {{ store.primaryGoalPct }}%
              </text>
              <text x="50" y="60" text-anchor="middle" font-size="7.5"
                font-family="system-ui, sans-serif" fill="currentColor" class="donut-label-sm">
                reached
              </text>
            </svg>
          </div>

          <!-- Amount stack -->
          <div class="goal-amounts-stack">
            <div class="goal-amount-row">
              <span class="goal-amount-label">Saved</span>
              <span class="mono goal-amount-val">S$ {{ fmt(store.primaryGoal.current) }}</span>
            </div>
            <div class="goal-amount-row">
              <span class="goal-amount-label">Target</span>
              <span class="mono goal-amount-val">S$ {{ fmt(store.primaryGoal.target) }}</span>
            </div>
            <div class="goal-amount-row">
              <span class="goal-amount-label">Remaining</span>
              <span 
                class="mono goal-amount-val" 
                :class="store.primaryGoal.current >= store.primaryGoal.target ? 'success' : 'danger'"
              >
                S$ {{ store.primaryGoal.current >= store.primaryGoal.target 
                  ? fmt(store.primaryGoal.current - store.primaryGoal.target) 
                  : fmt(store.primaryGoal.target - store.primaryGoal.current) }}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Row 3: Spending by Category + Recent Transactions -->
    <div class="charts-grid">

      <!-- Spending Breakdown -->
      <div class="card category-card">
        <h3>Spending Breakdown</h3>
        <p class="label-sm" style="margin-bottom: 1.25rem;">
          Debit transactions · last {{ debitTransactionsCount }} records
        </p>
        <div v-if="spendByCategory.length === 0" class="cat-empty">
          No debit transactions yet
        </div>
        <div v-else class="cat-list">
          <div v-for="cat in spendByCategory" :key="cat.cat" class="cat-row">
            <div class="cat-row__head">
              <span class="cat-icon" style="font-size: 1rem; margin-right: 0.5rem;">{{ cat.icon }}</span>
              <span class="cat-name">{{ cat.cat }}</span>
              <span class="cat-pct mono" :style="{ color: cat.color }">{{ cat.pct }}%</span>
              <span class="cat-amt mono">S$ {{ fmt(cat.amt) }}</span>
            </div>
            <div class="cat-bar-track">
              <div
                class="cat-bar-fill"
                :style="{ width: cat.pct + '%', background: cat.color }"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Transactions -->
      <div class="card txn-card">
        <div class="card-head-row">
          <div>
            <h3>Recent Transactions</h3>
            <p class="label-sm">Spend wallet activity</p>
          </div>
        </div>
        <div v-if="recentTxns.length === 0" class="cat-empty">No transactions yet</div>
        <div v-else class="txn-list">
          <div v-for="txn in recentTxns" :key="txn.id" class="txn-row">
            <div class="txn-icon"
              :style="txn.amount < 0 && store.CAT_META[txn.category] ? {
                backgroundColor: store.CAT_META[txn.category].color + '1a',
                color: store.CAT_META[txn.category].color
              } : {}"
              :class="{
                'txn-icon--debit': txn.amount < 0 && !store.CAT_META[txn.category],
                'txn-icon--credit': txn.amount > 0
              }"
            >
              <template v-if="txn.amount < 0 && store.CAT_META[txn.category]">
                <span style="font-size: 1rem">{{ store.CAT_META[txn.category].icon }}</span>
              </template>
              <svg v-else-if="txn.amount < 0" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
              </svg>
              <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
              </svg>
            </div>
            <div class="txn-info">
              <span class="txn-merchant">{{ txn.merchant }}</span>
              <span class="txn-meta">
                <span class="txn-type-pill" :class="txn.amount < 0 ? 'pill--debit' : 'pill--credit'">
                  {{ txn.amount < 0 ? 'Debit' : 'Credit' }}
                </span>
                · {{ txn.date }}
              </span>
            </div>
            <span class="txn-amount mono" :class="txn.amount < 0 ? 'neg' : 'pos'">
              {{ txn.amount < 0 ? '−' : '+' }}S$ {{ fmt(Math.abs(txn.amount)) }}
            </span>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { onMounted, computed, ref } from 'vue'
import { useFinanceStore } from '../stores/finance.js'
import BucketCard from '../components/BucketCard.vue'

const store = useFinanceStore()
const activeSeg = ref(null)
onMounted(() => {
  store.refreshDashboard()
  store.refreshSplitSettings()
  store.fetchTransactions()
})

// ── Chart constants ─────────────────────────────────────────────
const CIRCUMFERENCE      = 2 * Math.PI * 36   // donut r=36  ≈ 226.19
const GOAL_CIRCUMFERENCE = 2 * Math.PI * 38   // goal  r=38  ≈ 238.76

// ── Bucket definitions ──────────────────────────────────────────
const buckets = [
  { key: 'save',   label: 'Save',   color: '#00D4C8', dim: 'rgba(0,212,200,0.1)',  glow: 'rgba(0,212,200,0.2)' },
  { key: 'invest', label: 'Invest', color: '#F5C842', dim: 'rgba(245,200,66,0.1)', glow: 'rgba(245,200,66,0.2)' },
  { key: 'spend',  label: 'Spend',  color: '#A855F7', dim: 'rgba(168,85,247,0.1)', glow: 'rgba(168,85,247,0.2)' },
]

const splitRows = [
  { key: 'save',   label: 'Save',   color: '#00D4C8' },
  { key: 'invest', label: 'Invest', color: '#F5C842' },
  { key: 'spend',  label: 'Spend',  color: '#A855F7' },
]

// ── Donut chart ─────────────────────────────────────────────────
const donutSegments = computed(() => {
  const s = store.splitSettings
  const segs = [
    { key: 'save',   pct: s.save,   color: '#00D4C8', label: 'Save' },
    { key: 'invest', pct: s.invest, color: '#F5C842', label: 'Invest' },
    { key: 'spend',  pct: s.spend,  color: '#A855F7', label: 'Spend' },
  ]
  let cumPct = 0
  const GAP = 1.2  // visual gap between segments (arc units)
  return segs.map(seg => {
    const startAngle = -90 + (cumPct / 100) * 360
    const length = Math.max((seg.pct / 100) * CIRCUMFERENCE - GAP, 0)
    cumPct += seg.pct
    return { ...seg, length, startAngle }
  })
})

const activeSegInfo = computed(() => 
  donutSegments.value.find(s => s.key === activeSeg.value)
)

// ── Goal radial arc ─────────────────────────────────────────────
const goalArcLength = computed(() =>
  (store.primaryGoalPct / 100) * GOAL_CIRCUMFERENCE
)

// ── Spending breakdown (grouped by category) ───────────────────
const spendByCategory = computed(() => {
  const total = store.categoryBreakdown.reduce((a, b) => a + b.amount, 0) || 1
  return store.categoryBreakdown.map(cat => ({
    cat: cat.name,
    amt: cat.amount,
    pct: cat.pct,
    color: cat.color,
    icon: cat.icon
  }))
})

const debitTransactionsCount = computed(() => 
  store.transactions.filter(t => t.amount < 0).length
)

const recentTxns = computed(() => store.transactions.slice(0, 5))

// ── Wallet Allocation hover tooltips ────────────────────────────
const hoveredSeg = ref(null)
const hoveredRow = ref(null)

const hoveredSegData = computed(() => {
  if (!hoveredSeg.value) return null
  const seg = donutSegments.value.find(s => s.key === hoveredSeg.value)
  const row = splitRows.find(r => r.key === hoveredSeg.value)
  return {
    label:  row?.label ?? '',
    pct:    store.splitSettings[hoveredSeg.value] ?? 0,
    amount: store.lastSplitEvent[hoveredSeg.value] ?? 0,
    color:  seg?.color ?? '#fff',
  }
})

// ── Formatters ──────────────────────────────────────────────────
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

/* ── Header ── */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 2rem;
  gap: 1rem;
  flex-wrap: wrap;
}
.page-title { font-size: 1.75rem; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 0.2rem; }
.page-sub   { color: var(--text-2); font-size: 0.875rem; }

.header-actions {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}
.total-balance {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.1rem;
}
.total-balance__label {
  font-size: 0.68rem;
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: 0.07em;
}
.total-balance__val {
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--text);
}

/* ── Bucket cards ── */
.buckets {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}
@media (min-width: 640px) and (max-width: 900px) { .buckets { grid-template-columns: 1fr 1fr; } }
@media (max-width: 639px) { .buckets { grid-template-columns: 1fr; } }

/* ── Lower grid (allocation + goal) ── */
.lower-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}
@media (max-width: 820px) { .lower-grid { grid-template-columns: 1fr; } }

/* ── Charts grid (categories + transactions) ── */
.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
}
@media (max-width: 820px) { .charts-grid { grid-template-columns: 1fr; } }

/* ── Shared card head row ── */
.card-head-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}
.card-head-row h3 { font-size: 1rem; margin-bottom: 0.2rem; }
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

/* ── Wallet Allocation (split card) ── */
.split-body {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

/* Donut */
.donut-wrap { width: 108px; flex-shrink: 0; }
.donut-svg  { width: 100%; height: auto; display: block; }
.donut-track { stroke: var(--border); }
.donut-seg   { 
  transition: all 0.3s ease; 
  cursor: pointer;
}
.donut-seg:hover, .donut-seg--active {
  stroke-width: 15;
  filter: drop-shadow(0 0 5px currentColor);
}

.donut-center-text { pointer-events: none; }
.center-pct { font-size: 16px; font-weight: 700; }
.center-label { font-size: 8px; fill: var(--text-3); text-transform: uppercase; letter-spacing: 0.05em; }
.center-total { font-size: 9px; fill: var(--text-3); font-weight: 500; }

.donut-label-sm  { fill: var(--text-3); }
.donut-label-val { fill: var(--text); }

/* Breakdown rows */
.split-rows { flex: 1; display: flex; flex-direction: column; gap: 1.1rem; }
.split-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.4rem;
  border-radius: 8px;
  transition: background 0.2s ease;
  cursor: default;
}
.split-row--active {
  background: var(--surface-2);
}
.split-row__left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--text-2);
  min-width: 55px;
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
  transition: width 1s cubic-bezier(0.4,0,0.2,1);
}
.split-amount { font-size: 0.78rem; color: var(--text); min-width: 75px; text-align: right; }
.split-pct    { font-size: 0.72rem; color: var(--text-3); min-width: 28px; text-align: right; }

/* ── Goal card ── */
.goal-card__header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}
.goal-emoji { font-size: 1.75rem; }
.goal-card__header h3 { font-size: 1rem; margin-bottom: 0.2rem; }

.goal-radial-wrap {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 1.25rem;
}
.goal-radial { width: 108px; flex-shrink: 0; }
.goal-radial-svg { width: 100%; height: auto; display: block; }
.goal-arc {
  transition: stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1);
  filter: drop-shadow(0 0 6px rgba(245,200,66,0.4));
}

.goal-amounts-stack { flex: 1; display: flex; flex-direction: column; gap: 0.7rem; }
.goal-amount-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.goal-amount-label { font-size: 0.85rem; color: var(--text-2); }
.goal-amount-val   { font-size: 0.85rem; color: var(--text); font-weight: 600; }
.goal-amount-val.danger { color: var(--danger); }
.goal-amount-val.success { color: var(--success); }

.mini-goal {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
  font-size: 0.8rem;
  color: var(--text-2);
}
.mini-goal-bar { flex: 1; height: 4px; background: var(--border); border-radius: 2px; overflow: hidden; }
.mini-goal-fill { height: 100%; background: var(--teal); border-radius: 2px; transition: width 1s ease; }
.mini-goal-pct  { font-size: 0.75rem; color: var(--teal); white-space: nowrap; }

/* ── Spending Breakdown ── */
.category-card h3 { margin-bottom: 0.2rem; }
.cat-empty { font-size: 0.82rem; color: var(--text-3); padding: 1rem 0; }
.cat-list { display: flex; flex-direction: column; gap: 0.9rem; }
.cat-row__head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
}
.cat-dot { width: 8px; height: 8px; border-radius: 2px; flex-shrink: 0; }
.cat-name { font-size: 0.82rem; color: var(--text-2); flex: 1; }
.cat-pct  { font-size: 0.77rem; font-weight: 600; }
.cat-amt  { font-size: 0.75rem; color: var(--text-3); min-width: 68px; text-align: right; }
.cat-bar-track {
  height: 5px;
  background: var(--border);
  border-radius: 3px;
  overflow: hidden;
}
.cat-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.9s ease;
  opacity: 0.85;
}

/* ── Recent Transactions ── */
.txn-card h3 { margin-bottom: 0.2rem; }
.txn-list { display: flex; flex-direction: column; }
.txn-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0;
  border-bottom: 1px solid var(--border);
}
.txn-row:last-child { border-bottom: none; }
.txn-icon {
  width: 34px; height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.txn-icon--debit  { background: rgba(239,68,68,0.12); color: var(--danger); }
.txn-icon--credit { background: rgba(0,212,200,0.12); color: var(--teal); }
.txn-type-pill {
  font-size: 0.62rem;
  font-weight: 600;
  padding: 1px 5px;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.pill--debit  { background: rgba(239,68,68,0.12); color: var(--danger); }
.pill--credit { background: rgba(0,212,200,0.12); color: var(--teal); }
.txn-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}
.txn-merchant {
  font-size: 0.85rem;
  color: var(--text);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.txn-meta   { font-size: 0.7rem; color: var(--text-3); }
.txn-amount { font-size: 0.82rem; font-weight: 500; white-space: nowrap; }
.txn-amount.neg { color: var(--danger); }
.txn-amount.pos { color: var(--teal); }
</style>
