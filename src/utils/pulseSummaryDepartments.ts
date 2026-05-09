/** Веса и константы для мок-агрегации KPI/графиков по id подразделений (данные дерева — `departments.json`). */

export type DepartmentNode = {
  id: string
  name: string
}

export const DEFAULT_ROOT_DEPARTMENT_ID = 'campus-directorate'

/** Стабильный вес подразделения для мок-агрегации (0..1). */
export function departmentWeight(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0
  }
  return 0.55 + (h % 45) / 100
}

export function scopeIntensityMultiplier(scopeIds: readonly string[]): number {
  if (scopeIds.length === 0) return 0
  const sum = scopeIds.reduce((s, id) => s + departmentWeight(id), 0)
  return Math.min(1.45, 0.32 + sum * 0.14)
}
