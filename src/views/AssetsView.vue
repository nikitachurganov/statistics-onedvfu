<script setup lang="ts">
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons-vue'
import type { ChartData } from 'chart.js'
import type { Component } from 'vue'
import { computed, h, ref } from 'vue'
import { Bar, Line } from 'vue-chartjs'
import { Tag } from 'ant-design-vue'
import type { ColumnsType, TablePaginationConfig } from 'ant-design-vue/es/table/interface'
import {
  DEPT_LOCATION_MOCK_RAW,
  buildSystemGroupsRows,
  generateDeptLocationTimeSeries,
  SCIENCE_CLASSES_MOCK,
} from '@/utils/assetsAnalyticsCharts'
import { generateAssetsTimeSeries } from '@/utils/assetsTimeSeries'
import { type PulseSummaryPeriod } from '@/utils/pulseSummaryCharts'
import {
  DEPT_MOL_TABLE_MOCK,
  LOCATION_TABLE_MOCK,
  NO_MOL_LABEL,
  departmentRowSpanProps,
  formatCostRu,
  formatCountRu,
  sliceTablePage,
  type DeptMolTableRow,
  type LocationTableRow,
} from '@/utils/assetsDetailTables'
import {
  chartColors,
  chartHoverColors,
  createAreaLineOptions,
  createHorizontalBarOptions,
  createVerticalBarOptions,
  DASHBOARD_LINE_PRIMARY_COLOR,
  hexToRgbA,
} from '@/shared/chart/chartOptions'

type Period = PulseSummaryPeriod

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
  secondary?: string
  deltaWeek: number
  deltaMonth: number
}

const kpiMetrics: KpiMetric[] = [
  {
    title: 'Все основные средства',
    mainValue: '392 614',
    mainUnit: 'ед.',
    secondary: '79 665 711 ₽',
    deltaWeek: 0.4,
    deltaMonth: 1.3,
  },
  {
    title: 'ОЦДИ',
    mainValue: '2 816',
    mainUnit: 'ед.',
    secondary: '74 552 122 173 ₽',
    deltaWeek: -0.2,
    deltaMonth: 0.5,
  },
  {
    title: 'Научное оборудование',
    mainValue: '3 072',
    mainUnit: 'ед.',
    secondary: '2 955 344 132 ₽',
    deltaWeek: 1.1,
    deltaMonth: 3.2,
  },
  {
    title: 'Научное оборудование с классификатором',
    mainValue: '2 891',
    mainUnit: 'ед.',
    secondary: '2 782 156 000 ₽',
    deltaWeek: 0.6,
    deltaMonth: 2.8,
  },
]

