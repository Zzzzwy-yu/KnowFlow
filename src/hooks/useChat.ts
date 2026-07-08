import { useTreeStore } from '@/store/chatStore';
import { chatApi } from '@/utils/apiClient';
import type { TreeNode } from '@/types';

const generateId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

export function useChat() {
  const { nodes, rootId, activeNodeId, isLoading, addNode, addChild, setRootId, setActiveNode, setLoading, setSessionId, clearTree, getNode } = useTreeStore();

  const sendMessage = async (input: string, parentNodeId?: string | null) => {
    if (!input.trim()) return;

    setLoading(true);

    try {
      const targetParentId = parentNodeId ?? null;

      const parentNode = targetParentId ? getNode(targetParentId) : null;
      const context = parentNode ? `${parentNode.title}: ${parentNode.content}` : undefined;

      const response = await chatApi.sendMessage(input.trim(), rootId ? nodes[rootId]?.sessionId : undefined, context);

      const questionNode: TreeNode = {
        id: generateId('question'),
        parentId: targetParentId,
        type: 'question',
        title: input.trim(),
        content: response.content,
        words: response.words,
        children: [],
        isExpanded: true,
        createdAt: new Date(),
        definition: response.definition,
        examples: response.examples,
        relatedTerms: response.relatedTerms,
      };

      addNode(questionNode);

      if (targetParentId) {
        addChild(targetParentId, questionNode);
      } else if (!rootId) {
        setRootId(questionNode.id);
      }

      setActiveNode(questionNode.id);

      if (!rootId) {
        setSessionId(response.sessionId);
      }
    } catch (error) {
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

    try {
      const response = await chatApi.explainWord(word, parentNode.content);

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
      };

      addChild(parentNodeId, explainNode);
      setActiveNode(explainNode.id);
    } catch {
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
  };
}