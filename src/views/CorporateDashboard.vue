<template>
  <div class="corporate-portal">
    <!-- Page header -->
    <div class="page-header">
      <div>
        <h1>Payroll Dashboard</h1>
        <p class="page-sub">{{ store.company.name }} &middot; UEN {{ store.company.uen }}</p>
      </div>
      <button
        class="btn btn-primary run-payroll-btn"
        :disabled="store.pendingCount === 0 || store.isCreditingAll"
        @click="store.creditAll()"
      >
        <span v-if="store.isCreditingAll" class="spinner" />
        <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        {{ store.isCreditingAll ? 'Processing…' : `Run Payroll (${store.pendingCount} pending)` }}
      </button>
    </div>

    <!-- Transfer / Credit Salary modal -->
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

    <!-- Stats row -->
    <div class="stats-row">
      <div class="stat-card">
        <span class="stat-label">Total Headcount</span>
        <span class="stat-value mono">{{ store.employees.length }}</span>
        <span class="stat-sub">employees</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Monthly Payroll</span>
        <span class="stat-value mono">S${{ fmt(store.totalPayroll) }}</span>
        <span class="stat-sub">gross total</span>
      </div>
      <div class="stat-card" :class="{ 'stat-card--alert': store.pendingCount > 0 }">
        <span class="stat-label">Pending Credits</span>
        <span class="stat-value mono">{{ store.pendingCount }}</span>
        <span class="stat-sub">{{ store.pendingCount > 0 ? `S$${fmt(store.pendingPayroll)} to disburse` : 'all clear' }}</span>
      </div>
      <div class="stat-card stat-card--balance">
        <span class="stat-label">Account Balance</span>
        <span v-if="store.isLoadingBalance" class="stat-value mono stat-value--loading">
          <span class="spinner spinner--sm" /> Fetching…
        </span>
        <span v-else class="stat-value mono">
          {{ store.accountBalance != null ? fmtBalance(store.accountBalance) : '—' }}
        </span>
        <span class="stat-sub">
          {{ store.accountCurrency }}
          <span v-if="store.accountStatus" :class="['acct-status', store.accountStatus === 'ACTIVE' ? 'acct-status--active' : 'acct-status--inactive']">
            {{ store.accountStatus }}
          </span>
        </span>
      </div>
    </div>



    <!-- Employee table -->
    <div class="section-card">
      <div class="section-header">
        <h3>Employees</h3>
        <div class="filter-tabs">
          <button
            v-for="tab in ['all', 'pending', 'credited']"
            :key="tab"
            :class="['filter-tab', { 'filter-tab--active': activeTab === tab }]"
            @click="activeTab = tab"
          >
            {{ tab === 'all' ? 'All' : tab === 'pending' ? `Pending (${store.pendingCount})` : 'Credited' }}
          </button>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="store.isLoadingEmployees" class="emp-loading">
        <span class="spinner spinner--sm" /> Loading employees…
      </div>

      <!-- Error state -->
      <div v-else-if="store.employeesError" class="emp-error">
        {{ store.employeesError }}
        <button class="retry-btn" @click="store.fetchEmployees()">Retry</button>
      </div>

      <div v-else class="emp-table">
        <div class="emp-row emp-row--header">
          <span>Employee</span>
          <span>NRIC</span>
          <span>Salary</span>
          <span>Last Credit</span>
          <span>Status</span>
          <span>Action</span>
        </div>

        <div
          v-for="emp in filteredEmployees"
          :key="emp.id"
          class="emp-row"
        >
          <div class="emp-identity">
            <div class="emp-avatar">{{ emp.initials }}</div>
            <div>
              <span class="emp-name">{{ emp.name }}</span>
              <span class="emp-id mono">{{ emp.email }}</span>
            </div>
          </div>
          <span class="emp-dept mono">{{ emp.nric || '—' }}</span>
          <span class="emp-salary mono">S${{ fmt(emp.salary) }}</span>
          <span class="emp-date mono">{{ emp.lastCreditDate ? fmtDate(emp.lastCreditDate) : '—' }}</span>
          <span :class="['status-badge', `status-badge--${emp.status}`]">
            <span class="status-dot" />
            {{ emp.status === 'credited' ? 'Credited' : 'Pending' }}
          </span>
          <button
            :class="['credit-btn', emp.status === 'credited' ? 'credit-btn--done' : 'credit-btn--pending']"
            :disabled="emp.status === 'credited' || store.isCreditingAll"
            @click="openCreditModal(emp)"
          >
            <svg v-if="emp.status === 'credited'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            {{ emp.status === 'credited' ? 'Done' : 'Credit Salary' }}
          </button>
        </div>

        <div v-if="filteredEmployees.length === 0" class="emp-empty">
          No employees match this filter.
        </div>
      </div><!-- end emp-table -->
    </div><!-- end section-card -->

    <!-- Payroll history -->
    <div class="section-card">
      <div class="section-header">
        <h3>Payroll History</h3>
      </div>
      <div class="history-list">
        <div v-for="run in store.payrollHistory" :key="run.id" class="history-row">
          <div class="history-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <div class="history-info">
            <span class="history-month">{{ run.month }}</span>
            <span class="history-detail">{{ run.employeeCount }} employees credited</span>
          </div>
          <div class="history-meta">
            <span class="history-amount mono">S${{ fmt(run.totalPaid) }}</span>
            <span class="history-date mono">{{ fmtDate(run.processedAt.split('T')[0]) }}</span>
          </div>
          <span class="status-badge status-badge--credited">
            <span class="status-dot" />Completed
          </span>
        </div>
        <div v-if="store.payrollHistory.length === 0" class="emp-empty">No payroll runs yet.</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCorporateStore } from '../stores/corporate.js'
