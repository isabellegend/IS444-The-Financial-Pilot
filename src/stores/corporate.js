import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getAccountByNRIC, getAllUsers } from '../api/users.js'

export const useCorporateStore = defineStore('corporate', () => {
  function getInitials(name) {
    const parts = (name || '').trim().split(/\s+/)
    if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?'
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  const sessionName = sessionStorage.getItem('fullName') || 'Corporate Admin'

  const company = ref({
    name:           sessionName,
    uen:            '201234567K',
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
        .map(u => ({
          id:              String(u.userId),
          name:            u.fullName  || '—',
          initials:        getInitials(u.fullName),
          nric:            u.nric      || '',
          email:           u.email     || '',
          department:      '—',
          salary:          0,
          lastCreditDate:  null,
          lastCreditAmount:null,
          status:          'pending',
        }))
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
    totalPayroll, pendingCount, pendingPayroll, pendingEmployees,
    initFromSession, fetchBalance, fetchEmployees, creditEmployee, creditAll,
  }
})
