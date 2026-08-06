import { useTreeStore } from '@/store/chatStore';
import { chatApi } from '@/utils/apiClient';
import type { KnowledgePlacement, TreeNode } from '@/types';
import { useState } from 'react';

const generateId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

const fallbackPlacement = (title: string, content: string, nodes: Record<string, TreeNode>, preferredParentId?: string | null): KnowledgePlacement => {
  const terms = new Set((`${title} ${content}`).toLowerCase().match(/[\u4e00-\u9fff]{2,6}|[a-z0-9+#.-]{2,}/g) || []);
  const best = Object.values(nodes).reduce<{ id: string; score: number } | null>((currentBest, node) => {
    const nodeTerms = new Set((`${node.title} ${node.content} ${(node.tags || []).join(' ')}`).toLowerCase().match(/[\u4e00-\u9fff]{2,6}|[a-z0-9+#.-]{2,}/g) || []);
    let score = node.id === preferredParentId ? 1.5 : 0;
    terms.forEach((term) => { if (nodeTerms.has(term)) score += 1; });
    return !currentBest || score > currentBest.score ? { id: node.id, score } : currentBest;
  }, null);
  const parentId = best && best.score >= 1.5 ? best.id : null;
  return {
    parentId,
    relationType: parentId ? 'related' : 'root',
    reason: parentId ? '离线模式下根据语义关键词自动归类' : '暂未发现明确的上位知识点',
    normalizedTitle: title,
    tags: [...terms].slice(0, 5),
    confidence: parentId ? 0.55 : 0.35,
  };
};

export function useChat() {
  const [error, setError] = useState<string | null>(null);
  const { nodes, rootId, activeNodeId, isLoading, addNode, addChild, setRootId, setActiveNode, setLoading, setSessionId, clearTree, getNode } = useTreeStore();

  const sendMessage = async (input: string, parentNodeId?: string | null) => {
    if (!input.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const targetParentId = parentNodeId ?? null;

      const parentNode = targetParentId ? getNode(targetParentId) : null;
      const context = parentNode ? `${parentNode.title}: ${parentNode.content}` : undefined;

      const response = await chatApi.sendMessage(input.trim(), rootId ? nodes[rootId]?.sessionId : undefined, context);
      if (response.isFallback) setError('后端或模型暂时不可用，本次展示的是本地离线内容。');

      const placement = await chatApi.organizeKnowledge(input.trim(), response.content, nodes, targetParentId)
        || fallbackPlacement(input.trim(), response.content, nodes, targetParentId);
      const resolvedParentId = placement.parentId && nodes[placement.parentId] ? placement.parentId : null;
      const questionNode: TreeNode = {
        id: generateId('question'),
        parentId: resolvedParentId,
        type: 'question',
        title: placement.normalizedTitle || input.trim(),
        content: response.content,
        words: response.words,
        children: [],
        isExpanded: true,
        createdAt: new Date(),
        definition: response.definition,
        examples: response.examples,
        relatedTerms: response.relatedTerms,
        relationType: placement.relationType,
        relationReason: placement.reason,
        tags: placement.tags,
        provider: response.provider,
        isFallback: response.isFallback,
      };

      if (resolvedParentId) {
        addChild(resolvedParentId, questionNode);
      } else {
        addNode(questionNode);
      }
      if (!rootId) {
        setRootId(questionNode.id);
      }

      setActiveNode(questionNode.id);

      if (!rootId) {
        setSessionId(response.sessionId);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : '请求失败，请稍后重试。');
      const targetParentId = parentNodeId ?? null;

      const questionNode: TreeNode = {
        id: generateId('question'),
        parentId: targetParentId,
        type: 'question',
        title: input.trim(),
        content: '抱歉，发生了一些错误，请稍后重试。',
        words: [],
        children: [],
        isExpanded: true,
        createdAt: new Date(),
      };

      addNode(questionNode);

      if (targetParentId) {
        addChild(targetParentId, questionNode);
      } else if (!rootId) {
        setRootId(questionNode.id);
      }

      setActiveNode(questionNode.id);
    } finally {
      setLoading(false);
    }
  };

  const explainWord = async (word: string, parentNodeId: string) => {
    if (!parentNodeId) return;

    const parentNode = getNode(parentNodeId);
    if (!parentNode) return;

    setLoading(true);
    setError(null);

    try {
      const response = await chatApi.explainWord(word, parentNode.content);
      if (response.isFallback) setError('词语解释已降级为本地离线内容。');

      const explainNode: TreeNode = {
        id: generateId('explain'),
        parentId: parentNodeId,
        type: 'explanation',
        title: word,
        content: response.content,
        words: response.words || [],
        children: [],
        isExpanded: true,
        createdAt: new Date(),
        definition: response.definition,
        examples: response.examples,
        relatedTerms: response.relatedTerms,
        relationType: 'detail',
        relationReason: `“${word}”是当前知识点中可进一步展开的概念`,
        tags: [word],
        provider: response.provider,
        isFallback: response.isFallback,
      };

      addChild(parentNodeId, explainNode);
      setActiveNode(explainNode.id);
    } catch {
      setError('词语解释请求失败，请稍后重试。');
      const explainNode: TreeNode = {
        id: generateId('explain'),
        parentId: parentNodeId,
        type: 'explanation',
        title: word,
        content: `抱歉，无法获取"${word}"的解释。`,
        words: [],
        children: [],
        isExpanded: true,
        createdAt: new Date(),
        definition: undefined,
        examples: undefined,
        relatedTerms: undefined,
      };

      addChild(parentNodeId, explainNode);
      setActiveNode(explainNode.id);
    } finally {
      setLoading(false);
    }
  };

  return {
    nodes,
    rootId,
    activeNodeId,
    isLoading,
    sendMessage,
    explainWord,
    clearTree,
    setActiveNode,
    getNode,
    error,
    clearError: () => setError(null),
  };
}
