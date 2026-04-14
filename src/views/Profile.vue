<template>
  <div class="profile-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Profile & Settings</h1>
        <p class="page-sub">Manage your information and wallet split</p>
      </div>
    </div>

    <div class="profile-grid">

      <!-- User Info card -->
      <div class="card user-card">
        <!-- Gradient banner -->
        <div class="user-card__banner" />

        <div class="user-card__body">
          <div class="user-card__avatar">{{ store.user.avatarInitials }}</div>
          <h2 class="user-card__name">{{ store.user.name }}</h2>
          <p class="user-card__tag">Personal Account</p>

            <div class="info-rows">
              <div class="info-row">
                <span class="info-label">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  Phone Number
                </span>
                <span class="info-val mono">{{ store.user.phone }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                  </svg>
                  Email
                </span>
                <span class="info-val mono">{{ store.user.email }}</span>
              </div>
            </div>

          <!-- Current split mini bar -->
          <div class="split-mini">
            <p class="split-mini__label">Current Split</p>
            <div class="split-mini__bar">
              <div
                v-for="item in splitMiniItems" :key="item.key"
                class="split-mini__seg"
                :style="{ flex: store.splitSettings[item.key], background: item.color }"
                :title="`${item.label}: ${store.splitSettings[item.key]}%`"
              />
            </div>
            <div class="split-mini__legend">
              <span v-for="item in splitMiniItems" :key="item.key" class="split-mini__leg-item">
                <span class="split-mini__dot" :style="{ background: item.color }" />
                <span class="split-mini__leg-label" :style="{ color: item.color }">
                  {{ store.splitSettings[item.key] }}%
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Split settings card -->
      <div class="card split-settings-card">
        <div class="card-head">
          <h3>Wallet Split Settings</h3>
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

        <!-- Error toast -->
        <Transition name="fade">
          <div v-if="store.splitUpdateError" class="toast-error">
            ✗ {{ store.splitUpdateError }}
          </div>
        </Transition>

        <div class="card-actions">
          <button
            class="btn btn-primary"
            :disabled="!sumOk || store.isUpdatingSplit"
            @click="store.approveSplitSettings()"
          >
            <span v-if="store.isUpdatingSplit" class="btn-spinner" />
            <span>{{ store.isUpdatingSplit ? 'Saving…' : 'Approve Settings' }}</span>
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

const splitMiniItems = [
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
    const each = Math.floor(remaining / 2)
    store.pendingSettings[others[0]] = each
    store.pendingSettings[others[1]] = remaining - each
  } else {
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
</script>

<style scoped>
.profile-page { max-width: 1100px; }
.page-header  { margin-bottom: 2rem; }
.page-title   { font-size: 1.75rem; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 0.2rem; }
.page-sub     { color: var(--text-2); font-size: 0.875rem; }
.label-sm     { font-size: 0.75rem; color: var(--text-3); }

.profile-grid {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 1.25rem;
  align-items: start;
}
@media (max-width: 820px) { .profile-grid { grid-template-columns: 1fr; } }

/* ── User card ── */
.user-card {
  padding: 0;
  overflow: hidden;
}

.user-card__banner {
  height: 80px;
  background: linear-gradient(135deg, rgba(0,212,200,0.25) 0%, rgba(0,112,168,0.35) 50%, rgba(168,85,247,0.2) 100%);
  border-bottom: 1px solid var(--border);
  position: relative;
}
.user-card__banner::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 20px,
    rgba(255,255,255,0.02) 20px,
    rgba(255,255,255,0.02) 21px
  );
}

.user-card__body {
  padding: 0 1.5rem 1.75rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
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
  margin-top: -36px;
  margin-bottom: 0.9rem;
  box-shadow: 0 0 0 4px var(--surface), 0 0 24px var(--teal-glow);
  position: relative;
  z-index: 1;
}
.user-card__name {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.2rem;
}
.user-card__tag {
  font-size: 0.72rem;
  color: var(--text-3);
  margin-bottom: 1.5rem;
  background: var(--surface-2);
  border: 1px solid var(--border);
  padding: 2px 10px;
  border-radius: 20px;
}

.info-rows {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-bottom: 1.5rem;
}
.info-row {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.7rem 0.85rem;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  text-align: left;
}
.info-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--text-3);
}
.info-val { font-size: 0.85rem; color: var(--text); }
.info-val.mono { font-family: var(--font-mono); }

/* ── Split mini bar ── */
.split-mini { width: 100%; }
.split-mini__label {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--text-3);
  margin-bottom: 0.5rem;
}
.split-mini__bar {
  display: flex;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
  gap: 2px;
  margin-bottom: 0.6rem;
}
.split-mini__seg {
  height: 100%;
  border-radius: 2px;
  transition: flex 0.4s ease;
}
.split-mini__legend {
  display: flex;
  justify-content: space-between;
}
.split-mini__leg-item {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.75rem;
}
.split-mini__dot {
  width: 7px; height: 7px;
  border-radius: 50%;
}
.split-mini__leg-label { font-family: var(--font-mono); font-weight: 600; }

/* ── Split settings card ── */
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
.slider-dot { width: 8px; height: 8px; border-radius: 50%; }
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
  margin: 0; padding: 0;
  -webkit-appearance: none;
}

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
.sum-bar-track { flex: 1; height: 5px; background: var(--border); border-radius: 3px; overflow: hidden; }
.sum-bar-fill  { height: 100%; border-radius: 3px; transition: all 0.2s ease; }
.sum-val  { font-size: 0.85rem; color: var(--text); min-width: 36px; text-align: right; }
.sum-hint { font-size: 0.72rem; color: var(--danger); }
.sum-hint.ok { color: var(--teal); }

/* Toasts */
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
.toast-error {
  background: rgba(239,68,68,0.1);
  color: var(--danger);
  border: 1px solid rgba(239,68,68,0.25);
  border-radius: var(--radius-sm);
  padding: 0.65rem 1rem;
  font-size: 0.85rem;
  font-weight: 500;
  margin-bottom: 1rem;
}

/* Spinner */
.btn-spinner {
  display: inline-block;
  width: 13px; height: 13px;
  border: 2px solid rgba(255,255,255,0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.65s linear infinite;
  flex-shrink: 0;
}
@keyframes spin { to { transform: rotate(360deg); } }

.card-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}
.card-actions .btn-primary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Transitions */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.fade-enter-from { opacity: 0; transform: translateY(-6px); }
.fade-leave-to   { opacity: 0; transform: translateY(-6px); }
</style>
