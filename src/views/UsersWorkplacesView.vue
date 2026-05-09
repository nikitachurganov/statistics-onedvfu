<script setup lang="ts">
import { ArrowDownOutlined, ArrowUpOutlined, InfoCircleOutlined } from '@ant-design/icons-vue'
import type { ChartData } from 'chart.js'
import type { ColumnsType } from 'ant-design-vue/es/table/interface'
import type { Component } from 'vue'
import { computed, ref } from 'vue'
import { Line } from 'vue-chartjs'
import DashboardLegendScroll from '@/shared/chart/DashboardLegendScroll.vue'
import { chartDatasetsToLegendItems } from '@/shared/chart/datasetsToLegendItems'
import {
  chartColors,
  createAreaLineOptions,
  DASHBOARD_LINE_PRIMARY_COLOR,
  hexToRgbA,
} from '@/shared/chart/chartOptions'
import { type PulseSummaryPeriod } from '@/utils/pulseSummaryCharts'
import {
  generateEmployeeBindingSeries,
  generateWorkplaceTypesSeries,
  WP_DISTRIBUTION_TABLE_MOCK,
  type WorkplaceSeriesPack,
  type EmployeeSeriesPack,
  type WpDistributionRow,
} from '@/utils/usersWorkplacesCharts'

type Period = PulseSummaryPeriod

const BAR_SERIES_COLOR = DASHBOARD_LINE_PRIMARY_COLOR
const COL_OCDI = chartColors[1]
const COL_SCIENCE = chartColors[2]

const period = ref<Period>('month')

const segmentedOptions = [
  { label: 'Неделя', value: 'week' as const },
  { label: 'Месяц', value: 'month' as const },
  { label: 'Год', value: 'year' as const },
]

interface KpiMetric {
  title: string
  mainValue: string
  mainUnit: string
  deltaWeek: number
  deltaMonth: number
  infoTooltip?: string
}

const kpiMetricsRow1: KpiMetric[] = [
  {
    title: 'Всего рабочих мест',
    mainValue: '4 997',
    mainUnit: 'ед.',
    deltaWeek: 2.4,
    deltaMonth: 2.4,
  },
  {
    title: 'Офисные',
    mainValue: '4 997',
    mainUnit: 'ед.',
    deltaWeek: 2.4,
    deltaMonth: 2.4,
  },
  {
    title: 'Переговорные',
    mainValue: '4 997',
    mainUnit: 'ед.',
    deltaWeek: 2.4,
    deltaMonth: 2.4,
  },
  {
    title: 'Научно-производственные',
    mainValue: '4 997',
    mainUnit: 'ед.',
    deltaWeek: 2.4,
    deltaMonth: 2.4,
  },
  {
    title: 'Учебные',
    mainValue: '4 997',
    mainUnit: 'ед.',
    deltaWeek: 2.4,
    deltaMonth: 2.4,
  },
]

const kpiMetricsRow2: KpiMetric[] = [
  {
    title: 'Всего сотрудников',
    mainValue: '32',
    mainUnit: 'чел.',
    deltaWeek: 2.4,
    deltaMonth: 2.4,
  },
  {
    title: 'Сотрудников без привязки к РМ',
    mainValue: '10 000',
    mainUnit: 'чел.',
    deltaWeek: 2.4,
    deltaMonth: 2.4,
  },
  {
    title: 'Свободно рабочих мест',
    mainValue: '10 000',
    mainUnit: 'мест',
    deltaWeek: 2.4,
    deltaMonth: 2.4,
    infoTooltip: 'Рабочие места без назначенного сотрудника',
  },
  {
    title: 'Занято рабочих мест',
    mainValue: '10 000',
    mainUnit: 'мест',
    deltaWeek: 2.4,
    deltaMonth: 2.4,
    infoTooltip: 'Рабочие места с назначенным сотрудником',
  },
]

const kpiMetricsAll = computed(() => [...kpiMetricsRow1, ...kpiMetricsRow2])

const periodDeltaPhrase = computed(() => {
  if (period.value === 'week') return 'за неделю'
  if (period.value === 'month') return 'за месяц'
  return 'за год'
})

