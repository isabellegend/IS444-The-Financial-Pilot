<template>
  <div class="goal-page">

    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Goal Optimisation</h1>
        <p class="page-sub">AI-powered split recommendations tailored to your financial goal</p>
      </div>
      <div class="header-right">
        <div class="ai-badge">
          <span class="ai-dot" />
          AI Active
        </div>
        <button v-if="phase === 'chat'" class="btn btn-ghost reset-btn" @click="reset">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          New Goal
        </button>
      </div>
    </div>

    <!-- ── STATE 1: Goal form ─────────────────────────────────── -->
    <div v-if="phase === 'form'" class="form-layout">

      <!-- Left: form -->
      <div class="card form-card">
        <h3 class="form-title">Set Your Goal</h3>
        <p class="form-subtitle">Tell the AI what you're working towards and it will optimise your split.</p>

        <div class="form-section-label">Goal Details</div>
        <div class="form-grid">
          <div class="field field--full">
            <label>Goal Type</label>
            <select v-model="form.goalType" :disabled="isLoading">
              <option value="" disabled>Select a goal…</option>
              <option v-for="g in goalTypes" :key="g" :value="g">{{ g }}</option>
            </select>
          </div>
          <div class="field">
            <label>Target Amount</label>
            <div class="input-prefix-wrap">
              <span class="input-prefix">S$</span>
              <input
                v-model.number="form.targetAmount"
                type="number" min="1" step="100"
                placeholder="e.g. 100,000"
                :disabled="isLoading"
              />
            </div>
          </div>
          <div class="field">
            <label>Timeline</label>
            <div class="input-suffix-wrap">
              <input
                v-model.number="form.timelineMonths"
                type="number" min="1" max="360" step="1"
                placeholder="e.g. 24"
                :disabled="isLoading"
              />
              <span class="input-suffix">months</span>
            </div>
          </div>
        </div>

        <div class="form-section-label" style="margin-top: 1.25rem;">Your Income</div>
        <div class="field">
          <label>Monthly Take-Home Pay</label>
          <div class="input-prefix-wrap">
            <span class="input-prefix">S$</span>
            <input
              v-model.number="form.salaryAmount"
              type="number" min="1" step="100"
              placeholder="e.g. 4,200"
              :disabled="isLoading"
            />
          </div>
          <p class="field-hint">Net monthly income after CPF deductions</p>
        </div>

        <p v-if="formError" class="form-error">{{ formError }}</p>

        <button
          class="btn btn-primary submit-btn"
          :disabled="isLoading || !formValid"
          @click="submitFirstTurn"
        >
          <span v-if="isLoading" class="btn-spinner" />
          <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
          </svg>
          <span>{{ isLoading ? 'Analysing…' : 'Get Recommendation' }}</span>
        </button>
      </div>

      <!-- Right: info panel -->
      <div class="info-panel">
        <div class="info-section">
          <p class="info-section__title">How it works</p>
          <div class="info-steps">
            <div class="info-step">
              <div class="info-step__num">1</div>
              <div>
                <p class="info-step__label">Set your goal</p>
                <p class="info-step__sub">Choose what you're saving for and your target amount</p>
              </div>
            </div>
            <div class="info-step">
              <div class="info-step__num">2</div>
              <div>
                <p class="info-step__label">Get AI recommendations</p>
                <p class="info-step__sub">The AI calculates the optimal Save / Invest / Spend split</p>
              </div>
            </div>
            <div class="info-step">
              <div class="info-step__num">3</div>
              <div>
                <p class="info-step__label">Refine &amp; apply</p>
                <p class="info-step__sub">Chat to adjust, then apply the split to your account</p>
              </div>
            </div>
          </div>
        </div>

        <div class="info-section">
          <p class="info-section__title">Goal examples</p>
          <div class="example-goals">
            <button
              v-for="eg in exampleGoals"
              :key="eg.type"
              class="example-goal"
              :disabled="isLoading"
              @click="fillExample(eg)"
            >
              <span class="eg-icon">{{ eg.icon }}</span>
              <div class="eg-body">
                <span class="eg-type">{{ eg.type }}</span>
                <span class="eg-meta">S$ {{ eg.target.toLocaleString() }} · {{ eg.months }} mo</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ── STATE 2: Results + Chat ────────────────────────────── -->
    <div v-else class="chat-layout">

      <!-- Left: Results card -->
      <div class="results-col">

        <!-- Goal context pill -->
        <div class="goal-pill">
          <span class="goal-pill__label">{{ goalSummary.type }}</span>
          <span class="goal-pill__sep" />
          <span class="goal-pill__val">S$ {{ fmtNum(goalSummary.target) }}</span>
          <span class="goal-pill__sep" />
          <span class="goal-pill__val">{{ goalSummary.months }} months</span>
        </div>

        <!-- Infeasible banner -->
        <div v-if="result.IsInfeasible" class="infeasible-banner">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          Goal may be infeasible within your timeline
        </div>

        <div class="card results-card">
          <div class="results-card__header">
            <h3>Recommended Split</h3>
            <span
              class="feasibility-badge"
              :class="`feasibility-badge--${feasibilityClass}`"
            >{{ feasibilityLabel }}</span>
          </div>

          <!-- Split bars -->
          <div class="split-bars">
            <div v-for="row in splitRows" :key="row.key" class="split-bar-row">
              <div class="split-bar-row__head">
                <span class="split-bar-label" :style="{ color: row.color }">
                  <span class="split-dot" :style="{ background: row.color }" />
                  {{ row.label }}
                </span>
                <span class="split-bar-pct mono" :style="{ color: row.color }">
                  {{ result.Output[row.pctKey] }}%
                </span>
              </div>
              <div class="split-bar-track">
                <div
                  class="split-bar-fill"
                  :style="{ width: result.Output[row.pctKey] + '%', background: row.color }"
                />
              </div>
            </div>
          </div>

          <!-- Key metrics -->
          <div class="metrics-grid">
            <div class="metric">
              <span class="metric-label">Monthly Savings</span>
              <span class="metric-val teal mono">S$ {{ fmtNum(result.Output.save_amount) }}</span>
            </div>
            <div class="metric">
              <span class="metric-label">Months to Goal</span>
              <span class="metric-val mono">{{ result.MonthsToGoal }}
                <span class="metric-unit">mo</span>
              </span>
            </div>
          </div>

          <!-- Apply split button -->
          <button
            class="btn btn-primary apply-split-btn"
            :disabled="isApplying"
            @click="applySplit"
          >
            <span v-if="isApplying" class="btn-spinner btn-spinner--dark" />
            <span>{{ isApplying ? 'Applying…' : 'Apply This Split' }}</span>
          </button>
          <p v-if="applySuccess" class="apply-ok">✓ Split applied to your account</p>
        </div>
      </div>

      <!-- Right: Chat -->
      <div class="chat-col">
        <div class="card chat-window" ref="chatWindowEl">
          <div class="chat-messages" ref="chatListEl">
            <div
              v-for="msg in chatHistory"
              :key="msg.id"
              :class="['bubble-row', msg.role === 'user' ? 'bubble-row--user' : 'bubble-row--ai']"
            >
              <div v-if="msg.role === 'assistant'" class="ai-avatar">AI</div>
              <div class="bubble" :class="msg.role === 'user' ? 'bubble--user' : 'bubble--ai'">
                <p class="bubble-text">{{ msg.content }}</p>
                <span class="bubble-ts">{{ fmtTime(msg.ts) }}</span>
              </div>
            </div>

            <!-- Typing indicator -->
            <div v-if="isLoading" class="bubble-row bubble-row--ai">
              <div class="ai-avatar">AI</div>
              <div class="bubble bubble--ai">
                <div class="typing-dots">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Chat input -->
        <div class="card chat-input-wrap">
          <textarea
            ref="chatInputEl"
            v-model="followUpText"
            rows="1"
            class="chat-input"
            placeholder="Ask a follow-up… e.g. 'I want my spend above S$1500'"
            :disabled="isLoading"
            @input="adjustHeight"
            @keydown.enter.exact.prevent="sendFollowUp"
          />
          <button
            class="send-btn"
            :disabled="!followUpText.trim() || isLoading"
            @click="sendFollowUp"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { firstTurn, followUp } from '../api/goalChat.js'
