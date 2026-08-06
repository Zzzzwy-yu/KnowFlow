import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateLayeredLayout, normalizeParentMap, wouldCreateCycle } from '../src/utils/graph.ts';
import type { TreeNode } from '../src/types/index.ts';

const node = (id: string, parentId: string | null): TreeNode => ({ id, parentId, type: 'question', title: id, content: id, children: [], isExpanded: true, createdAt: new Date() });

test('wouldCreateCycle rejects moving a parent below its descendant', () => {
  const nodes = { a: node('a', null), b: node('b', 'a'), c: node('c', 'b') };
  assert.equal(wouldCreateCycle(nodes, 'a', 'c'), true);
  assert.equal(wouldCreateCycle(nodes, 'c', 'a'), false);
});

test('normalizeParentMap removes cycles and missing parents', () => {
  const normalized = normalizeParentMap({ a: 'b', b: 'a', c: 'missing', d: null });
  assert.equal(normalized.a, null);
  assert.equal(normalized.c, null);
  assert.equal(normalized.d, null);
});

test('layered layout wraps a wide level inside the configured canvas', () => {
  const nodes: Record<string, TreeNode> = { root: { ...node('root', null), children: [] } };
  for (let index = 0; index < 20; index += 1) {
    const id = `child-${index}`;
    nodes[id] = node(id, 'root');
    nodes.root.children.push(id);
  }
  const layout = calculateLayeredLayout(nodes, 900);
  assert.equal(layout.width, 900);
  assert.ok([...layout.positions.values()].every((point) => point.x >= 0 && point.x <= 900));
  assert.ok(layout.height > 500, 'wide levels should wrap into additional rows');
});
