import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { optimizeSplit } from '../services/goalService.js'
import { getTransactionHistory, updateUserPercentage } from '../api/users.js'
import { getDashboardMetrics } from '../api/dashboard.js'
import { updateSplit } from '../api/chatbot.js'

export const useFinanceStore = defineStore('finance', () => {
  // ── Session helpers ────────────────────────────────────────────
  function getInitials(name) {
    const parts = (name || '').trim().split(/\s+/)
    if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?'
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  const sessionName  = sessionStorage.getItem('fullName') || 'Alex Tan Wei Ming'
  const sessionSave  = parseFloat(sessionStorage.getItem('savePercentage'))  || 40
  const sessionInvest= parseFloat(sessionStorage.getItem('investPercentage'))|| 30
  const sessionSpend = parseFloat(sessionStorage.getItem('spendPercentage')) || 30

  // ── State ──────────────────────────────────────────────────────
  const sessionCustomerType = sessionStorage.getItem('customerType') || localStorage.getItem('customerType') || 'Retail'

  const user = ref({
    id:              sessionStorage.getItem('userId')  || 'user-001',
    name:            sessionName,
    customerType:    sessionCustomerType,
    checkingAccount: '***-***-4821',
    avatarInitials:  getInitials(sessionName),
  })

  const balances = ref({ save: 0, invest: 0, spend: 0 })
  const splitSettings  = ref({ save: sessionSave, invest: sessionInvest, spend: sessionSpend })
  const pendingSettings= ref({ save: sessionSave, invest: sessionInvest, spend: sessionSpend })

  const goals = ref([
    { id: 'goal-1', name: 'House Downpayment', target: 50000, current: 17000, deadline: 'Dec 2026', emoji: '🏠' },
    { id: 'goal-2', name: 'Emergency Fund',    target: 15000, current: 12450, deadline: 'Jun 2026', emoji: '🛡️' },
  ])

  const transactions = ref([])

  const debitCard = ref({
    cardNumber: '**** **** **** 4821',
    cardholderName: sessionName.toUpperCase(),
    expiry: '03/29',
    network: 'VISA',
    spendLimit: 2000.00,
    spentThisMonth: 447.16,
  })

  const chatMessages = ref([
    {
      id: 'msg-0',
      role: 'assistant',
      content: `Hi ${sessionName.split(' ')[0]} 👋 I'm your Financial Pilot AI. Ask me anything about optimising your Save, Invest, or Spend split — I'll run the numbers for your goals.`,
      ts: Date.now() - 60000,
    },
  ])

  const isRefreshing        = ref(false)
  const isChatLoading       = ref(false)
  const settingsSaved       = ref(false)
  const isApplyingSplit     = ref(false)
  const isLoadingTransactions = ref(false)
  const isUpdatingSplit     = ref(false)
  const splitUpdateError    = ref('')

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
  function initFromSession() {
    const name   = sessionStorage.getItem('fullName') || 'Alex Tan Wei Ming'
    const save   = parseFloat(sessionStorage.getItem('savePercentage'))   || 40
    const invest = parseFloat(sessionStorage.getItem('investPercentage')) || 30
    const spend  = parseFloat(sessionStorage.getItem('spendPercentage'))  || 30

    user.value.id             = sessionStorage.getItem('userId') || 'user-001'
    user.value.name           = name
    user.value.customerType   = sessionStorage.getItem('customerType') || localStorage.getItem('customerType') || 'Retail'
    user.value.avatarInitials = getInitials(name)
    debitCard.value.cardholderName = name.toUpperCase()

    splitSettings.value  = { save, invest, spend }
    pendingSettings.value = { save, invest, spend }

    // Clear previous user's balances and transactions so stale data never shows
    balances.value      = { save: 0, invest: 0, spend: 0 }
    transactions.value  = []

    chatMessages.value = [{
      id:      'msg-0',
      role:    'assistant',
      content: `Hi ${name.split(' ')[0]} 👋 I'm your Financial Pilot AI. Ask me anything about optimising your Save, Invest, or Spend split — I'll run the numbers for your goals.`,
      ts:      Date.now(),
    }]
  }

  async function refreshDashboard() {
    isRefreshing.value = true
    try {
      const nric = sessionStorage.getItem('nric') || 'T9992445Z'
      const { data } = await getDashboardMetrics(nric)
      balances.value = {
        save:   parseFloat(data.DepositBalance)                   || 0,
        invest: parseFloat(data.totalPortfolioSizeInBaseCurrency) || 0,
        spend:  parseFloat(data.SpendWalletBalance)               || 0,
      }
    } finally {
      isRefreshing.value = false
    }
  }

  async function fetchTransactions() {
    isLoadingTransactions.value = true
    try {
      const nric = sessionStorage.getItem('nric') || 'T9992445Z'
      const { data } = await getTransactionHistory(nric)
      const rawList = Array.isArray(data) ? data : (data?.List ?? data?.Transactions ?? [])
      transactions.value = rawList.map(t => ({
        id:           t.transactionId,
        date:         t.transactionDate ? t.transactionDate.slice(0, 10) : '',
        merchant:     t.narrative || '—',
        type:         t.transactionType,           // 'DEBIT' | 'CREDIT'
        amount:       t.transactionType === 'DEBIT' ? -Number(t.amount) : Number(t.amount),
        balanceAfter: Number(t.balanceAfter),
        referenceId:  t.referenceId || '',
        status:       'settled',
      }))
    } finally {
      isLoadingTransactions.value = false
    }
  }

  async function approveSplitSettings() {
    const s = pendingSettings.value
    if (s.save + s.invest + s.spend !== 100) return

    isUpdatingSplit.value = true
    splitUpdateError.value = ''
    try {
      const nric = sessionStorage.getItem('nric') || 'T9992445Z'
      const { data } = await updateUserPercentage({
        nric,
        savePercentage:   s.save,
        investPercentage: s.invest,
        spendPercentage:  s.spend,
      })
      console.log('[UpdateUserPercentage] response:', JSON.stringify(data, null, 2))

      // Persist to store and session
      splitSettings.value = { ...s }
      sessionStorage.setItem('savePercentage',   s.save)
      sessionStorage.setItem('investPercentage', s.invest)
      sessionStorage.setItem('spendPercentage',  s.spend)

      settingsSaved.value = true
      setTimeout(() => { settingsSaved.value = false }, 2500)
    } catch (err) {
      const msg = err?.response?.data?.Errors?.[0]
        || err?.response?.data?.message
        || 'Failed to save settings. Please try again.'
      splitUpdateError.value = msg
      setTimeout(() => { splitUpdateError.value = '' }, 4000)
    } finally {
      isUpdatingSplit.value = false
    }
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
      const nric = sessionStorage.getItem('nric') || 'T9992445Z'
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
    goals, transactions, debitCard, chatMessages,
    isRefreshing, isChatLoading, settingsSaved, isApplyingSplit, isLoadingTransactions,
    isUpdatingSplit, splitUpdateError,
    lastSplitEvent,
    totalBalance, primaryGoal, primaryGoalPct, spendLimitPct,
    initFromSession, refreshDashboard, fetchTransactions, approveSplitSettings, sendChat,
    applySuggestedSplit,
  }
})
