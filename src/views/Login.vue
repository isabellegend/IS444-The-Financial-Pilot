<template>
  <div class="login-wrap">
    <div :class="['login-box', { 'login-box--wide': mode === 'signup' }]">
      <!-- Brand -->
      <div class="login-brand">
        <div class="brand-icon">
          <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
            <path d="M14 2L26 8v12L14 26 2 20V8L14 2z" stroke="#00D4C8" stroke-width="1.5"/>
            <circle cx="14" cy="14" r="3" fill="#00D4C8"/>
          </svg>
        </div>
        <span class="brand-name">Financial Pilot</span>
      </div>

      <!-- Role toggle -->
      <div class="role-toggle">
        <button
          type="button"
          :class="['role-btn', { 'role-btn--active': role === 'employee' }]"
          @click="role = 'employee'"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          Employee
        </button>
        <button
          type="button"
          :class="['role-btn', { 'role-btn--active': role === 'employer' }]"
          @click="role = 'employer'; mode = 'login'"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="7" width="20" height="14" rx="2"/>
            <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
          </svg>
          Employer
        </button>
      </div>

      <!-- Mode tabs (employees only) -->
      <div v-if="role === 'employee'" class="mode-tabs">
        <button
          type="button"
          :class="['mode-tab', { 'mode-tab--active': mode === 'login' }]"
          @click="mode = 'login'; clearMessages()"
        >
          Sign In
        </button>
        <button
          type="button"
          :class="['mode-tab', { 'mode-tab--active': mode === 'signup' }]"
          @click="mode = 'signup'; clearMessages()"
        >
          Create Account
        </button>
      </div>

      <!-- Heading -->
      <h2>
        {{ mode === 'signup' ? 'Create your account' : role === 'employer' ? 'Employer Portal' : 'Welcome back' }}
      </h2>
      <p class="login-sub">
        {{ mode === 'signup'
          ? 'Set up your Financial Pilot profile'
          : role === 'employer'
            ? 'Manage payroll for your team'
            : 'Sign in to your account' }}
      </p>

      <!-- ── SIGN IN FORM ── -->
      <form v-if="mode === 'login'" @submit.prevent="handleLogin">
        <div class="field">
          <label>Username</label>
          <input v-model="login.username" type="text" placeholder="Enter any username" required />
        </div>
        <div class="field">
          <label>Password</label>
          <input v-model="login.password" type="password" placeholder="Enter any password" required />
        </div>
        <p v-if="error" class="msg msg--error">{{ error }}</p>
        <button type="submit" class="submit-btn" :disabled="loading">
          {{ loading ? 'Signing in…' : 'Sign In' }}
        </button>
      </form>

      <!-- ── SIGN UP FORM ── -->
      <form v-else @submit.prevent="handleSignup">

        <!-- Personal info -->
        <p class="field-group-label">Personal Information</p>
        <div class="field-row">
          <div class="field">
            <label>Full Name</label>
            <input v-model="signup.fullName" type="text" placeholder="e.g. Alex Tan Wei Ming" required />
          </div>
          <div class="field">
            <label>NRIC</label>
            <input v-model="signup.nric" type="text" placeholder="e.g. S1234567A" required />
          </div>
        </div>
        <div class="field-row">
          <div class="field">
            <label>Email</label>
            <input v-model="signup.email" type="email" placeholder="you@example.com" required />
          </div>
          <div class="field">
            <label>Phone Number</label>
            <input v-model="signup.phoneNumber" type="tel" placeholder="e.g. 91234567" required />
          </div>
        </div>
        <div class="field">
          <label>Address</label>
          <input v-model="signup.address" type="text" placeholder="e.g. 1 Orchard Road, #01-01, Singapore 238801" required />
        </div>

        <!-- Account credentials -->
        <p class="field-group-label">Account Credentials</p>
        <div class="field-row">
          <div class="field">
            <label>Username</label>
            <input v-model="signup.username" type="text" placeholder="Choose a username" required />
          </div>
          <div class="field">
            <label>Password</label>
            <input v-model="signup.password" type="password" placeholder="Choose a password" required />
          </div>
        </div>
        <div class="field">
          <label>TBank ID</label>
          <input v-model="signup.tbankId" type="text" placeholder="Your TBank account ID" required />
        </div>

        <!-- Salary split -->
        <p class="field-group-label">
          Initial Salary Split
          <span :class="['split-sum', splitValid ? 'split-sum--ok' : 'split-sum--err']">
            {{ splitTotal }}% / 100%
          </span>
        </p>
        <div class="split-fields">
          <div class="split-field">
            <div class="split-field__header">
              <span class="split-dot split-dot--save" />
              <label>Save %</label>
            </div>
            <div class="split-input-wrap">
              <input
                v-model.number="signup.savePercentage"
                type="number" min="0" max="100" step="1"
                placeholder="0"
                @input="clampSplit('savePercentage')"
              />
              <span class="pct-symbol">%</span>
            </div>
          </div>
          <div class="split-field">
            <div class="split-field__header">
              <span class="split-dot split-dot--invest" />
              <label>Invest %</label>
            </div>
            <div class="split-input-wrap">
              <input
                v-model.number="signup.investPercentage"
                type="number" min="0" max="100" step="1"
                placeholder="0"
                @input="clampSplit('investPercentage')"
              />
              <span class="pct-symbol">%</span>
            </div>
          </div>
          <div class="split-field">
            <div class="split-field__header">
              <span class="split-dot split-dot--spend" />
              <label>Spend %</label>
            </div>
            <div class="split-input-wrap">
              <input
                v-model.number="signup.spendPercentage"
                type="number" min="0" max="100" step="1"
                placeholder="0"
                @input="clampSplit('spendPercentage')"
              />
              <span class="pct-symbol">%</span>
            </div>
          </div>
        </div>
        <div v-if="!splitValid && splitTotal > 0" class="split-hint">
          Percentages must add up to exactly 100%
        </div>

        <p v-if="error"   class="msg msg--error">{{ error }}</p>
        <p v-if="success" class="msg msg--success">{{ success }}</p>

        <button type="submit" class="submit-btn" :disabled="loading || !splitValid">
          {{ loading ? 'Creating account…' : 'Create Account' }}
        </button>

        <button type="button" class="back-link" @click="mode = 'login'; clearMessages()">
          Already have an account? Sign in
        </button>
      </form>

      <p class="hint">Dev mode — any credentials will work</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { createUser, registerAccount } from '../api/users.js'

