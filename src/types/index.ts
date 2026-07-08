export interface WordInfo {
  word: string;
  start: number;
  end: number;
}

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  words?: WordInfo[];
  createdAt: Date;
}

export interface ChatResponse {
  id: string;
  content: string;
  words: WordInfo[];
  sessionId: string;
  definition?: string;
  examples?: string[];
  relatedTerms?: string[];
}

export interface ExplainRequest {
  word: string;
  context?: string;
}

export interface ExplainResponse {
  word: string;
  definition: string;
  content: string;
  words: WordInfo[];
  examples: string[];
  relatedTerms: string[];
}

export interface TreeNode {
  id: string;
  parentId: string | null;
  type: 'question' | 'explanation';
  title: string;
  content: string;
  words?: WordInfo[];
  children: string[];
  isExpanded: boolean;
  createdAt: Date;
  sessionId?: string;
  definition?: string;
  examples?: string[];
  relatedTerms?: string[];
}

export interface TreeState {
  nodes: Record<string, TreeNode>;
  rootId: string | null;
  activeNodeId: string | null;
  isLoading: boolean;
  sessionId: string | null;
  addNode: (node: TreeNode) => void;
  addChild: (parentId: string, node: TreeNode) => void;
  setRootId: (rootId: string | null) => void;
  setActiveNode: (nodeId: string | null) => void;
  toggleExpand: (nodeId: string) => void;
  setLoading: (loading: boolean) => void;
  setSessionId: (sessionId: string) => void;
  clearTree: () => void;
  getNode: (nodeId: string) => TreeNode | undefined;
  getChildren: (nodeId: string) => TreeNode[];
}

export interface ChatState {
  messages: ChatMessage[];
  sessionId: string | null;
  isLoading: boolean;
  addMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  setSessionId: (sessionId: string) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
}

export interface MiniWindowState {
  isOpen: boolean;
  word: string;
  definition: string;
  examples: string[];
  relatedTerms: string[];
  position: { x: number; y: number };
  open: (word: string, position: { x: number; y: number }) => void;
  close: () => void;
  setContent: (content: ExplainResponse) => void;
}