import { Router } from 'express';
import {
  createReview,
  deleteReview,
  getReviewsByPlace,
  updateReview,
} from '../controllers/reviewController';
import { auth } from '../middlewares/Auth';

const router = Router();

router.get('/:placeId', auth, getReviewsByPlace);
router.post('/:placeId', auth, createReview);
router.put('/:reviewId', auth, updateReview);
router.delete('/:reviewId', auth, deleteReview);

export default router;