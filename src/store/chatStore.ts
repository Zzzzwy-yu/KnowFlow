import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TreeState, ChatState, MiniWindowState } from '@/types';
import { normalizeParentMap, wouldCreateCycle } from '@/utils/graph';

interface PersistedTreeState {
  nodes: TreeState['nodes'];
  rootId: TreeState['rootId'];
  activeNodeId: TreeState['activeNodeId'];
  sessionId: TreeState['sessionId'];
  edges?: TreeState['edges'];
}

export const useTreeStore = create<TreeState>()(
  persist(
    (set, get) => ({
      nodes: {},
      edges: [],
      previousGraph: null,
      nextGraph: null,
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
          edges: [],
          previousGraph: null,
          nextGraph: null,
        }),

      updateNode: (nodeId, updates) =>
        set((state) => {
          const node = state.nodes[nodeId];
          if (!node) return state;
          return { nodes: { ...state.nodes, [nodeId]: { ...node, ...updates } } };
        }),

      deleteNode: (nodeId) =>
        set((state) => {
          if (!state.nodes[nodeId]) return state;
          const ids = new Set<string>();
          const collect = (id: string) => {
            ids.add(id);
            state.nodes[id]?.children.forEach(collect);
          };
          collect(nodeId);
          const nodes = Object.fromEntries(
            Object.entries(state.nodes)
              .filter(([id]) => !ids.has(id))
              .map(([id, node]) => [id, { ...node, children: node.children.filter((childId) => !ids.has(childId)) }])
          );
          const activeNodeId = state.activeNodeId && ids.has(state.activeNodeId) ? null : state.activeNodeId;
          const rootId = state.rootId && ids.has(state.rootId)
            ? Object.values(nodes).find((node) => node.parentId === null)?.id ?? null
            : state.rootId;
          return { nodes, edges: state.edges.filter((edge) => !ids.has(edge.sourceId) && !ids.has(edge.targetId)), activeNodeId, rootId };
        }),

      replaceTree: (nodes, edges = []) => {
        const normalizedNodes = Object.fromEntries(
          Object.entries(nodes).map(([id, node]) => [id, { ...node, createdAt: new Date(node.createdAt) }])
        );
        const rootId = Object.values(normalizedNodes).find((node) => node.parentId === null)?.id ?? null;
        set({ nodes: normalizedNodes, edges: edges.filter((edge) => normalizedNodes[edge.sourceId] && normalizedNodes[edge.targetId]), previousGraph: null, nextGraph: null, rootId, activeNodeId: rootId, sessionId: null, isLoading: false });
      },

      moveNode: (nodeId, parentId) => {
        const state = get();
        const node = state.nodes[nodeId];
        if (!node || wouldCreateCycle(state.nodes, nodeId, parentId)) return false;
        set((current) => {
          const nodes = { ...current.nodes };
          if (node.parentId && nodes[node.parentId]) {
            nodes[node.parentId] = { ...nodes[node.parentId], children: nodes[node.parentId].children.filter((id) => id !== nodeId) };
          }
          if (parentId && nodes[parentId]) {
            nodes[parentId] = { ...nodes[parentId], children: [...new Set([...nodes[parentId].children, nodeId])], isExpanded: true };
          }
          nodes[nodeId] = { ...node, parentId, relationType: parentId ? node.relationType === 'root' ? 'related' : node.relationType : 'root' };
          return { nodes, rootId: Object.values(nodes).find((item) => item.parentId === null)?.id ?? null };
        });
        return true;
      },

      applyGraphProposal: (proposal) =>
        set((state) => {
          const safeParents = normalizeParentMap(Object.fromEntries(Object.keys(state.nodes).map((id) => [id, proposal.placements[id]?.parentId && state.nodes[proposal.placements[id].parentId!] ? proposal.placements[id].parentId : null])));
          const nextNodes: Record<string, typeof state.nodes[string]> = Object.fromEntries(Object.entries(state.nodes).map(([id, node]) => {
            const placement = proposal.placements[id];
            return [id, { ...node, parentId: safeParents[id], children: [] as string[], relationType: safeParents[id] ? placement?.relationType || node.relationType : 'root', relationReason: placement?.reason || node.relationReason, title: placement?.normalizedTitle || node.title, tags: placement?.tags?.length ? placement.tags : node.tags }];
          }));
          Object.values(nextNodes).forEach((node) => {
            if (node.parentId && nextNodes[node.parentId]) nextNodes[node.parentId].children.push(node.id);
          });
          return {
            previousGraph: { nodes: state.nodes, edges: state.edges },
            nextGraph: null,
            nodes: nextNodes,
            edges: proposal.edges.filter((edge) => nextNodes[edge.sourceId] && nextNodes[edge.targetId] && edge.sourceId !== edge.targetId),
            rootId: Object.values(nextNodes).find((node) => node.parentId === null)?.id ?? null,
          };
        }),

      undoGraphChange: () =>
        set((state) => state.previousGraph ? {
          nextGraph: { nodes: state.nodes, edges: state.edges },
          nodes: state.previousGraph.nodes,
          edges: state.previousGraph.edges,
          previousGraph: null,
          rootId: Object.values(state.previousGraph.nodes).find((node) => node.parentId === null)?.id ?? null,
        } : state),

      redoGraphChange: () =>
        set((state) => state.nextGraph ? {
          previousGraph: { nodes: state.nodes, edges: state.edges },
          nodes: state.nextGraph.nodes,
          edges: state.nextGraph.edges,
          nextGraph: null,
          rootId: Object.values(state.nextGraph.nodes).find((node) => node.parentId === null)?.id ?? null,
        } : state),

      mergeNodes: (keepId, removeId) => {
        const state = get();
        const keep = state.nodes[keepId];
        const remove = state.nodes[removeId];
        if (!keep || !remove || keepId === removeId) return false;
        set((current) => {
          const nodes = { ...current.nodes };
          nodes[keepId] = {
            ...keep,
            content: keep.content.length >= remove.content.length ? keep.content : remove.content,
            tags: [...new Set([...(keep.tags || []), ...(remove.tags || [])])],
            relatedTerms: [...new Set([...(keep.relatedTerms || []), ...(remove.relatedTerms || [])])],
            children: [...new Set([...keep.children, ...remove.children])].filter((id) => id !== keepId),
          };
          delete nodes[removeId];
          Object.entries(nodes).forEach(([id, node]) => {
            nodes[id] = { ...node, parentId: node.parentId === removeId ? keepId : node.parentId, children: node.children.map((childId) => childId === removeId ? keepId : childId).filter((childId, index, all) => childId !== id && all.indexOf(childId) === index) };
          });
          const edges = current.edges.map((edge) => ({ ...edge, sourceId: edge.sourceId === removeId ? keepId : edge.sourceId, targetId: edge.targetId === removeId ? keepId : edge.targetId })).filter((edge, index, all) => edge.sourceId !== edge.targetId && all.findIndex((item) => item.sourceId === edge.sourceId && item.targetId === edge.targetId && item.type === edge.type) === index);
          return { nodes, edges, activeNodeId: current.activeNodeId === removeId ? keepId : current.activeNodeId };
        });
        return true;
      },

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
        edges: state.edges,
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
          edges: state?.edges || currentState.edges,
          previousGraph: null,
          nextGraph: null,
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
