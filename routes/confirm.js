import express from 'express';
import { verifyToken } from '../controllers/confirm.js';

const router = express.Router();

// Route for token confirmation
router.get('/confirm', verifyToken);

export default router;