import { useFinanceStore } from '../stores/finance.js'

const store  = useFinanceStore()
const router = useRouter()

// ── Persistence helpers ────────────────────────────────────────
function storageKey() {
  const nric = sessionStorage.getItem('nric') || 'anonymous'
  return `fp_goal_${nric}`
}

function persistSession() {
  try {
    localStorage.setItem(storageKey(), JSON.stringify({
      phase:          phase.value,
      chatSessionId:  chatSessionId.value,
      result:         result.value,
      goalSummary:    goalSummary.value,
      chatHistory:    chatHistory.value,
    }))
  } catch (_) { /* storage full — silently ignore */ }
}

function clearPersistedSession() {
  localStorage.removeItem(storageKey())
}

// ── Page state ─────────────────────────────────────────────────
const phase     = ref('form')
const isLoading = ref(false)
const formError = ref('')
const isApplying = ref(false)
const applySuccess = ref(false)

const goalTypes = [
  'HDB BTO Downpayment',
  'Car',
  'Vacation',
  'Emergency Fund',
  'Education',
]

const exampleGoals = [
  { icon: '🏠', type: 'HDB BTO Downpayment', target: 100000, months: 36 },
  { icon: '🚗', type: 'Car',                  target: 30000,  months: 24 },
  { icon: '✈️', type: 'Vacation',             target: 8000,   months: 12 },
  { icon: '🛡️', type: 'Emergency Fund',       target: 20000,  months: 18 },
]

