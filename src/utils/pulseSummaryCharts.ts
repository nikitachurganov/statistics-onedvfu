/** Моковые ряды для дашборда «Общая сводка»: гладкая динамика, диапазон по умолчанию 1000–2500. */

import { chartColors, chartHoverColors } from '@/shared/chart/chartOptions'

export type PulseSummaryPeriod = 'week' | 'month' | 'year'

export function pulseSummaryPointCount(period: PulseSummaryPeriod): number {
  if (period === 'week') return 7
  if (period === 'month') return 31
  return 12
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/** Подписи оси X: последние 7 / 31 дней (DD.MM) или 12 месяцев (MM.YY), включая текущий период. */
export function pulseSummaryAxisLabels(period: PulseSummaryPeriod): string[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (period === 'year') {
    const labels: string[] = []
    for (let i = 0; i < 12; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - (11 - i), 1)
      labels.push(`${pad2(d.getMonth() + 1)}.${String(d.getFullYear()).slice(-2)}`)
    }
    return labels
  }

  const pointCount = pulseSummaryPointCount(period)
  const labels: string[] = []
  for (let i = 0; i < pointCount; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - (pointCount - 1 - i))
    labels.push(`${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}`)
  }
  return labels
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

function scaleData(arr: readonly number[], factor: number): number[] {
  if (factor <= 0) return arr.map(() => 0)
  return arr.map((v) => Math.round(v * factor))
}

export function smoothSeries(
  pointCount: number,
  seed: number,
  min = 1000,
  max = 2500,
): number[] {
  const out: number[] = []
  const mid = (min + max) / 2
  const amp = (max - min) / 2
  for (let i = 0; i < pointCount; i++) {
    const t = pointCount > 1 ? i / (pointCount - 1) : 0
    const w1 = Math.sin(t * Math.PI * 2 + seed) * 0.55
    const w2 = Math.sin(t * Math.PI * 3.2 + seed * 1.3) * 0.25
    const w3 = Math.sin(t * Math.PI * 0.85 + seed * 0.4) * 0.18
    const v = mid + amp * (w1 + w2 + w3)
    out.push(Math.round(clamp(v, min, max)))
  }
  return out
}

/** Площади ~185k–191k м² для переключателя «Площадь». */
export function roomsAreaSqmSeries(pointCount: number, seed: number): number[] {
  const min = 185_200
  const max = 191_400
  const mid = (min + max) / 2
  const amp = (max - min) / 2
  const out: number[] = []
  for (let i = 0; i < pointCount; i++) {
    const t = pointCount > 1 ? i / (pointCount - 1) : 0
    const v =
      mid +
      amp *
        (Math.sin(t * Math.PI * 2 + seed) * 0.6 +
          Math.sin(t * Math.PI * 4 + seed * 1.1) * 0.35)
    out.push(Math.round(clamp(v, min, max)))
  }
  return out
}

const COST_SCALE = 85_000

/** Доля ОЦДИ в совокупном портфеле НФА (мок): при фильтре «только ОЦДИ» ряды масштабируются. */
const MOCK_OCDI_NFA_SHARE = 0.37

function applyOcdiOnlyToDatasets<T extends { label: string; data: number[] }>(
  datasets: T[],
  ocdiOnly: boolean,
): T[] {
  if (!ocdiOnly) return datasets
  return datasets.map((d) => ({
    ...d,
    data: d.data.map((v) => Math.max(0, Math.round(v * MOCK_OCDI_NFA_SHARE))),
  }))
}

/** Типы НФА для графика «Основные средства (типы НФА)» (порядок = легенда и мультивыбор). */
export const NFA_TYPE_OPTIONS = [
  { label: 'Биологические ресурсы', value: 'biological-resources' },
  {
    label: 'Вложения в иные объекты интеллектуальной собственности',
    value: 'investments-other-ip-objects',
  },
  { label: 'Вложения в основные средства', value: 'investments-fixed-assets' },
  { label: 'Жилые помещения', value: 'residential-premises' },
  { label: 'Земля (земельные участки)', value: 'land-plots' },
  { label: 'Инвентарь производственный и хозяйственный', value: 'production-household-inventory' },
  { label: 'Иные объекты интеллектуальной собственности', value: 'other-ip-objects' },
  { label: 'Машины и оборудование', value: 'machinery-equipment' },
] as const

