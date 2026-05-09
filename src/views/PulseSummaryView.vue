<script setup lang="ts">
import { CaretDownFilled, CaretUpFilled } from '@ant-design/icons-vue'
import type { ChartData } from 'chart.js'
import { theme } from 'ant-design-vue'
import { computed, ref, watch } from 'vue'
import { Bar } from 'vue-chartjs'
import DashboardLegendScroll from '@/shared/chart/DashboardLegendScroll.vue'
import { chartDatasetsToLegendItems } from '@/shared/chart/datasetsToLegendItems'
import {
  chartColors,
  chartHoverColors,
  createStackedColumnOptions,
  getStackedBarRadius,
} from '@/shared/chart/chartOptions'
import {
  applicationSpheresOverDates,
  APPLICATION_SPHERE_CATEGORY_LABELS,
  assetsNfaTypesStackSeries,
  buildWorkplacesChartPack,
  NFA_TYPE_OPTIONS,
  PROBLEMATIC_OS_CATEGORY_LABELS,
  pulseSummaryAxisLabels,
  pulseSummaryPointCount,
  problematicAssetsOverDates,
  ROOM_TYPE_LABELS_ORDERED,
  roomsStackSlices,
  WORKPLACE_KIND_LABELS,
  type PulseSummaryPeriod,
} from '@/utils/pulseSummaryCharts'
import departmentsTree from '@/data/departments.json'
import {
  findDepartmentNode,
  type DepartmentTreeNode,
} from '@/utils/departmentTree'
import { DEFAULT_ROOT_DEPARTMENT_ID, scopeIntensityMultiplier, type DepartmentNode } from '@/utils/pulseSummaryDepartments'
import {
  aggregateKpiForScope,
  formatKpiDeltaTooltip,
  kpiDeltaForPeriod,
  type KpiMetricAgg,
} from '@/utils/pulseSummaryKpi'
import { generateEmployeeBindingSeries } from '@/utils/usersWorkplacesCharts'

type Period = PulseSummaryPeriod
type RoomsMetric = 'count' | 'area'
type AssetsMetric = 'count' | 'cost'

const PALETTE_N = chartColors.length

const { token } = theme.useToken()

const nfaTypeOptions = NFA_TYPE_OPTIONS.map((o) => ({ label: o.label, value: o.value }))
const nfaAllowedTypeValues = new Set<string>(nfaTypeOptions.map((o) => o.value))

const selectedNfaTypes = ref<string[]>([])

watch(
  selectedNfaTypes,
  (ids) => {
    const next = ids.filter((id) => nfaAllowedTypeValues.has(id))
    if (next.length !== ids.length) selectedNfaTypes.value = next
  },
  { deep: true },
)

function roomTypePaletteIndex(label: string): number {
  const i = ROOM_TYPE_LABELS_ORDERED.indexOf(label as (typeof ROOM_TYPE_LABELS_ORDERED)[number])
  return i >= 0 ? i : 0
}

const departmentTreeData = departmentsTree as DepartmentTreeNode[]

const period = ref<Period>('month')

const selectedDepartmentId = ref(DEFAULT_ROOT_DEPARTMENT_ID)

function filterDepartmentTreeNode(input: string, treeNode: { title?: unknown }) {
  return String(treeNode?.title ?? '').toLowerCase().includes(input.trim().toLowerCase())
}

const selectedDepartmentBranch = computed((): DepartmentTreeNode[] => {
  const selectedNode = findDepartmentNode(
    departmentTreeData,
    selectedDepartmentId.value,
  )

  if (!selectedNode) return []

  return [selectedNode, ...(selectedNode.children ?? [])]
})

const activeDepartmentScopeIds = computed(() =>
  selectedDepartmentBranch.value.map((department) => department.value),
)

const activeDepartmentScope = computed((): DepartmentNode[] =>
  selectedDepartmentBranch.value.map((node) => ({
    id: node.value,
    name: node.title,
  })),
)

const scopeMultiplier = computed(() => scopeIntensityMultiplier(activeDepartmentScopeIds.value))

const chartDepartmentTreeData = computed(() => {
  const [root, ...children] = selectedDepartmentBranch.value

  if (!root) return []

  return [
    {
      title: root.title,
      value: root.value,
      key: root.key,
      children: children.map((child) => ({
        title: child.title,
        value: child.value,
        key: child.key,
      })),
    },
  ]
})

