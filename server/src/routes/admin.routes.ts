import { Router } from 'express';
import {
    getDashboardStats,
    getAllUsers,
    updateUserRole,
    deleteUser,
    getPendingArtists,
    approveArtist,
    rejectArtist,
} from '../controllers/admin.controller';
import { authenticate, authorizeRole } from '../middleware/auth.middleware';

const router = Router();

// All routes require ADMIN role
router.use(authenticate, authorizeRole('ADMIN'));

// Dashboard
router.get('/stats', getDashboardStats);

// Users Management
router.get('/users', getAllUsers);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

// Artist Approval
router.get('/artists/pending', getPendingArtists);
router.put('/artists/:id/approve', approveArtist);
router.put('/artists/:id/reject', rejectArtist);

export default router;
