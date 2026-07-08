export interface WordInfo {
  word: string;
  start: number;
  end: number;
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
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