import { useFinanceStore } from '../stores/finance.js'
import { debitSpendAccount, creditSpendAccount } from '../api/users.js'

const store        = useCorporateStore()
const financeStore = useFinanceStore()
const activeTab = ref('all')

onMounted(() => {
  store.fetchBalance()
  store.fetchEmployees()
})

const filteredEmployees = computed(() => {
  if (activeTab.value === 'all') return store.employees
  return store.employees.filter(e => e.status === activeTab.value)
})

// ── Transfer modal ─────────────────────────────────────────────
const showTransfer    = ref(false)
const isTransferring  = ref(false)
const transferSuccess = ref('')
const transferError   = ref('')
const pendingEmpId    = ref(null)

const transfer = ref({ recipientNric: '', amount: '', note: '' })

function openCreditModal(emp) {
  if (emp.status === 'credited') return
  pendingEmpId.value        = emp.id
  transfer.value.recipientNric = emp.nric || ''
  transfer.value.amount        = emp.salary
  transfer.value.note          = `Salary - ${new Date().toLocaleString('en-SG', { month: 'short', year: 'numeric' })}`
  transferSuccess.value = ''
  transferError.value   = ''
  showTransfer.value    = true
}

function closeTransfer() {
  showTransfer.value    = false
  transferSuccess.value = ''
  transferError.value   = ''
  pendingEmpId.value    = null
  transfer.value = { recipientNric: '', amount: '', note: '' }
}

async function submitTransfer() {
  transferError.value = ''
  const amt = Number(transfer.value.amount)
  if (!amt || amt <= 0) { transferError.value = 'Enter a valid amount.'; return }

  const payerNric     = sessionStorage.getItem('nric') || ''
  const recipientNric = transfer.value.recipientNric.trim().toUpperCase()
  const narrative     = transfer.value.note.trim() || `Salary to ${recipientNric}`
  const referenceId   = 'REF' + Date.now()

  isTransferring.value = true
  try {
    const { data: debitData } = await debitSpendAccount({
      nric: payerNric, amount: amt, narrative, referenceId,
    })

    await creditSpendAccount({
      nric: recipientNric, amount: amt, narrative, referenceId,
    })

    if (debitData.balanceAfter != null) {
      financeStore.balances.spend = Number(debitData.balanceAfter)
    }

    // Mark employee as credited in the store
    if (pendingEmpId.value) store.creditEmployee(pendingEmpId.value)

    transferSuccess.value = `S$ ${amt.toFixed(2)} sent to ${recipientNric}. New balance: S$ ${Number(debitData.balanceAfter ?? financeStore.balances.spend).toFixed(2)}.`
  } catch (err) {
    const msg = err?.response?.data?.Errors?.[0]
      || err?.response?.data?.message
      || err?.message
      || 'Transfer failed. Please try again.'
    transferError.value = msg
  } finally {
    isTransferring.value = false
  }
}