const periodDeltaPhrase = computed(() => {
  if (period.value === 'week') return 'за неделю'
  if (period.value === 'month') return 'за месяц'
  return 'за год'
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

type BarMetric = 'count' | 'cost'

const BAR_PORTFOLIO_COST_TOTAL = 79_665_711

interface BarChartRow {
  name: string
  count: number
  cost: number
}

function allocateCostByCount(
  rows: readonly { name: string; count: number }[],
  totalCost: number,
): BarChartRow[] {
  const sum = rows.reduce((s, r) => s + r.count, 0)
  let used = 0
  return rows.map((r, i) => {
    const last = i === rows.length - 1
    const cost = last ? totalCost - used : Math.round((totalCost * r.count) / sum)
    if (!last) used += cost
    return { name: r.name, count: r.count, cost }
  })
}

const NFA_TYPES_BAR_ROWS: BarChartRow[] = allocateCostByCount(
  [
    { name: 'Здания', count: 84_210 },
    { name: 'Сооружения', count: 28_940 },
    { name: 'Оборудование', count: 156_320 },
    { name: 'ОЦДИ', count: 2_816 },
    { name: 'Транспортные средства', count: 4_210 },
    { name: 'Прочие НФА', count: 116_118 },
  ],
  BAR_PORTFOLIO_COST_TOTAL,
)

const APPLICATION_SPHERES_BAR_ROWS: BarChartRow[] = allocateCostByCount(
  [
    { name: 'Учебная деятельность', count: 148_200 },
    { name: 'НИОКР', count: 67_800 },
    { name: 'Административно-хозяйственная', count: 89_200 },
    { name: 'Социальная инфраструктура', count: 45_600 },
    { name: 'Прочие сферы', count: 41_814 },
  ],
  BAR_PORTFOLIO_COST_TOTAL,
)

const metricSegmentOptions: { label: string; value: BarMetric }[] = [
  { label: 'Количество', value: 'count' },
  { label: 'Стоимость', value: 'cost' },
]

const metricNfa = ref<BarMetric>('count')
const metricSpheres = ref<BarMetric>('count')
const metricSystemGroups = ref<BarMetric>('count')
const metricAssetsDynamics = ref<BarMetric>('count')

const deptLocationSelectOptions = computed(() =>
  DEPT_LOCATION_MOCK_RAW.map((r) => ({ label: r.department, value: r.department })),
)
const selectedDeptLocation = ref<string>(DEPT_LOCATION_MOCK_RAW[0]?.department ?? '')
const hasDeptLocationDepartments = computed(() => deptLocationSelectOptions.value.length > 0)

const systemGroupsRowsDisplay = computed(() => buildSystemGroupsRows(BAR_PORTFOLIO_COST_TOTAL))
const scienceClassesRowsDisplay = computed(() => SCIENCE_CLASSES_MOCK)
const hasSystemGroupsData = computed(() => systemGroupsRowsDisplay.value.length > 0)
const hasScienceClassesData = computed(() => scienceClassesRowsDisplay.value.length > 0)

const nfaCardTitle = computed(() =>
  metricNfa.value === 'count' ? 'Типы НФА' : 'Типы НФА по стоимости',
)

const spheresCardTitle = computed(() =>
  metricSpheres.value === 'count'
    ? 'Сферы применения'
    : 'Сферы применения по стоимости',
)

const BAR_SERIES_COLOR = DASHBOARD_LINE_PRIMARY_COLOR

const lineChartXTicksExtras = computed(() =>
  period.value === 'year'
    ? { xTicks: { autoSkip: false as const, maxTicksLimit: 12 } }
    : { xTicks: { autoSkip: true as const, maxTicksLimit: 8 } },
)

const dynamicsTs = computed(() => generateAssetsTimeSeries(period.value))

const dynamicsLineData = computed<ChartData<'line'>>(() => {
  const data = dynamicsTs.value
  const isCount = metricAssetsDynamics.value === 'count'
  return {
    labels: data.labels,
    datasets: [
      {
        label: 'Все основные средства',
        data: isCount ? data.all : data.allCost,
        borderColor: BAR_SERIES_COLOR,
        backgroundColor: hexToRgbA(BAR_SERIES_COLOR, 0.18),
        borderWidth: 2,
        fill: true,
        tension: 0.35,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
    ],
  }
})

const dynamicsLineOptions = computed(() => {
  const isCount = metricAssetsDynamics.value === 'count'
  return createAreaLineOptions(
    {
      yAxisTitle: isCount ? 'Количество, ед.' : 'Балансовая стоимость, ₽',
      unit: isCount ? 'ед.' : '₽',
    },
    lineChartXTicksExtras.value,
  )
})

function verticalBarDataset(items: readonly BarChartRow[], metric: BarMetric) {
  const isCount = metric === 'count'
  const bg = chartColors[0]
  return {
    label: isCount ? 'Количество' : 'Стоимость',
    data: items.map((i) => (isCount ? i.count : i.cost)),
    backgroundColor: bg,
    hoverBackgroundColor: chartHoverColors[0],
    borderRadius: 4,
    borderSkipped: false,
    maxBarThickness: 72,
  }
}

const nfaBarData = computed<ChartData<'bar'>>(() => ({
  labels: NFA_TYPES_BAR_ROWS.map((r) => r.name),
  datasets: [verticalBarDataset(NFA_TYPES_BAR_ROWS, metricNfa.value)],
}))

const nfaBarOptions = computed(() =>
  createVerticalBarOptions(
    metricNfa.value === 'count' ? 'Количество, ед.' : 'Балансовая стоимость, ₽',
    metricNfa.value === 'count' ? 'ед.' : '₽',
    22,
  ),
)

const spheresBarData = computed<ChartData<'bar'>>(() => ({
  labels: APPLICATION_SPHERES_BAR_ROWS.map((r) => r.name),
  datasets: [verticalBarDataset(APPLICATION_SPHERES_BAR_ROWS, metricSpheres.value)],
}))

const spheresBarOptions = computed(() =>
  createVerticalBarOptions(
    metricSpheres.value === 'count' ? 'Количество, ед.' : 'Балансовая стоимость, ₽',
    metricSpheres.value === 'count' ? 'ед.' : '₽',
    22,
  ),
)

const deptLocLineData = computed<ChartData<'line'>>(() => {
  const ts = generateDeptLocationTimeSeries(period.value, selectedDeptLocation.value)
  return {
    labels: ts.labels,
    datasets: [
      {
        label: selectedDeptLocation.value || 'Подразделение',
        data: ts.values,
        borderColor: BAR_SERIES_COLOR,
        backgroundColor: hexToRgbA(BAR_SERIES_COLOR, 0.18),
        borderWidth: 2,
        fill: true,
        tension: 0.35,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
    ],
  }
})

const deptLocLineOptions = computed(() =>
  createAreaLineOptions(
    {
      yAxisTitle: 'Количество, ед.',
      unit: 'ед.',
    },
    lineChartXTicksExtras.value,
  ),
)

const sysGroupsBarData = computed<ChartData<'bar'>>(() => {
  const rows = systemGroupsRowsDisplay.value
  const isCount = metricSystemGroups.value === 'count'
  const bg = chartColors[0]
  return {
    labels: rows.map((r) => r.name),
    datasets: [
      {
        label: isCount ? 'Количество' : 'Стоимость',
        data: rows.map((r) => (isCount ? r.count : r.cost)),
        backgroundColor: bg,
        hoverBackgroundColor: chartHoverColors[0],
        borderRadius: { topRight: 4, bottomRight: 4 },
        borderSkipped: false,
        maxBarThickness: 28,
      },
    ],
  }
})

const sysGroupsBarOptions = computed(() =>
  createHorizontalBarOptions(
    metricSystemGroups.value === 'count' ? 'Количество, ед.' : 'Стоимость, ₽',
    metricSystemGroups.value === 'count' ? 'ед.' : '₽',
  ),
)

const sciClassesBarData = computed<ChartData<'bar'>>(() => {
  const rows = scienceClassesRowsDisplay.value
  const bg = chartColors[0]
  return {
    labels: rows.map((r) => r.name),
    datasets: [
      {
        label: 'Количество',
        data: rows.map((r) => r.count),
        backgroundColor: bg,
        hoverBackgroundColor: chartHoverColors[0],
        borderRadius: { topRight: 4, bottomRight: 4 },
        borderSkipped: false,
        maxBarThickness: 26,
      },
    ],
  }
})

const sciClassesBarOptions = computed(() =>
  createHorizontalBarOptions('Количество, ед.', 'ед.'),
)

const todayShort = computed(() => {
  const d = new Date()
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}.${mm}.${yyyy}`
})

const ASSETS_DETAIL_PAGE_SIZE = 10

const assetsDetailPagination = { pageSize: ASSETS_DETAIL_PAGE_SIZE, showSizeChanger: false }

const deptMolDetailPageRows = ref(
  sliceTablePage(DEPT_MOL_TABLE_MOCK, { current: 1, pageSize: ASSETS_DETAIL_PAGE_SIZE }),
)
const locationDetailPageRows = ref(
  sliceTablePage(LOCATION_TABLE_MOCK, { current: 1, pageSize: ASSETS_DETAIL_PAGE_SIZE }),
)

function onDeptMolDetailTableChange(
  pagination: TablePaginationConfig,
  _filters: unknown,
  _sorter: unknown,
  extra: { currentDataSource: DeptMolTableRow[] },
) {
  deptMolDetailPageRows.value = sliceTablePage(extra.currentDataSource, pagination)
}

function onLocationDetailTableChange(
  pagination: TablePaginationConfig,
  _filters: unknown,
  _sorter: unknown,
  extra: { currentDataSource: LocationTableRow[] },
) {
  locationDetailPageRows.value = sliceTablePage(extra.currentDataSource, pagination)
}

function createDeptMolDetailColumns(pageRows: DeptMolTableRow[]): ColumnsType<DeptMolTableRow> {
  return [
    {
      title: 'Подразделение',
      dataIndex: 'department',
      key: 'department',
      width: 240,
      ellipsis: true,
      align: 'left',
      sorter: (a, b) => a.department.localeCompare(b.department, 'ru'),
      sortDirections: ['ascend', 'descend'],
      defaultSortOrder: 'ascend',
      customCell: (_record, rowIndex) => departmentRowSpanProps(pageRows, rowIndex ?? 0),
    },
    {
      title: 'МОЛ',
      dataIndex: 'mol',
      key: 'mol',
      width: 160,
      align: 'left',
      customRender: ({ record }: { record: DeptMolTableRow }) =>
        record.mol === NO_MOL_LABEL ? h(Tag, { color: 'warning' }, () => record.mol) : record.mol,
    },
    {
      title: 'Всего',
      key: 'totalGroup',
      align: 'center',
      children: [
        {
          title: 'Количество, ед.',
          dataIndex: 'totalCount',
          key: 'totalCount',
          align: 'right',
          width: 150,
          sorter: (a, b) => a.totalCount - b.totalCount,
          sortDirections: ['descend', 'ascend'],
          customRender: ({ text }: { text: number }) => formatCountRu(Number(text)),
        },
        {
          title: 'Балансовая стоимость, ₽',
          dataIndex: 'totalCost',
          key: 'totalCost',
          align: 'right',
          width: 190,
          sorter: (a, b) => a.totalCost - b.totalCost,
          sortDirections: ['descend', 'ascend'],
          customRender: ({ text }: { text: number }) => formatCostRu(Number(text)),
        },
      ],
    },
    {
      title: 'Из них ОЦДИ',
      key: 'ocdiGroup',
      align: 'center',
      children: [
        {
          title: 'Количество, ед.',
          dataIndex: 'ocdiCount',
          key: 'ocdiCount',
          align: 'right',
          width: 150,
          sorter: (a, b) => a.ocdiCount - b.ocdiCount,
          sortDirections: ['descend', 'ascend'],
          customRender: ({ text }: { text: number }) => formatCountRu(Number(text)),
        },
        {
          title: 'Балансовая стоимость, ₽',
          dataIndex: 'ocdiCost',
          key: 'ocdiCost',
          align: 'right',
          width: 190,
          sorter: (a, b) => a.ocdiCost - b.ocdiCost,
          sortDirections: ['descend', 'ascend'],
          customRender: ({ text }: { text: number }) => formatCostRu(Number(text)),
        },
      ],
    },
  ]
}

function createLocationDetailColumns(pageRows: LocationTableRow[]): ColumnsType<LocationTableRow> {
  return [
    {
      title: 'Подразделение',
      dataIndex: 'department',
      key: 'department',
      width: 240,
      ellipsis: true,
      align: 'left',
      sorter: (a, b) => a.department.localeCompare(b.department, 'ru'),
      sortDirections: ['ascend', 'descend'],
      defaultSortOrder: 'ascend',
      customCell: (_record, rowIndex) => departmentRowSpanProps(pageRows, rowIndex ?? 0),
    },
    {
      title: 'МОЛ',
      dataIndex: 'mol',
      key: 'mol',
      width: 160,
      align: 'left',
      customRender: ({ record }: { record: LocationTableRow }) =>
        record.mol === NO_MOL_LABEL ? h(Tag, { color: 'warning' }, () => record.mol) : record.mol,
    },
    {
      title: 'Всего ОС',
      dataIndex: 'totalAssets',
      key: 'totalAssets',
      align: 'right',
      width: 130,
      sorter: (a, b) => a.totalAssets - b.totalAssets,
      sortDirections: ['descend', 'ascend'],
      customRender: ({ text }: { text: number }) => formatCountRu(Number(text)),
    },
    {
      title: 'В помещении',
      dataIndex: 'inRoom',
      key: 'inRoom',
      align: 'right',
      width: 140,
      sorter: (a, b) => a.inRoom - b.inRoom,
      sortDirections: ['descend', 'ascend'],
      customRender: ({ text }: { text: number }) => formatCountRu(Number(text)),
    },
    {
      title: 'У пользователя',
      dataIndex: 'withUser',
      key: 'withUser',
      align: 'right',
      width: 150,
      sorter: (a, b) => a.withUser - b.withUser,
      sortDirections: ['descend', 'ascend'],
      customRender: ({ text }: { text: number }) => formatCountRu(Number(text)),
    },
    {
      title: 'Неизвестно',
      dataIndex: 'unknown',
      key: 'unknown',
      align: 'right',
      width: 140,
      sorter: (a, b) => a.unknown - b.unknown,
      sortDirections: ['descend', 'ascend'],
      customRender: ({ text }: { text: number }) => {
        const n = Number(text)
        return h(
          'span',
          n > 0 ? { style: { color: chartColors[3], fontWeight: 600 } } : undefined,
          formatCountRu(n),
        )
      },
    },
  ]
}

const deptMolDetailColumns = computed(() => createDeptMolDetailColumns(deptMolDetailPageRows.value))
const locationDetailColumns = computed(() => createLocationDetailColumns(locationDetailPageRows.value))

const assetsDetailTableScroll = { x: 1100 as const, y: 440 as const }
</script>

<template>
  <div class="assets-page">
    <header class="assets-section-header">
      <a-flex vertical :gap="8">
        <a-typography-title :level="3" class="assets-section-header__title">
          Основные средства
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
        v-for="m in kpiMetrics"
        :key="m.title"
        :hoverable="false"
        class="kpi-metrics-panel__cell"
      >
        <a-flex vertical :gap="4">
          <a-space align="center" :size="12" style="gap: 12px">
            <a-typography-text>{{ m.title }}</a-typography-text>
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

          <a-space align="baseline" :size="8" style="gap: 8px">
            <a-typography-title :level="3" style="margin: 0">
              {{ m.mainValue }} {{ m.mainUnit }}
            </a-typography-title>
            <a-typography-text v-if="m.secondary" type="secondary">
              /<span style="margin-inline-start: 8px">{{ m.secondary }}</span>
            </a-typography-text>
          </a-space>
        </a-flex>
      </a-card-grid>
      </a-card>

      <a-row :gutter="[16, 16]" class="assets-bar-charts-row">
        <a-col :xs="24" :lg="12">
          <a-card class="chart-card" :title="nfaCardTitle">
            <template #extra>
              <a-segmented v-model:value="metricNfa" size="middle" :options="metricSegmentOptions" />
            </template>
            <div class="chart-host-bar">
              <div class="chart-container">
                <Bar :data="nfaBarData" :options="nfaBarOptions" />
              </div>
            </div>
          </a-card>
        </a-col>
        <a-col :xs="24" :lg="12">
          <a-card class="chart-card" :title="spheresCardTitle">
            <template #extra>
              <a-segmented v-model:value="metricSpheres" size="middle" :options="metricSegmentOptions" />
            </template>
            <div class="chart-host-bar">
              <div class="chart-container">
                <Bar :data="spheresBarData" :options="spheresBarOptions" />
              </div>
            </div>
          </a-card>
        </a-col>
      </a-row>

      <a-row :gutter="[16, 16]" class="assets-dynamics-row">
        <a-col :xs="24" :lg="12">
          <a-card class="chart-card" title="Динамика основных средств">
            <template #extra>
              <a-segmented
                v-model:value="metricAssetsDynamics"
                size="middle"
                :options="metricSegmentOptions"
              />
            </template>
            <div class="chart-host">
              <div class="chart-container chart-container--large">
                <Line :data="dynamicsLineData" :options="dynamicsLineOptions" />
              </div>
            </div>
          </a-card>
        </a-col>
        <a-col :xs="24" :lg="12">
          <a-card class="chart-card" title="Динамика местоположений">
            <template #extra>
              <a-select
                v-model:value="selectedDeptLocation"
                :options="deptLocationSelectOptions"
                placeholder="Подразделение"
                :style="{ minWidth: '200px', maxWidth: '100%' }"
              />
            </template>
            <div v-if="hasDeptLocationDepartments" class="chart-host">
              <div class="chart-container chart-container--large">
                <Line :data="deptLocLineData" :options="deptLocLineOptions" />
              </div>
            </div>
            <div v-else class="chart-empty-wrap chart-empty-wrap--line">
              <a-empty description="Нет данных для отображения" />
            </div>
          </a-card>
        </a-col>
      </a-row>

      <section class="assets-extra-analytics">
        <a-row :gutter="[16, 16]" class="assets-extra-analytics__row">
          <a-col :xs="24" :lg="12">
            <a-card
              class="assets-bar-chart-card"
              :bordered="false"
              title="Распределение по группам систем"
            >
              <template #extra>
                <a-segmented
                  v-model:value="metricSystemGroups"
                  size="middle"
                  :options="metricSegmentOptions"
                />
              </template>
              <div v-if="hasSystemGroupsData" class="chart-host-extra-half">
                <div class="chart-container chart-container--half">
                  <Bar :data="sysGroupsBarData" :options="sysGroupsBarOptions" />
                </div>
              </div>
              <div v-else class="chart-empty-wrap chart-empty-wrap--half">
                <a-empty description="Нет данных для отображения" />
              </div>
            </a-card>
          </a-col>
          <a-col :xs="24" :lg="12">
            <a-card class="assets-bar-chart-card" :bordered="false" title="Научное оборудование по классам">
              <div v-if="hasScienceClassesData" class="chart-host-extra-half">
                <div class="chart-container chart-container--half">
                  <Bar :data="sciClassesBarData" :options="sciClassesBarOptions" />
                </div>
              </div>
              <div v-else class="chart-empty-wrap chart-empty-wrap--half">
                <a-empty description="Нет данных для отображения" />
              </div>
            </a-card>
          </a-col>
        </a-row>
      </section>

      <section class="assets-detail-section">
        <a-card class="chart-card assets-detail-card" title="Распределение по подразделениям и МОЛ">
          <a-table
            bordered
            row-key="key"
            :columns="deptMolDetailColumns"
            :data-source="DEPT_MOL_TABLE_MOCK"
            :pagination="assetsDetailPagination"
            size="middle"
            :scroll="assetsDetailTableScroll"
            @change="onDeptMolDetailTableChange"
          />
        </a-card>

        <a-card class="chart-card assets-detail-card" title="Распределение по местоположению">
          <a-table
            bordered
            row-key="key"
            :columns="locationDetailColumns"
            :data-source="LOCATION_TABLE_MOCK"
            :pagination="assetsDetailPagination"
            size="middle"
            :scroll="assetsDetailTableScroll"
            @change="onLocationDetailTableChange"
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

.kpi-metrics-panel {
  margin-bottom: 24px;
}

.kpi-metrics-panel__cell {
  width: 100% !important;
}

@media (min-width: 576px) {
  .kpi-metrics-panel__cell {
    width: 50% !important;
  }
}

@media (min-width: 992px) {
  .kpi-metrics-panel__cell {
    width: 25% !important;
  }
}

.assets-bar-charts-row {
  margin-bottom: 24px;
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

.chart-container--large {
  min-height: 360px;
}

.chart-container--half {
  min-height: 280px;
}

.chart-host {
  width: 100%;
  height: 420px;
}

.chart-host-bar {
  width: 100%;
  height: 420px;
}

.chart-host-extra-half {
  width: 100%;
  height: 320px;
}

.assets-extra-analytics {
  margin-top: 24px;
}

.assets-extra-analytics__row {
  margin-bottom: 0;
}

.assets-extra-analytics__row + .assets-extra-analytics__row {
  margin-top: 16px;
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

/* base.css задаёт * { font-weight: normal } — сбрасывает вложенные span в шапке */
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

.assets-detail-card :deep(.ant-table-tbody > tr > td:first-child) {
  vertical-align: middle;
}

.chart-empty-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.chart-empty-wrap--line {
  min-height: 420px;
}

.chart-empty-wrap--half {
  min-height: 320px;
}

</style>
