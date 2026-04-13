import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type User = {
  id?: string;
  _id?: string;
  name?: string;
  email?: string;
  interests?: string[];
};

type AuthState = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
};

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (
      state,
      action: PayloadAction<{ token: string; user: User }>
    ) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.isLoading = false;
    },

    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },

    setAuthLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    logout: state => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
    },
  },
});

export const { loginSuccess, setUser, logout, setAuthLoading } =
  authSlice.actions;

export default authSlice.reducer;