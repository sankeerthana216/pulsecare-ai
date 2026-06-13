import { Router } from 'express';
import { ProfileController, updateProfileSchema } from './profile.controller';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validation';

const router = Router();

router.use(requireAuth);

router.get('/', ProfileController.getProfile);
router.put('/', validate(updateProfileSchema), ProfileController.updateProfile);

export default router;
