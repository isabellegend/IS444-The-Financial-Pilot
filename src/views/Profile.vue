<template>
  <div class="profile-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Profile & Settings</h1>
        <p class="page-sub">Manage your information and salary split</p>
      </div>
    </div>

    <div class="profile-grid">
      <!-- User Info card -->
      <div class="card user-card">
        <div class="user-card__avatar">{{ store.user.avatarInitials }}</div>
        <h2 class="user-card__name">{{ store.user.name }}</h2>
        <p class="user-card__tag">Personal Account</p>

        <div class="info-rows">
          <div class="info-row">
            <span class="info-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
              </svg>
              Employer
            </span>
            <span class="info-val">{{ store.user.employer }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
              Checking A/C
            </span>
            <span class="info-val mono">{{ store.user.checkingAccount }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
              Monthly Salary
            </span>
            <span class="info-val mono teal">S$ {{ fmt(store.salary.gross) }}</span>
          </div>
        </div>
      </div>

      <!-- Split settings card -->
      <div class="card split-settings-card">
        <div class="card-head">
          <h3>Salary Split Settings</h3>
          <p class="label-sm">Percentages must sum to 100%</p>
        </div>

        <div class="sliders">
          <div v-for="item in sliderItems" :key="item.key" class="slider-group">
            <div class="slider-group__head">
              <span class="slider-label" :style="{ color: item.color }">
                <span class="slider-dot" :style="{ background: item.color }" />
                {{ item.label }}
              </span>
              <span class="slider-pct mono" :style="{ color: item.color }">
                {{ store.pendingSettings[item.key] }}%
              </span>
            </div>
            <div class="slider-track">
              <div
                class="slider-fill"
                :style="{ width: store.pendingSettings[item.key] + '%', background: item.color }"
              />
              <input
                type="range"
                :min="0"
                :max="100"
                :step="1"
                :value="store.pendingSettings[item.key]"
                class="slider-input"
                :style="{ '--thumb-color': item.color }"
                @input="onSlider(item.key, +$event.target.value)"
              />
            </div>
            <p class="slider-amount label-sm">
              ≈ S$ {{ fmt(store.salary.gross * store.pendingSettings[item.key] / 100) }} / month
            </p>
          </div>
        </div>

        <!-- Sum indicator -->
        <div class="sum-row" :class="{ 'sum-row--ok': sumOk, 'sum-row--err': !sumOk }">
          <span class="sum-label">Total</span>
          <div class="sum-bar-track">
            <div
              class="sum-bar-fill"
              :style="{ width: Math.min(pendingSum, 100) + '%', background: sumOk ? 'var(--teal)' : 'var(--danger)' }"
            />
          </div>
          <span class="sum-val mono">{{ pendingSum }}%</span>
          <span v-if="!sumOk" class="sum-hint">must equal 100%</span>
          <span v-else class="sum-hint ok">✓ Good to go</span>
        </div>

        <!-- Success toast -->
        <Transition name="fade">
          <div v-if="store.settingsSaved" class="toast-success">
            ✓ Split settings approved and saved
          </div>
        </Transition>

        <div class="card-actions">
          <button
            class="btn btn-primary"
            :disabled="!sumOk"
            @click="store.approveSplitSettings()"
          >
            Approve Settings
          </button>
          <button class="btn btn-ghost" @click="resetPending">Reset</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useFinanceStore } from '../stores/finance.js'

const store = useFinanceStore()

const sliderItems = [
  { key: 'save',   label: 'Save',   color: '#00D4C8' },
  { key: 'invest', label: 'Invest', color: '#F5C842' },
  { key: 'spend',  label: 'Spend',  color: '#A855F7' },
]

const pendingSum = computed(() =>
  store.pendingSettings.save + store.pendingSettings.invest + store.pendingSettings.spend
)
const sumOk = computed(() => pendingSum.value === 100)

function onSlider(key, val) {
  const others = sliderItems.map(i => i.key).filter(k => k !== key)
  const remaining = 100 - val
  const currentOthers = others.reduce((acc, k) => acc + store.pendingSettings[k], 0)

  store.pendingSettings[key] = val

  if (currentOthers === 0) {
    // distribute evenly
    const each = Math.floor(remaining / 2)
    store.pendingSettings[others[0]] = each
    store.pendingSettings[others[1]] = remaining - each
  } else {
    // distribute proportionally
    const ratio0 = store.pendingSettings[others[0]] / currentOthers
    const newVal0 = Math.round(remaining * ratio0)
    store.pendingSettings[others[0]] = newVal0
    store.pendingSettings[others[1]] = remaining - newVal0
  }
}

function resetPending() {
  store.pendingSettings.save   = store.splitSettings.save
  store.pendingSettings.invest = store.splitSettings.invest
  store.pendingSettings.spend  = store.splitSettings.spend
}

function fmt(n) {
  return Number(n).toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
</script>

<style scoped>
.profile-page { max-width: 900px; }
.page-header { margin-bottom: 2rem; }
.page-title  { font-size: 1.75rem; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 0.2rem; }
.page-sub    { color: var(--text-2); font-size: 0.875rem; }
.label-sm    { font-size: 0.75rem; color: var(--text-3); }

.profile-grid {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 1.25rem;
  align-items: start;
}
@media (max-width: 760px) { .profile-grid { grid-template-columns: 1fr; } }

/* User card */
.user-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 2rem 1.5rem;
}
.user-card__avatar {
  width: 72px; height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--teal), #0070a8);
  color: #0A0F1E;
  font-size: 1.2rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  box-shadow: 0 0 24px var(--teal-glow);
}
.user-card__name {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.2rem;
}
.user-card__tag {
  font-size: 0.75rem;
  color: var(--text-3);
  margin-bottom: 1.5rem;
}
.info-rows {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.info-row {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.75rem;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  text-align: left;
}
.info-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--text-3);
}
.info-val { font-size: 0.85rem; color: var(--text); }
.info-val.teal { color: var(--teal); }
.info-val.mono { font-family: var(--font-mono); }

