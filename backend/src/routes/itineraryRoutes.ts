import { Router } from 'express';

import {
  addPlaceToItinerary,
  createItinerary,
  createOrGetCurrentItinerary,
  deleteItinerary,
  getItineraryById,
  getMyItineraries,
  removePlaceFromItinerary,
  reorderItineraryPlaces,
  updateItinerary,
} from '../controllers/itineraryController';

import { auth } from '../middlewares/Auth';

const router = Router();

router.use(auth);

router.post('/', createItinerary);

router.get('/my', getMyItineraries);

router.get('/current', createOrGetCurrentItinerary);

router.get('/:id', getItineraryById);

router.put('/:id', updateItinerary);

router.delete('/:id', deleteItinerary);

router.post('/:id/places', addPlaceToItinerary);

router.delete('/:id/places/:placeId', removePlaceFromItinerary);

router.put('/:id/reorder', reorderItineraryPlaces);

export default router;