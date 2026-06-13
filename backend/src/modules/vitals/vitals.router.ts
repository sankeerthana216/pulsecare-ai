import { Router } from 'express';
import { VitalsController, addVitalsSchema } from './vitals.controller';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validation';

const router = Router();

// Manual vitals entry - require user session
router.post('/', requireAuth, validate(addVitalsSchema), VitalsController.recordVitals);

// IoT entry - accepts device auth token in headers or Bearer JWT token
router.post('/iot', validate(addVitalsSchema), VitalsController.recordIoTTelemetry);

// Paginated health readings history
router.get('/history', requireAuth, VitalsController.getHistory);

export default router;
