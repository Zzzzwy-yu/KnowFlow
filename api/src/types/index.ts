export interface WordInfo {
  word: string;
  start: number;
  end: number;
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
  depth?: 'brief' | 'beginner' | 'professional' | 'academic';
}

export interface ChatResponse {
  id: string;
  content: string;
  words: WordInfo[];
  sessionId: string;
}

export interface ExplainRequest {
  word: string;
  context?: string;
}

export interface ExplainResponse {
  word: string;
  definition: string;
  examples: string[];
  relatedTerms: string[];
}

export type KnowledgeRelation = 'root' | 'prerequisite' | 'contains' | 'detail' | 'example' | 'comparison' | 'related';

export interface KnowledgeNodeSummary {
  id: string;
  parentId: string | null;
  title: string;
  content: string;
  tags?: string[];
}

export interface OrganizeKnowledgeRequest {
  title: string;
  content: string;
  preferredParentId?: string | null;
  nodes: KnowledgeNodeSummary[];
}

export interface KnowledgePlacement {
  parentId: string | null;
  relationType: KnowledgeRelation;
  reason: string;
  normalizedTitle: string;
  tags: string[];
  confidence: number;
}

export interface KnowledgeEdge {
  id: string;
  sourceId: string;
  targetId: string;
  type: Exclude<KnowledgeRelation, 'root'>;
  reason: string;
  confidence: number;
}

export interface DuplicateSuggestion {
  nodeIds: [string, string];
  reason: string;
  confidence: number;
}

export interface GraphProposal {
  placements: Record<string, KnowledgePlacement>;
  edges: KnowledgeEdge[];
  duplicates: DuplicateSuggestion[];
}

export interface MaterialKnowledgeItem {
  title: string;
  content: string;
  tags: string[];
  sourceExcerpt: string;
  parentIndex: number | null;
  relationType: KnowledgeRelation;
}

export interface MaterialImportResult {
  items: MaterialKnowledgeItem[];
  edges: Array<{ sourceIndex: number; targetIndex: number; type: Exclude<KnowledgeRelation, 'root'>; reason: string; confidence: number }>;
}