function fillExample(eg) {
  form.value.goalType      = eg.type
  form.value.targetAmount  = eg.target
  form.value.timelineMonths = eg.months
}

const form = ref({
  goalType:      '',
  targetAmount:  null,
  timelineMonths: null,
  salaryAmount:  null,
})

// Stored after first turn, used for every follow-up
const chatSessionId = ref(null)

// The latest API response (updates on every turn)
const result = ref({
  Output: {
    recommended_save_pct:    0,
    recommended_spend_pct:   0,
    recommended_invest_pct:  0,
    save_amount:             0,
    months_to_goal:          0,
    reasoning:               '',
    feasibility_flag:        'feasible',
  },
  MonthsToGoal:       0,
  ChatSessionId:      null,
  FeasibilityMessage: '',
  IsInfeasible:       false,
})

// Goal context snapshot (for the pill, captured at first turn)
const goalSummary = ref({ type: '', target: 0, months: 0 })

// Chat history displayed in the right column
const chatHistory = ref([])

const followUpText = ref('')
const chatListEl   = ref(null)
const chatInputEl  = ref(null)

// ── Restore persisted session on mount ────────────────────────
onMounted(async () => {
  try {
    const saved = localStorage.getItem(storageKey())
    if (!saved) return
    const s = JSON.parse(saved)
    if (s.phase !== 'chat' || !s.chatSessionId) return

    chatSessionId.value = s.chatSessionId
    result.value        = s.result
    goalSummary.value   = s.goalSummary
    chatHistory.value   = s.chatHistory || []
    phase.value         = 'chat'

    await nextTick()
    scrollChat()
  } catch (_) { /* corrupted storage — ignore and show form */ }
})

// ── Computed ───────────────────────────────────────────────────
const formValid = computed(() =>
  form.value.goalType &&
  form.value.targetAmount > 0 &&
  form.value.timelineMonths > 0 &&
  form.value.salaryAmount > 0
)

const splitRows = [
  { key: 'save',   label: 'Save',   color: '#00D4C8', pctKey: 'recommended_save_pct'   },
  { key: 'invest', label: 'Invest', color: '#F5C842', pctKey: 'recommended_invest_pct' },
  { key: 'spend',  label: 'Spend',  color: '#A855F7', pctKey: 'recommended_spend_pct'  },
]

const feasibilityClass = computed(() => {
  if (result.value.IsInfeasible) return 'red'
  const flag = result.value.Output.feasibility_flag?.toLowerCase()
  if (flag === 'stretched') return 'yellow'
  return 'green'
})

const feasibilityLabel = computed(() => {
  if (result.value.IsInfeasible) return 'Infeasible'
  const flag = result.value.Output.feasibility_flag?.toLowerCase()
  if (flag === 'stretched') return 'Stretched'
  return 'Feasible'
})

function adjustHeight() {
  if (!chatInputEl.value) return
  chatInputEl.value.style.height = 'auto'
  chatInputEl.value.style.height = chatInputEl.value.scrollHeight + 'px'
}

