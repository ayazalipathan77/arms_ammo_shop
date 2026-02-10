import { Router } from 'express';
import {
    getProfile,
    updateProfile,
    addAddress,
    deleteAddress,
    getReferralCode,
    getReferralStats,
} from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.post('/addresses', authenticate, addAddress);
router.delete('/addresses/:id', authenticate, deleteAddress);

// Referral system
router.get('/referral/code', authenticate, getReferralCode);
router.get('/referral/stats', authenticate, getReferralStats);

export default router;
