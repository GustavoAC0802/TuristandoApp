import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ThemeMode = 'light' | 'dark';
export type ThemePreference = 'light' | 'dark' | 'auto';

type ThemeState = {
  /**
   * Tema realmente aplicado no app.
   * Sempre será light ou dark.
   */
  mode: ThemeMode;

  /**
   * Preferência escolhida pelo usuário.
   * auto = o app decide com base no sensor de luz.
   */
  preference: ThemePreference;
};

const initialState: ThemeState = {
  mode: 'light',
  preference: 'light',
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<ThemePreference>) => {
      state.preference = action.payload;

      if (action.payload === 'light' || action.payload === 'dark') {
        state.mode = action.payload;
      }
    },

    setAutoThemeMode: (state, action: PayloadAction<ThemeMode>) => {
      if (state.preference === 'auto') {
        state.mode = action.payload;
      }
    },

    toggleTheme: (state) => {
      const nextMode: ThemeMode = state.mode === 'light' ? 'dark' : 'light';

      state.mode = nextMode;
      state.preference = nextMode;
    },
  },
});

export const { setTheme, setAutoThemeMode, toggleTheme } = themeSlice.actions;
export default themeSlice.reducer;