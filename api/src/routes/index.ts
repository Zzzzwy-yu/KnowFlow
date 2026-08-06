import { Router } from 'express';
import { llmController } from '../controllers/llmController.js';

const router = Router();

router.post('/chat', llmController.chat);
router.post('/explain', llmController.explain);
router.post('/knowledge/organize', llmController.organize);
router.post('/knowledge/analyze-graph', llmController.analyzeGraph);
router.post('/knowledge/import-material', llmController.importMaterial);

export default router;
