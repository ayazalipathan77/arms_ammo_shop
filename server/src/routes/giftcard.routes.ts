import { Router } from 'express';
import {
    purchaseGiftCard,
    getGiftCardByCode,
    redeemGiftCard,
    getUserGiftCards,
} from '../controllers/giftcard.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Public route - check gift card validity
router.get('/:code', getGiftCardByCode);

// Authenticated routes
router.post('/purchase', purchaseGiftCard); // Can be anonymous or authenticated
router.post('/redeem', authenticate, redeemGiftCard);
router.get('/user/my-cards', authenticate, getUserGiftCards);

export default router;
