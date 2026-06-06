import { Router } from 'express';
import { translateText } from '../controllers/translationController';

const router = Router();

router.post('/translate', translateText);

export default router;