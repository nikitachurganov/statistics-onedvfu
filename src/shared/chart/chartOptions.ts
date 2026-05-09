import type { ChartOptions, ScriptableContext } from 'chart.js'

export const formatNumber = (value: number) =>
  new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(value)

/** Сдержанная enterprise-палитра (акцент `#2867AB`). */
export const chartColors = [
  '#2867AB',
  '#5E8C61',
  '#8A63D2',
  '#C27C2C',
  '#4F7C7A',
  '#B35C7A',
  '#6B7280',
  '#3F6B8C',
] as const

export const chartHoverColors = [
  '#1F5187',
  '#4F7752',
  '#744EB8',
  '#A6671F',
  '#3E6664',
  '#944966',
  '#565D68',
  '#345A75',
] as const

export const DASHBOARD_LINE_PRIMARY_COLOR = chartColors[0]

export const chartPaletteSize = chartColors.length

export function chartColorAt(index: number): string {
  return chartColors[index % chartColors.length]!
}

export function chartHoverColorAt(index: number): string {
  return chartHoverColors[index % chartHoverColors.length]!
}

const axisTickColor = '#6B7280'
const gridColor = '#F0F3F6'

const layoutChartPadding = {
  padding: {
    top: 4,
    bottom: 12,
  },
}

const legendPluginConfig = {
  display: false as const,
  position: 'top' as const,
  align: 'start' as const,
  labels: {
    usePointStyle: true,
    pointStyle: 'circle' as const,
    boxWidth: 8,
    boxHeight: 8,
    padding: 18,
  },
}

const STACK_BAR_RADIUS = 4

/** Скругление только у верхнего видимого сегмента стековой колонки (с учётом легенды / скрытых рядов). */
export function getStackedBarRadius(ctx: ScriptableContext<'bar'>) {
  const chart = ctx.chart
  const datasetIndex = ctx.datasetIndex
  const visibleDatasetIndexes = chart.data.datasets
    .map((_, index: number) => index)
    .filter((index: number) => chart.isDatasetVisible(index))
  if (visibleDatasetIndexes.length === 0) {
    return { topLeft: 0, topRight: 0, bottomLeft: 0, bottomRight: 0 }
  }
  const topVisibleDatasetIndex = visibleDatasetIndexes[visibleDatasetIndexes.length - 1]!
  const isTopVisibleDataset = datasetIndex === topVisibleDatasetIndex
  if (!isTopVisibleDataset) {
    return { topLeft: 0, topRight: 0, bottomLeft: 0, bottomRight: 0 }
  }
  return {
    topLeft: STACK_BAR_RADIUS,
    topRight: STACK_BAR_RADIUS,
    bottomLeft: 0,
    bottomRight: 0,
  }
}

export function hexToRgbA(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h
  const v = parseInt(full, 16)
  const r = (v >> 16) & 255
  const g = (v >> 8) & 255
  const b = v & 255
  return `rgba(${r},${g},${b},${alpha})`
}

export function createBaseOptions(unit: string): ChartOptions<'bar' | 'line'> {
  return {
    layout: layoutChartPadding,
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: legendPluginConfig,
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label ?? ''
            const parsed = context.parsed
            const raw =
              typeof parsed === 'object' && parsed !== null
                ? ('y' in parsed && parsed.y != null
                    ? parsed.y
                    : 'x' in parsed && parsed.x != null
                      ? parsed.x
                      : context.raw)
                : context.raw
            const n = typeof raw === 'number' ? raw : Number(raw)
            return `${label}: ${formatNumber(Number(n))} ${unit}`.trim()
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 0,
          minRotation: 0,
          autoSkip: true,
          maxTicksLimit: 10,
          color: axisTickColor,
          font: { size: 12 },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: gridColor,
        },
        title: { display: false },
        ticks: {
          callback: (value) => formatNumber(Number(value)),
          color: axisTickColor,
          font: { size: 12 },
        },
      },
    },
  }
}

export type StackedColumnExtras = {
  maxTicksLimit?: number
  tooltipMode?: 'default' | 'category-slash-series'
  /** Переопределение подписей оси X (например `Год`: все 12 месяцев). */
  xTicks?: {
    autoSkip?: boolean
    maxTicksLimit?: number
  }
}

export type AreaLineExtras = {
  xTicks?: {
    autoSkip?: boolean
    maxTicksLimit?: number
  }
}

