import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface HrPermissionsState {
  permissions: string[];
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
}

const initialState: HrPermissionsState = {
  permissions: [],
  isLoading: false,
  isLoaded: false,
  error: null,
};

const hrPermissionsSlice = createSlice({
  name: 'hrPermissions',
  initialState,
  reducers: {
    fetchHrPermissionsStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchHrPermissionsSuccess: (state, action: PayloadAction<string[]>) => {
      state.permissions = Array.from(new Set(action.payload));
      state.isLoading = false;
      state.isLoaded = true;
      state.error = null;
    },
    fetchHrPermissionsFailure: (state, action: PayloadAction<string>) => {
      state.permissions = [];
      state.isLoading = false;
      state.isLoaded = true;
      state.error = action.payload;
    },
    clearHrPermissions: (state) => {
      state.permissions = [];
      state.isLoading = false;
      state.isLoaded = false;
      state.error = null;
    },
  },
});

export const {
  fetchHrPermissionsStart,
  fetchHrPermissionsSuccess,
  fetchHrPermissionsFailure,
  clearHrPermissions,
} = hrPermissionsSlice.actions;

export default hrPermissionsSlice.reducer;