export type NfaTypeChartValue = (typeof NFA_TYPE_OPTIONS)[number]['value']

function hashNfaTypeKey(key: string): number {
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0
  return Math.abs(h)
}

/** Ряды по типам НФА по датам (единицы или балансовая стоимость, ₽). */
export function assetsNfaTypesStackSeries(
  pointCount: number,
  baseSeed: number,
  metric: 'count' | 'cost',
  scopeMultiplier = 1,
  ocdiOnly = false,
): Record<NfaTypeChartValue, number[]> {
  const m = scopeMultiplier <= 0 ? 0 : scopeMultiplier
  const out = {} as Record<NfaTypeChartValue, number[]>

  NFA_TYPE_OPTIONS.forEach((opt, i) => {
    const h = hashNfaTypeKey(opt.value)
    const seed = baseSeed + 1.15 + i * 0.33 + (h % 19) * 0.06
    const lo = 520 + ((h + i * 127) % 380)
    const hi = 1980 + ((h + i * 179) % 520)
    const raw = smoothSeries(pointCount, seed, lo, hi)
    const data =
      metric === 'count'
        ? scaleData(raw, m)
        : raw.map((v) =>
            Math.round(v * COST_SCALE * m * (0.88 + ((h % 24) / 100) + i * 0.008)),
          )
    out[opt.value] = data
  })

  if (ocdiOnly && m > 0) {
    for (const opt of NFA_TYPE_OPTIONS) {
      const key = opt.value
      const row = out[key]
      out[key] = row.map((v) => Math.max(0, Math.round(v * MOCK_OCDI_NFA_SHARE)))
    }
  }

  return out
}

/** Типы помещений для стека (порядок = легенда и мультивыбор). */
export const ROOM_TYPE_LABELS_ORDERED = [
  'Административные',
  'Вспомогательные',
  'Коридоры',
  'Основные',
  'Технические',
  'Учебные',
  'Научные',
  'Прочее',
] as const

export type RoomStackTypeKey =
  | 'all'
  | 'administrative'
  | 'auxiliary'
  | 'corridors'
  | 'main'
  | 'technical'
  | 'educational'
  | 'scientific'
  | 'misc'

/** Ключ фильтра селекта → индекс в `ROOM_TYPE_LABELS_ORDERED`. */
export const ROOM_TYPE_SELECT_TO_INDEX: Record<Exclude<RoomStackTypeKey, 'all'>, number> = {
  administrative: 0,
  auxiliary: 1,
  corridors: 2,
  main: 3,
  technical: 4,
  educational: 5,
  scientific: 6,
  misc: 7,
}

const PALETTE_LEN = chartColors.length
const ROOM_WEIGHTS = [0.14, 0.09, 0.11, 0.26, 0.08, 0.22, 0.07, 0.03] as const

export interface RoomsStackSlice {
  label: (typeof ROOM_TYPE_LABELS_ORDERED)[number]
  data: number[]
  color: string
}

/** Стеки помещений по датам: количества или доли площади по типам. */
export function roomsStackSlices(
  pointCount: number,
  metric: 'count' | 'area',
  seed: number,
  scopeMultiplier = 1,
): RoomsStackSlice[] {
  const baseTotals =
    metric === 'count'
      ? smoothSeries(pointCount, seed, 1000, 2500)
      : roomsAreaSqmSeries(pointCount, seed + 0.3)

  return ROOM_TYPE_LABELS_ORDERED.map((label, i) => {
    const w = ROOM_WEIGHTS[i] ?? 0.05
    const ripple = smoothSeries(pointCount, seed + i * 0.73, 85, 115)
    const raw = baseTotals.map((t, idx) => (t * w * (ripple[idx] ?? 100)) / 100)
    const data = raw.map((v) => {
      const scaled = v * scopeMultiplier
      return metric === 'count'
        ? Math.max(scopeMultiplier > 0 ? 1 : 0, Math.round(scaled))
        : Math.round(clamp(scaled, 800, 90_000))
    })
    return {
      label,
      data,
      color: chartColors[i % PALETTE_LEN]!,
    }
  })
}

