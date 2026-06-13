import { Router } from 'express';
import { AuthController, signupSchema, loginSchema, refreshSchema } from './auth.controller';
import { validate } from '../../middleware/validation';

const router = Router();

router.post('/signup', validate(signupSchema), AuthController.signup);
router.post('/login', validate(loginSchema), AuthController.login);
router.post('/logout', AuthController.logout);
router.post('/refresh', validate(refreshSchema), AuthController.refresh);

export default router;
