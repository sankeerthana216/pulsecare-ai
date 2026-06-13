import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { GeminiService } from '../../services/gemini';
import { AppError } from '../../middleware/errorHandler';

// Chat request schema validation
export const chatSchema = z.object({
  body: z.object({
    messages: z.array(
      z.object({
        role: z.enum(['user', 'model']),
        parts: z.array(
          z.object({
            text: z.string().min(1, 'Message text is required'),
          })
        ),
      })
    ).min(1, 'At least one message is required'),
    language: z.string().min(2).max(10).default('en'),
  }),
});

export class ChatController {
  /**
   * Handle user symptom log chat messages and return clinical triage recommendations
   */
  public static async triageChat(req: Request, res: Response, next: NextFunction) {
    try {
      const { messages, language } = req.body;

      if (!req.user?.id) {
        throw new AppError('Unauthorized', 401);
      }

      // Generate triage recommendation from AI/fallback engine
      const aiResponse = await GeminiService.generateChatTriage(messages, language);

      res.status(200).json({
        role: 'model',
        parts: [{ text: aiResponse }],
      });
    } catch (error) {
      next(error);
    }
  }
}
