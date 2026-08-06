import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeParentMap, wouldCreateCycle } from '../src/utils/graph.ts';
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
