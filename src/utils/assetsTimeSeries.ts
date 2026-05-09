import {
  pulseSummaryAxisLabels,
  pulseSummaryPointCount,
  type PulseSummaryPeriod,
} from '@/utils/pulseSummaryCharts'

/** Генерирует метки дат и три ряда значений (дни или месяцы в зависимости от периода). */

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export function formatDayMonth(d: Date): string {
  return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}`
}

export interface AssetsTimeSeries {
  labels: string[]
  /** Количество единиц по всему портфелю ОС. */
  all: number[]
  /** Оценочная стоимость портфеля, ₽ (пропорционально `all`, KPI-сводка). */
  allCost: number[]
  ocdi: number[]
  science: number[]
}

const BASE_ALL = 392_614
const BASE_OCDI = 2_816
const BASE_SCIENCE = 3_072

/** Балансовая стоимость для масштаба ряда «стоимость» (мок). */
const PORTFOLIO_COST_TOTAL = 79_665_711

export function generateAssetsTimeSeries(period: PulseSummaryPeriod): AssetsTimeSeries {
  const pointCount = pulseSummaryPointCount(period)
  const labels = pulseSummaryAxisLabels(period)
  const all: number[] = []
  const allCost: number[] = []
  const ocdi: number[] = []
  const science: number[] = []

  const costPerUnit = PORTFOLIO_COST_TOTAL / BASE_ALL

  for (let i = 0; i < pointCount; i++) {
    const t = pointCount > 1 ? i / (pointCount - 1) : 0
    const wobble = Math.sin(t * Math.PI * 2) * 0.002
    const drift = ((i % 7) - 3) * 4

    const cnt = Math.round(BASE_ALL * (1 + wobble) + drift + (i % 5) * 2)
    all.push(cnt)
    allCost.push(Math.round(cnt * costPerUnit))

    ocdi.push(Math.round(BASE_OCDI * (1 + wobble * 1.2) + (i % 4) - 1))
    science.push(Math.round(BASE_SCIENCE * (1 + wobble * 0.9) + (i % 6)))
  }

  return { labels, all, allCost, ocdi, science }
}
