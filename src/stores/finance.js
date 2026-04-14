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

  const EMOJI_MAP = {
    'HDB BTO Downpayment': '🏠',
    'Car':                 '🚗',
    'Vacation':            '✈️',
    'Emergency Fund':      '🛡️',
    'Education':           '🎓',
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
  const salaryAmount = ref(0)
  const savePct      = ref(40)
  const investPct    = ref(30)
  const spendPct     = ref(30)
  const updatedAt    = ref('')

  const debitCard = ref({
    cardNumber: '**** **** **** 4821',
    cardholderName: sessionName.toUpperCase(),
    expiry: '03/29',
    network: 'VISA',
    spendLimit: 2000.00,
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

  // Pending investment tracking (when PlaceMarketOrder fails/skips)
  const pendingInvestAmount = ref(0)
  const pendingInvestInfo   = ref(null)  // { amount, conversionAmount, timestamp }

  // Last split event (calculated from salary session)
  const lastSplitEvent = computed(() => {
    const gross = salaryAmount.value || 8500
    // Defensive check: only slice if it looks like an ISO date (YYYY-MM-DD or longer)
    const rawDate = updatedAt.value
    const dateStr = (rawDate && rawDate.length >= 10 && !rawDate.includes(' ')) 
      ? rawDate.slice(0, 10) 
      : '2026-03-01'
    return {
      date:   dateStr,
      gross:  gross,
      save:   gross * (savePct.value / 100),
      invest: gross * (investPct.value / 100),
      spend:  gross * (spendPct.value / 100),
    }
  })

  // ── Computed ──────────────────────────────────────────────────
  const totalBalance = computed(() =>
    balances.value.save + balances.value.invest + balances.value.spend
  )

  const primaryGoal = computed(() => {
    const g = goals.value[0]
    if (!g) return null
    return {
      ...g,
      current: balances.value.save
    }
  })

  const primaryGoalPct = computed(() => {
    const g = primaryGoal.value
    if (!g) return 0
    return Math.min(Math.round((g.current / g.target) * 100), 100)
  })

  const CAT_META = {
    Food:      { icon: '🍜', color: '#F87171' },
    Groceries: { icon: '🛒', color: '#34D399' },
    Entertain: { icon: '🎬', color: '#818CF8' },
    Shopping:  { icon: '🛍️', color: '#F59E0B' },
    Transport: { icon: '🚗', color: '#38BDF8' },
    Sports:    { icon: '🏃', color: '#A3E635' },
    Salary:    { icon: '💰', color: '#00D4C8' },
  }

  const spentThisMonth = computed(() => {
    return transactions.value
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
  })

  const categoryBreakdown = computed(() => {
    const breakdown = {}
    Object.keys(CAT_META).forEach(cat => { breakdown[cat] = 0 })

    transactions.value.forEach(txn => {
      if (txn.amount < 0) {
        const cat = txn.category || 'Other'
        if (!breakdown[cat]) breakdown[cat] = 0
        breakdown[cat] += Math.abs(txn.amount)
      }
    })

    const totalSpent = Object.values(breakdown).reduce((a, b) => a + b, 0) || 1
    return Object.entries(breakdown)
      .filter(([_, amt]) => amt > 0)
      .map(([name, amount]) => ({
        name,
        amount,
        icon: CAT_META[name]?.icon || '❓',
        color: CAT_META[name]?.color || 'var(--text-3)',
        pct: Math.round((amount / totalSpent) * 100)
      }))
      .sort((a,b) => b.amount - a.amount)
  })

  const spendLimitPct = computed(() =>
    Math.min(Math.round((spentThisMonth.value / debitCard.value.spendLimit) * 100), 100)
  )

  // ── Actions ───────────────────────────────────────────────────
  function syncGoalFromSession() {
    const nric = sessionStorage.getItem('nric') || 'anonymous'
    const activeKey = `fp_active_goal_${nric}`
    const sessionKey = `fp_goal_${nric}`
    
    const activeSaved = localStorage.getItem(activeKey)
    const sessionSaved = localStorage.getItem(sessionKey)
    
    const saved = activeSaved || sessionSaved
    if (!saved) return

    try {
      const s = JSON.parse(saved)
      const goal = s.goalSummary || s
      if (!goal || !goal.type) return

      const { type, target, months, salaryAmount: sAmt, savePct: saPct, investPct: iPct, spendPct: spPct, updatedAt: uAt } = goal
      
      if (sAmt)    salaryAmount.value = sAmt
      if (saPct)   savePct.value      = saPct
      if (iPct)    investPct.value    = iPct
      if (spPct)   spendPct.value     = spPct
      if (uAt)     updatedAt.value    = uAt

      // Update splitSettings synchronously to match most recent session
      if (saPct && iPct && spPct) {
        splitSettings.value = { save: saPct, invest: iPct, spend: spPct }
        pendingSettings.value = { save: saPct, invest: iPct, spend: spPct }
      }

      // Calculate deadline date
      const d = new Date()
      d.setMonth(d.getMonth() + (months || 0))
      const deadline = d.toLocaleDateString('en-SG', { month: 'short', year: 'numeric' })

      // Update basic details in first goal
      goals.value[0] = {
        ...goals.value[0],
        name:     type,
        target:   target || 50000,
        deadline: deadline,
        emoji:    EMOJI_MAP[type] || '💰',
      }
    } catch (e) {
      console.warn('[FinanceStore] Failed to sync goal from session', e)
    }
  }

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

    balances.value      = { save: 0, invest: 0, spend: 0 }
    transactions.value  = []

    syncGoalFromSession()

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
      syncGoalFromSession()
      const nric = sessionStorage.getItem('nric') || 'T9992445Z'
      const { data } = await getDashboardMetrics(nric)

      const depositBal  = parseFloat(data.DepositBalance)                   || 0
      const portfolioBal = parseFloat(data.totalPortfolioSizeInBaseCurrency) || 0
      const spendBal    = parseFloat(data.SpendWalletBalance)               || 0

      // When PlaceMarketOrder fails/skips, the invest allocation is still in the
      // TBank deposit account. Read pending invest tracked by corporate dashboard.
      // Normalize NRIC to uppercase so keys always match regardless of case.
      const nricKey = nric.toUpperCase()
      const pendingInvestKey  = `fp_pendingInvest_${nricKey}`
      const pendingInfoKey   = `fp_pendingInvestInfo_${nricKey}`
      const pendingInvest    = parseFloat(localStorage.getItem(pendingInvestKey)) || 0

      // Debug: show all pending invest keys in localStorage
      const allPendingKeys = Object.keys(localStorage).filter(k => k.startsWith('fp_pendingInvest_'))
      console.log('[refreshDashboard] session nric:', nric, '→ lookup key:', pendingInvestKey,
        '→ value:', localStorage.getItem(pendingInvestKey),
        '| All pending keys:', allPendingKeys.map(k => `${k}=${localStorage.getItem(k)}`).join(', '))

      pendingInvestAmount.value = pendingInvest
      try {
        pendingInvestInfo.value = JSON.parse(localStorage.getItem(pendingInfoKey)) || null
      } catch { pendingInvestInfo.value = null }

      balances.value = {
        save:   Math.max(depositBal - pendingInvest, 0),
        invest: portfolioBal + pendingInvest,
        spend:  spendBal,
      }

      console.log('[refreshDashboard] depositBal:', depositBal, 'pendingInvest:', pendingInvest,
        '→ save:', balances.value.save, 'invest:', balances.value.invest, 'spend:', balances.value.spend)
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
      transactions.value = rawList.map(t => {
        const rawNarrative = t.narrative || '—'
        // Extract category from [Category] prefix
        const catMatch = rawNarrative.match(/^\[(.*?)\]/)
        const category = catMatch ? catMatch[1] : (t.category || t.Category || '')
        // Remove the prefix from the displayed merchant name
        const merchant = catMatch ? rawNarrative.replace(/^\[.*?\]\s?/, '') : rawNarrative

        return {
          id:           t.transactionId,
          date:         t.transactionDate ? t.transactionDate.slice(0, 10) : '',
          merchant,
          category,
          type:         t.transactionType,           // 'DEBIT' | 'CREDIT'
          amount:       t.transactionType === 'DEBIT' ? -Number(t.amount) : Number(t.amount),
          balanceAfter: Number(t.balanceAfter),
          referenceId:  t.referenceId || '',
          status:       'settled',
        }
      })
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
    isUpdatingSplit, splitUpdateError, pendingInvestAmount, pendingInvestInfo,
    lastSplitEvent, CAT_META, categoryBreakdown,
    totalBalance, primaryGoal, primaryGoalPct, spendLimitPct,
    salaryAmount, savePct, investPct, spendPct, updatedAt, spentThisMonth,
    initFromSession, refreshDashboard, fetchTransactions, approveSplitSettings, sendChat,
    applySuggestedSplit,
  }
})
