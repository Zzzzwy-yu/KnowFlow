import { Request, Response } from 'express';
import { llmService } from '../services/llmService.js';

export const llmController = {
  async importMaterial(req: Request, res: Response) {
    const { title, content } = req.body;
    if (typeof title !== 'string' || typeof content !== 'string' || !title.trim() || !content.trim()) return res.status(400).json({ error: 'Title and content are required' });
    if (title.length > 200 || content.length > 100000) return res.status(413).json({ error: 'Material is too large' });
    try {
      return res.json(await llmService.extractMaterial(title.trim(), content));
    } catch {
      return res.status(500).json({ error: 'Material extraction failed' });
    }
  },

  async analyzeGraph(req: Request, res: Response) {
    const { nodes } = req.body;
    if (!Array.isArray(nodes) || nodes.length < 2 || nodes.length > 120) return res.status(400).json({ error: 'Graph analysis requires 2-120 nodes' });
    if (nodes.some((node) => !node || typeof node.id !== 'string' || typeof node.title !== 'string' || typeof node.content !== 'string')) return res.status(400).json({ error: 'Invalid graph node' });
    try {
      return res.json(await llmService.analyzeKnowledgeGraph(nodes));
    } catch {
      return res.status(500).json({ error: 'Graph analysis failed' });
    }
  },

  async organize(req: Request, res: Response) {
    try {
      const { title, content, preferredParentId, nodes } = req.body;
      if (typeof title !== 'string' || typeof content !== 'string' || !Array.isArray(nodes)) {
        return res.status(400).json({ error: 'Invalid knowledge placement request' });
      }
      if (title.length > 200 || content.length > 20000 || nodes.length > 500) {
        return res.status(413).json({ error: 'Knowledge placement request is too large' });
      }
      const placement = await llmService.organizeKnowledge({ title, content, preferredParentId, nodes });
      return res.json(placement);
    } catch {
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  async chat(req: Request, res: Response) {
    try {
      const { message, sessionId, context, depth } = req.body;

      if (typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({ error: 'Message is required' });
      }
      if (message.length > 10000 || (typeof context === 'string' && context.length > 30000)) {
        return res.status(413).json({ error: 'Chat request is too large' });
      }

      const allowedDepths = ['brief', 'beginner', 'professional', 'academic'];
      const selectedDepth = allowedDepths.includes(depth) ? depth : 'beginner';
      const startedAt = Date.now();
      const response = await llmService.getChatResponse(message, sessionId, context, selectedDepth);

      res.json({
        id: `chat-${Date.now()}`,
        content: response.content,
        words: response.words,
        sessionId: response.sessionId,
        provider: response.provider,
        durationMs: Date.now() - startedAt,
        estimatedTokens: Math.ceil(response.content.length / 2.5),
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async explain(req: Request, res: Response) {
    try {
      const { word, context } = req.body;

      if (typeof word !== 'string' || !word.trim()) {
        return res.status(400).json({ error: 'Word is required' });
      }
      if (word.length > 200 || (typeof context === 'string' && context.length > 30000)) {
        return res.status(413).json({ error: 'Explain request is too large' });
      }

      const response = await llmService.getWordExplanation(word, context);

      res.json(response);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};
