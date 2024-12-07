import { Router } from 'express';
import {readLogData,deleteLogByType} from '../controllers/log.js';
import { ensureAuthenticated } from '../middleware/Middleware.js';
const router = Router();

router.get('/:type', ensureAuthenticated, readLogData);
router.delete('/:type',ensureAuthenticated,deleteLogByType)

export default router;