/** Подписи типов РМ для стека (дашборд). */
export const WORKPLACE_KIND_LABELS = [
  'Офисные',
  'Переговорные',
  'Научно-производственные',
  'Учебные',
] as const

/** Подразделения для графика «Рабочие места» (мультивыбор в режиме «Подразделения»). */
export const WP_DEPARTMENT_LABELS = [
  'Дирекция кампуса',
  'Инженерная служба',
  'Школа биомедицины',
  'Школа цифровой экономики',
  'Лабораторный комплекс',
] as const

function kindIncluded(kIndex: number, selectedKinds: readonly string[]): boolean {
  if (selectedKinds.length === 0) return true
  const name = WORKPLACE_KIND_LABELS[kIndex] as string
  return selectedKinds.includes(name)
}

function hashDeptId(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

function workplaceSeatSeriesForDept(
  deptId: string,
  kindIndex: number,
  pointCount: number,
  period: PulseSummaryPeriod,
): number[] {
  const h = hashDeptId(deptId)
  const scale = period === 'week' ? 0.92 : period === 'year' ? 1.05 : 1
  const base = 90 + (h % 47) + ((kindIndex * 11) % 61)
  const lo = Math.max(1, Math.round(base * scale * 0.75))
  const hi = Math.max(lo + 1, Math.round(base * scale * 1.25))
  return smoothSeries(
    pointCount,
    1.08 + (h % 17) * 0.02 + kindIndex * 0.23,
    lo,
    hi,
  )
}

function addPointwise(a: number[], b: number[]): number[] {
  return a.map((v, i) => Math.round(v + (b[i] ?? 0)))
}

export type WorkplaceStackLayoutMode = 'departments' | 'workplaceTypes'

/** Рабочие места: ось X — даты; стеки по подразделениям из охвата или по типам РМ. */
export function buildWorkplacesChartPack(
  pointCount: number,
  period: PulseSummaryPeriod,
  mode: WorkplaceStackLayoutMode,
  selectedDeptIds: readonly string[],
  selectedKinds: readonly string[],
  scope: readonly { id: string; name: string }[],
): {
  dateLabels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor: string
    hoverBackgroundColor: string
  }[]
} {
  const dateLabels = pulseSummaryAxisLabels(period)

  let nodes = scope.map((s) => ({ ...s }))
  if (selectedDeptIds.length) {
    nodes = nodes.filter((n) => selectedDeptIds.includes(n.id))
  }
  if (nodes.length === 0) {
    return { dateLabels, datasets: [] }
  }

  if (mode === 'workplaceTypes') {
    const datasets = WORKPLACE_KIND_LABELS.map((kindName, k) => {
      if (!kindIncluded(k, selectedKinds)) return null
      let data = Array.from({ length: pointCount }, () => 0)
      for (const node of nodes) {
        const row = workplaceSeatSeriesForDept(node.id, k, pointCount, period)
        data = addPointwise(data, row)
      }
      return {
        label: kindName,
        data,
        backgroundColor: chartColors[k % PALETTE_LEN]!,
        hoverBackgroundColor: chartHoverColors[k % PALETTE_LEN]!,
      }
    }).filter((x): x is NonNullable<typeof x> => x !== null)
    return { dateLabels, datasets }
  }

  const datasets = nodes
    .map((node, idx) => {
      let data = new Array(pointCount).fill(0) as number[]
      for (let k = 0; k < WORKPLACE_KIND_LABELS.length; k++) {
        data = addPointwise(data, workplaceSeatSeriesForDept(node.id, k, pointCount, period))
      }
      return {
        label: node.name,
        data,
        backgroundColor: chartColors[idx % PALETTE_LEN]!,
        hoverBackgroundColor: chartHoverColors[idx % PALETTE_LEN]!,
      }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)

  return { dateLabels, datasets }
}

/** Сферы применения — заголовки стеков (ось X — даты). */
export const APPLICATION_SPHERE_CATEGORY_LABELS = [
  'Учебная деятельность',
  'НИОКР',
  'Административно-хозяйственная',
  'Социальная инфраструктура',
  'Прочие сферы',
] as const

/** Проблемные ОС — заголовки стеков (ось X — даты). */
export const PROBLEMATIC_OS_CATEGORY_LABELS = [
  'Без МОЛ',
  'Местоположение неизвестно',
  'Неклассифицировано',
] as const

const PROBLEM_BAR_COLORS: Record<string, string> = {
  'Без МОЛ': '#B35C7A',
  'Местоположение неизвестно': '#6B7280',
  'Неклассифицировано': '#C27C2C',
}

const PROBLEM_HOVER_COLORS: Record<string, string> = {
  'Без МОЛ': '#944966',
  'Местоположение неизвестно': '#565D68',
  'Неклассифицировано': '#A6671F',
}

export function applicationSpheresOverDates(
  period: PulseSummaryPeriod,
  metric: 'count' | 'cost',
  selectedSpheres: readonly string[],
  scopeMultiplier = 1,
  ocdiOnly = false,
): {
  dateLabels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor: string
    hoverBackgroundColor: string
  }[]
} {
  const pointCount = pulseSummaryPointCount(period)
  const dateLabels = pulseSummaryAxisLabels(period)
  const m = scopeMultiplier <= 0 ? 0 : scopeMultiplier
  const all = APPLICATION_SPHERE_CATEGORY_LABELS.map((label, i) => {
    const lo = 1200 + i * 400
    const hi = 2200 + i * 500
    const raw = smoothSeries(pointCount, 2.4 + i * 0.31, lo, hi)
    const scaledRaw = m > 0 ? raw.map((v) => Math.round(v * m)) : raw.map(() => 0)
    const data =
      metric === 'count'
        ? scaledRaw
        : scaledRaw.map((v) => Math.round(v * COST_SCALE * (1 + i * 0.012)))
    return {
      label,
      data,
      backgroundColor: chartColors[i % PALETTE_LEN]!,
      hoverBackgroundColor: chartHoverColors[i % PALETTE_LEN]!,
    }
  })
  const visible =
    selectedSpheres.length === 0
      ? all
      : all.filter((s) => selectedSpheres.includes(s.label))
  const datasets = applyOcdiOnlyToDatasets(visible, ocdiOnly)
  return { dateLabels, datasets }
}

