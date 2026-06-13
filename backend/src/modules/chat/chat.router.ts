import { Router } from 'express';
import { ChatController, chatSchema } from './chat.controller';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validation';

const router = Router();

// Symptoms checker chatbot endpoint
router.post('/', requireAuth, validate(chatSchema), ChatController.triageChat);

export default router;