const router  = useRouter()
const role    = ref('employee')
const mode    = ref('login')
const loading = ref(false)
const error   = ref('')
const success = ref('')

// ── Login state ──────────────────────────────────────────────
const login = ref({ username: '', password: '' })

// ── Signup state ─────────────────────────────────────────────
const signup = ref({
  fullName:         '',
  nric:             '',
  email:            '',
  phoneNumber:      '',
  address:          '',
  username:         '',
  password:         '',
  savePercentage:   34,
  investPercentage: 33,
  spendPercentage:  33,
  tbankId:          '',
})

const splitTotal = computed(() =>
  (signup.value.savePercentage || 0) +
  (signup.value.investPercentage || 0) +
  (signup.value.spendPercentage || 0)
)
const splitValid = computed(() => splitTotal.value === 100)

function clampSplit(field) {
  const v = signup.value[field]
  if (v < 0)   signup.value[field] = 0
  if (v > 100) signup.value[field] = 100
}

function clearMessages() {
  error.value   = ''
  success.value = ''
}

// ── Login ─────────────────────────────────────────────────────
async function handleLogin() {
  loading.value = true
  clearMessages()
  try {
    // TODO: replace with real OutSystems auth once API is live
    // const { data } = await auth.login({ Username: login.value.username, Password: login.value.password })
    // localStorage.setItem('token', data.Token)
    await new Promise(r => setTimeout(r, 500))
    if (!login.value.username || !login.value.password) throw new Error('Enter credentials')
    localStorage.setItem('token', 'mock-token-dev')
    localStorage.setItem('role', role.value)
    router.push(role.value === 'employer' ? '/employer-portal' : '/dashboard')
  } catch (err) {
    error.value = err.message || 'Login failed. Please try again.'
  } finally {
    loading.value = false
  }
}

