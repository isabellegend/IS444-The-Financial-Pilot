import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getAccountByNRIC, getAllUsers, getTransactionHistory } from '../api/users.js'

export const useCorporateStore = defineStore('corporate', () => {
  function getInitials(name) {
    const parts = (name || '').trim().split(/\s+/)
    if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?'
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  const sessionName = sessionStorage.getItem('fullName') || 'Corporate Admin'

  const company = ref({
    name:           sessionName,
    uen:            sessionStorage.getItem('nric') || '—',
    bankAccount:    '***-***-8891',
    avatarInitials: getInitials(sessionName),
  })

  const employees          = ref([])
  const isLoadingEmployees = ref(false)
  const employeesError     = ref('')

  async function fetchEmployees() {
    isLoadingEmployees.value = true
    employeesError.value     = ''
    try {
      const { data } = await getAllUsers()
      const list = Array.isArray(data) ? data : []
      employees.value = list
        .filter(u => (u.customerType || '').toLowerCase() === 'retail')
        .map(u => {
          const name = u.fullName || '—'
          // Isabel's salary is 8000 per user request
          const salary = (name.toLowerCase().includes('isabel')) ? 8000 : 0
          
          return {
            id:              String(u.userId),
            name:            name,
            initials:        getInitials(name),
            nric:            u.nric      || '',
            email:           u.email     || '',
            department:      '—',
            salary:          salary,
            lastCreditDate:  null,
            lastCreditAmount:null,
            status:          'pending',
          }
        })
    } catch (err) {
      employeesError.value = err?.response?.data?.Errors?.[0]
        || err?.message
        || 'Failed to load employees.'
    } finally {
      isLoadingEmployees.value = false
    }
  }

  const payrollHistory = ref([
    { id: 'pr-001', month: 'Mar 2026', totalPaid: 44100.00, employeeCount: 5, processedAt: '2026-03-01T09:00:00Z', status: 'completed' },
    { id: 'pr-002', month: 'Feb 2026', totalPaid: 44100.00, employeeCount: 5, processedAt: '2026-02-01T09:00:00Z', status: 'completed' },
    { id: 'pr-003', month: 'Jan 2026', totalPaid: 38600.00, employeeCount: 5, processedAt: '2026-01-01T09:00:00Z', status: 'completed' },
  ])

  const isCreditingId  = ref(null)
  const isCreditingAll = ref(false)

  // Company checking account
  const accountBalance    = ref(null)
  const accountCurrency   = ref('SGD')
  const accountStatus     = ref('')
  const accountHolderName = ref('')
  const isLoadingBalance  = ref(false)

  async function fetchBalance() {
    const nric = sessionStorage.getItem('nric')
    if (!nric) return
    isLoadingBalance.value = true
    try {
      const { data } = await getAccountByNRIC(nric)
      accountBalance.value    = data.balance
      accountCurrency.value   = data.currency          || 'SGD'
      accountStatus.value     = data.status            || ''
      accountHolderName.value = data.accountHolderName || company.value.name
    } finally {
      isLoadingBalance.value = false
    }
  }

  const totalPayroll = computed(() =>
    employees.value.reduce((sum, e) => sum + (e.salary || 0), 0)
  )

  const pendingEmployees = computed(() =>
    employees.value.filter(e => e.status === 'pending')
  )

  const pendingCount = computed(() => pendingEmployees.value.length)

  const pendingPayroll = computed(() =>
    pendingEmployees.value.reduce((sum, e) => sum + (e.salary || 0), 0)
  )

  const transactions          = ref([])
  const isLoadingTransactions = ref(false)

  async function fetchTransactions() {
    const nric = sessionStorage.getItem('nric')
    if (!nric) return
    isLoadingTransactions.value = true
    try {
      const { data } = await getTransactionHistory(nric)
      const rawList = Array.isArray(data) ? data : (data?.List ?? data?.Transactions ?? [])
      transactions.value = rawList.map(t => ({
        id:           t.transactionId,
        date:         t.transactionDate ? t.transactionDate.slice(0, 10) : '',
        merchant:     t.narrative || '—',
        type:         t.transactionType,
        amount:       t.transactionType === 'DEBIT' ? -Number(t.amount) : Number(t.amount),
        balanceAfter: Number(t.balanceAfter),
        status:       'settled',
      }))
    } finally {
      isLoadingTransactions.value = false
    }
  }

  function initFromSession() {
    const name = sessionStorage.getItem('fullName') || 'Corporate Admin'
    company.value.name           = name
    company.value.avatarInitials = getInitials(name)
  }

  function creditEmployee(employeeId) {
    const emp = employees.value.find(e => e.id === employeeId)
    if (emp) {
      emp.lastCreditDate    = new Date().toISOString().split('T')[0]
      emp.lastCreditAmount  = emp.salary
      emp.status            = 'credited'
    }
  }

  async function creditAll() {
    isCreditingAll.value = true
    try {
      await new Promise(r => setTimeout(r, 1400))
      const today   = new Date().toISOString().split('T')[0]
      const pending = employees.value.filter(e => e.status === 'pending')
      pending.forEach(emp => {
        emp.lastCreditDate   = today
        emp.lastCreditAmount = emp.salary
        emp.status           = 'credited'
      })
      if (pending.length) {
        payrollHistory.value.unshift({
          id:            'pr-' + Date.now(),
          month:         new Date().toLocaleString('en-SG', { month: 'short', year: 'numeric' }),
          totalPaid:     pending.reduce((s, e) => s + (e.salary || 0), 0),
          employeeCount: pending.length,
          processedAt:   new Date().toISOString(),
          status:        'completed',
        })
      }
    } finally {
      isCreditingAll.value = false
    }
  }

  return {
    company, employees, isLoadingEmployees, employeesError, payrollHistory,
    isCreditingId, isCreditingAll,
    accountBalance, accountCurrency, accountStatus, accountHolderName, isLoadingBalance,
    transactions, isLoadingTransactions,
    totalPayroll, pendingCount, pendingPayroll, pendingEmployees,
    initFromSession, fetchBalance, fetchEmployees, fetchTransactions, creditEmployee, creditAll,
  }
})
