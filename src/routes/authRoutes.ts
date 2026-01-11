import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/login', authController.login);
router.post('/signup', authController.signup);

// Protected routes
router.get('/me', authMiddleware, authController.getCurrentUser);
router.patch('/profile', authMiddleware, authController.updateProfile);

export default router;
