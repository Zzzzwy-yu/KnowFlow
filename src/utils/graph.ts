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

export interface LayeredLayout {
  width: number;
  height: number;
  positions: Map<string, { x: number; y: number }>;
  levels: Map<string, number>;
}

export function calculateLayeredLayout(nodes: Record<string, TreeNode>, availableWidth = 1200): LayeredLayout {
  const values = Object.values(nodes);
  const width = Math.max(640, Math.min(1600, availableWidth));
  const nodeWidth = 176;
  const columns = Math.max(2, Math.floor((width - 48) / (nodeWidth + 36)));
  const levels = new Map<string, number>();
  const getLevel = (id: string, seen = new Set<string>()): number => {
    if (levels.has(id)) return levels.get(id)!;
    if (seen.has(id)) return 0;
    seen.add(id);
    const parentId = nodes[id]?.parentId;
    const level = parentId && nodes[parentId] ? getLevel(parentId, seen) + 1 : 0;
    levels.set(id, level);
    return level;
  };
  values.forEach((node) => getLevel(node.id));
  const groups = new Map<number, TreeNode[]>();
  values.forEach((node) => {
    const level = levels.get(node.id) || 0;
    groups.set(level, [...(groups.get(level) || []), node]);
  });
  const positions = new Map<string, { x: number; y: number }>();
  let levelTop = 80;
  [...groups.keys()].sort((a, b) => a - b).forEach((level) => {
    const group = groups.get(level)!;
    group.sort((left, right) => {
      const leftParentX = left.parentId ? positions.get(left.parentId)?.x ?? 0 : 0;
      const rightParentX = right.parentId ? positions.get(right.parentId)?.x ?? 0 : 0;
      return leftParentX - rightParentX || left.title.localeCompare(right.title);
    });
    const rows = Math.ceil(group.length / columns);
    group.forEach((node, index) => {
      const row = Math.floor(index / columns);
      const rowStart = row * columns;
      const rowLength = Math.min(columns, group.length - rowStart);
      const column = index % columns;
      positions.set(node.id, { x: ((column + 1) * width) / (rowLength + 1), y: levelTop + row * 112 });
    });
    levelTop += Math.max(1, rows) * 112 + 72;
  });
  [...groups.keys()].sort((a, b) => b - a).forEach((level) => {
    for (const node of groups.get(level) || []) {
      const children = node.children.map((id) => positions.get(id)).filter((item): item is { x: number; y: number } => Boolean(item));
      const current = positions.get(node.id);
      if (current && children.length) {
        const center = children.reduce((sum, child) => sum + child.x, 0) / children.length;
        positions.set(node.id, { ...current, x: Math.max(nodeWidth / 2 + 16, Math.min(width - nodeWidth / 2 - 16, current.x * 0.6 + center * 0.4)) });
      }
    }
  });
  return { width, height: Math.max(480, levelTop + 30), positions, levels };
}
