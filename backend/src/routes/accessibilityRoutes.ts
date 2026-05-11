import { Router } from 'express';
import {
  createOrUpdateAccessibilityReview,
  getAccessibilitySummary,
  getMyAccessibilityReview,
} from '../controllers/accessibilityController';
import { auth } from '../middlewares/Auth';

const router = Router();

router.get('/:placeId', getAccessibilitySummary);
router.get('/:placeId/me', auth, getMyAccessibilityReview);
router.post('/:placeId', auth, createOrUpdateAccessibilityReview);

export default router;