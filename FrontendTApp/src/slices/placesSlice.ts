import { createSlice } from '@reduxjs/toolkit';

const placesSlice = createSlice({
  name: 'places',
  initialState: {
    places: [],
    loading: false,
  },
  reducers: {},
});

export default placesSlice.reducer;