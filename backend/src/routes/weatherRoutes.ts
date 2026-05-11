import { Router } from 'express';
import {
  getWeatherByCity,
  getWeatherForecastByCity,
} from '../controllers/weatherController';

const router = Router();

router.get('/', getWeatherByCity);
router.get('/forecast', getWeatherForecastByCity);

export default router;