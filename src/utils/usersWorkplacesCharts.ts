import {
  pulseSummaryAxisLabels,
  pulseSummaryPointCount,
  smoothSeries,
  type PulseSummaryPeriod,
} from './pulseSummaryCharts'

export type { PulseSummaryPeriod }

export function usersWpPointCount(p: PulseSummaryPeriod): number {
  return pulseSummaryPointCount(p)
}

export interface WorkplaceSeriesPack {
  labels: string[]
  office: number[]
  meeting: number[]
  rnd: number[]
}

export interface EmployeeSeriesPack {
  labels: string[]
  total: number[]
  unassigned: number[]
  assigned: number[]
}

/** Гладкие ряды по типам РМ — около 5k мест на линию. */
export function generateWorkplaceTypesSeries(period: PulseSummaryPeriod): WorkplaceSeriesPack {
  const n = pulseSummaryPointCount(period)
  const labels = pulseSummaryAxisLabels(period)
  return {
    labels,
    office: smoothSeries(n, 1.08, 4750, 5250),
    meeting: smoothSeries(n, 2.17, 4720, 5280),
    rnd: smoothSeries(n, 3.26, 4780, 5220),
  }
}

function scalePack(pack: EmployeeSeriesPack, scale: number): EmployeeSeriesPack {
  if (scale <= 0) {
    const z = pack.labels.map(() => 0)
    return { labels: pack.labels, total: z, unassigned: z, assigned: z }
  }
  return {
    labels: pack.labels,
    total: pack.total.map((v) => Math.round(v * scale)),
    unassigned: pack.unassigned.map((v) => Math.round(v * scale)),
    assigned: pack.assigned.map((v) => Math.round(v * scale)),
  }
}

/** Всего / без привязки / с привязкой — согласованные значения (assigned = total − unassigned). */
export function generateEmployeeBindingSeries(
  period: PulseSummaryPeriod,
  scopeMultiplier = 1,
): EmployeeSeriesPack {
  const n = pulseSummaryPointCount(period)
  const labels = pulseSummaryAxisLabels(period)
  const total = smoothSeries(n, 1.72, 4720, 5280)
  const unassigned = smoothSeries(n, 2.95, 520, 1180)
  const assigned = total.map((t, i) => Math.max(0, Math.round(t - (unassigned[i] ?? 0))))
  return scalePack({ labels, total, unassigned, assigned }, scopeMultiplier)
}

export interface WpDistributionRow {
  key: string
  department: string
  employeesTotal: number
  employeesNoWp: number
  wpTotal: number
  wpOccupied: number
  wpFree: number
}

const DEPTS_12 = [
  'Административные',
  'Вспомогательные',
  'Коридоры',
  'Технические',
  'Дирекция кампуса',
  'Инженерная служба',
  'Научные подразделения',
  'Учебные корпуса',
  'Общежития',
  'Спортивный блок',
  'Столовые',
  'Библиотечный комплекс',
] as const

export const WP_DISTRIBUTION_TABLE_MOCK: WpDistributionRow[] = DEPTS_12.map((department, i) => {
  const wave = Math.round(420 + Math.sin(i * 1.1 + 0.4) * 80 + i * 41)
  const employeesTotal = 280 + wave
  const employeesNoWp = Math.min(
    employeesTotal - 40,
    Math.round(employeesTotal * (0.08 + (i % 4) * 0.03)),
  )
  const wpTotal = Math.round(employeesTotal * 1.85 + i * 120)
  const wpOccupied = Math.round(wpTotal * (0.72 + (i % 3) * 0.05))
  const wpFree = Math.max(0, wpTotal - wpOccupied)
  return {
    key: `wp-dist-${i}`,
    department,
    employeesTotal,
    employeesNoWp,
    wpTotal,
    wpOccupied,
    wpFree,
  }
})
