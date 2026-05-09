<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const openKeys = ref<string[]>(['pulse-campus'])

const selectedKeys = computed(() => [route.path])

function onMenuClick({ key }: { key: string }) {
  router.push(key)
}
</script>

<template>
  <a-layout class="dash-shell">
    <a-layout-header class="dash-shell__header">
      <span class="dash-shell__brand">FEFUone</span>
    </a-layout-header>

    <div class="dash-shell__main">
      <a-layout-sider class="dash-shell__sider" :width="256" theme="light">
        <a-menu
          mode="inline"
          :selected-keys="selectedKeys"
          v-model:open-keys="openKeys"
          class="dash-shell__menu"
          @click="onMenuClick"
        >
          <a-sub-menu key="pulse-campus">
            <template #title>Пульс кампуса</template>
            <a-menu-item key="/pulse/summary">Общая сводка</a-menu-item>
            <a-menu-item key="/pulse/rooms">Помещения</a-menu-item>
            <a-menu-item key="/pulse/assets">Основные средства</a-menu-item>
            <a-menu-item key="/pulse/users-workplaces">Пользователи и рабочие места</a-menu-item>
          </a-sub-menu>
        </a-menu>
      </a-layout-sider>

      <a-layout-content class="dash-shell__content">
        <router-view />
      </a-layout-content>
    </div>
  </a-layout>
</template>

<style scoped>
.dash-shell {
  height: 100%;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dash-shell__header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 64px;
  line-height: 64px;
  padding: 0 24px;
  z-index: 1000;
  background: #fff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.dash-shell__brand {
  font-size: 18px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.88);
}

/* Ряд под фиксированным хедером (хедер вне потока — задаём высоту явно) */
.dash-shell__main {
  margin-top: 64px;
  height: calc(100vh - 64px);
  overflow: hidden;
  display: flex;
  flex-flow: row nowrap;
  flex-shrink: 0;
}

/* Фиксированный сайдбар; при длинном меню скролл только здесь */
.dash-shell__sider {
  position: fixed !important;
  left: 0 !important;
  top: 64px !important;
  bottom: 0 !important;
  height: calc(100vh - 64px) !important;
  max-height: calc(100vh - 64px) !important;
  overflow-y: auto !important;
  overflow-x: hidden !important;
  width: 256px !important;
  min-width: 256px !important;
  max-width: 256px !important;
  flex: none !important;
  border-inline-end: 1px solid rgba(0, 0, 0, 0.06);
}

.dash-shell__sider :deep(.ant-layout-sider-children) {
  overflow-x: hidden;
}

.dash-shell__menu {
  height: auto;
  min-height: 100%;
  border-inline-end: 0 !important;
}

/* Контент справа: колонка без корневого скролла — страница задаёт внутреннюю область */
.dash-shell__content {
  margin-left: 256px !important;
  height: calc(100vh - 64px) !important;
  overflow: hidden !important;
  display: flex !important;
  flex-direction: column !important;
  flex: 1 !important;
  min-width: 0 !important;
  padding: 0 !important;
  background: transparent !important;
}
</style>