function fmt(n) {
  return Number(n).toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// API returns balance as a whole-number string (no decimals)
function fmtBalance(raw) {
  const n = Number(raw)
  if (isNaN(n)) return '—'
  return n.toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtDate(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return new Date(+y, +m - 1, +d).toLocaleDateString('en-SG', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>

<style scoped>
.corporate-portal {
  max-width: 1100px;
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}
.page-header h1 { font-size: 1.6rem; font-weight: 700; color: var(--text); }
.page-sub { font-size: 0.8rem; color: var(--text-3); margin-top: 0.2rem; font-family: var(--font-mono); }

.run-payroll-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.run-payroll-btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none !important; box-shadow: none; }

/* Stats */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}
.stat-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.stat-card--balance {
  border-color: rgba(0,212,200,0.35);
  background: linear-gradient(135deg, var(--surface), rgba(0,212,200,0.06));
  box-shadow: 0 8px 32px rgba(0,212,200,0.08);
}
.stat-card--balance .stat-value { color: var(--teal); text-shadow: 0 0 12px var(--teal-glow); }

.stat-card--alert {
  border-color: rgba(245,200,66,0.35);
  background: linear-gradient(135deg, var(--surface), rgba(245,200,66,0.06));
  box-shadow: 0 8px 32px rgba(245,200,66,0.08);
}
.stat-card--alert .stat-value { color: var(--gold); text-shadow: 0 0 12px rgba(245,200,66,0.2); }

.stat-value--loading {
  display: flex; align-items: center; gap: 0.4rem;
  font-size: 1rem;
}
.acct-status {
  display: inline-flex; align-items: center; gap: 0.3rem;
  font-size: 0.68rem; font-weight: 600; padding: 0.1rem 0.45rem;
  border-radius: 20px; margin-left: 0.35rem;
}
.acct-status--active   { background: rgba(34,197,94,0.12); color: var(--success); border: 1px solid rgba(34,197,94,0.2); }
.acct-status--inactive { background: rgba(239,68,68,0.1);  color: #f87171;        border: 1px solid rgba(239,68,68,0.2); }

/* Account balance card */
.account-card {
  background: var(--surface);
  border: 1px solid rgba(0,212,200,0.2);
  border-radius: var(--radius);
  padding: 1.1rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}
.account-card__left {
  display: flex; align-items: center; gap: 0.85rem; flex: 1;
}
.account-icon {
  width: 42px; height: 42px;
  border-radius: 10px;
  background: var(--teal-dim);
  border: 1px solid rgba(0,212,200,0.2);
  color: var(--teal);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.account-card__label { font-size: 0.7rem; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 0.15rem; }
.account-card__name  { font-size: 0.9rem; font-weight: 600; color: var(--text); margin: 0; }
.account-card__right {
  display: flex; align-items: baseline; gap: 0.4rem;
}
.account-card__bal {
  font-size: 1.4rem; font-weight: 700; color: var(--teal);
}
.account-card__currency {
  font-size: 0.75rem; color: var(--text-3); font-weight: 500;
}
.refresh-btn {
  background: none; border: none; color: var(--text-3);
  cursor: pointer; padding: 6px; border-radius: 6px;
  display: flex; transition: all var(--tr); flex-shrink: 0;
}
.refresh-btn:hover:not(:disabled) { color: var(--teal); background: var(--teal-dim); }
.refresh-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.stat-card--alert {
  border-color: rgba(245,200,66,0.35);
  background: linear-gradient(135deg, var(--surface), rgba(245,200,66,0.04));
}
.stat-label { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.07em; color: var(--text-3); font-weight: 500; }
.stat-value { font-size: 1.5rem; font-weight: 700; color: var(--text); line-height: 1.1; margin: 0.25rem 0 0.1rem; }
.stat-sub { font-size: 0.73rem; color: var(--text-3); }
.stat-card--alert .stat-value { color: var(--gold); }
.stat-card--alert .stat-sub { color: rgba(245,200,66,0.7); }

/* Section cards */
.section-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border);
  flex-wrap: wrap;
  gap: 0.75rem;
}
.section-header h3 { font-size: 0.95rem; font-weight: 600; color: var(--text); }

.filter-tabs { display: flex; gap: 4px; }
.filter-tab {
  padding: 0.35rem 0.85rem;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 500;
  background: transparent;
  color: var(--text-3);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all var(--tr);
}
.filter-tab:hover { color: var(--text-2); background: var(--surface-2); }
.filter-tab--active { background: var(--surface-2); color: var(--teal); border-color: rgba(0,212,200,0.2); }

/* Table */
.emp-table { display: flex; flex-direction: column; }
.emp-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1.2fr;
  align-items: center;
  gap: 1rem;
  padding: 0.9rem 1.5rem;
  border-bottom: 1px solid var(--border);
  transition: background var(--tr);
}
.emp-row:last-child { border-bottom: none; }
.emp-row--header {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--text-3);
  font-weight: 500;
  background: var(--surface-2);
  padding-top: 0.65rem;
  padding-bottom: 0.65rem;
}
.emp-row:not(.emp-row--header):hover { background: var(--surface-2); }
.emp-row--crediting { background: rgba(0,212,200,0.04); }

