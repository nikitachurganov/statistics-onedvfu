export const NO_MOL_LABEL = 'Нет МОЛ' as const

export interface DeptMolTableRow {
  key: string
  department: string
  mol: string
  totalCount: number
  totalCost: number
  ocdiCount: number
  ocdiCost: number
}

export interface LocationTableRow {
  key: string
  department: string
  mol: string
  totalAssets: number
  inRoom: number
  withUser: number
  unknown: number
}

export function formatCountRu(n: number): string {
  return `${Math.round(n).toLocaleString('ru-RU')} ед.`
}

export function formatCostRu(n: number): string {
  return `${Math.round(n).toLocaleString('ru-RU')} ₽`
}

/** Deterministic mock rows (Подразделение × МОЛ). */
export const DEPT_MOL_TABLE_MOCK: DeptMolTableRow[] = [
  {
    key: 'dm-1',
    department: 'Дирекция кампуса',
    mol: 'Иванов И.И.',
    totalCount: 142,
    totalCost: 52_340_000,
    ocdiCount: 31,
    ocdiCost: 14_180_000,
  },
  {
    key: 'dm-2',
    department: 'Дирекция кампуса',
    mol: 'Петров П.П.',
    totalCount: 96,
    totalCost: 38_910_000,
    ocdiCount: 12,
    ocdiCost: 6_050_000,
  },
  {
    key: 'dm-3',
    department: 'Дирекция кампуса',
    mol: NO_MOL_LABEL,
    totalCount: 54,
    totalCost: 19_720_000,
    ocdiCount: 8,
    ocdiCost: 3_410_000,
  },
  {
    key: 'dm-4',
    department: 'Инженерная служба',
    mol: 'Иванов И.И.',
    totalCount: 218,
    totalCost: 71_560_000,
    ocdiCount: 44,
    ocdiCost: 18_920_000,
  },
  {
    key: 'dm-5',
    department: 'Инженерная служба',
    mol: 'Петров П.П.',
    totalCount: 183,
    totalCost: 64_080_000,
    ocdiCount: 29,
    ocdiCost: 11_740_000,
  },
  {
    key: 'dm-6',
    department: 'Инженерная служба',
    mol: NO_MOL_LABEL,
    totalCount: 67,
    totalCost: 24_450_000,
    ocdiCount: 11,
    ocdiCost: 5_030_000,
  },
  {
    key: 'dm-7',
    department: 'Школа биомедицины',
    mol: 'Иванов И.И.',
    totalCount: 311,
    totalCost: 124_900_000,
    ocdiCount: 72,
    ocdiCost: 36_520_000,
  },
  {
    key: 'dm-8',
    department: 'Школа биомедицины',
    mol: 'Петров П.П.',
    totalCount: 274,
    totalCost: 108_730_000,
    ocdiCount: 58,
    ocdiCost: 28_910_000,
  },
  {
    key: 'dm-9',
    department: 'Школа биомедицины',
    mol: NO_MOL_LABEL,
    totalCount: 88,
    totalCost: 33_610_000,
    ocdiCount: 15,
    ocdiCost: 7_820_000,
  },
  {
    key: 'dm-10',
    department: 'Школа цифровой экономики',
    mol: 'Иванов И.И.',
    totalCount: 198,
    totalCost: 89_040_000,
    ocdiCount: 41,
    ocdiCost: 21_630_000,
  },
  {
    key: 'dm-11',
    department: 'Школа цифровой экономики',
    mol: 'Петров П.П.',
    totalCount: 165,
    totalCost: 76_520_000,
    ocdiCount: 36,
    ocdiCost: 17_090_000,
  },
  {
    key: 'dm-12',
    department: 'Школа цифровой экономики',
    mol: NO_MOL_LABEL,
    totalCount: 72,
    totalCost: 28_940_000,
    ocdiCount: 9,
    ocdiCost: 4_110_000,
  },
]

function clampNonNegative(n: number): number {
  return Math.max(0, Math.round(n))
}

/** Same departments/MОЛ as table 1; counts reconcile to totalAssets. */
export const LOCATION_TABLE_MOCK: LocationTableRow[] = DEPT_MOL_TABLE_MOCK.map((r, i) => {
  const totalAssets = r.totalCount
  let unknown =
    r.mol === NO_MOL_LABEL ? clampNonNegative(totalAssets * 0.11 + (i % 5)) : i % 6 === 0 ? 9 + (i % 4) : 0
  let withUser = clampNonNegative(totalAssets * 0.29 + (i % 3))
  let inRoom = totalAssets - withUser - unknown
  if (inRoom < 0) {
    const deficit = -inRoom
    unknown = clampNonNegative(unknown - deficit)
    inRoom = totalAssets - withUser - unknown
    if (inRoom < 0) {
      withUser = clampNonNegative(withUser + inRoom)
      inRoom = totalAssets - withUser - unknown
    }
  }
  return {
    key: `loc-${r.key}`,
    department: r.department,
    mol: r.mol,
    totalAssets,
    inRoom,
    withUser,
    unknown,
  }
})

const DEFAULT_DETAIL_PAGE_SIZE = 10

/** Строки текущей страницы (после sort/filter в таблице) — для rowSpan по подразделению. */
export function sliceTablePage<T>(
  full: readonly T[],
  pagination: { current?: number; pageSize?: number },
): T[] {
  const pageSize = Number(pagination.pageSize ?? DEFAULT_DETAIL_PAGE_SIZE)
  const current = Number(pagination.current ?? 1)
  const start = Math.max(0, (current - 1) * pageSize)
  return full.slice(start, start + pageSize) as T[]
}

export function departmentRowSpanProps<T extends { department: string }>(
  pageRows: readonly T[],
  rowIndex: number,
): { rowSpan: number } | Record<string, never> {
  const row = pageRows[rowIndex]
  if (!row) return {}
  if (rowIndex > 0 && pageRows[rowIndex - 1]!.department === row.department) {
    return { rowSpan: 0 }
  }
  let span = 1
  for (let i = rowIndex + 1; i < pageRows.length; i++) {
    if (pageRows[i]!.department === row.department) span++
    else break
  }
  return { rowSpan: span }
}
