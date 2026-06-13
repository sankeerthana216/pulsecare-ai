import { Router } from 'express';
import { AnalyticsController } from './analytics.controller';
import { requireAuth } from '../../middleware/auth';

const router = Router();

router.use(requireAuth);

// Get historical aggregate data and health trends
router.get('/trends', AnalyticsController.getTrends);

// Export health telemetry as CSV or PDF report
router.get('/export', AnalyticsController.exportReport);

export default router;