const workplaceScopeForChart = computed(() =>
  activeDepartmentScope.value.map((d) => ({ id: d.id, name: d.name })),
)

const hasSummaryScope = computed(() => activeDepartmentScopeIds.value.length > 0)

const chartEmptyDescription = computed(() =>
  !hasSummaryScope.value
    ? 'Нет данных для выбранного подразделения'
    : 'Нет данных для отображения',
)

/** Full titles for header tooltips when text is truncated */
const chartTitleTooltip = {
  rooms: 'Помещения',
  assetsNfa: 'Основные средства (типы НФА)',
  workplaces: 'Рабочие места',
  assetsSpheres: 'Основные средства (сферы применения)',
  staff: 'Сотрудники',
  problematic: 'Проблемные основные средства',
} as const

const segmentedOptions = [
  { label: 'Неделя', value: 'week' as const },
  { label: 'Месяц', value: 'month' as const },
  { label: 'Год', value: 'year' as const },
]

const roomsMetricSegmented = [
  { label: 'Ед.', value: 'count' as const },
  { label: 'м²', value: 'area' as const },
]

const metricSegmentOptions: { label: string; value: AssetsMetric }[] = [
  { label: 'Ед.', value: 'count' },
  { label: '₽', value: 'cost' },
]

const roomsMetric = ref<RoomsMetric>('count')
const assetsMetric = ref<AssetsMetric>('count')
const spheresOsMetric = ref<AssetsMetric>('count')
const problematicOsMetric = ref<AssetsMetric>('count')
const roomsTypeFilter = ref<string[]>([])

const roomTypeMultiOptions = ROOM_TYPE_LABELS_ORDERED.map((label) => ({
  label,
  value: label,
}))

type WpStackLayout = 'departments' | 'workplaceTypes'

const wpStackMode = ref<WpStackLayout>('departments')

const wpStackSegmentedOptions: { label: string; value: WpStackLayout }[] = [
  { label: 'Подразделения', value: 'departments' },
  { label: 'Типы', value: 'workplaceTypes' },
]

const spheresApplicationOcdiOnly = ref(false)
const problematicOcdiOnly = ref(false)
const assetsNfaOcdiOnly = ref(false)

const spheresApplicationFilter = ref<string[]>([])

const sphereSelectOptions = APPLICATION_SPHERE_CATEGORY_LABELS.map((label) => ({
  label,
  value: label,
}))

const problematicProblemFilter = ref<string[]>([])

const problematicSelectOptions = PROBLEMATIC_OS_CATEGORY_LABELS.map((label) => ({
  label,
  value: label,
}))

const kpiMetricsAll = computed(() => aggregateKpiForScope(activeDepartmentScopeIds.value, period.value))

function kpiMetricDelta(metric: KpiMetricAgg) {
  return kpiDeltaForPeriod(metric, period.value)
}

function kpiMetricDeltaTooltipTitle(metric: KpiMetricAgg) {
  const { pct, abs } = kpiMetricDelta(metric)
  return formatKpiDeltaTooltip(pct, abs, metric.deltaUnit)
}

function formatDeltaPercent(value: number) {
  if (value === 0) return '0%'
  return `${Math.abs(value).toFixed(1)}%`
}

function getDeltaTagColor(value: number): 'success' | 'error' | undefined {
  if (value > 0) return 'success'
  if (value < 0) return 'error'
  return undefined
}

