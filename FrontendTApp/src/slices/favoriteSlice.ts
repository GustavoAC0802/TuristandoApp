import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../services/api';

export type FavoritePlace = {
  _id: string;
  name: string;
  description: string;
  categories: string[];
  address: string;
  openingHours?: string;
  contact?: string;
  website?: string;
  images?: string[];
  distance?: number;
  location?: {
    type: string;
    coordinates: number[];
  };
};

type FavoritesState = {
  items: FavoritePlace[];
  loading: boolean;
  error: string | null;
};

const initialState: FavoritesState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchFavorites = createAsyncThunk(
  'favorites/fetchFavorites',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/favorites');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Erro ao carregar favoritos'
      );
    }
  }
);

export const addFavorite = createAsyncThunk(
  'favorites/addFavorite',
  async (place: FavoritePlace, { rejectWithValue }) => {
    try {
      await api.post('/favorites', {
        placeId: place._id,
      });

      return place;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Erro ao favoritar local'
      );
    }
  }
);

export const removeFavorite = createAsyncThunk(
  'favorites/removeFavorite',
  async (placeId: string, { rejectWithValue }) => {
    try {
      await api.delete(`/favorites/${placeId}`);
      return placeId;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Erro ao remover favorito'
      );
    }
  }
);

export const toggleFavorite = createAsyncThunk(
  'favorites/toggleFavorite',
  async (place: FavoritePlace, { getState, dispatch }) => {
    const state: any = getState();

    const exists = state.favorites.items.some(
      (item: FavoritePlace) => item._id === place._id
    );

    if (exists) {
      await dispatch(removeFavorite(place._id));
      return {
        action: 'removed',
        place,
      };
    }

    await dispatch(addFavorite(place));
    return {
      action: 'added',
      place,
    };
  }
);

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    clearFavorites: (state) => {
      state.items = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFavorites.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFavorites.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchFavorites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(addFavorite.fulfilled, (state, action) => {
        const exists = state.items.some(
          (item) => item._id === action.payload._id
        );

        if (!exists) {
          state.items.push(action.payload);
        }
      })

      .addCase(removeFavorite.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item._id !== action.payload);
      });
  },
});

export const { clearFavorites } = favoritesSlice.actions;

export default favoritesSlice.reducer;