<template>
  <div class="debit-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Debit Card</h1>
        <p class="page-sub">Virtual Spend bucket card</p>
      </div>
    </div>

    <div class="debit-layout">
      <!-- Left: Card + spending limit -->
      <div class="left-col">
        <!-- Virtual card -->
        <div class="virtual-card">
          <div class="vc__toprow">
            <div class="vc__chip">
              <svg width="28" height="22" viewBox="0 0 28 22" fill="none">
                <rect width="28" height="22" rx="3" fill="#F5C842" fill-opacity="0.15"/>
                <rect x="0" y="8" width="28" height="6" fill="#F5C842" fill-opacity="0.08"/>
                <rect x="9" y="0" width="10" height="22" fill="#F5C842" fill-opacity="0.08"/>
                <rect x="2" y="2" width="24" height="18" rx="2" stroke="#F5C842" stroke-opacity="0.4" stroke-width="0.8" fill="none"/>
              </svg>
            </div>
            <div class="vc__network">{{ store.debitCard.network }}</div>
          </div>

          <div class="vc__number mono">{{ store.debitCard.cardNumber }}</div>

          <div class="vc__bottom">
            <div class="vc__holder">
              <span class="vc__field-label">Card Holder</span>
              <span class="vc__field-val mono">{{ store.debitCard.cardholderName }}</span>
            </div>
            <div class="vc__expiry">
              <span class="vc__field-label">Expires</span>
              <span class="vc__field-val mono">{{ store.debitCard.expiry }}</span>
            </div>
          </div>

          <!-- Decorative glow orbs -->
          <div class="vc__orb vc__orb--1" />
          <div class="vc__orb vc__orb--2" />
        </div>

        <!-- Spending limit -->
        <div class="card spend-limit-card">
          <div class="sl__head">
            <h3>Monthly Spending Limit</h3>
            <span class="sl__pct mono" :style="{ color: limitColor }">{{ store.spendLimitPct }}%</span>
          </div>
          <div class="sl__amounts">
            <span class="mono sl__spent" :style="{ color: limitColor }">
              S$ {{ fmt(store.debitCard.spentThisMonth) }}
            </span>
            <span class="sl__sep">/</span>
            <span class="mono sl__limit">S$ {{ fmt(store.debitCard.spendLimit) }}</span>
          </div>
          <div class="sl__bar-track">
            <div
              class="sl__bar-fill"
              :style="{ width: store.spendLimitPct + '%', background: limitColor }"
            />
          </div>
          <p class="sl__remaining label-sm">
            S$ {{ fmt(store.debitCard.spendLimit - store.debitCard.spentThisMonth) }} remaining this month
          </p>

          <!-- Debit / Credit summary -->
          <div class="category-breakdown">
            <div class="cat-row">
              <span class="cat-icon">⬇️</span>
              <span class="cat-label">Debited</span>
              <div class="cat-bar-track">
                <div class="cat-bar-fill cat-bar-fill--debit"
                  :style="{ width: txnSummary.total ? (txnSummary.debit / txnSummary.total * 100) + '%' : '0%' }"
                />
              </div>
              <span class="mono cat-amount">S$ {{ fmt(txnSummary.debit) }}</span>
            </div>
            <div class="cat-row">
              <span class="cat-icon">⬆️</span>
              <span class="cat-label">Credited</span>
              <div class="cat-bar-track">
                <div class="cat-bar-fill cat-bar-fill--credit"
                  :style="{ width: txnSummary.total ? (txnSummary.credit / txnSummary.total * 100) + '%' : '0%' }"
                />
              </div>
              <span class="mono cat-amount">S$ {{ fmt(txnSummary.credit) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Transactions -->
      <div class="card transactions-card">
        <div class="txn-header">
          <h3>Recent Transactions</h3>
          <span class="label-sm">{{ store.transactions.length }} transactions</span>
        </div>

        <!-- Loading skeleton -->
        <div v-if="store.isLoadingTransactions" class="txn-loading">
          <div v-for="n in 5" :key="n" class="txn-skeleton">
            <div class="skeleton skeleton--icon" />
            <div class="skeleton-lines">
              <div class="skeleton skeleton--text" />
              <div class="skeleton skeleton--text-sm" />
            </div>
            <div class="skeleton skeleton--amount" />
          </div>
        </div>

        <!-- Empty state -->
        <div v-else-if="!store.transactions.length" class="txn-empty">
          No transactions found.
        </div>

        <!-- Transaction list -->
        <div v-else class="txn-list">
          <div
            v-for="txn in store.transactions"
            :key="txn.transactionId"
            class="txn-row"
          >
            <div class="txn-icon" :class="txn.transactionType === 'CREDIT' ? 'txn-icon--credit' : 'txn-icon--debit'">
              <svg v-if="txn.transactionType === 'CREDIT'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
              </svg>
              <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
              </svg>
            </div>

            <div class="txn-info">
              <span class="txn-merchant">{{ txn.narrative }}</span>
              <span class="txn-meta">
                <span class="txn-ref mono">{{ txn.referenceId }}</span>
                · {{ fmtDate(txn.transactionDate) }}
              </span>
            </div>

            <div class="txn-right">
              <span class="mono txn-amount" :class="txn.transactionType === 'CREDIT' ? 'amount-pos' : 'amount-neg'">
                {{ txn.transactionType === 'CREDIT' ? '+' : '-' }}S$ {{ txn.amount.toFixed(2) }}
              </span>
              <span class="txn-balance mono">Bal: S$ {{ Number(txn.balanceAfter).toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useFinanceStore } from '../stores/finance.js'

const store = useFinanceStore()

onMounted(() => store.fetchTransactions())

const limitColor = computed(() => {
  if (store.spendLimitPct >= 90) return 'var(--danger)'
  if (store.spendLimitPct >= 70) return 'var(--gold)'
  return 'var(--purple)'
})

const txnSummary = computed(() => {
  let debit = 0, credit = 0
  for (const txn of store.transactions) {
    if (txn.transactionType === 'DEBIT')  debit  += txn.amount
    else                                  credit += txn.amount
  }
  return { debit, credit, total: debit + credit }
})

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-SG', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmt(n) {
  return Number(n).toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
</script>

<style scoped>
.debit-page   { max-width: 1000px; }
.page-header  { margin-bottom: 2rem; }
.page-title   { font-size: 1.75rem; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 0.2rem; }
.page-sub     { color: var(--text-2); font-size: 0.875rem; }
.label-sm     { font-size: 0.75rem; color: var(--text-3); }

.debit-layout {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 1.25rem;
  align-items: start;
}
@media (max-width: 820px) { .debit-layout { grid-template-columns: 1fr; } }

.left-col { display: flex; flex-direction: column; gap: 1.25rem; }

/* Virtual card */
.virtual-card {
  border-radius: 20px;
  padding: 1.75rem;
  background: linear-gradient(135deg, #0D1E3D 0%, #1A2E55 50%, #0D1E3D 100%);
  border: 1px solid rgba(245,200,66,0.2);
  box-shadow:
    0 24px 48px rgba(0,0,0,0.5),
    0 0 40px rgba(245,200,66,0.08),
    inset 0 1px 0 rgba(255,255,255,0.06);
  position: relative;
  overflow: hidden;
  aspect-ratio: 1.586 / 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.virtual-card:hover {
  transform: translateY(-4px) rotate(-0.5deg);
  box-shadow:
    0 32px 60px rgba(0,0,0,0.55),
    0 0 60px rgba(245,200,66,0.12);
}
.vc__orb {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}
.vc__orb--1 {
  width: 180px; height: 180px;
  top: -60px; right: -40px;
  background: radial-gradient(circle, rgba(245,200,66,0.12), transparent 70%);
}
.vc__orb--2 {
  width: 120px; height: 120px;
  bottom: -30px; left: 10px;
  background: radial-gradient(circle, rgba(0,212,200,0.08), transparent 70%);
}
.vc__toprow {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.vc__network {
  font-family: var(--font-mono);
  font-size: 1rem;
  font-weight: 500;
  color: rgba(245,200,66,0.8);
  letter-spacing: 0.05em;
}
.vc__number {
  font-size: 1.1rem;
  letter-spacing: 0.18em;
  color: rgba(232,238,247,0.85);
  text-shadow: 0 1px 2px rgba(0,0,0,0.4);
}
.vc__bottom {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}
.vc__field-label {
  display: block;
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(232,238,247,0.4);
  margin-bottom: 0.2rem;
}
.vc__field-val {
  font-size: 0.78rem;
  color: rgba(232,238,247,0.85);
  letter-spacing: 0.05em;
}

/* Spend limit */
.sl__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}
.sl__head h3 { font-size: 1rem; }
.sl__pct { font-size: 1.1rem; font-weight: 500; }
.sl__amounts {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  margin-bottom: 0.75rem;
}
.sl__spent { font-size: 1.4rem; font-weight: 500; }
.sl__sep   { color: var(--text-3); }
.sl__limit { font-size: 0.875rem; color: var(--text-2); }
.sl__bar-track {
  height: 7px;
  background: var(--border);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}
.sl__bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 1s ease;
}
.sl__remaining { margin-bottom: 1.25rem; }

/* Category breakdown */
.category-breakdown {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  border-top: 1px solid var(--border);
  padding-top: 1rem;
}
.cat-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
}
.cat-icon  { font-size: 0.875rem; }
.cat-label { color: var(--text-2); min-width: 74px; }
.cat-bar-track {
  flex: 1;
  height: 4px;
  background: var(--border);
  border-radius: 2px;
  overflow: hidden;
}
.cat-bar-fill {
  height: 100%;
  background: var(--purple);
  border-radius: 2px;
  transition: width 0.8s ease;
}
.cat-amount { font-size: 0.78rem; color: var(--text-2); white-space: nowrap; }

/* Transactions */
.transactions-card { }
.txn-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}
.txn-header h3 { font-size: 1rem; }
.txn-list { display: flex; flex-direction: column; gap: 0; }
.txn-row {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.85rem 0;
  border-bottom: 1px solid var(--border);
  transition: background var(--tr);
}
.txn-row:last-child { border-bottom: none; }
.txn-row:hover { background: var(--surface-2); margin: 0 -1.5rem; padding-left: 1.5rem; padding-right: 1.5rem; border-radius: 0; }
.txn-icon {
  width: 38px; height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  flex-shrink: 0;
}
.txn-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}
.txn-merchant {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.txn-meta { font-size: 0.72rem; color: var(--text-3); }
.txn-cat  { color: var(--text-2); }
.txn-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.15rem;
  flex-shrink: 0;
}
.txn-icon--debit  { background: rgba(248,113,113,0.12); color: #F87171; }
.txn-icon--credit { background: rgba(0,212,200,0.12);  color: var(--teal); }
.txn-amount  { font-size: 0.875rem; font-weight: 500; }
.amount-neg  { color: #F87171; }
.amount-pos  { color: var(--teal); }
.txn-ref     { color: var(--text-3); }
.txn-balance { font-size: 0.68rem; color: var(--text-3); }
.cat-bar-fill--debit  { background: #F87171; }
.cat-bar-fill--credit { background: var(--teal); }

/* Loading skeleton */
.txn-loading { display: flex; flex-direction: column; gap: 0; }
.txn-skeleton {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.85rem 0;
  border-bottom: 1px solid var(--border);
}
.skeleton {
  background: linear-gradient(90deg, var(--surface-2) 25%, var(--border) 50%, var(--surface-2) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  border-radius: 6px;
}
.skeleton--icon    { width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0; }
.skeleton--text    { height: 12px; width: 140px; margin-bottom: 6px; }
.skeleton--text-sm { height: 10px; width: 90px; }
.skeleton--amount  { height: 14px; width: 70px; margin-left: auto; flex-shrink: 0; }
.skeleton-lines    { flex: 1; }
@keyframes shimmer { to { background-position: -200% 0; } }

/* Empty state */
.txn-empty {
  padding: 2.5rem;
  text-align: center;
  color: var(--text-3);
  font-size: 0.875rem;
}
</style>