.emp-identity { display: flex; align-items: center; gap: 0.75rem; }
.emp-avatar {
  width: 34px; height: 34px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--teal-dim), rgba(0,212,200,0.08));
  border: 1px solid rgba(0,212,200,0.2);
  color: var(--teal);
  font-size: 0.7rem;
  font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.emp-name { display: block; font-size: 0.875rem; font-weight: 500; color: var(--text); }
.emp-id { display: block; font-size: 0.7rem; color: var(--text-3); margin-top: 1px; }
.emp-dept  { font-size: 0.82rem; color: var(--text-2); }
.emp-salary { font-size: 0.875rem; color: var(--text); font-weight: 600; }
.emp-email { font-size: 0.8rem; color: var(--text-2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.emp-date  { font-size: 0.8rem; color: var(--text-2); }

.emp-loading {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 2rem 1.5rem; font-size: 0.85rem; color: var(--text-3);
}
.emp-error {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 1.25rem 1.5rem; font-size: 0.82rem; color: #f87171;
}
.retry-btn {
  background: none; border: 1px solid rgba(239,68,68,0.3); color: #f87171;
  padding: 0.25rem 0.65rem; border-radius: 6px; font-size: 0.75rem;
  cursor: pointer; transition: all var(--tr);
}
.retry-btn:hover { background: rgba(239,68,68,0.1); }

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.25rem 0.65rem;
  border-radius: 20px;
  font-size: 0.72rem;
  font-weight: 600;
  width: fit-content;
}
.status-badge--credited { 
  background: rgba(34,197,94,0.1); color: var(--success); border: 1px solid rgba(34,197,94,0.2); 
  animation: badgePop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.status-badge--pending  { background: rgba(245,200,66,0.1); color: var(--gold);    border: 1px solid rgba(245,200,66,0.2); }
.status-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

@keyframes badgePop {
  0% { transform: scale(0.8); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.credit-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.85rem;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--tr);
  border: 1px solid transparent;
  white-space: nowrap;
}
.credit-btn--pending { background: var(--teal-dim); color: var(--teal); border-color: rgba(0,212,200,0.25); }
.credit-btn--pending:hover:not(:disabled) { background: rgba(0,212,200,0.2); box-shadow: 0 0 12px var(--teal-glow); transform: translateY(-1px); }
.credit-btn--done { background: transparent; color: var(--text-3); border-color: var(--border); cursor: default; }
.credit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.emp-empty { padding: 2.5rem; text-align: center; color: var(--text-3); font-size: 0.85rem; }

/* History */
.history-list { display: flex; flex-direction: column; }
.history-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border);
  transition: background var(--tr);
}
.history-row:last-child { border-bottom: none; }
.history-row:hover { background: var(--surface-2); }
.history-icon {
  width: 36px; height: 36px;
  border-radius: 10px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  display: flex; align-items: center; justify-content: center;
  color: var(--text-2);
  flex-shrink: 0;
}
.history-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.history-month { font-size: 0.875rem; font-weight: 600; color: var(--text); }
.history-detail { font-size: 0.75rem; color: var(--text-3); }
.history-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; margin-right: 1rem; }
.history-amount { font-size: 0.9rem; font-weight: 600; color: var(--text); }
.history-date { font-size: 0.72rem; color: var(--text-3); }

