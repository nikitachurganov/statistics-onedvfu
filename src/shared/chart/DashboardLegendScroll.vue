<script setup lang="ts">
defineProps<{
  /** Legend rows (typically from `chartDatasetsToLegendItems`). */
  items: { label: string; color: string }[]
}>()
</script>

<template>
  <div v-if="items.length > 0" class="dash-legend-scroll">
    <div class="dash-legend-scroll__track">
      <span
        v-for="(it, i) in items"
        :key="`${it.label}-${i}`"
        class="dash-legend-scroll__item"
      >
        <span class="dash-legend-scroll__swatch" :style="{ backgroundColor: it.color }" />
        <span class="dash-legend-scroll__text">{{ it.label }}</span>
      </span>
    </div>
  </div>
</template>

<style scoped>
.dash-legend-scroll {
  flex-shrink: 0;
  max-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  overscroll-behavior-x: contain;
  padding: 8px 0 18px;
  -webkit-overflow-scrolling: touch;
}

.dash-legend-scroll__track {
  display: inline-flex;
  flex-wrap: nowrap;
  gap: 0 18px;
  align-items: center;
  min-width: min-content;
}

.dash-legend-scroll__item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  font-size: 12px;
  line-height: 1.35;
  color: rgba(0, 0, 0, 0.45);
}

.dash-legend-scroll__swatch {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  flex-shrink: 0;
}
</style>