const todayShort = computed(() => {
  const d = new Date()
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}.${mm}.${yyyy}`
})

const selectedChartDepartmentIds = ref<string[]>([])
const wpWorkplaceTypeFilter = ref<string[]>([])

function resetChartDepartmentFilters() {
  selectedChartDepartmentIds.value = []
}

watch(selectedDepartmentId, () => {
  resetChartDepartmentFilters()
})

watch(
  () => [...activeDepartmentScopeIds.value].sort().join('|'),
  () => {
    const allowed = new Set(activeDepartmentScopeIds.value)
    selectedChartDepartmentIds.value = selectedChartDepartmentIds.value.filter((id) =>
      allowed.has(id),
    )
  },
)

const wpWorkplaceTypeOptions = WORKPLACE_KIND_LABELS.map((label) => ({
  label,
  value: label,
}))

watch(wpStackMode, () => {
  selectedChartDepartmentIds.value = []
  wpWorkplaceTypeFilter.value = []
})

const pointCount = computed(() => pulseSummaryPointCount(period.value))
const chartLabels = computed(() => pulseSummaryAxisLabels(period.value))

const stackedColumnTickExtras = computed(() =>
  period.value === 'year'
    ? { xTicks: { autoSkip: false as const, maxTicksLimit: 12 } }
    : { xTicks: { autoSkip: true as const, maxTicksLimit: 8 } },
)

const roomsSlices = computed(() => {
  if (!hasSummaryScope.value) return []
  const n = pointCount.value
  const full = roomsStackSlices(n, roomsMetric.value, 1.15, scopeMultiplier.value)
  const sel = roomsTypeFilter.value
  if (sel.length === 0) return full
  const set = new Set(sel)
  return full.filter((s) => set.has(s.label))
})

const roomsChartEmpty = computed(
  () => !hasSummaryScope.value || roomsSlices.value.length === 0,
)

const assetsNfaPack = computed(() =>
  assetsNfaTypesStackSeries(
    pointCount.value,
    2.25,
    assetsMetric.value,
    scopeMultiplier.value,
    assetsNfaOcdiOnly.value,
  ),
)

const visibleNfaTypes = computed(() => {
  if (!selectedNfaTypes.value.length) {
    return [...NFA_TYPE_OPTIONS]
  }
  return NFA_TYPE_OPTIONS.filter((type) => selectedNfaTypes.value.includes(type.value))
})

const assetsChartEmpty = computed(
  () => !hasSummaryScope.value || visibleNfaTypes.value.length === 0,
)

const roomsChartData = computed<ChartData<'bar'>>(() => ({
  labels: chartLabels.value,
  datasets: roomsSlices.value.map((s) => {
    const pi = roomTypePaletteIndex(s.label)
    return {
      label: s.label,
      data: s.data,
      backgroundColor: chartColors[pi % PALETTE_N],
      hoverBackgroundColor: chartHoverColors[pi % PALETTE_N],
      borderRadius: getStackedBarRadius,
      borderSkipped: false,
      maxBarThickness: 48,
    }
  }),
}))

const roomsChartOptions = computed(() => {
  const isCount = roomsMetric.value === 'count'
  return createStackedColumnOptions(
    isCount ? 'Количество, ед.' : 'Площадь, м²',
    isCount ? 'ед.' : 'м²',
    stackedColumnTickExtras.value,
  )
})

const assetsChartData = computed<ChartData<'bar'>>(() => {
  const labels = chartLabels.value
  const pack = assetsNfaPack.value
  return {
    labels,
    datasets: visibleNfaTypes.value.map((type, index) => {
      const pi = index % PALETTE_N
      return {
        label: type.label,
        data: pack[type.value],
        backgroundColor: chartColors[pi],
        hoverBackgroundColor: chartHoverColors[pi],
        borderRadius: getStackedBarRadius,
        borderSkipped: false,
        maxBarThickness: 48,
      }
    }),
  }
})

const assetsChartOptions = computed(() =>
  createStackedColumnOptions(
    assetsMetric.value === 'count' ? 'Количество, ед.' : 'Балансовая стоимость, ₽',
    assetsMetric.value === 'count' ? 'ед.' : '₽',
    stackedColumnTickExtras.value,
  ),
)

const workplacesPack = computed(() =>
  buildWorkplacesChartPack(
    pointCount.value,
    period.value,
    wpStackMode.value,
    selectedChartDepartmentIds.value,
    wpWorkplaceTypeFilter.value,
    workplaceScopeForChart.value,
  ),
)

const workplacesChartEmpty = computed(
  () => !hasSummaryScope.value || workplacesPack.value.datasets.length === 0,
)

const workplacesChartData = computed<ChartData<'bar'>>(() => {
  const { dateLabels, datasets } = workplacesPack.value
  return {
    labels: dateLabels,
    datasets: datasets.map((s) => ({
      label: s.label,
      data: s.data,
      backgroundColor: s.backgroundColor,
      hoverBackgroundColor: s.hoverBackgroundColor,
      borderRadius: getStackedBarRadius,
      borderSkipped: false,
      maxBarThickness: 48,
    })),
  }
})

const workplacesChartOptions = computed(() =>
  createStackedColumnOptions('Количество, мест', 'мест', stackedColumnTickExtras.value),
)

const roomsLegendItems = computed(() =>
  roomsChartEmpty.value ? [] : chartDatasetsToLegendItems(roomsChartData.value.datasets ?? []),
)

const assetsLegendItems = computed(() =>
  chartDatasetsToLegendItems(assetsChartData.value.datasets ?? []),
)

const workplacesLegendItems = computed(() =>
  workplacesChartEmpty.value
    ? []
    : chartDatasetsToLegendItems(workplacesChartData.value.datasets ?? []),
)

const employeeBindingPack = computed(() =>
  generateEmployeeBindingSeries(period.value, scopeMultiplier.value),
)

const staffChartEmpty = computed(() => {
  if (!hasSummaryScope.value) return true
  const p = employeeBindingPack.value
  return (
    p.labels.length === 0 ||
    (p.assigned.every((v) => v === 0) && p.unassigned.every((v) => v === 0))
  )
})

const staffChartData = computed<ChartData<'bar'>>(() => {
  const p = employeeBindingPack.value
  return {
    labels: p.labels,
    datasets: [
      {
        label: 'С привязкой к рабочему месту',
        data: p.assigned,
        backgroundColor: chartColors[0 % PALETTE_N],
        hoverBackgroundColor: chartHoverColors[0 % PALETTE_N],
        borderRadius: getStackedBarRadius,
        borderSkipped: false,
        maxBarThickness: 48,
      },
      {
        label: 'Без привязки к рабочему месту',
        data: p.unassigned,
        backgroundColor: chartColors[1 % PALETTE_N],
        hoverBackgroundColor: chartHoverColors[1 % PALETTE_N],
        borderRadius: getStackedBarRadius,
        borderSkipped: false,
        maxBarThickness: 48,
      },
    ],
  }
})

const staffChartOptions = computed(() =>
  createStackedColumnOptions('Количество, чел.', 'чел.', stackedColumnTickExtras.value),
)

const staffLegendItems = computed(() =>
  staffChartEmpty.value ? [] : chartDatasetsToLegendItems(staffChartData.value.datasets ?? []),
)

const spheresPack = computed(() =>
  applicationSpheresOverDates(
    period.value,
    spheresOsMetric.value === 'count' ? 'count' : 'cost',
    spheresApplicationFilter.value,
    scopeMultiplier.value,
    spheresApplicationOcdiOnly.value,
  ),
)

const spheresChartEmpty = computed(
  () => !hasSummaryScope.value || spheresPack.value.datasets.length === 0,
)

const spheresChartData = computed<ChartData<'bar'>>(() => {
  const { dateLabels, datasets } = spheresPack.value
  return {
    labels: dateLabels,
    datasets: datasets.map((s) => ({
      label: s.label,
      data: s.data,
      backgroundColor: s.backgroundColor,
      hoverBackgroundColor: s.hoverBackgroundColor,
      borderRadius: getStackedBarRadius,
      borderSkipped: false,
      maxBarThickness: 48,
    })),
  }
})

const spheresChartOptions = computed(() =>
  createStackedColumnOptions(
    spheresOsMetric.value === 'count' ? 'Количество, ед.' : 'Балансовая стоимость, ₽',
    spheresOsMetric.value === 'count' ? 'ед.' : '₽',
    stackedColumnTickExtras.value,
  ),
)

const spheresLegendItems = computed(() =>
  spheresChartEmpty.value ? [] : chartDatasetsToLegendItems(spheresChartData.value.datasets ?? []),
)

const problematicPack = computed(() =>
  problematicAssetsOverDates(
    period.value,
    problematicOsMetric.value === 'count' ? 'count' : 'cost',
    problematicProblemFilter.value,
    scopeMultiplier.value,
    problematicOcdiOnly.value,
  ),
)

const problematicChartEmpty = computed(
  () => !hasSummaryScope.value || problematicPack.value.datasets.length === 0,
)

const problematicChartData = computed<ChartData<'bar'>>(() => {
  const { dateLabels, datasets } = problematicPack.value
  return {
    labels: dateLabels,
    datasets: datasets.map((s) => ({
      label: s.label,
      data: s.data,
      backgroundColor: s.backgroundColor,
      hoverBackgroundColor: s.hoverBackgroundColor,
      borderRadius: getStackedBarRadius,
      borderSkipped: false,
      maxBarThickness: 48,
    })),
  }
})

const problematicChartOptions = computed(() =>
  createStackedColumnOptions(
    problematicOsMetric.value === 'count' ? 'Количество, ед.' : 'Балансовая стоимость, ₽',
    problematicOsMetric.value === 'count' ? 'ед.' : '₽',
    stackedColumnTickExtras.value,
  ),
)

const problematicLegendItems = computed(() =>
  problematicChartEmpty.value
    ? []
    : chartDatasetsToLegendItems(problematicChartData.value.datasets ?? []),
)
</script>

<template>
  <div class="assets-page">
    <header class="assets-section-header">
      <a-flex vertical :gap="8">
        <a-typography-title :level="3" class="assets-section-header__title">
          Общая сводка
        </a-typography-title>
        <a-flex justify="space-between" align="center" wrap="wrap" gap="middle">
          <a-typography-text type="secondary">{{ todayShort }}</a-typography-text>
          <a-flex wrap="wrap" gap="small" align="center">
            <a-tree-select
              v-model:value="selectedDepartmentId"
              :tree-data="departmentTreeData"
              placeholder="Подразделение"
              tree-default-expand-all
              show-search
              :filter-tree-node="filterDepartmentTreeNode"
              style="min-width: 280px"
            />
            <a-segmented v-model:value="period" size="middle" :options="segmentedOptions" />
          </a-flex>
        </a-flex>
      </a-flex>
    </header>

    <div class="assets-scroll-body">
      <a-card class="kpi-metrics-panel metrics-grid">
        <a-card-grid
          v-for="(m, kpiIdx) in kpiMetricsAll"
          :key="`${kpiIdx}-${m.title}`"
          :hoverable="false"
          class="kpi-metrics-panel__cell"
        >
          <div class="kpi-metric-card">
            <div class="kpi-metric-card__title-row">
              <span class="kpi-metric-card__title">{{ m.title }}</span>
              <a-tooltip :title="kpiMetricDeltaTooltipTitle(m)" :trigger="['hover', 'focus']">
                <span class="metric-delta-tag-tooltip-anchor" tabindex="0">
                  <a-tag :color="getDeltaTagColor(kpiMetricDelta(m).pct)" class="metric-delta-tag">
                    <CaretUpFilled v-if="kpiMetricDelta(m).pct > 0" />
                    <CaretDownFilled v-else-if="kpiMetricDelta(m).pct < 0" />
                    <span>{{ formatDeltaPercent(kpiMetricDelta(m).pct) }}</span>
                  </a-tag>
                </span>
              </a-tooltip>
            </div>

            <div class="kpi-metric-card__values">
              <a-typography-title :level="3" class="kpi-metric-card__main-value">
                {{ m.mainValue }}
              </a-typography-title>
              <span class="kpi-metric-card__main-unit">{{ m.mainUnit }}</span>
              <template v-if="m.secondary">
                <span class="kpi-metric-card__slash" aria-hidden="true">/</span>
                <a-typography-text type="secondary" class="kpi-metric-card__secondary">
                  {{ m.secondary }}
                </a-typography-text>
              </template>
            </div>
          </div>
        </a-card-grid>
      </a-card>

      <a-row :gutter="[16, 16]" class="assets-bar-charts-row">
        <a-col :span="24" class="dashboard-chart-col">
          <a-card class="chart-card">
            <template #title>
              <a-tooltip :title="chartTitleTooltip.rooms" placement="topLeft"
                :trigger="['hover', 'focus']">
                <span class="chart-card-title-tooltip-anchor" tabindex="0">
                  <a-typography-title :level="5" class="chart-card-title">Помещения</a-typography-title>
                </span>
              </a-tooltip>
            </template>
            <template #extra>
              <div class="chart-card-controls">
                <a-select
                  v-model:value="roomsTypeFilter"
                  mode="multiple"
                  max-tag-count="responsive"
                  :options="roomTypeMultiOptions"
                  placeholder="Тип помещения"
                  class="chart-card-control-field"
                />
                <a-segmented v-model:value="roomsMetric" size="middle" :options="roomsMetricSegmented" />
              </div>
            </template>
            <div class="chart-host">
              <template v-if="!roomsChartEmpty">
                <div class="chart-stack">
                  <div class="chart-stack__plot">
                    <div class="chart-container">
                      <Bar :data="roomsChartData" :options="roomsChartOptions" />
                    </div>
                  </div>
                  <DashboardLegendScroll :items="roomsLegendItems" />
                </div>
              </template>
              <div v-else class="chart-empty-inner">
                <a-empty :description="chartEmptyDescription" />
              </div>
            </div>
          </a-card>
        </a-col>
        <a-col :span="24" class="dashboard-chart-col">
          <a-card class="chart-card">
            <template #title>
              <a-tooltip :title="chartTitleTooltip.assetsNfa" placement="topLeft"
                :trigger="['hover', 'focus']">
                <span class="chart-card-title-tooltip-anchor" tabindex="0">
                  <a-typography-title :level="5" class="chart-card-title">
                    Основные средства
                    <span :style="{ color: token.colorTextTertiary }">(типы НФА)</span>
                  </a-typography-title>
                </span>
              </a-tooltip>
            </template>
            <template #extra>
              <div class="chart-card-controls">
                <a-button
                  :type="assetsNfaOcdiOnly ? 'primary' : 'default'"
                  :aria-pressed="assetsNfaOcdiOnly"
                  @click="assetsNfaOcdiOnly = !assetsNfaOcdiOnly"
                >
                  ОЦДИ
                </a-button>
                <a-select
                  v-model:value="selectedNfaTypes"
                  mode="multiple"
                  :max-tag-count="1"
                  :options="nfaTypeOptions"
                  placeholder="Выберите тип НФА"
                  class="chart-card-control-field"
                  style="width: 280px; max-width: 280px"
                />
                <a-segmented v-model:value="assetsMetric" size="middle" :options="metricSegmentOptions" />
              </div>
            </template>
            <div class="chart-host">
              <template v-if="!assetsChartEmpty">
                <div class="chart-stack">
                  <div class="chart-stack__plot">
                    <div class="chart-container">
                      <Bar :data="assetsChartData" :options="assetsChartOptions" />
                    </div>
                  </div>
                  <DashboardLegendScroll :items="assetsLegendItems" />
                </div>
              </template>
              <div v-else class="chart-empty-inner">
                <a-empty :description="chartEmptyDescription" />
              </div>
            </div>
          </a-card>
        </a-col>

        <a-col :span="24" class="dashboard-chart-col">
          <a-card class="chart-card">
            <template #title>
              <a-tooltip :title="chartTitleTooltip.workplaces" placement="topLeft"
                :trigger="['hover', 'focus']">
                <span class="chart-card-title-tooltip-anchor" tabindex="0">
                  <a-typography-title :level="5" class="chart-card-title">
                    Рабочие места
                  </a-typography-title>
                </span>
              </a-tooltip>
            </template>
            <template #extra>
              <div class="chart-card-controls">
                <a-tree-select
                  v-if="wpStackMode === 'departments'"
                  v-model:value="selectedChartDepartmentIds"
                  :tree-data="chartDepartmentTreeData"
                  placeholder="Подразделение"
                  tree-checkable
                  tree-default-expand-all
                  show-search
                  :filter-tree-node="filterDepartmentTreeNode"
                  max-tag-count="responsive"
                  class="chart-card-control-field"
                />
                <a-select
                  v-else
                  v-model:value="wpWorkplaceTypeFilter"
                  mode="multiple"
                  max-tag-count="responsive"
                  :options="wpWorkplaceTypeOptions"
                  placeholder="Тип рабочего места"
                  class="chart-card-control-field"
                />
                <a-segmented
                  v-model:value="wpStackMode"
                  size="middle"
                  :options="wpStackSegmentedOptions"
                />
              </div>
            </template>
            <div class="chart-host">
              <template v-if="!workplacesChartEmpty">
                <div class="chart-stack">
                  <div class="chart-stack__plot">
                    <div class="chart-container">
                      <Bar :data="workplacesChartData" :options="workplacesChartOptions" />
                    </div>
                  </div>
                  <DashboardLegendScroll :items="workplacesLegendItems" />
                </div>
              </template>
              <div v-else class="chart-empty-inner">
                <a-empty :description="chartEmptyDescription" />
              </div>
            </div>
          </a-card>
        </a-col>
        <a-col :span="24" class="dashboard-chart-col">
          <a-card class="chart-card">
            <template #title>
              <a-tooltip :title="chartTitleTooltip.assetsSpheres" placement="topLeft"
                :trigger="['hover', 'focus']">
                <span class="chart-card-title-tooltip-anchor" tabindex="0">
                  <a-typography-title :level="5" class="chart-card-title">
                    Основные средства
                    <span :style="{ color: token.colorTextTertiary }">(сферы применения)</span>
                  </a-typography-title>
                </span>
              </a-tooltip>
            </template>
            <template #extra>
              <div class="chart-card-controls">
                <a-button
                  :type="spheresApplicationOcdiOnly ? 'primary' : 'default'"
                  :aria-pressed="spheresApplicationOcdiOnly"
                  @click="spheresApplicationOcdiOnly = !spheresApplicationOcdiOnly"
                >
                  ОЦДИ
                </a-button>
                <a-select
                  v-model:value="spheresApplicationFilter"
                  mode="multiple"
                  :max-tag-count="1"
                  :options="sphereSelectOptions"
                  placeholder="Сфера применения"
                  class="chart-card-control-field"
                  style="width: 280px; max-width: 280px"
                />
                <a-segmented
                  v-model:value="spheresOsMetric"
                  size="middle"
                  :options="metricSegmentOptions"
                />
              </div>
            </template>
            <div class="chart-host">
              <template v-if="!spheresChartEmpty">
                <div class="chart-stack">
                  <div class="chart-stack__plot">
                    <div class="chart-container">
                      <Bar :data="spheresChartData" :options="spheresChartOptions" />
                    </div>
                  </div>
                  <DashboardLegendScroll :items="spheresLegendItems" />
                </div>
              </template>
              <div v-else class="chart-empty-inner">
                <a-empty :description="chartEmptyDescription" />
              </div>
            </div>
          </a-card>
        </a-col>

        <a-col :span="24" class="dashboard-chart-col">
          <a-card class="chart-card">
            <template #title>
              <a-tooltip :title="chartTitleTooltip.staff" placement="topLeft"
                :trigger="['hover', 'focus']">
                <span class="chart-card-title-tooltip-anchor" tabindex="0">
                  <a-typography-title :level="5" class="chart-card-title">Сотрудники</a-typography-title>
                </span>
              </a-tooltip>
            </template>
            <div class="chart-host">
              <template v-if="!staffChartEmpty">
                <div class="chart-stack">
                  <div class="chart-stack__plot">
                    <div class="chart-container">
                      <Bar :data="staffChartData" :options="staffChartOptions" />
                    </div>
                  </div>
                  <DashboardLegendScroll :items="staffLegendItems" />
                </div>
              </template>
              <div v-else class="chart-empty-inner">
                <a-empty :description="chartEmptyDescription" />
              </div>
            </div>
          </a-card>
        </a-col>
        <a-col :span="24" class="dashboard-chart-col">
          <a-card class="chart-card">
            <template #title>
              <a-tooltip :title="chartTitleTooltip.problematic" placement="topLeft"
                :trigger="['hover', 'focus']">
                <span class="chart-card-title-tooltip-anchor" tabindex="0">
                  <a-typography-title :level="5" class="chart-card-title">
                    Проблемные основные средства
                  </a-typography-title>
                </span>
              </a-tooltip>
            </template>
            <template #extra>
              <div class="chart-card-controls">
                <a-button
                  :type="problematicOcdiOnly ? 'primary' : 'default'"
                  :aria-pressed="problematicOcdiOnly"
                  @click="problematicOcdiOnly = !problematicOcdiOnly"
                >
                  ОЦДИ
                </a-button>
                <a-select
                  mode="multiple"
                  max-tag-count="responsive"
                  :options="problematicSelectOptions"
                  placeholder="Проблема"
                  class="chart-card-control-field"
                />
                <a-segmented
                  v-model:value="problematicOsMetric"
                  size="middle"
                  :options="metricSegmentOptions"
                />
              </div>
            </template>
            <div class="chart-host">
              <template v-if="!problematicChartEmpty">
                <div class="chart-stack">
                  <div class="chart-stack__plot">
                    <div class="chart-container">
                      <Bar :data="problematicChartData" :options="problematicChartOptions" />
                    </div>
                  </div>
                  <DashboardLegendScroll :items="problematicLegendItems" />
                </div>
              </template>
              <div v-else class="chart-empty-inner">
                <a-empty :description="chartEmptyDescription" />
              </div>
            </div>
          </a-card>
        </a-col>
      </a-row>
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

.metrics-grid.kpi-metrics-panel :deep(.ant-card-body) {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0;
  padding: 0 !important;
  overflow: hidden;
}

.metrics-grid.kpi-metrics-panel :deep(.ant-card-body)::before,
.metrics-grid.kpi-metrics-panel :deep(.ant-card-body)::after {
  content: none !important;
  display: none !important;
}

.metrics-grid.kpi-metrics-panel :deep(.ant-card-grid) {
  width: auto !important;
  min-width: 0;
}

@media (max-width: 1599px) {
  .metrics-grid.kpi-metrics-panel :deep(.ant-card-body) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 1023px) {
  .metrics-grid.kpi-metrics-panel :deep(.ant-card-body) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 639px) {
  .metrics-grid.kpi-metrics-panel :deep(.ant-card-body) {
    grid-template-columns: 1fr;
  }
}

.kpi-metric-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.kpi-metric-card__title-row {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.kpi-metric-card__title {
  font-weight: 500;
  font-size: 14px;
  line-height: 1.5715;
  color: rgba(0, 0, 0, 0.88);
  flex: 1;
  min-width: 0;
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

.metric-delta-tag-tooltip-anchor {
  display: inline-flex;
  flex-shrink: 0;
  max-width: 100%;
  outline-offset: 2px;
  cursor: help;
}

.metric-delta-tag {
  display: inline-flex;
  align-items: center;
  margin-inline-end: 0;
  line-height: 20px;
  cursor: help;
}

.metric-delta-tag :deep(.anticon) {
  font-size: 10px;
}

.kpi-metric-card__values {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  min-width: 0;
}

.kpi-metric-card__main-value {
  margin: 0 !important;
  flex-shrink: 0;
}

.kpi-metric-card__main-unit {
  margin-inline-start: 4px;
  font-size: 16px;
  line-height: 1.5715;
  color: rgba(0, 0, 0, 0.88);
}

.kpi-metric-card__slash {
  margin-inline: 8px;
  font-size: 16px;
  line-height: 1.5715;
  color: rgba(0, 0, 0, 0.25);
}

.kpi-metric-card__secondary {
  font-size: 16px;
}

.assets-bar-charts-row .dashboard-chart-col.ant-col {
  flex: 0 0 100%;
  max-width: 100%;
}

@media (min-width: 1400px) {
  .assets-bar-charts-row .dashboard-chart-col.ant-col {
    flex: 0 0 50%;
    max-width: 50%;
  }
}

.chart-card :deep(.ant-card-head),
.assets-bar-chart-card :deep(.ant-card-head) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  min-height: unset;
  height: 56px;
  padding: 0 20px;
  box-sizing: border-box;
}

.chart-card :deep(.ant-card-head-wrapper) {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 16px;
  row-gap: 10px;
  width: 100%;
}

.chart-card :deep(.ant-card-head-title),
.assets-bar-chart-card :deep(.ant-card-head-title) {
  text-align: left;
  font-weight: 500;
  padding: 0;
  margin-bottom: 0;
  display: flex;
  align-items: center;
  flex: 1 1 0;
  min-width: 0;
  max-width: 100%;
}

.chart-card :deep(.ant-card-extra) {
  flex: 0 1 auto;
  min-width: 0;
  margin-inline-start: auto;
}

.chart-card-title-tooltip-anchor {
  display: block;
  min-width: 0;
  max-width: 100%;
  cursor: default;
}

.chart-card-title-tooltip-anchor:focus {
  outline: none;
}

.chart-card-title-tooltip-anchor:focus-visible {
  outline: 2px solid rgba(5, 145, 255, 0.55);
  outline-offset: 2px;
  border-radius: 2px;
}

.chart-card-title {
  margin: 0 !important;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.chart-card-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.chart-card-control-field {
  width: 280px;
  max-width: 100%;
}

.chart-card-control-field :deep(.ant-select-selection-overflow) {
  flex-wrap: nowrap;
}

.chart-card :deep(.ant-card-body),
.assets-bar-chart-card :deep(.ant-card-body) {
  padding: 20px;
  background: transparent;
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

.chart-container {
  width: 100%;
  flex: 1 1 auto;
  min-height: 0;
  position: relative;
}

.chart-empty-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 320px;
}

.chart-host {
  width: 100%;
  height: 320px;
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