.mono { font-family: var(--font-mono); }

/* ── Transfer Modal ── */
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
.modal-header h3 { font-size: 1.1rem; font-weight: 700; color: var(--text); }
.modal-close {
  background: none; border: none; color: var(--text-3); cursor: pointer;
  padding: 4px; border-radius: 6px; display: flex; transition: all var(--tr);
}
.modal-close:hover { color: var(--text); background: var(--surface-2); }


.m-field { display: flex; flex-direction: column; gap: 0.3rem; margin-bottom: 0.85rem; }
.m-field label {
  font-size: 0.72rem; font-weight: 500; text-transform: uppercase;
  letter-spacing: 0.05em; color: var(--text-2);
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

.amount-wrap { position: relative; }
.amount-prefix {
  position: absolute; left: 0.85rem; top: 50%; transform: translateY(-50%);
  font-size: 0.875rem; color: var(--text-3); pointer-events: none;
  font-family: var(--font-mono);
}
.amount-input { padding-left: 2.2rem !important; }

.t-error {
  font-size: 0.8rem; color: #f87171;
  background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2);
  border-radius: 8px; padding: 0.5rem 0.75rem; margin-bottom: 0.75rem;
}

.modal-actions { display: flex; gap: 0.75rem; margin-top: 0.25rem; }
.modal-actions .btn-primary {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
}

.transfer-success {
  display: flex; flex-direction: column; align-items: center;
  text-align: center; padding: 1rem 0 0.5rem; gap: 0.6rem;
}
.ts-icon {
  width: 56px; height: 56px; border-radius: 50%;
  background: var(--teal-dim); border: 1px solid rgba(0,212,200,0.25);
  color: var(--teal); display: flex; align-items: center; justify-content: center;
  margin-bottom: 0.25rem;
}
.ts-title { font-size: 1.1rem; font-weight: 700; color: var(--text); }
.ts-sub   { font-size: 0.85rem; color: var(--text-2); }
.ts-btn   { margin-top: 0.5rem; }

.btn-ghost {
  background: none; border: 1px solid var(--border); color: var(--text-2);
  padding: 0.55rem 1.1rem; border-radius: 8px; font-size: 0.85rem; font-weight: 600;
  cursor: pointer; transition: all 0.2s;
}
.btn-ghost:hover:not(:disabled) { border-color: var(--text-3); color: var(--text); }
.btn-ghost:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-spinner {
  display: inline-block; width: 13px; height: 13px;
  border: 2px solid rgba(10,15,30,0.3); border-top-color: #0A0F1E;
  border-radius: 50%; animation: spin 0.65s linear infinite; flex-shrink: 0;
}

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-active .modal-box,
.modal-fade-leave-active .modal-box { transition: transform 0.2s ease, opacity 0.2s ease; }
.modal-fade-enter-from { opacity: 0; }
.modal-fade-enter-from .modal-box { transform: scale(0.95) translateY(8px); opacity: 0; }
.modal-fade-leave-to { opacity: 0; }

.spinner { width: 14px; height: 14px; border: 2px solid rgba(0,212,200,0.2); border-top-color: var(--teal); border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; flex-shrink: 0; }
.spinner--sm { width: 12px; height: 12px; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Btn */
.btn {
  display: inline-flex; align-items: center; gap: 0.4rem;
  padding: 0.55rem 1.1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}
.btn-primary {
  background: var(--teal);
  color: #0A0F1E;
  box-shadow: 0 0 20px var(--teal-glow);
}
.btn-primary:hover:not(:disabled) { background: #00ece4; transform: translateY(-1px); }

@media (max-width: 900px) { .stats-row { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 700px) {
  .emp-row { grid-template-columns: 1fr 1fr; gap: 0.5rem; }
  .emp-row--header { display: none; }
  .emp-dept, .emp-date { display: none; }
}
@media (max-width: 480px) { .stats-row { grid-template-columns: 1fr; } }
</style>
