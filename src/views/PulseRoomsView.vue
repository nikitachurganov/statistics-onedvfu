<template>
  <div class="pulse-dashboard-page">
    <div class="pulse-dashboard-page__scroll">
      <a-typography-title :level="4">Помещения</a-typography-title>
      <a-typography-text type="secondary">Раздел в разработке.</a-typography-text>
    </div>
  </div>
</template>

<style scoped>
.pulse-dashboard-page {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.pulse-dashboard-page__scroll {
  flex: 1;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 24px;
  background: #f5f5f5;
}
</style>
