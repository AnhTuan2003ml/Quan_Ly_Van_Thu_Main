import { Router } from 'express';
import { Login, Logout, getProfile,changePassword } from '../controllers/auth.js';
import { ensureAuthenticated } from '../middleware/Middleware.js';
const router = Router();
router.post('/login',Login);
router.get('/logout',Logout);
router.get('/profile',ensureAuthenticated,getProfile);
router.put('/:id', ensureAuthenticated, changePassword);
export default router;