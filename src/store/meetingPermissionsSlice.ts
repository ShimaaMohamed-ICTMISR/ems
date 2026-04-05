import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface MeetingPermissionsState {
  permissions: string[];
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
}

const initialState: MeetingPermissionsState = {
  permissions: [],
  isLoading: false,
  isLoaded: false,
  error: null,
};

const meetingPermissionsSlice = createSlice({
  name: 'meetingPermissions',
  initialState,
  reducers: {
    fetchMeetingPermissionsStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchMeetingPermissionsSuccess: (
      state,
      action: PayloadAction<string[]>,
    ) => {
      state.permissions = Array.from(new Set(action.payload));
      state.isLoading = false;
      state.isLoaded = true;
      state.error = null;
    },
    fetchMeetingPermissionsFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.isLoaded = true;
      state.error = action.payload;
      state.permissions = [];
    },
    clearMeetingPermissions: (state) => {
      state.permissions = [];
      state.isLoading = false;
      state.isLoaded = false;
      state.error = null;
    },
  },
});

export const {
  fetchMeetingPermissionsStart,
  fetchMeetingPermissionsSuccess,
  fetchMeetingPermissionsFailure,
  clearMeetingPermissions,
} = meetingPermissionsSlice.actions;

export default meetingPermissionsSlice.reducer;
