import { Router } from 'express';
import {
  createCheckIn,
  getMyCheckIns,
  getCheckInStatus,
  getPlaceCheckIns,
} from '../controllers/checkInController';
import { auth } from '../middlewares/Auth';

const router = Router();

router.post('/', auth, createCheckIn);

router.get('/me', auth, getMyCheckIns);

router.get('/status/:placeId', auth, getCheckInStatus);

router.get('/place/:placeId', getPlaceCheckIns);

export default router;