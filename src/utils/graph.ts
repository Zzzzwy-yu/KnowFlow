import type { TreeNode } from '../types/index.js';

export function wouldCreateCycle(nodes: Record<string, TreeNode>, nodeId: string, parentId: string | null): boolean {
  if (!parentId) return false;
  if (nodeId === parentId || !nodes[parentId]) return true;
  const seen = new Set<string>();
  let cursor: string | null = parentId;
  while (cursor) {
    if (cursor === nodeId || seen.has(cursor)) return true;
    seen.add(cursor);
    cursor = nodes[cursor]?.parentId ?? null;
  }
  return false;
}

export function normalizeParentMap(parentMap: Record<string, string | null>): Record<string, string | null> {
  const normalized = { ...parentMap };
  Object.keys(normalized).forEach((nodeId) => {
    const seen = new Set([nodeId]);
    let cursor = normalized[nodeId];
    while (cursor) {
      if (!(cursor in normalized) || seen.has(cursor)) {
        normalized[nodeId] = null;
        break;
      }
      seen.add(cursor);
      cursor = normalized[cursor];
    }
  });
  return normalized;
}
