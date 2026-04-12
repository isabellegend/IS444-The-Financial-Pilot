import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useEmployerStore = defineStore('employer', () => {
  const employer = ref({
    id: 'emp-001',
    name: 'Meridian Tech Pte Ltd',
    uen: '201234567K',
    bankAccount: '***-***-8891',
    avatarInitials: 'MT',
    payrollDate: 1,
  })

  const employees = ref([
    {
      id: 'u-001', name: 'Alex Tan Wei Ming',  initials: 'AT',
      department: 'Engineering', salary: 8500.00,
      lastCreditDate: '2026-03-01', lastCreditAmount: 8500.00, status: 'credited',
    },
    {
      id: 'u-002', name: 'Priya Nair',          initials: 'PN',
      department: 'Product',     salary: 7200.00,
      lastCreditDate: '2026-03-01', lastCreditAmount: 7200.00, status: 'credited',
    },
    {
      id: 'u-003', name: 'Jordan Lee',           initials: 'JL',
      department: 'Design',      salary: 6800.00,
      lastCreditDate: '2026-03-01', lastCreditAmount: 6800.00, status: 'credited',
    },
    {
      id: 'u-004', name: 'Benny Ong',            initials: 'BO',
      department: 'Marketing',   salary: 5500.00,
      lastCreditDate: '2026-03-01', lastCreditAmount: 5500.00, status: 'credited',
    },
    {
      id: 'u-005', name: 'Sarah Lim Hui Ting',   initials: 'SL',
      department: 'Operations',  salary: 6100.00,
      lastCreditDate: '2026-03-01', lastCreditAmount: 6100.00, status: 'credited',
    },
    {
      id: 'u-006', name: 'David Chua',           initials: 'DC',
      department: 'Engineering', salary: 9000.00,
      lastCreditDate: null, lastCreditAmount: null, status: 'pending',
    },
    {
      id: 'u-007', name: 'Michelle Wong',        initials: 'MW',
      department: 'Finance',     salary: 7800.00,
      lastCreditDate: null, lastCreditAmount: null, status: 'pending',
    },
  ])

  const payrollHistory = ref([
    { id: 'pr-001', month: 'Mar 2026', totalPaid: 44100.00, employeeCount: 5, processedAt: '2026-03-01T09:00:00Z', status: 'completed' },
    { id: 'pr-002', month: 'Feb 2026', totalPaid: 44100.00, employeeCount: 5, processedAt: '2026-02-01T09:00:00Z', status: 'completed' },
    { id: 'pr-003', month: 'Jan 2026', totalPaid: 38600.00, employeeCount: 5, processedAt: '2026-01-01T09:00:00Z', status: 'completed' },
  ])

  const isCreditingId  = ref(null)
  const isCreditingAll = ref(false)

  const totalPayroll = computed(() =>
    employees.value.reduce((sum, e) => sum + e.salary, 0)
  )

  const pendingEmployees = computed(() =>
    employees.value.filter(e => e.status === 'pending')
  )

  const pendingCount = computed(() => pendingEmployees.value.length)

  const pendingPayroll = computed(() =>
    pendingEmployees.value.reduce((sum, e) => sum + e.salary, 0)
  )

  async function creditEmployee(employeeId) {
    isCreditingId.value = employeeId
    try {
      // TODO: replace with real salaryService call (Split Salary composite service)
      await new Promise(r => setTimeout(r, 900))
      const emp = employees.value.find(e => e.id === employeeId)
      if (emp) {
        emp.lastCreditDate   = new Date().toISOString().split('T')[0]
        emp.lastCreditAmount = emp.salary
        emp.status           = 'credited'
      }
    } finally {
      isCreditingId.value = null
    }
  }

  async function creditAll() {
    isCreditingAll.value = true
    try {
      // TODO: replace with real batch salary credit call
      await new Promise(r => setTimeout(r, 1400))
      const today = new Date().toISOString().split('T')[0]
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
          totalPaid:     pending.reduce((s, e) => s + e.salary, 0),
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
    employer, employees, payrollHistory,
    isCreditingId, isCreditingAll,
    totalPayroll, pendingCount, pendingPayroll, pendingEmployees,
    creditEmployee, creditAll,
  }
})
