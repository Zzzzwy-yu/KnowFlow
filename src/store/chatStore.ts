import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TreeState, ChatState, MiniWindowState } from '@/types';

interface PersistedTreeState {
  nodes: TreeState['nodes'];
  rootId: TreeState['rootId'];
  activeNodeId: TreeState['activeNodeId'];
  sessionId: TreeState['sessionId'];
}

export const useTreeStore = create<TreeState>()(
  persist(
    (set, get) => ({
      nodes: {},
      rootId: null,
      activeNodeId: null,
      isLoading: false,
      sessionId: null,

      addNode: (node) =>
        set((state) => ({
          nodes: { ...state.nodes, [node.id]: node },
        })),

      addChild: (parentId, node) =>
        set((state) => {
          const parent = state.nodes[parentId];
          if (!parent) return state;

          return {
            nodes: {
              ...state.nodes,
              [node.id]: node,
              [parentId]: {
                ...parent,
                children: [...parent.children, node.id],
                isExpanded: true,
              },
            },
          };
        }),

      setRootId: (rootId: string | null) =>
        set({
          rootId,
        }),

      setActiveNode: (nodeId) =>
        set({
          activeNodeId: nodeId,
        }),

      toggleExpand: (nodeId) =>
        set((state) => {
          const node = state.nodes[nodeId];
          if (!node) return state;

          return {
            nodes: {
              ...state.nodes,
              [nodeId]: {
                ...node,
                isExpanded: !node.isExpanded,
              },
            },
          };
        }),

      setLoading: (loading) =>
        set({
          isLoading: loading,
        }),

      setSessionId: (sessionId) =>
        set({
          sessionId,
        }),

      clearTree: () =>
        set({
          nodes: {},
          rootId: null,
          activeNodeId: null,
          sessionId: null,
        }),

      getNode: (nodeId) => {
        const { nodes } = get();
        return nodes[nodeId];
      },

      getChildren: (nodeId) => {
        const { nodes } = get();
        const node = nodes[nodeId];
        if (!node) return [];
        return node.children.map((childId) => nodes[childId]).filter(Boolean);
      },
    }),
    {
      name: 'foolproof-tutorial-tree',
      partialize: (state) => ({
        nodes: state.nodes,
        rootId: state.rootId,
        activeNodeId: state.activeNodeId,
        sessionId: state.sessionId,
      }),
      merge: (persistedState, currentState) => {
        const state = persistedState as PersistedTreeState | undefined;
        return {
          ...currentState,
          ...state,
          nodes: state?.nodes || currentState.nodes,
          isLoading: false,
        };
      },
    }
  )
);

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  sessionId: null,
  isLoading: false,

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  setMessages: (messages) =>
    set({
      messages,
    }),

  setSessionId: (sessionId) =>
    set({
      sessionId,
    }),

  setLoading: (loading) =>
    set({
      isLoading: loading,
    }),

  clearMessages: () =>
    set({
      messages: [],
      sessionId: null,
    }),
}));

export const useMiniWindowStore = create<MiniWindowState>((set) => ({
  isOpen: false,
  word: '',
  definition: '',
  examples: [],
  relatedTerms: [],
  position: { x: 0, y: 0 },

  open: (word, position) =>
    set({
      isOpen: true,
      word,
      definition: '加载中...',
      examples: [],
      relatedTerms: [],
      position,
    }),

  close: () =>
    set({
      isOpen: false,
    }),

  setContent: (content) =>
    set({
      definition: content.definition,
      examples: content.examples,
      relatedTerms: content.relatedTerms,
    }),
}));