// ── Actions ────────────────────────────────────────────────────
async function submitFirstTurn() {
  formError.value = ''
  if (!formValid.value) return

  isLoading.value = true
  try {
    const nric = sessionStorage.getItem('nric') || ''
    const { data } = await firstTurn({
      UserNRIC:       nric,
      SalaryAmount:   form.value.salaryAmount,
      GoalType:       form.value.goalType,
      TargetAmount:   form.value.targetAmount,
      TimelineMonths: form.value.timelineMonths,
    })

    console.log('[FirstTurn] response:', JSON.stringify(data, null, 2))

    chatSessionId.value = data.ChatSessionId
    result.value        = data
    goalSummary.value   = {
      type:   form.value.goalType,
      target: form.value.targetAmount,
      months: form.value.timelineMonths,
    }

    // Seed chat history with the AI's first reasoning message
    chatHistory.value = [{
      id:      'ai-0',
      role:    'assistant',
      content: data.Output.reasoning || data.FeasibilityMessage,
      ts:      Date.now(),
    }]

    phase.value = 'chat'
    persistSession()
    await nextTick()
    scrollChat()
  } catch (err) {
    console.error('[FirstTurn error]', err?.response?.data)
    const msg = err?.response?.data?.Errors?.[0]
      || err?.response?.data?.message
      || err.message
      || 'Something went wrong. Please try again.'
    formError.value = msg
  } finally {
    isLoading.value = false
  }
}

async function sendFollowUp() {
  const text = followUpText.value.trim()
  if (!text || isLoading.value) return

  followUpText.value = ''
  
  // Reset textarea height
  nextTick(() => {
    adjustHeight()
  })

  // Add user bubble
  chatHistory.value.push({
    id:      'u-' + Date.now(),
    role:    'user',
    content: text,
    ts:      Date.now(),
  })
  await nextTick()
  scrollChat()

  isLoading.value = true
  try {
    const { data } = await followUp({
      ChatSessionId:      chatSessionId.value,
      UserFollowUpMessage: text,
    })

    console.log('[FollowUp] response:', JSON.stringify(data, null, 2))

    result.value = data

    chatHistory.value.push({
      id:      'ai-' + Date.now(),
      role:    'assistant',
      content: data.Output.reasoning || data.FeasibilityMessage,
      ts:      Date.now(),
    })
    persistSession()
  } catch (err) {
    console.error('[FollowUp error]', err?.response?.data)
    const msg = err?.response?.data?.Errors?.[0]
      || err?.response?.data?.message
      || err.message
      || 'Could not get a response. Please try again.'
    chatHistory.value.push({
      id:      'err-' + Date.now(),
      role:    'assistant',
      content: msg,
      ts:      Date.now(),
    })
  } finally {
    isLoading.value = false
    await nextTick()
    scrollChat()
  }
}

async function applySplit() {
  const output = result.value.Output
  const save   = Math.round(output.recommended_save_pct)
  const invest = Math.round(output.recommended_invest_pct)
  const spend  = Math.round(output.recommended_spend_pct)

  isApplying.value   = true
  applySuccess.value = false
  try {
    await store.applySuggestedSplit({ save, invest, spend })
    reset()
    router.push('/dashboard')
  } finally {
    isApplying.value = false
  }
}

function reset() {
  clearPersistedSession()
  phase.value         = 'form'
  chatSessionId.value = null
  chatHistory.value   = []
  followUpText.value  = ''
  formError.value     = ''
  applySuccess.value  = false
  form.value = { goalType: '', targetAmount: null, timelineMonths: null, salaryAmount: null }
}

function scrollChat() {
  if (chatListEl.value) {
    chatListEl.value.scrollTop = chatListEl.value.scrollHeight
  }
}

function fmtNum(n) {
  return Number(n).toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.goal-page { max-width: 1100px; }

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 2rem;
}
.page-title { font-size: 1.75rem; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 0.2rem; }
.page-sub   { color: var(--text-2); font-size: 0.875rem; }
.header-right { display: flex; align-items: center; gap: 0.75rem; flex-shrink: 0; }
.label-sm { font-size: 0.75rem; color: var(--text-3); }

.ai-badge {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: var(--teal-dim);
  border: 1px solid rgba(0,212,200,0.2);
  color: var(--teal);
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
}
.ai-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: var(--teal);
  box-shadow: 0 0 6px var(--teal);
  animation: pulse 2s ease-in-out infinite;
}
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

.reset-btn {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.82rem;
}

/* ── STATE 1: Form layout ── */
.form-layout {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 1.5rem;
  align-items: start;
}
@media (max-width: 860px) { .form-layout { grid-template-columns: 1fr; } }

.form-card { padding: 2rem; }