// ── Helpers ───────────────────────────────────────────────────
function nextCustomerId() {
  const counter = parseInt(localStorage.getItem('fp_cust_counter') || '0', 10) + 1
  localStorage.setItem('fp_cust_counter', String(counter))
  return 'CUST' + String(counter).padStart(3, '0')
}

// ── Sign up ───────────────────────────────────────────────────
async function handleSignup() {
  if (!splitValid.value) return
  loading.value = true
  clearMessages()
  try {
    // Step 1 — POST /Users to create the user record
    const { data: userData } = await createUser({
      fullName:         signup.value.fullName,
      nric:             signup.value.nric,
      email:            signup.value.email,
      phoneNumber:      signup.value.phoneNumber,
      address:          signup.value.address,
      username:         signup.value.username,
      password:         signup.value.password,
      tbankId:          signup.value.tbankId,
      savePercentage:   signup.value.savePercentage,
      investPercentage: signup.value.investPercentage,
      spendPercentage:  signup.value.spendPercentage,
    })

    // Step 2 — Extract session variables from the response
    const sessionNric          = userData.nric             ?? signup.value.nric
    const sessionAccountHolder = userData.fullName         ?? signup.value.fullName
    const customerId           = nextCustomerId()

    // Step 3 — Persist to sessionStorage
    sessionStorage.setItem('nric',              sessionNric)
    sessionStorage.setItem('customerId',        customerId)
    sessionStorage.setItem('accountHolderName', sessionAccountHolder)

    // Step 4 — POST /RegisterAccount with the session variables
    await registerAccount({
      nric:              sessionNric,
      customerId,
      accountHolderName: sessionAccountHolder,
    })

    // Step 5 — Success: reset form and redirect to sign-in
    success.value = `Account created for ${signup.value.fullName}. You can now sign in.`
    signup.value = {
      fullName: '', nric: '', email: '', phoneNumber: '',
      address: '', username: '', password: '', tbankId: '',
      savePercentage: 34, investPercentage: 33, spendPercentage: 33,
    }
    setTimeout(() => { mode.value = 'login'; success.value = '' }, 2000)
  } catch (err) {
    const msg = err.response?.data?.message ?? err.response?.data?.errors?.[0] ?? err.message
    error.value = msg || 'Registration failed. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-wrap {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  padding: 1.5rem 1rem;
}
.login-box {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 2.5rem;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 24px 48px rgba(0,0,0,0.4);
  transition: max-width 0.3s ease;
}
.login-box--wide { max-width: 560px; }

/* Brand */
.login-brand {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 1.75rem;
}
.brand-icon {
  width: 36px; height: 36px;
  border-radius: 10px;
  background: var(--teal-dim);
  border: 1px solid rgba(0,212,200,0.2);
  display: flex; align-items: center; justify-content: center;
}
.brand-name { font-size: 1rem; font-weight: 700; color: var(--text); }

/* Role toggle */
.role-toggle {
  display: flex;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 4px;
  gap: 4px;
  margin-bottom: 1rem;
}
.role-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.5rem 0.75rem;
  border-radius: 7px;
  font-size: 0.82rem;
  font-weight: 600;
  background: transparent;
  color: var(--text-3);
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}
.role-btn:hover { color: var(--text-2); }
.role-btn--active {
  background: var(--surface-3);
  color: var(--teal);
  border: 1px solid rgba(0,212,200,0.2);
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}