const todayShort = computed(() => {
  const d = new Date()
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}.${mm}.${yyyy}`
})

function deltaForMetric(m: KpiMetric): number {
  return period.value === 'week' ? m.deltaWeek : m.deltaMonth
}

function formatDeltaPercent(pct: number): string {
  if (pct === 0) return '0%'
  const rounded = Math.round(pct * 10) / 10
  return pct > 0 ? `+${rounded}%` : `${rounded}%`
}

function deltaTagColor(pct: number): 'success' | 'error' | 'default' {
  if (pct > 0) return 'success'
  if (pct < 0) return 'error'
  return 'default'
}

function deltaIconFor(pct: number): Component | null {
  if (pct > 0) return ArrowUpOutlined
  if (pct < 0) return ArrowDownOutlined
  return null
}

const wpTypeFilter = ref<'all' | 'office' | 'meeting' | 'rnd'>('all')
const wpSelectOptions = [
  { label: 'Все типы', value: 'all' as const },
  { label: 'Офисные', value: 'office' as const },
  { label: 'Переговорные', value: 'meeting' as const },
  { label: 'Научно-производственные', value: 'rnd' as const },
]

const empBindFilter = ref<'all' | 'unassigned' | 'assigned'>('all')
const empSelectOptions = [
  { label: 'Все', value: 'all' as const },
  { label: 'Без привязки', value: 'unassigned' as const },
  { label: 'С привязкой', value: 'assigned' as const },
]

const lineChartXTicksExtras = computed(() =>
  period.value === 'year'
    ? { xTicks: { autoSkip: false as const, maxTicksLimit: 12 } }
    : { xTicks: { autoSkip: true as const, maxTicksLimit: 8 } },
)

const wpPack = computed(() => generateWorkplaceTypesSeries(period.value))
const empPack = computed(() => generateEmployeeBindingSeries(period.value))

type WpPick = (p: WorkplaceSeriesPack) => number[]
const WP_DEFS: {
  filterKey: 'office' | 'meeting' | 'rnd'
  name: string
  color: string
  pick: WpPick
}[] = [
  { filterKey: 'office', name: 'Офисные', color: BAR_SERIES_COLOR, pick: (p) => p.office },
  { filterKey: 'meeting', name: 'Переговорные', color: COL_OCDI, pick: (p) => p.meeting },
  {
    filterKey: 'rnd',
    name: 'Научно-производственные',
    color: COL_SCIENCE,
    pick: (p) => p.rnd,
  },
]

function wpSeriesSlices(): { name: string; values: number[]; color: string }[] {
  const pack = wpPack.value
  const f = wpTypeFilter.value
  const defs = f === 'all' ? WP_DEFS : WP_DEFS.filter((d) => d.filterKey === f)
  return defs.map((d) => ({
    name: d.name,
    values: d.pick(pack),
    color: d.color,
  }))
}

const wpChartData = computed<ChartData<'line'>>(() => ({
  labels: wpPack.value.labels,
  datasets: wpSeriesSlices().map((d) => ({
    label: d.name,
    data: d.values,
    borderColor: d.color,
    backgroundColor: hexToRgbA(d.color, 0.18),
    borderWidth: 2,
    fill: true,
    tension: 0.35,
    pointRadius: 0,
    pointHoverRadius: 4,
  })),
}))

const wpChartOptions = computed(() =>
  createAreaLineOptions(
    {
      yAxisTitle: 'Количество, мест',
      unit: 'мест',
    },
    lineChartXTicksExtras.value,
  ),
)

type EmpPick = (p: EmployeeSeriesPack) => number[]
const EMP_DEFS: {
  filterKey: 'total' | 'unassigned' | 'assigned'
  name: string
  color: string
  pick: EmpPick
}[] = [
  { filterKey: 'total', name: 'Всего', color: chartColors[0], pick: (p) => p.total },
  { filterKey: 'unassigned', name: 'Без привязки', color: chartColors[1], pick: (p) => p.unassigned },
  { filterKey: 'assigned', name: 'С привязкой', color: chartColors[2], pick: (p) => p.assigned },
]

function empSeriesSlices(): { name: string; values: number[]; color: string }[] {
  const pack = empPack.value
  const f = empBindFilter.value
  const defs = f === 'all' ? EMP_DEFS : EMP_DEFS.filter((d) => d.filterKey === f)
  return defs.map((d) => ({
    name: d.name,
    values: d.pick(pack),
    color: d.color,
  }))
}

const empChartData = computed<ChartData<'line'>>(() => ({
  labels: empPack.value.labels,
  datasets: empSeriesSlices().map((d) => ({
    label: d.name,
    data: d.values,
    borderColor: d.color,
    backgroundColor: hexToRgbA(d.color, 0.18),
    borderWidth: 2,
    fill: true,
    tension: 0.35,
    pointRadius: 0,
    pointHoverRadius: 4,
  })),
}))

const empChartOptions = computed(() =>
  createAreaLineOptions(
    {
      yAxisTitle: 'Количество, чел.',
      unit: 'чел.',
    },
    lineChartXTicksExtras.value,
  ),
)

const wpLegendItems = computed(() => chartDatasetsToLegendItems(wpChartData.value.datasets ?? []))

const empLegendItems = computed(() => chartDatasetsToLegendItems(empChartData.value.datasets ?? []))

const distributionPagination = { pageSize: 10, showSizeChanger: false }

function fmtEmpCell(n: number): string {
  return `${Math.round(n).toLocaleString('ru-RU')} чел.`
}

function fmtWpCell(n: number): string {
  return `${Math.round(n).toLocaleString('ru-RU')} мест`
}

const distributionColumns: ColumnsType<WpDistributionRow> = [
  {
    title: 'Подразделение',
    dataIndex: 'department',
    key: 'department',
    ellipsis: true,
    align: 'left',
    sorter: (a, b) => a.department.localeCompare(b.department, 'ru'),
    sortDirections: ['ascend', 'descend'],
    width: 220,
  },
  {
    title: 'Всего сотрудников',
    dataIndex: 'employeesTotal',
    key: 'employeesTotal',
    align: 'right',
    sorter: (a, b) => a.employeesTotal - b.employeesTotal,
    sortDirections: ['descend', 'ascend'],
    width: 170,
    customRender: ({ text }: { text: number }) => fmtEmpCell(Number(text)),
  },
  {
    title: 'Сотрудников без РМ',
    dataIndex: 'employeesNoWp',
    key: 'employeesNoWp',
    align: 'right',
    sorter: (a, b) => a.employeesNoWp - b.employeesNoWp,
    sortDirections: ['descend', 'ascend'],
    width: 190,
    customRender: ({ text }: { text: number }) => fmtEmpCell(Number(text)),
  },
  {
    title: 'Всего рабочих мест',
    dataIndex: 'wpTotal',
    key: 'wpTotal',
    align: 'right',
    sorter: (a, b) => a.wpTotal - b.wpTotal,
    sortDirections: ['descend', 'ascend'],
    width: 180,
    customRender: ({ text }: { text: number }) => fmtWpCell(Number(text)),
  },
  {
    title: 'Занято рабочих мест',
    dataIndex: 'wpOccupied',
    key: 'wpOccupied',
    align: 'right',
    sorter: (a, b) => a.wpOccupied - b.wpOccupied,
    sortDirections: ['descend', 'ascend'],
    width: 190,
    customRender: ({ text }: { text: number }) => fmtWpCell(Number(text)),
  },
  {
    title: 'Свободно рабочих мест',
    dataIndex: 'wpFree',
    key: 'wpFree',
    align: 'right',
    sorter: (a, b) => a.wpFree - b.wpFree,
    sortDirections: ['descend', 'ascend'],
    width: 210,
    customRender: ({ text }: { text: number }) => fmtWpCell(Number(text)),
  },
]

const distributionScroll = { x: 1200 as const }
</script>

<template>
  <div class="assets-page users-workplaces-page">
    <header class="assets-section-header">
      <a-flex vertical :gap="8">
        <a-typography-title :level="3" class="assets-section-header__title">
          Пользователи и рабочие места
        </a-typography-title>
        <a-flex justify="space-between" align="center" wrap="wrap" gap="middle">
          <a-typography-text type="secondary">{{ todayShort }}</a-typography-text>
          <a-segmented v-model:value="period" size="middle" :options="segmentedOptions" />
        </a-flex>
      </a-flex>
    </header>

    <div class="assets-scroll-body">
      <a-card class="kpi-metrics-panel">
        <a-card-grid
          v-for="m in kpiMetricsAll"
          :key="m.title"
          :hoverable="false"
          class="kpi-metrics-panel__cell"
        >
          <a-flex vertical :gap="4">
            <a-space align="center" :size="12" style="gap: 12px">
              <a-typography-text>{{ m.title }}</a-typography-text>
              <a-tooltip v-if="m.infoTooltip" :title="m.infoTooltip">
                <span class="uw-kpi-info" tabindex="0" aria-label="Подсказка">
                  <InfoCircleOutlined />
                </span>
              </a-tooltip>
              <a-tag v-if="deltaForMetric(m) !== 0" :color="deltaTagColor(deltaForMetric(m))">
                <span style="display: inline-flex; align-items: center; gap: 4px">
                  <component :is="deltaIconFor(deltaForMetric(m))!" />
                  <span>{{ formatDeltaPercent(deltaForMetric(m)) }} {{ periodDeltaPhrase }}</span>
                </span>
              </a-tag>
              <a-tag v-else color="default">
                {{ formatDeltaPercent(0) }} {{ periodDeltaPhrase }}
              </a-tag>
            </a-space>

            <a-typography-title :level="3" style="margin: 0">
              {{ m.mainValue }} {{ m.mainUnit }}
            </a-typography-title>
          </a-flex>
        </a-card-grid>
      </a-card>

      <a-row :gutter="[16, 16]" class="assets-dynamics-row">
        <a-col :xs="24" :lg="12">
          <a-card class="chart-card" title="Рабочие места">
            <template #extra>
              <a-select
                v-model:value="wpTypeFilter"
                :options="wpSelectOptions"
                placeholder="Тип рабочего места"
                :style="{ minWidth: '220px', maxWidth: '100%' }"
              />
            </template>
            <div class="chart-host">
              <div class="chart-stack">
                <div class="chart-stack__plot">
                  <div class="chart-container chart-container--xlarge">
                    <Line :data="wpChartData" :options="wpChartOptions" />
                  </div>
                </div>
                <DashboardLegendScroll :items="wpLegendItems" />
              </div>
            </div>
          </a-card>
        </a-col>
        <a-col :xs="24" :lg="12">
          <a-card class="chart-card" title="Сотрудники">
            <template #extra>
              <a-select
                v-model:value="empBindFilter"
                :options="empSelectOptions"
                placeholder="Привязка к рабочему месту"
                :style="{ minWidth: '260px', maxWidth: '100%' }"
              />
            </template>
            <div class="chart-host">
              <div class="chart-stack">
                <div class="chart-stack__plot">
                  <div class="chart-container chart-container--xlarge">
                    <Line :data="empChartData" :options="empChartOptions" />
                  </div>
                </div>
                <DashboardLegendScroll :items="empLegendItems" />
              </div>
            </div>
          </a-card>
        </a-col>
      </a-row>

      <section class="assets-detail-section">
        <a-card class="chart-card assets-detail-card" title="Распределение рабочих мест">
          <a-table
            bordered
            row-key="key"
            :columns="distributionColumns"
            :data-source="WP_DISTRIBUTION_TABLE_MOCK"
            :pagination="distributionPagination"
            size="middle"
            :scroll="distributionScroll"
          />
        </a-card>
      </section>
    </div>
  </div>
</template>

<style scoped>
.assets-page {
  flex: 1;
  min-height: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.assets-page :deep(.ant-card) {
  border-radius: 8px;
  box-shadow: none !important;
}

.assets-page :deep(.ant-card.ant-card-hoverable:hover) {
  box-shadow: none !important;
}

.assets-page .chart-card,
.assets-page .assets-bar-chart-card {
  background: #fff;
}

.assets-section-header {
  position: sticky;
  top: 0;
  z-index: 10;
  flex-shrink: 0;
  padding: 16px 24px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}

.assets-scroll-body {
  flex: 1;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 24px;
  background: #f5f5f5;
}

.assets-section-header__title {
  margin: 0 !important;
}

.uw-kpi-info {
  display: inline-flex;
  align-items: center;
  color: #8c8c8c;
  font-size: 12px;
  cursor: help;
}

.kpi-metrics-panel {
  margin-bottom: 24px;
}

.kpi-metrics-panel__cell {
  width: 100% !important;
}

@media (min-width: 576px) {
  .users-workplaces-page .kpi-metrics-panel__cell {
    width: 50% !important;
  }
}

@media (min-width: 992px) {
  .users-workplaces-page .kpi-metrics-panel__cell:nth-child(-n + 5) {
    width: 20% !important;
  }

  .users-workplaces-page .kpi-metrics-panel__cell:nth-child(n + 6) {
    width: 25% !important;
  }
}

.assets-dynamics-row {
  margin-bottom: 24px;
}

.chart-card :deep(.ant-card-head),
.assets-bar-chart-card :deep(.ant-card-head) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  min-height: unset;
  padding: 14px 20px 10px;
}

.chart-card :deep(.ant-card-head-title),
.assets-bar-chart-card :deep(.ant-card-head-title) {
  text-align: left;
  font-weight: 500;
  padding: 0;
  margin-bottom: 4px;
}

.chart-card :deep(.ant-card-body),
.assets-bar-chart-card :deep(.ant-card-body) {
  padding: 20px;
  background: transparent;
}

.chart-container {
  width: 100%;
  height: 100%;
}

.chart-container--xlarge {
  min-height: 360px;
}

.chart-stack {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.chart-stack__plot {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.chart-host {
  width: 100%;
  height: 420px;
}

.assets-detail-section {
  margin-top: 24px;
}

.assets-detail-card + .assets-detail-card {
  margin-top: 24px;
}

.assets-detail-card :deep(.ant-table-thead th),
.assets-detail-card :deep(.ant-table-thead .ant-table-cell),
.assets-detail-card :deep(.ant-table-thead .ant-table-column-title),
.assets-detail-card :deep(.ant-table-thead .ant-table-column-sorters) {
  font-weight: 600 !important;
}

.assets-detail-card :deep(.ant-table-thead th *) {
  font-weight: inherit !important;
}

.assets-detail-card :deep(.ant-table-header .ant-table-thead th),
.assets-detail-card :deep(.ant-table-header .ant-table-column-title),
.assets-detail-card :deep(.ant-table-header .ant-table-column-sorters) {
  font-weight: 600 !important;
}

.assets-detail-card :deep(.ant-table-header .ant-table-thead th *) {
  font-weight: inherit !important;
}
</style>