export function createStackedColumnOptions(
  yAxisTitle: string,
  unit: string,
  extras?: StackedColumnExtras,
): ChartOptions<'bar'> {
  void yAxisTitle
  const baseTickLimit = extras?.maxTicksLimit ?? 8
  const tooltipMode = extras?.tooltipMode ?? 'default'
  const xAutoSkip = extras?.xTicks?.autoSkip ?? true
  const xMaxTicksLimit = extras?.xTicks?.maxTicksLimit ?? baseTickLimit

  return {
    layout: layoutChartPadding,
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: legendPluginConfig,
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label ?? ''
            const v = context.parsed.y
            const n = typeof v === 'number' ? v : Number(v)
            if (tooltipMode === 'category-slash-series') {
              const cats = context.chart.data.labels
              const catRaw = cats?.[context.dataIndex]
              const cat =
                typeof catRaw === 'string'
                  ? catRaw
                  : catRaw != null
                    ? String(catRaw)
                    : ''
              return `${cat} / ${label}: ${formatNumber(n)} ${unit}`.trim()
            }
            return `${label}: ${formatNumber(n)} ${unit}`.trim()
          },
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        ticks: {
          maxRotation: 0,
          minRotation: 0,
          autoSkip: xAutoSkip,
          maxTicksLimit: xMaxTicksLimit,
          color: axisTickColor,
          font: { size: 12 },
        },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        grid: { color: gridColor },
        title: { display: false },
        ticks: {
          callback: (value) => formatNumber(Number(value)),
          color: axisTickColor,
          font: { size: 12 },
        },
      },
    },
  }
}

export function createAreaLineOptions(
  params: {
    yAxisTitle: string
    unit: string
  },
  extras?: AreaLineExtras,
): ChartOptions<'line'> {
  void params.yAxisTitle
  const { unit } = params
  const xAutoSkip = extras?.xTicks?.autoSkip ?? true
  const xMaxTicksLimit = extras?.xTicks?.maxTicksLimit ?? 10
  return {
    layout: layoutChartPadding,
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: legendPluginConfig,
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label ?? ''
            const v = context.parsed.y
            const n = typeof v === 'number' ? v : Number(v)
            return `${label}: ${formatNumber(n)} ${unit}`.trim()
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          maxRotation: 0,
          minRotation: 0,
          autoSkip: xAutoSkip,
          maxTicksLimit: xMaxTicksLimit,
          color: axisTickColor,
          font: { size: 12 },
        },
      },
      y: {
        beginAtZero: true,
        grid: { color: gridColor },
        title: { display: false },
        ticks: {
          callback: (value) => formatNumber(Number(value)),
          color: axisTickColor,
          font: { size: 12 },
        },
      },
    },
    elements: {
      line: { tension: 0.35 },
      point: { radius: 0, hoverRadius: 4 },
    },
  }
}

export function createVerticalBarOptions(
  yAxisTitle: string,
  unit: string,
  xMaxRotation = 22,
): ChartOptions<'bar'> {
  void yAxisTitle
  return {
    layout: layoutChartPadding,
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'x',
    plugins: {
      legend: legendPluginConfig,
      tooltip: {
        callbacks: {
          title: (items) => (items[0]?.label ? String(items[0].label) : ''),
          label: (context) => {
            const lbl = context.dataset.label || ''
            const v = context.parsed.y
            const n = typeof v === 'number' ? v : Number(v)
            return lbl ? `${lbl}: ${formatNumber(n)} ${unit}` : `${formatNumber(n)} ${unit}`
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          maxRotation: xMaxRotation,
          minRotation: 0,
          autoSkip: false,
          color: axisTickColor,
          font: { size: 12 },
        },
      },
      y: {
        beginAtZero: true,
        grid: { color: gridColor },
        ticks: {
          callback: (value) => formatNumber(Number(value)),
          color: axisTickColor,
          font: { size: 12 },
        },
        title: { display: false },
      },
    },
  }
}

export function createHorizontalBarOptions(xAxisTitle: string, unit: string): ChartOptions<'bar'> {
  void xAxisTitle
  return {
    layout: layoutChartPadding,
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: legendPluginConfig,
      tooltip: {
        callbacks: {
          title: (items) => (items[0]?.label ? String(items[0].label) : ''),
          label: (context) => {
            const lbl = context.dataset.label || ''
            const v = context.parsed.x
            const n = typeof v === 'number' ? v : Number(v)
            return lbl ? `${lbl}: ${formatNumber(n)} ${unit}` : `${formatNumber(n)} ${unit}`
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        stacked: false,
        grid: { color: gridColor },
        ticks: {
          callback: (value) => formatNumber(Number(value)),
          color: axisTickColor,
          font: { size: 11 },
        },
        title: { display: false },
      },
      y: {
        stacked: false,
        grid: { display: false },
        ticks: {
          autoSkip: false,
          color: axisTickColor,
          font: { size: 11 },
        },
      },
    },
  }
}
