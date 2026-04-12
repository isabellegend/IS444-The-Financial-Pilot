<template>
  <div class="debit-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Debit Card</h1>
        <p class="page-sub">Virtual Spend bucket card</p>
      </div>
      <button class="btn btn-primary transfer-trigger" @click="showTransfer = true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="22" y1="2" x2="11" y2="13"/>
          <polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
        Transfer
      </button>
    </div>

    <!-- Transfer modal -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showTransfer" class="modal-overlay" @click.self="closeTransfer">
          <div class="modal-box">
            <div class="modal-header">
              <h3>Transfer Funds</h3>
              <button class="modal-close" @click="closeTransfer">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <!-- Success state -->
            <div v-if="transferSuccess" class="transfer-success">
              <div class="ts-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <p class="ts-title">Transfer Sent</p>
              <p class="ts-sub">{{ transferSuccess }}</p>
              <button class="btn btn-ghost ts-btn" @click="closeTransfer">Done</button>
            </div>

            <!-- Form -->
            <template v-else>
              <div class="modal-balance">
                <span class="mb-label">Available (Spend)</span>
                <span class="mb-val mono">S$ {{ fmt(store.balances.spend) }}</span>
              </div>

              <form @submit.prevent="submitTransfer">
                <div class="m-field">
                  <label>Recipient NRIC</label>
                  <input
                    v-model="transfer.recipientNric"
                    type="text"
                    placeholder="e.g. S1234567A"
                    :disabled="isTransferring"
                    required
                  />
                </div>
                <div class="m-field">
                  <label>Amount (S$)</label>
                  <div class="amount-wrap">
                    <span class="amount-prefix">S$</span>
                    <input
                      v-model.number="transfer.amount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="0.00"
                      class="amount-input"
                      :disabled="isTransferring"
                      required
                    />
                  </div>
                </div>
                <div class="m-field">
                  <label>Note <span class="optional">(optional)</span></label>
                  <input
                    v-model="transfer.note"
                    type="text"
                    placeholder="e.g. Dinner split"
                    :disabled="isTransferring"
                  />
                </div>

                <p v-if="transferError" class="t-error">{{ transferError }}</p>

                <div class="modal-actions">
                  <button type="submit" class="btn btn-primary" :disabled="isTransferring">
                    <span v-if="isTransferring" class="btn-spinner" />
                    {{ isTransferring ? 'Sending…' : 'Send Transfer' }}
                  </button>
                  <button type="button" class="btn btn-ghost" @click="closeTransfer" :disabled="isTransferring">
                    Cancel
                  </button>
                </div>
              </form>
            </template>
          </div>
        </div>
      </Transition>
    </Teleport>

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
import { ref, computed, onMounted } from 'vue'
import { useFinanceStore } from '../stores/finance.js'
import { debitSpendAccount, creditSpendAccount } from '../api/users.js'

const store = useFinanceStore()

onMounted(() => store.fetchTransactions())

// ── Transfer ──────────────────────────────────────────────────
const showTransfer   = ref(false)
const isTransferring = ref(false)
const transferSuccess = ref('')
const transferError  = ref('')

const transfer = ref({ recipientNric: '', amount: '', note: '' })

function closeTransfer() {
  showTransfer.value   = false
  transferSuccess.value = ''
  transferError.value  = ''
  transfer.value = { recipientNric: '', amount: '', note: '' }
}

