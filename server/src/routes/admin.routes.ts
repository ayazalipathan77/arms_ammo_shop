import { Router } from 'express';
import {
    getDashboardStats,
    getAllUsers,
    updateUserRole,
} from '../controllers/admin.controller';
import { authenticate, authorizeRole } from '../middleware/auth.middleware';

const router = Router();

// All routes require ADMIN role
router.use(authenticate, authorizeRole('ADMIN'));

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.put('/users/:id/role', updateUserRole);

export default router;
