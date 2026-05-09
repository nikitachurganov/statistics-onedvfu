export type DepartmentTreeNode = {
  title: string
  value: string
  key: string
  children?: DepartmentTreeNode[]
}

export function findDepartmentNode(
  nodes: DepartmentTreeNode[],
  value: string,
): DepartmentTreeNode | null {
  for (const node of nodes) {
    if (node.value === value) return node
    if (node.children?.length) {
      const found = findDepartmentNode(node.children, value)
      if (found) return found
    }
  }
  return null
}

export function flattenDepartmentTree(nodes: DepartmentTreeNode[]): DepartmentTreeNode[] {
  return nodes.flatMap((node) => [
    node,
    ...(node.children?.length ? flattenDepartmentTree(node.children) : []),
  ])
}
