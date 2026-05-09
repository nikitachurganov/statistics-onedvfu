import {
  pulseSummaryAxisLabels,
  pulseSummaryPointCount,
  type PulseSummaryPeriod,
} from '@/utils/pulseSummaryCharts'
export interface DeptLocationRow {
  department: string
  transferredInPercent: number
  transferredOutPercent: number
  unchangedPercent: number
}

export interface NamedCountRow {
  name: string
  count: number
}

export interface NamedCountCostRow extends NamedCountRow {
  cost: number
}

export function formatRuInt(v: number): string {
  return Math.round(v).toLocaleString('ru-RU')
}

/** Мок: суммы по строкам = 100%. */
export const DEPT_LOCATION_MOCK_RAW: DeptLocationRow[] = [
  {
    department: 'Дирекция кампуса',
    transferredInPercent: 22,
    transferredOutPercent: 14,
    unchangedPercent: 64,
  },
  {
    department: 'Инженерная служба',
    transferredInPercent: 18,
    transferredOutPercent: 24,
    unchangedPercent: 58,
  },
  {
    department: 'Школа биомедицины',
    transferredInPercent: 11,
    transferredOutPercent: 10,
    unchangedPercent: 79,
  },
  {
    department: 'Школа цифровой экономики',
    transferredInPercent: 15,
    transferredOutPercent: 11,
    unchangedPercent: 74,
  },
  {
    department: 'Лабораторный комплекс',
    transferredInPercent: 10,
    transferredOutPercent: 16,
    unchangedPercent: 74,
  },
]

/** Базовое число ОС по подразделению (мок для линии «динамика местоположений»). */
const DEPT_LOCATION_BASE_UNITS: Record<string, number> = {
  'Дирекция кампуса': 58_420,
  'Инженерная служба': 71_350,
  'Школа биомедицины': 46_890,
  'Школа цифровой экономики': 52_110,
  'Лабораторный комплекс': 63_770,
}

export function generateDeptLocationTimeSeries(
  period: PulseSummaryPeriod,
  department: string,
): { labels: string[]; values: number[] } {
  const pointCount = pulseSummaryPointCount(period)
  const labels = pulseSummaryAxisLabels(period)
  const values: number[] = []
  const BASE = DEPT_LOCATION_BASE_UNITS[department] ?? 48_000

  for (let i = 0; i < pointCount; i++) {
    const t = pointCount > 1 ? i / (pointCount - 1) : 0
    const wobble = Math.sin(t * Math.PI * 2) * 0.002
    const drift = ((i % 7) - 3) * 4

    values.push(Math.round(BASE * (1 + wobble) + drift + (i % 5) * 2))
  }

  return { labels, values }
}

/** Распределение по группам систем (count + cost от KPI-подобной суммы). */
export function buildSystemGroupsRows(totalCost = 79_665_711): NamedCountCostRow[] {
  const counts = [
    { name: 'Инженерные системы', count: 42_300 },
    { name: 'ИТ-инфраструктура', count: 18_900 },
    { name: 'Безопасность', count: 27_650 },
    { name: 'Лабораторные системы', count: 61_400 },
    { name: 'Мебель и оснащение', count: 33_120 },
    { name: 'Транспортные системы', count: 12_840 },
    { name: 'Прочее', count: 34_714 },
  ]
  const sum = counts.reduce((s, r) => s + r.count, 0)
  let used = 0
  return counts.map((r, i) => {
    const last = i === counts.length - 1
    const cost = last ? totalCost - used : Math.round((totalCost * r.count) / sum)
    if (!last) used += cost
    return { name: r.name, count: r.count, cost }
  })
}

export const SCIENCE_CLASSES_MOCK: NamedCountRow[] = [
  { name: 'Лабораторное', count: 860 },
  { name: 'Измерительное', count: 540 },
  { name: 'Вычислительное', count: 612 },
  { name: 'Медицинское', count: 284 },
  { name: 'Учебно-научное', count: 486 },
  { name: 'Прочее', count: 290 },
]
