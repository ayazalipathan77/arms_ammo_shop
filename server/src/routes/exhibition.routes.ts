import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
    getExhibitions,
    getExhibitionById,
    createExhibition,
    updateExhibition,
    deleteExhibition,
} from '../controllers/exhibition.controller';

const router = Router();

router.get('/', getExhibitions);
router.get('/:id', getExhibitionById);

// Protected Admin Routes
router.post('/', authenticate, createExhibition);
router.put('/:id', authenticate, updateExhibition);
router.delete('/:id', authenticate, deleteExhibition);

export default router;
