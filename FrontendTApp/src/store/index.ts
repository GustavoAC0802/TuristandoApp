import { configureStore } from '@reduxjs/toolkit';

import authReducer from '../slices/authSlice';
import placesReducer from '../slices/placesSlice';
import favoriteReducer from '../slices/favoriteSlice';
import itineraryReducer from '../slices/itinerarySlice';
import themeReducer from '../slices/themeSlice';
import searchReducer from '../slices/searchSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    places: placesReducer,
    favorites: favoriteReducer,
    itinerary: itineraryReducer,
    theme: themeReducer,
    search: searchReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;