/* Split settings */
.card-head { margin-bottom: 1.75rem; }
.card-head h3 { font-size: 1.1rem; margin-bottom: 0.2rem; }

.sliders { display: flex; flex-direction: column; gap: 1.5rem; margin-bottom: 1.5rem; }

.slider-group__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.6rem;
}
.slider-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.875rem;
  font-weight: 600;
}
.slider-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
}
.slider-pct { font-size: 1rem; font-weight: 500; }

.slider-track {
  position: relative;
  height: 8px;
  background: var(--border);
  border-radius: 4px;
  margin-bottom: 0.35rem;
  overflow: visible;
}
.slider-fill {
  position: absolute;
  left: 0; top: 0; bottom: 0;
  border-radius: 4px;
  pointer-events: none;
  transition: width 0.1s ease;
}
.slider-input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  margin: 0;
  padding: 0;
  -webkit-appearance: none;
}
.slider-amount { color: var(--text-3); }

/* Sum row */
.sum-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--surface-2);
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}
.sum-row--ok  { border-color: rgba(0,212,200,0.25); }
.sum-row--err { border-color: rgba(239,68,68,0.3); }
.sum-label { font-size: 0.8rem; color: var(--text-2); min-width: 32px; }
.sum-bar-track {
  flex: 1;
  height: 5px;
  background: var(--border);
  border-radius: 3px;
  overflow: hidden;
}
.sum-bar-fill { height: 100%; border-radius: 3px; transition: all 0.2s ease; }
.sum-val { font-size: 0.85rem; color: var(--text); min-width: 36px; text-align: right; }
.sum-hint { font-size: 0.72rem; color: var(--danger); }
.sum-hint.ok { color: var(--teal); }

.toast-success {
  background: var(--teal-dim);
  color: var(--teal);
  border: 1px solid rgba(0,212,200,0.25);
  border-radius: var(--radius-sm);
  padding: 0.65rem 1rem;
  font-size: 0.85rem;
  font-weight: 500;
  margin-bottom: 1rem;
}

.card-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

/* Transitions */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.fade-enter-from  { opacity: 0; transform: translateY(-6px); }
.fade-leave-to    { opacity: 0; transform: translateY(-6px); }
</style>
