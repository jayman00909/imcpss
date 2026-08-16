 import { createSlice } from '@reduxjs/toolkit';

// Rehydrate the stored user on boot. Without this the navbar, role checks and
// manager-only controls all vanish after a page refresh, because the token
// survived in localStorage but `user` came back null.
const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('mco_user') || 'null');
  } catch {
    localStorage.removeItem('mco_user');
    return null;
  }
};

const storedToken = localStorage.getItem('mco_token');

const initialState = {
  user: readStoredUser(),
  token: storedToken,
  isAuthenticated: !!storedToken,
};

export const authSlice = createSlice({
  name: 'auth',

  initialState,

  reducers: {
    login: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;

      // Persist here so storage and Redux can never disagree.
      localStorage.setItem('mco_token', action.payload.token);
      localStorage.setItem('mco_user', JSON.stringify(action.payload.user));
    },

    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;

      localStorage.removeItem('mco_token');
      localStorage.removeItem('mco_user');
    },
  },
});

export const { login, logout } = authSlice.actions;

export default authSlice.reducer;