async function submitTransfer() {
  transferError.value = ''
  const amt = Number(transfer.value.amount)
  if (!amt || amt <= 0) { transferError.value = 'Enter a valid amount.'; return }
  if (amt > store.balances.spend) { transferError.value = 'Insufficient funds in Spend bucket.'; return }

  const payerNric    = sessionStorage.getItem('nric') || 'T9992445Z'
  const recipientNric = transfer.value.recipientNric.trim().toUpperCase()
  const narrative    = transfer.value.note.trim() || `Transfer to ${recipientNric}`
  const referenceId  = 'REF' + Date.now()

  isTransferring.value = true
  try {
    // Step 1 — Debit payer's Spend wallet
    const { data: debitData } = await debitSpendAccount({
      nric:        payerNric,
      amount:      amt,
      narrative,
      referenceId,
    })
    console.log('[DebitSpendAccount] response:', JSON.stringify(debitData, null, 2))

    // Step 2 — Credit recipient's Spend wallet
    const { data: creditData } = await creditSpendAccount({
      nric:        recipientNric,
      amount:      amt,
      narrative,
      referenceId,
    })
    console.log('[CreditSpendAccount] response:', JSON.stringify(creditData, null, 2))

    // Update local spend balance with what the server returned
    store.balances.spend = debitData.balanceAfter

    transferSuccess.value = `S$ ${amt.toFixed(2)} sent to ${recipientNric}. Your new Spend balance is S$ ${Number(debitData.balanceAfter).toFixed(2)}.`
  } catch (err) {
    console.error('[Transfer error]', err?.response?.data)
    const msg = err?.response?.data?.Errors?.[0]
      || err?.response?.data?.message
      || err?.message
      || 'Transfer failed. Please try again.'
    transferError.value = msg
  } finally {
    isTransferring.value = false
  }
}

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
.page-header  {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 2rem;
}
.page-title   { font-size: 1.75rem; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 0.2rem; }
.page-sub     { color: var(--text-2); font-size: 0.875rem; }
.label-sm     { font-size: 0.75rem; color: var(--text-3); }

.transfer-trigger {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

/* ── Modal ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 500;
  padding: 1rem;
}
.modal-box {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 1.75rem;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 32px 64px rgba(0,0,0,0.5);
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}
.modal-header h3 { font-size: 1.1rem; font-weight: 700; }
.modal-close {
  background: none;
  border: none;
  color: var(--text-3);
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  display: flex;
  transition: all var(--tr);
}
.modal-close:hover { color: var(--text); background: var(--surface-2); }

.modal-balance {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0.75rem 1rem;
  margin-bottom: 1.25rem;
}
.mb-label { font-size: 0.78rem; color: var(--text-3); }
.mb-val   { font-size: 0.95rem; font-weight: 500; color: var(--teal); }

.m-field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  margin-bottom: 0.85rem;
}
.m-field label {
  font-size: 0.72rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-2);
}
.optional { text-transform: none; font-weight: 400; color: var(--text-3); }
.m-field input {
  padding: 0.55rem 0.85rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 0.875rem;
  outline: none;
  background: var(--surface-2);
  color: var(--text);
  transition: border-color 0.2s;
  width: 100%;
  box-sizing: border-box;
}
.m-field input:focus { border-color: var(--teal); box-shadow: 0 0 0 3px var(--teal-dim); }
.m-field input::placeholder { color: var(--text-3); }
.m-field input:disabled { opacity: 0.5; }

.amount-wrap {
  position: relative;
}
.amount-prefix {
  position: absolute;
  left: 0.85rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.875rem;
  color: var(--text-3);
  pointer-events: none;
  font-family: var(--font-mono);
}
.amount-input { padding-left: 2.2rem !important; }

.t-error {
  font-size: 0.8rem;
  color: #f87171;
  background: rgba(239,68,68,0.1);
  border: 1px solid rgba(239,68,68,0.2);
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  margin-bottom: 0.75rem;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.25rem;
}
.modal-actions .btn-primary {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

/* Transfer success */
.transfer-success {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1rem 0 0.5rem;
  gap: 0.6rem;
}
.ts-icon {
  width: 56px; height: 56px;
  border-radius: 50%;
  background: var(--teal-dim);
  border: 1px solid rgba(0,212,200,0.25);
  color: var(--teal);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.25rem;
}
.ts-title { font-size: 1.1rem; font-weight: 700; color: var(--text); }
.ts-sub   { font-size: 0.85rem; color: var(--text-2); }
.ts-btn   { margin-top: 0.5rem; }

/* Spinner */
.btn-spinner {
  display: inline-block;
  width: 13px; height: 13px;
  border: 2px solid rgba(10,15,30,0.3);
  border-top-color: #0A0F1E;
  border-radius: 50%;
  animation: spin 0.65s linear infinite;
  flex-shrink: 0;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Modal transition */
.modal-fade-enter-active, .modal-fade-leave-active {
  transition: opacity 0.2s ease;
}
.modal-fade-enter-active .modal-box,
.modal-fade-leave-active .modal-box {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.modal-fade-enter-from { opacity: 0; }
.modal-fade-enter-from .modal-box { transform: scale(0.95) translateY(8px); opacity: 0; }
.modal-fade-leave-to { opacity: 0; }

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
