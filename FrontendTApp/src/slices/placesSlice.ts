import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../services/api';

export type Place = {
  _id: string;
  name: string;
  description: string;
  categories: string[];
  address: string;
  openingHours?: string;
  contact?: string;
  images?: string[];
  website?: string;
  distance?: number;
  averageRating?: number;
  reviewsCount?: number;
  location: {
    type: string;
    coordinates: number[];
  };
};

type PlacesState = {
  places: Place[];
  selectedPlace: Place | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  } | null;
};

const initialState: PlacesState = {
  places: [],
  selectedPlace: null,
  loading: false,
  error: null,
  pagination: null,
};

type SearchParams = {
  search?: string;
  categories?: string[];
  minRating?: number | null;
  maxDistance?: number | null;
  sortBy?: 'name' | 'rating' | 'distance';
  page?: number;
  limit?: number;
  userLat?: number;
  userLng?: number;
};

function normalizePlace(place: Place): Place {
  return {
    ...place,
    averageRating: Math.min(Number(place.averageRating || 0), 5),
    reviewsCount: Number(place.reviewsCount || 0),
  };
}

export const searchPlaces = createAsyncThunk(
  'places/searchPlaces',
  async (params: SearchParams = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/places/search', {
        params,
      });

      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Erro ao buscar locais'
      );
    }
  }
);

export const getPlaceById = createAsyncThunk(
  'places/getPlaceById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/places/${id}`);

      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Erro ao buscar detalhes do local'
      );
    }
  }
);

const placesSlice = createSlice({
  name: 'places',
  initialState,
  reducers: {
    clearPlaces: (state) => {
      state.places = [];
      state.pagination = null;
      state.error = null;
    },
    clearSelectedPlace: (state) => {
      state.selectedPlace = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchPlaces.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchPlaces.fulfilled, (state, action) => {
        state.loading = false;
        state.places = action.payload.items.map((place: Place) =>
          normalizePlace(place)
        );
        state.pagination = action.payload.pagination;
      })
      .addCase(searchPlaces.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(getPlaceById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPlaceById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedPlace = normalizePlace(action.payload);
      })
      .addCase(getPlaceById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearPlaces, clearSelectedPlace } = placesSlice.actions;

export default placesSlice.reducer;