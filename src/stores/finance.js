import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { simulateSalaryCredit } from '../services/salaryService.js'
import { getGoalProgress, optimizeSplit } from '../services/goalService.js'
import { getTransactions, getDebitCardInfo } from '../services/accountService.js'
import { getDashboardMetrics } from '../api/dashboard.js'
import { updateSplit } from '../api/chatbot.js'

export const useFinanceStore = defineStore('finance', () => {
  // ── State ──────────────────────────────────────────────────────
  const user = ref({
    id: 'user-001',
    name: 'Alex Tan Wei Ming',
    employer: 'Meridian Tech Pte Ltd',
    checkingAccount: '***-***-4821',
    avatarInitials: 'AT',
  })

  const balances = ref({ save: 12450.00, invest: 8200.00, spend: 3100.00 })
  const splitSettings = ref({ save: 40, invest: 30, spend: 30 })
  const pendingSettings = ref({ save: 40, invest: 30, spend: 30 })

  const salary = ref({
    gross: 8500.00,
    lastCreditDate: '2026-03-01',
    lastCreditAmount: 8500.00,
    nextCreditDate: '2026-04-01',
  })

  const goals = ref([
    { id: 'goal-1', name: 'House Downpayment', target: 50000, current: 17000, deadline: 'Dec 2026', emoji: '🏠' },
    { id: 'goal-2', name: 'Emergency Fund',    target: 15000, current: 12450, deadline: 'Jun 2026', emoji: '🛡️' },
  ])

  const transactions = ref([
    { id: 'txn-001', date: '2026-03-24', merchant: 'Grab Food',        category: 'Food',       amount: -18.90,  status: 'settled' },
    { id: 'txn-002', date: '2026-03-23', merchant: 'FairPrice Online',  category: 'Groceries',  amount: -67.40,  status: 'settled' },
    { id: 'txn-003', date: '2026-03-22', merchant: 'Netflix',           category: 'Entertain',  amount: -18.98,  status: 'settled' },
    { id: 'txn-004', date: '2026-03-21', merchant: 'Uniqlo ION',        category: 'Shopping',   amount: -89.00,  status: 'settled' },
    { id: 'txn-005', date: '2026-03-20', merchant: 'Spotify',           category: 'Entertain',  amount: -9.98,   status: 'settled' },
    { id: 'txn-006', date: '2026-03-19', merchant: 'Shell Buona Vista', category: 'Transport',  amount: -55.00,  status: 'settled' },
    { id: 'txn-007', date: '2026-03-18', merchant: 'Koufu @ One North', category: 'Food',       amount: -8.50,   status: 'settled' },
    { id: 'txn-008', date: '2026-03-17', merchant: 'Amazon SG',         category: 'Shopping',   amount: -112.00, status: 'settled' },
    { id: 'txn-009', date: '2026-03-16', merchant: 'Decathlon',         category: 'Sports',     amount: -45.00,  status: 'settled' },
    { id: 'txn-010', date: '2026-03-15', merchant: 'Wingstop',          category: 'Food',       amount: -22.40,  status: 'settled' },
  ])

  const debitCard = ref({
    cardNumber: '**** **** **** 4821',
    cardholderName: 'ALEX TAN WEI MING',
    expiry: '03/29',
    network: 'VISA',
    spendLimit: 2000.00,
    spentThisMonth: 447.16,
  })

  const chatMessages = ref([
    {
      id: 'msg-0',
      role: 'assistant',
      content: "Hi Alex 👋 I'm your Financial Pilot AI. Ask me anything about optimising your Save, Invest, or Spend split — I'll run the numbers for your goals.",
      ts: Date.now() - 60000,
    },
  ])

  const isRefreshing    = ref(false)
  const isCreditingRef  = ref(false)
  const isChatLoading   = ref(false)
  const settingsSaved   = ref(false)
  const isApplyingSplit = ref(false)

  // Last split event (for dashboard summary)
  const lastSplitEvent = ref({
    date: '2026-03-01',
    gross: 8500,
    save:  3400,
    invest: 2550,
    spend:  2550,
  })

  // ── Computed ──────────────────────────────────────────────────
  const totalBalance = computed(() =>
    balances.value.save + balances.value.invest + balances.value.spend
  )

  const primaryGoal = computed(() => goals.value[0])

  const primaryGoalPct = computed(() => {
    const g = primaryGoal.value
    return Math.min(Math.round((g.current / g.target) * 100), 100)
  })

  const spendLimitPct = computed(() =>
    Math.min(Math.round((debitCard.value.spentThisMonth / debitCard.value.spendLimit) * 100), 100)
  )

  // ── Actions ───────────────────────────────────────────────────
  async function refreshDashboard() {
    isRefreshing.value = true
    try {
      const nric = 'T9992445Z'
      const { data } = await getDashboardMetrics(nric)
      balances.value = {
        save:   parseFloat(data.DepositBalance),
        invest: data.totalPortfolioSizeInBaseCurrency,
        spend:  parseFloat(data.SpendWalletBalance),
      }
    } finally {
      isRefreshing.value = false
    }
  }

  async function simulateSalary() {
    isCreditingRef.value = true
    try {
      const result = await simulateSalaryCredit({
        employer: user.value.employer,
        amount: salary.value.gross,
        splitSettings: splitSettings.value,
      })
      // Update balances
      balances.value.save   += result.split.save
      balances.value.invest += result.split.invest
      balances.value.spend  += result.split.spend

      // Update goal progress proportionally
      goals.value[0].current = Math.min(goals.value[0].current + result.split.save * 0.5, goals.value[0].target)

      // Record last split event
      lastSplitEvent.value = {
        date:   result.creditedAt.split('T')[0],
        gross:  result.grossAmount,
        save:   result.split.save,
        invest: result.split.invest,
        spend:  result.split.spend,
      }

      salary.value.lastCreditDate   = result.creditedAt.split('T')[0]
      salary.value.lastCreditAmount = result.grossAmount

      // Add a transaction
      transactions.value.unshift({
        id:       'txn-sal-' + Date.now(),
        date:     result.creditedAt.split('T')[0],
        merchant: result.employer,
        category: 'Salary',
        amount:   +result.grossAmount,
        status:   'settled',
      })
    } finally {
      isCreditingRef.value = false
    }
  }

  async function approveSplitSettings() {
    const s = pendingSettings.value
    if (s.save + s.invest + s.spend !== 100) return
    splitSettings.value = { ...s }
    settingsSaved.value = true
    setTimeout(() => { settingsSaved.value = false }, 2500)
  }

  async function sendChat(content) {
    chatMessages.value.push({
      id: 'msg-u-' + Date.now(),
      role: 'user',
      content,
      ts: Date.now(),
    })
    isChatLoading.value = true
    try {
      const result = await optimizeSplit(user.value.id, content)
      chatMessages.value.push({
        id: 'msg-a-' + Date.now(),
        role: 'assistant',
        content: result.reply,
        suggestedSplit: result.suggestedSplit,
        ts: Date.now(),
      })
    } finally {
      isChatLoading.value = false
    }
  }

  async function applySuggestedSplit(split) {
    pendingSettings.value = { ...split }
    splitSettings.value   = { ...split }

    isApplyingSplit.value = true
    try {
      const nric = 'T9992445Z'
      const { data } = await updateSplit({
        savePercentage:   split.save,
        investPercentage: split.invest,
        spendPercentage:  split.spend,
        nric,
      })
      chatMessages.value.push({
        id:      'msg-apply-' + Date.now(),
        role:    'assistant',
        content: data.Message || 'Your split has been updated successfully.',
        ts:      Date.now(),
      })
    } catch {
      chatMessages.value.push({
        id:      'msg-apply-err-' + Date.now(),
        role:    'assistant',
        content: 'Split saved locally, but we could not notify the server. Please try again.',
        ts:      Date.now(),
      })
    } finally {
      isApplyingSplit.value = false
    }
  }

  return {
    user, balances, splitSettings, pendingSettings,
    salary, goals, transactions, debitCard, chatMessages,
    isRefreshing, isCreditingRef, isChatLoading, settingsSaved, isApplyingSplit,
    lastSplitEvent,
    totalBalance, primaryGoal, primaryGoalPct, spendLimitPct,
    refreshDashboard, simulateSalary, approveSplitSettings, sendChat,
    applySuggestedSplit,
  }
})
