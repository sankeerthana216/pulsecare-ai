import { Router } from 'express';
import { UsersController } from './users.controller';
import { requireAuth, requireRoles } from '../../middleware/auth';

const router = Router();

router.use(requireAuth);

// List patients (restricted to doctors and admins)
router.get('/', requireRoles('DOCTOR', 'ADMIN'), UsersController.getUsers);

// Get specific patient (accessible by self, doctor, or admin)
router.get('/:id', UsersController.getUserById);

export default router;
