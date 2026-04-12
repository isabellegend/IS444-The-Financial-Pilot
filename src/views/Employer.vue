<template>
  <div class="employer-portal">
    <!-- Page header -->
    <div class="page-header">
      <div>
        <h1>Payroll Dashboard</h1>
        <p class="page-sub">{{ store.employer.name }} &middot; UEN {{ store.employer.uen }}</p>
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
      <div class="stat-card">
        <span class="stat-label">Bank Account</span>
        <span class="stat-value mono">{{ store.employer.bankAccount }}</span>
        <span class="stat-sub">disbursement account</span>
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

      <div class="emp-table">
        <div class="emp-row emp-row--header">
          <span>Employee</span>
          <span>Department</span>
          <span>Salary</span>
          <span>Last Credit</span>
          <span>Status</span>
          <span>Action</span>
        </div>

        <div
          v-for="emp in filteredEmployees"
          :key="emp.id"
          class="emp-row"
          :class="{ 'emp-row--crediting': store.isCreditingId === emp.id }"
        >
          <div class="emp-identity">
            <div class="emp-avatar">{{ emp.initials }}</div>
            <div>
              <span class="emp-name">{{ emp.name }}</span>
              <span class="emp-id mono">{{ emp.id }}</span>
            </div>
          </div>
          <span class="emp-dept">{{ emp.department }}</span>
          <span class="emp-salary mono">S${{ fmt(emp.salary) }}</span>
          <span class="emp-date mono">{{ emp.lastCreditDate ? fmtDate(emp.lastCreditDate) : '—' }}</span>
          <span :class="['status-badge', `status-badge--${emp.status}`]">
            <span class="status-dot" />
            {{ emp.status === 'credited' ? 'Credited' : 'Pending' }}
          </span>
          <button
            :class="['credit-btn', emp.status === 'credited' ? 'credit-btn--done' : 'credit-btn--pending']"
            :disabled="emp.status === 'credited' || store.isCreditingId === emp.id || store.isCreditingAll"
            @click="store.creditEmployee(emp.id)"
          >
            <span v-if="store.isCreditingId === emp.id" class="spinner spinner--sm" />
            <svg v-else-if="emp.status === 'credited'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            {{ store.isCreditingId === emp.id ? 'Crediting…' : emp.status === 'credited' ? 'Done' : 'Credit Salary' }}
          </button>
        </div>

        <div v-if="filteredEmployees.length === 0" class="emp-empty">
          No employees match this filter.
        </div>
      </div>
    </div>

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
import { ref, computed } from 'vue'
import { useEmployerStore } from '../stores/employer.js'

const store     = useEmployerStore()
const activeTab = ref('all')

const filteredEmployees = computed(() => {
  if (activeTab.value === 'all') return store.employees
  return store.employees.filter(e => e.status === activeTab.value)
})

function fmt(n) {
  return Number(n).toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-SG', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>

<style scoped>
.employer-portal {
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
.emp-dept { font-size: 0.82rem; color: var(--text-2); }
.emp-salary { font-size: 0.875rem; color: var(--text); }
.emp-date { font-size: 0.8rem; color: var(--text-2); }

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
.status-badge--credited { background: rgba(34,197,94,0.1); color: var(--success); border: 1px solid rgba(34,197,94,0.2); }
.status-badge--pending  { background: rgba(245,200,66,0.1); color: var(--gold);    border: 1px solid rgba(245,200,66,0.2); }
.status-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

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
.credit-btn--pending:hover:not(:disabled) { background: rgba(0,212,200,0.2); box-shadow: 0 0 12px var(--teal-glow); }
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

.spinner { width: 14px; height: 14px; border: 2px solid rgba(0,212,200,0.2); border-top-color: var(--teal); border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; flex-shrink: 0; }
.spinner--sm { width: 12px; height: 12px; }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 900px) { .stats-row { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 700px) {
  .emp-row { grid-template-columns: 1fr 1fr; gap: 0.5rem; }
  .emp-row--header { display: none; }
  .emp-dept, .emp-date { display: none; }
}
@media (max-width: 480px) { .stats-row { grid-template-columns: 1fr; } }
</style>
