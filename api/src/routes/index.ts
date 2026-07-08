import { Router } from 'express';
import { llmController } from '../controllers/llmController';

const router = Router();

router.post('/chat', llmController.chat);
router.post('/explain', llmController.explain);

export default router;