.form-title {
  font-size: 1.15rem;
  font-weight: 700;
  margin-bottom: 0.3rem;
  color: var(--text);
}
.form-subtitle {
  font-size: 0.85rem;
  color: var(--text-2);
  margin-bottom: 1.75rem;
  line-height: 1.5;
}

.form-section-label {
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: var(--text-3);
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.85rem;
  margin-bottom: 0;
}
.field { display: flex; flex-direction: column; gap: 0.3rem; }
.field--full { grid-column: 1 / -1; }

label {
  font-size: 0.72rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-2);
}
input, select {
  padding: 0.6rem 0.9rem;
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
input:focus, select:focus { border-color: var(--teal); box-shadow: 0 0 0 3px var(--teal-dim); }
input::placeholder { color: var(--text-3); }
input:disabled, select:disabled { opacity: 0.5; }
select { cursor: pointer; }

.input-prefix-wrap { position: relative; }
.input-prefix {
  position: absolute;
  left: 0.9rem; top: 50%;
  transform: translateY(-50%);
  font-size: 0.82rem;
  color: var(--text-3);
  pointer-events: none;
  font-family: var(--font-mono);
}
.input-prefix-wrap input { padding-left: 2.2rem; }

.input-suffix-wrap { position: relative; }
.input-suffix {
  position: absolute;
  right: 0.9rem; top: 50%;
  transform: translateY(-50%);
  font-size: 0.78rem;
  color: var(--text-3);
  pointer-events: none;
}
.input-suffix-wrap input { padding-right: 3.8rem; }

.field-hint { font-size: 0.7rem; color: var(--text-3); margin-top: 0.25rem; }

.form-error {
  font-size: 0.82rem;
  color: #f87171;
  background: rgba(239,68,68,0.1);
  border: 1px solid rgba(239,68,68,0.2);
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  margin: 1rem 0 0;
}

.submit-btn {
  width: 100%;
  margin-top: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

/* Info panel */
.info-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-section {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.25rem;
}
.info-section__title {
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: var(--text-3);
  margin-bottom: 1rem;
}

.info-steps { display: flex; flex-direction: column; gap: 0.9rem; }
.info-step {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}
.info-step__num {
  width: 22px; height: 22px;
  border-radius: 50%;
  background: var(--teal-dim);
  border: 1px solid rgba(0,212,200,0.25);
  color: var(--teal);
  font-size: 0.68rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
}
.info-step__label { font-size: 0.82rem; font-weight: 600; color: var(--text); margin-bottom: 0.15rem; }
.info-step__sub   { font-size: 0.75rem; color: var(--text-3); line-height: 1.4; }

.example-goals { display: flex; flex-direction: column; gap: 0.5rem; }
.example-goal {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.85rem;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 10px;
  cursor: pointer;
  text-align: left;
  transition: all var(--tr);
  width: 100%;
}
.example-goal:hover:not(:disabled) {
  border-color: rgba(0,212,200,0.3);
  background: var(--teal-dim);
}
.example-goal:disabled { opacity: 0.5; cursor: not-allowed; }
.eg-icon  { font-size: 1.1rem; flex-shrink: 0; }
.eg-body  { display: flex; flex-direction: column; gap: 0.1rem; }
.eg-type  { font-size: 0.8rem; font-weight: 600; color: var(--text); }
.eg-meta  { font-size: 0.7rem; color: var(--text-3); font-family: var(--font-mono); }

/* ── STATE 2: Chat layout ── */
.chat-layout {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 1.25rem;
  align-items: start;
}
@media (max-width: 900px) { .chat-layout { grid-template-columns: 1fr; } }

/* Left: results */
.results-col {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.goal-pill {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 0.4rem 0.9rem;
  font-size: 0.78rem;
  flex-wrap: wrap;
}
.goal-pill__label { color: var(--teal); font-weight: 600; }
.goal-pill__sep {
  width: 1px; height: 12px;
  background: var(--border);
  flex-shrink: 0;
}
.goal-pill__val { color: var(--text-2); font-family: var(--font-mono); }

.infeasible-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(239,68,68,0.1);
  border: 1px solid rgba(239,68,68,0.25);
  color: #f87171;
  border-radius: 10px;
  padding: 0.7rem 1rem;
  font-size: 0.82rem;
  font-weight: 500;
}

.results-card {}
.results-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}
.results-card__header h3 { font-size: 1rem; font-weight: 700; }

.feasibility-badge {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.2rem 0.65rem;
  border-radius: 20px;
  text-transform: capitalize;
}
.feasibility-badge--green  { background: rgba(34,197,94,0.12);  color: #4ade80; border: 1px solid rgba(34,197,94,0.2); }
.feasibility-badge--yellow { background: rgba(245,200,66,0.12); color: #F5C842; border: 1px solid rgba(245,200,66,0.2); }
.feasibility-badge--red    { background: rgba(239,68,68,0.1);   color: #f87171; border: 1px solid rgba(239,68,68,0.2); }

/* Split bars */
.split-bars {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.25rem;
}
.split-bar-row__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.45rem;
}
.split-bar-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.82rem;
  font-weight: 600;
}
.split-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
.split-bar-pct { font-size: 0.875rem; font-weight: 500; }
.split-bar-track {
  height: 7px;
  background: var(--border);
  border-radius: 4px;
  overflow: hidden;
}
.split-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.8s cubic-bezier(0.4,0,0.2,1);
}

/* Metrics */
.metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}
.metric {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0.75rem 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.metric-label { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-3); }
.metric-val   { font-size: 1.1rem; font-weight: 500; color: var(--text); }
.metric-val.teal { color: var(--teal); }
.metric-unit  { font-size: 0.7rem; color: var(--text-3); }


