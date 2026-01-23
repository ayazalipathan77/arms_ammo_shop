import { Router } from 'express';
import { getShippingRates } from '../controllers/shipping.controller';

const router = Router();

// Public route for calculating rates (can be done before login in cart)
router.post('/rates', getShippingRates);

export default router;
