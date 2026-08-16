 import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  token: localStorage.getItem('imcpss_token'),
  isAuthenticated: !!localStorage.getItem('imcpss_token'),
};

export const authSlice = createSlice({
  name: 'auth',

  initialState,

  reducers: {
    login: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    },

    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;

      localStorage.removeItem('imcpss_token');
      localStorage.removeItem('imcpss_user');
    },
  },
});

export const { login, logout } = authSlice.actions;

export default authSlice.reducer;