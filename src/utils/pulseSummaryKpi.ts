import type { PulseSummaryPeriod } from '@/utils/pulseSummaryCharts'

export interface KpiMetricAgg {
  title: string
  mainValue: string
  mainUnit: string
  secondary?: string
  /** Единица для абсолютной дельты в подсказке (+ «ед.» в скобках). */
  deltaUnit: string
  deltaPercentWeek: number
  deltaAbsoluteWeek: number
  deltaPercentMonth: number
  deltaAbsoluteMonth: number
  deltaPercentYear: number
  deltaAbsoluteYear: number
}

/** Подпись процента в карточке (без «за неделю» и т.п.). Unicode − для отрицательных. */
export function formatKpiVisibleDeltaPercent(pct: number): string {
  if (pct === 0) return '0%'
  const sign = pct > 0 ? '+' : '\u2212'
  return `${sign}${Math.abs(pct).toFixed(1)}%`
}

/** Текст подсказки: сравнение с предыдущим периодом выбранного типа. */
export function formatKpiDeltaTooltip(pct: number, abs: number, deltaUnit: string): string {
  if (pct === 0) return 'Без изменений относительно прошлого периода'
  const direction = pct > 0 ? 'больше' : 'меньше'
  const percent = Math.abs(pct).toFixed(1)
  const absolute = new Intl.NumberFormat('ru-RU').format(Math.abs(abs))
  return `На ${percent}% (${absolute} ${deltaUnit}) ${direction}, чем за прошлый период`
}

export function kpiDeltaForPeriod(metric: KpiMetricAgg, period: PulseSummaryPeriod): {
  pct: number
  abs: number
} {
  switch (period) {
    case 'week':
      return { pct: metric.deltaPercentWeek, abs: metric.deltaAbsoluteWeek }
    case 'year':
      return { pct: metric.deltaPercentYear, abs: metric.deltaAbsoluteYear }
    default:
      return { pct: metric.deltaPercentMonth, abs: metric.deltaAbsoluteMonth }
  }
}

/** Мок: восемь KPI в фиксированном порядке; дельты по неделе / месяцу / году. */
export function aggregateKpiForScope(
  _scopeIds: readonly string[],
  _period: PulseSummaryPeriod,
): KpiMetricAgg[] {
  void _scopeIds
  void _period

  return [
    {
      title: 'Помещения и пространства',
      mainValue: '4 997',
      mainUnit: 'ед.',
      secondary: '188 907 м²',
      deltaUnit: 'ед.',
      deltaPercentWeek: 1.9,
      deltaAbsoluteWeek: 94,
      deltaPercentMonth: 2.4,
      deltaAbsoluteMonth: 120,
      deltaPercentYear: -0.8,
      deltaAbsoluteYear: -40,
    },
    {
      title: 'Сотрудники',
      mainValue: '4 997',
      mainUnit: 'чел.',
      deltaUnit: 'чел.',
      deltaPercentWeek: 0.4,
      deltaAbsoluteWeek: 20,
      deltaPercentMonth: 1.1,
      deltaAbsoluteMonth: 54,
      deltaPercentYear: -0.2,
      deltaAbsoluteYear: -10,
    },
    {
      title: 'Основные средства',
      mainValue: '392 614',
      mainUnit: 'ед.',
      secondary: '79 665 711 ₽',
      deltaUnit: 'ед.',
      deltaPercentWeek: 2.1,
      deltaAbsoluteWeek: 8000,
      deltaPercentMonth: 2.4,
      deltaAbsoluteMonth: 9240,
      deltaPercentYear: 3.2,
      deltaAbsoluteYear: 12_200,
    },
    {
      title: 'Машины и оборудование',
      mainValue: '156 240',
      mainUnit: 'ед.',
      secondary: '32 450 000 ₽',
      deltaUnit: 'ед.',
      deltaPercentWeek: 1.2,
      deltaAbsoluteWeek: 1850,
      deltaPercentMonth: 1.8,
      deltaAbsoluteMonth: 2750,
      deltaPercentYear: -0.5,
      deltaAbsoluteYear: -780,
    },
    {
      title: 'Рабочие места',
      mainValue: '10 000',
      mainUnit: 'мест',
      deltaUnit: 'мест',
      deltaPercentWeek: 0,
      deltaAbsoluteWeek: 0,
      deltaPercentMonth: -0.6,
      deltaAbsoluteMonth: -18,
      deltaPercentYear: 0,
      deltaAbsoluteYear: 0,
    },
    {
      title: 'Сотрудники без рабочего места',
      mainValue: '320',
      mainUnit: 'чел.',
      deltaUnit: 'чел.',
      deltaPercentWeek: 0,
      deltaAbsoluteWeek: 0,
      deltaPercentMonth: 0,
      deltaAbsoluteMonth: 0,
      deltaPercentYear: 0,
      deltaAbsoluteYear: 0,
    },
    {
      title: 'ОЦДИ',
      mainValue: '2 816',
      mainUnit: 'ед.',
      secondary: '74 552 122 ₽',
      deltaUnit: 'ед.',
      deltaPercentWeek: 2.0,
      deltaAbsoluteWeek: 55,
      deltaPercentMonth: 2.3,
      deltaAbsoluteMonth: 64,
      deltaPercentYear: 1.7,
      deltaAbsoluteYear: 47,
    },
    {
      title: 'Научное оборудование',
      mainValue: '3 072',
      mainUnit: 'ед.',
      secondary: '2 955 344 ₽',
      deltaUnit: 'ед.',
      deltaPercentWeek: 1.4,
      deltaAbsoluteWeek: 42,
      deltaPercentMonth: 1.9,
      deltaAbsoluteMonth: 58,
      deltaPercentYear: -1.1,
      deltaAbsoluteYear: -34,
    },
  ]
}
