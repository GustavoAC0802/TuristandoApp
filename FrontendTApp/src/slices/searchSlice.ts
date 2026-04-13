import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type SearchFilters = {
  categories: string[];
  distance: number | null;
  rating: number | null;
};

type SearchState = {
  searchText: string;
  filters: SearchFilters;
};

const initialState: SearchState = {
  searchText: '',
  filters: {
    categories: [],
    distance: null,
    rating: null,
  },
};

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setSearchText(state, action: PayloadAction<string>) {
      state.searchText = action.payload;
    },

    setFilters(state, action: PayloadAction<SearchFilters>) {
      state.filters = action.payload;
    },

    clearFilters(state) {
      state.filters = {
        categories: [],
        distance: null,
        rating: null,
      };
    },

    clearSearch(state) {
      state.searchText = '';
    },

    clearSearchState(state) {
      state.searchText = '';
      state.filters = {
        categories: [],
        distance: null,
        rating: null,
      };
    },
  },
});

export const {
  setSearchText,
  setFilters,
  clearFilters,
  clearSearch,
  clearSearchState,
} = searchSlice.actions;

export default searchSlice.reducer;