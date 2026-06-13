import { Router } from 'express';
import { AlertsController } from './alerts.controller';
import { requireAuth } from '../../middleware/auth';

const router = Router();

router.use(requireAuth);

// Get list of alerts with filtering and pagination
router.get('/', AlertsController.getAlerts);

// Mark alert as resolved
router.put('/:id/resolve', AlertsController.resolveAlert);

export default router;