/* Mode tabs */
.mode-tabs {
  display: flex;
  border-bottom: 1px solid var(--border);
  margin-bottom: 1.5rem;
  gap: 0;
}
.mode-tab {
  flex: 1;
  padding: 0.6rem;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-3);
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: -1px;
}
.mode-tab:hover { color: var(--text-2); }
.mode-tab--active {
  color: var(--teal);
  border-bottom-color: var(--teal);
}

h2 { font-size: 1.25rem; font-weight: 700; margin-bottom: 0.2rem; color: var(--text); }
.login-sub { font-size: 0.8rem; color: var(--text-3); margin-bottom: 1.5rem; }

/* Fields */
.field { display: flex; flex-direction: column; gap: 0.3rem; margin-bottom: 0.85rem; }
.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
label { font-size: 0.75rem; font-weight: 500; color: var(--text-2); text-transform: uppercase; letter-spacing: 0.05em; }
input {
  padding: 0.55rem 0.85rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 0.875rem;
  outline: none;
  background: var(--surface-2);
  color: var(--text);
  transition: border-color 0.2s;
  width: 100%;
}
input:focus { border-color: var(--teal); box-shadow: 0 0 0 3px var(--teal-dim); }
input::placeholder { color: var(--text-3); }

/* Field group label */
.field-group-label {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-3);
  margin: 1.25rem 0 0.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}
.field-group-label::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border);
}

/* Split fields */
.split-fields {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-bottom: 0.4rem;
}
.split-field { display: flex; flex-direction: column; gap: 0.3rem; }
.split-field__header { display: flex; align-items: center; gap: 0.35rem; }
.split-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
.split-dot--save   { background: var(--teal); }
.split-dot--invest { background: var(--gold); }
.split-dot--spend  { background: var(--purple); }
.split-input-wrap { position: relative; }
.split-input-wrap input { padding-right: 1.8rem; }
.pct-symbol {
  position: absolute;
  right: 0.7rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.8rem;
  color: var(--text-3);
  pointer-events: none;
  font-family: var(--font-mono);
}

/* Split sum indicator */
.split-sum {
  font-size: 0.72rem;
  font-family: var(--font-mono);
  font-weight: 600;
  padding: 0.15rem 0.5rem;
  border-radius: 20px;
}
.split-sum--ok  { background: rgba(34,197,94,0.12); color: var(--success); border: 1px solid rgba(34,197,94,0.2); }
.split-sum--err { background: rgba(239,68,68,0.1);  color: #f87171;        border: 1px solid rgba(239,68,68,0.2); }
.split-hint { font-size: 0.75rem; color: #f87171; margin-bottom: 0.75rem; }

/* Messages */
.msg {
  font-size: 0.82rem;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  margin-bottom: 0.75rem;
}
.msg--error   { color: #f87171; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); }
.msg--success { color: var(--success); background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.2); }

/* Submit button */
.submit-btn {
  width: 100%;
  background: var(--teal);
  color: #0A0F1E;
  border: none;
  padding: 0.7rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 0.5rem;
  transition: all 0.2s;
  box-shadow: 0 0 20px var(--teal-glow);
}
.submit-btn:hover:not(:disabled) { background: #00ece4; transform: translateY(-1px); }
.submit-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }

/* Back link */
.back-link {
  display: block;
  width: 100%;
  background: none;
  border: none;
  color: var(--text-3);
  font-size: 0.78rem;
  cursor: pointer;
  text-align: center;
  margin-top: 0.75rem;
  padding: 0.4rem;
  transition: color 0.2s;
}
.back-link:hover { color: var(--teal); }

/* Hint */
.hint {
  margin-top: 1.25rem;
  font-size: 0.72rem;
  color: var(--text-3);
  text-align: center;
  border-top: 1px solid var(--border);
  padding-top: 1rem;
}

/* Responsive */
@media (max-width: 480px) {
  .login-box { padding: 1.75rem 1.25rem; }
  .field-row { grid-template-columns: 1fr; }
  .split-fields { grid-template-columns: repeat(3, 1fr); gap: 0.5rem; }
}
</style>
