<template>
  <svg
    :width="size"
    :height="size"
    :viewBox="`0 0 ${size} ${size}`"
    class="ring"
  >
    <!-- Track -->
    <circle
      :cx="cx" :cy="cy"
      :r="r"
      fill="none"
      :stroke="trackColor"
      :stroke-width="thickness"
    />
    <!-- Progress arc -->
    <circle
      :cx="cx" :cy="cy"
      :r="r"
      fill="none"
      :stroke="color"
      :stroke-width="thickness"
      stroke-linecap="round"
      :stroke-dasharray="circumference"
      :stroke-dashoffset="dashOffset"
      :transform="`rotate(-90 ${cx} ${cy})`"
      class="ring-arc"
    />
    <!-- Glow duplicate (blurred) -->
    <circle
      :cx="cx" :cy="cy"
      :r="r"
      fill="none"
      :stroke="color"
      :stroke-width="thickness + 4"
      stroke-linecap="round"
      :stroke-dasharray="circumference"
      :stroke-dashoffset="dashOffset"
      :transform="`rotate(-90 ${cx} ${cy})`"
      class="ring-glow"
      style="filter: blur(6px); opacity: 0.35;"
    />
    <!-- Center label -->
    <text
      :x="cx" :y="cy - 6"
      text-anchor="middle"
      dominant-baseline="middle"
      :fill="color"
      font-family="'DM Mono', monospace"
      :font-size="fontSize"
      font-weight="500"
    >{{ Math.round(percentage) }}%</text>
    <text
      v-if="label"
      :x="cx" :y="cy + fontSize"
      text-anchor="middle"
      dominant-baseline="middle"
      fill="#4A5670"
      font-family="'Sora', sans-serif"
      :font-size="fontSize * 0.6"
      font-weight="400"
    >{{ label }}</text>
  </svg>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  percentage: { type: Number, default: 0 },
  color:      { type: String, default: '#00D4C8' },
  trackColor: { type: String, default: '#1A2540' },
  size:       { type: Number, default: 120 },
  thickness:  { type: Number, default: 9 },
  label:      { type: String, default: '' },
})

const cx = computed(() => props.size / 2)
const cy = computed(() => props.size / 2)
const r  = computed(() => (props.size / 2) - props.thickness)
const circumference = computed(() => 2 * Math.PI * r.value)
const dashOffset    = computed(() =>
  circumference.value * (1 - Math.min(props.percentage, 100) / 100)
)
const fontSize = computed(() => Math.round(props.size * 0.165))
</script>

<style scoped>
.ring { display: block; }
.ring-arc {
  transition: stroke-dashoffset 1.1s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
