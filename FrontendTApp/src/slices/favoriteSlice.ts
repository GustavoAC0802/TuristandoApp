import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type FavoritePlace = {
  _id: string;
  name: string;
  description: string;
  category: string;
  rating: number;
  address: string;
  openingHours?: string;
  contact?: string;
  images?: string[];
  distance?: number;
  latitude?: number;
  longitude?: number;
};

type FavoritesState = {
  items: FavoritePlace[];
};

const initialState: FavoritesState = {
  items: [],
};

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    addFavorite: (state, action: PayloadAction<FavoritePlace>) => {
      const alreadyExists = state.items.some(
        item => item._id === action.payload._id
      );

      if (!alreadyExists) {
        state.items.push(action.payload);
      }
    },

    removeFavorite: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item._id !== action.payload);
    },

    toggleFavorite: (state, action: PayloadAction<FavoritePlace>) => {
      const exists = state.items.some(item => item._id === action.payload._id);

      if (exists) {
        state.items = state.items.filter(item => item._id !== action.payload._id);
      } else {
        state.items.push(action.payload);
      }
    },

    clearFavorites: state => {
      state.items = [];
    },
  },
});

export const {
  addFavorite,
  removeFavorite,
  toggleFavorite,
  clearFavorites,
} = favoritesSlice.actions;

export default favoritesSlice.reducer;