export function problematicAssetsOverDates(
  period: PulseSummaryPeriod,
  metric: 'count' | 'cost',
  selectedProblems: readonly string[],
  scopeMultiplier = 1,
  ocdiOnly = false,
): {
  dateLabels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor: string
    hoverBackgroundColor: string
  }[]
} {
  const pointCount = pulseSummaryPointCount(period)
  const dateLabels = pulseSummaryAxisLabels(period)
  const m = scopeMultiplier <= 0 ? 0 : scopeMultiplier
  const all = PROBLEMATIC_OS_CATEGORY_LABELS.map((label, i) => {
    const lo = 95 + i * 70
    const hi = 420 + i * 180
    const raw = smoothSeries(pointCount, 3.1 + i * 0.45, lo, hi)
    const scaledRaw = m > 0 ? raw.map((v) => Math.round(v * m)) : raw.map(() => 0)
    const data =
      metric === 'count'
        ? scaledRaw
        : scaledRaw.map((v) => Math.round(v * COST_SCALE * (1 + i * 0.015)))
    return {
      label,
      data,
      backgroundColor: PROBLEM_BAR_COLORS[label] ?? chartColors[0]!,
      hoverBackgroundColor: PROBLEM_HOVER_COLORS[label] ?? chartHoverColors[0]!,
    }
  })
  const visible =
    selectedProblems.length === 0 ? all : all.filter((s) => selectedProblems.includes(s.label))
  const datasets = applyOcdiOnlyToDatasets(visible, ocdiOnly)
  return { dateLabels, datasets }
}
