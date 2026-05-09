import { chartColors } from '@/shared/chart/chartOptions'

/** Минимальный тип для разметки легенды (избегаем конфликтов generics Chart.js). */
export type LegendSourceDataset = {
  label?: string
  backgroundColor?: unknown
  borderColor?: unknown
}

export function chartDatasetsToLegendItems(
  datasets?: readonly LegendSourceDataset[] | null,
): { label: string; color: string }[] {
  if (!datasets?.length) return []
  return datasets.map((d, i) => {
    const label = String(d.label ?? `Series ${i + 1}`)
    let color: string = chartColors[0] as string
    const bg = d.backgroundColor
    const br = d.borderColor
    if (typeof bg === 'string') color = bg
    else if (typeof br === 'string') color = br
    return { label, color }
  })
}