.apply-split-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}
.apply-ok {
  text-align: center;
  font-size: 0.78rem;
  color: var(--teal);
  margin-top: 0.5rem;
}

/* Right: Chat */
.chat-col {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-height: 0;
}
.chat-window {
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 280px);
  min-height: 300px;
}
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Bubbles */
.bubble-row {
  display: flex;
  align-items: flex-end;
  gap: 0.65rem;
}
.bubble-row--user { flex-direction: row-reverse; }
.ai-avatar {
  width: 30px; height: 30px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--teal), #005d85);
  color: #0A0F1E;
  font-size: 0.58rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.bubble {
  max-width: 78%;
  padding: 0.75rem 1rem;
  border-radius: 14px;
  position: relative;
}
.bubble--ai   { background: var(--surface-2); border: 1px solid var(--border); border-bottom-left-radius: 4px; }
.bubble--user { background: var(--teal); color: #0A0F1E; border-bottom-right-radius: 4px; }
.bubble-text  { font-size: 0.85rem; line-height: 1.6; margin-bottom: 0.2rem; }
.bubble--user .bubble-text { color: #0A0F1E; }
.bubble-ts    { font-size: 0.62rem; color: var(--text-3); display: block; }
.bubble--user .bubble-ts { color: rgba(10,15,30,0.5); text-align: right; }

/* Typing dots */
.typing-dots { display: flex; gap: 4px; align-items: center; padding: 0.15rem 0; }
.typing-dots span {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--text-3);
  animation: bounce 1.2s ease-in-out infinite;
}
.typing-dots span:nth-child(2) { animation-delay: 0.2s; }
.typing-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes bounce { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-5px); } }

/* Chat input */
.chat-input-wrap {
  display: flex;
  align-items: flex-end;
  gap: 0.65rem;
  padding: 0.6rem 0.6rem 0.6rem 1rem;
}
.chat-input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: var(--text);
  font-size: 0.875rem;
  padding: 0.35rem 0;
  resize: none;
  max-height: 180px;
  line-height: 1.5;
  font-family: inherit;
  overflow-y: auto;
}
.chat-input::placeholder { color: var(--text-3); }
.chat-input:disabled { opacity: 0.5; }
.send-btn {
  width: 36px; height: 36px;
  border-radius: 8px;
  background: var(--teal);
  color: #0A0F1E;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all var(--tr);
}
.send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.send-btn:not(:disabled):hover { background: #00ece4; transform: scale(1.05); }

/* Spinner */
.btn-spinner {
  display: inline-block;
  width: 13px; height: 13px;
  border: 2px solid rgba(10,15,30,0.25);
  border-top-color: #0A0F1E;
  border-radius: 50%;
  animation: spin 0.65s linear infinite;
  flex-shrink: 0;
}
.btn-spinner--dark {
  border-color: rgba(10,15,30,0.25);
  border-top-color: #0A0F1E;
}
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 768px) {
  .form-grid { grid-template-columns: 1fr; }
  .chat-window { height: 400px; }
  .bubble { max-width: 88%; }
}
</style>
