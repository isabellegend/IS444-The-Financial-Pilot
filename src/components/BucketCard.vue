<template>
  <div
    class="bucket-card"
    :style="{
      '--accent':     bucket.color,
      '--accent-dim': bucket.dim,
      '--accent-glow':bucket.glow,
    }"
  >
    <!-- Top accent line -->
    <div class="bucket-card__line" />

    <!-- Header row -->
    <div class="bucket-card__head">
      <span class="bucket-label">{{ bucket.label }}</span>
    </div>

    <!-- Balance (animated counter) -->
    <div class="bucket-balance mono">
      <span class="balance-prefix">S$</span>
      <span class="balance-value">{{ displayBalance }}</span>
    </div>

    <!-- Ring + subtitle -->
    <div class="bucket-card__foot">
      <CircularRing
        :percentage="pct"
        :color="bucket.color"
        :size="100"
        :thickness="8"
      />
    </div>

    <!-- Glow overlay on hover -->
    <div class="bucket-card__glow" />
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import CircularRing from './CircularRing.vue'

const props = defineProps({
  bucket:  { type: Object, required: true },
  balance: { type: Number, default: 0 },
  pct:     { type: Number, default: 0 },
})

// Animated counter
const displayBalance = ref('0.00')

function animateCounter(target) {
  const duration = 900
  const start    = parseFloat(displayBalance.value.replace(/,/g, '')) || 0
  const delta    = target - start
  const startTs  = performance.now()

  function step(now) {
    const elapsed  = now - startTs
    const progress = Math.min(elapsed / duration, 1)
    const eased    = 1 - Math.pow(1 - progress, 3)
    const current  = start + delta * eased
    displayBalance.value = current.toLocaleString('en-SG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    if (progress < 1) requestAnimationFrame(step)
    else displayBalance.value = target.toLocaleString('en-SG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }
  requestAnimationFrame(step)
}

watch(() => props.balance, (val) => animateCounter(val), { immediate: true })

</script>

<style scoped>
.bucket-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.5rem;
  position: relative;
  overflow: hidden;
  cursor: default;
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
}

.bucket-card__line {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--accent), transparent);
  border-radius: var(--radius) var(--radius) 0 0;
}

.bucket-card__glow {
  position: absolute;
  inset: 0;
  border-radius: var(--radius);
  pointer-events: none;
  box-shadow: inset 0 0 40px var(--accent-dim);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.bucket-card:hover {
  transform: translateY(-5px);
  border-color: color-mix(in srgb, var(--accent) 30%, var(--border));
  box-shadow:
    0 24px 48px rgba(0,0,0,0.4),
    0 0 32px var(--accent-glow);
}

.bucket-card:hover .bucket-card__glow { opacity: 1; }

/* Head */
.bucket-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}
.bucket-label {
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--accent);
}
.bucket-pct {
  font-size: 0.75rem;
  color: var(--text-3);
  background: var(--surface-2);
  padding: 2px 8px;
  border-radius: 20px;
  border: 1px solid var(--border);
}

/* Balance */
.bucket-balance {
  display: flex;
  align-items: baseline;
  gap: 0.3rem;
  margin-bottom: 1.25rem;
  line-height: 1;
}
.balance-prefix {
  font-size: 0.9rem;
  color: var(--text-2);
  font-family: var(--font-mono);
}
.balance-value {
  font-size: 1.8rem;
  font-weight: 500;
  color: var(--text);
  font-family: var(--font-mono);
  letter-spacing: -0.02em;
}

/* Foot */
.bucket-card__foot {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}
.bucket-info { }
.bucket-info__label {
  font-size: 0.7rem;
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.15rem;
}
.bucket-info__val {
  font-size: 0.8rem;
  color: var(--text-2);
}
</style>
