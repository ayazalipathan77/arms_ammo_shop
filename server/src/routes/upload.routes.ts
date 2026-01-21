import { Router } from 'express';
import { uploadImage } from '../controllers/upload.controller';
import { authenticate } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

// POST /api/upload - Upload an image (Authenticated users only)
router.post('/', authenticate, upload.single('image'), uploadImage);

export default router;
