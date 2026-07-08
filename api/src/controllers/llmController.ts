import { Request, Response } from 'express';
import { llmService } from '../services/llmService';

export const llmController = {
  async chat(req: Request, res: Response) {
    try {
      const { message, sessionId, context } = req.body;

      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      const response = await llmService.getChatResponse(message, sessionId, context);

      res.json({
        id: `chat-${Date.now()}`,
        content: response.content,
        words: response.words,
        sessionId: response.sessionId,
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async explain(req: Request, res: Response) {
    try {
      const { word, context } = req.body;

      if (!word) {
        return res.status(400).json({ error: 'Word is required' });
      }

      const response = await llmService.getWordExplanation(word, context);

      res.json(response);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};