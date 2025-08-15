import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  mode: 'backend';
  isLoading: boolean;
  notifications: Array<{
    id: string;
    type: 'info' | 'error' | 'warning' | 'success';
    message: string;
    timestamp: number;
  }>;
}

const initialState: UIState = {
  mode: 'backend',
  isLoading: false,
  notifications: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    addNotification: (state, action: PayloadAction<{ type: 'info' | 'error' | 'warning' | 'success', message: string }>) => {
      const notification = {
        id: Date.now().toString(),
        ...action.payload,
        timestamp: Date.now(),
      };
      state.notifications.push(notification);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
  },
});

export const { setLoading, addNotification, removeNotification, clearNotifications } = uiSlice.actions;
export default uiSlice.reducer;
