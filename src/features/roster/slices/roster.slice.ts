// src/features/roster/slices/roster.slice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface SwapItem {
  shiftId: string;
  employeeId: string;
  level: string | number; // To check if users are at the same level
  date: string;
}

interface RosterState {
  swapQueue: SwapItem[];
  errorMsg: string | null;
}

const initialState: RosterState = {
  swapQueue: [],
  errorMsg: null,
};

const rosterSlice = createSlice({
  name: 'roster',
  initialState,
  reducers: {
    toggleSwapSelection: (state, action: PayloadAction<SwapItem>) => {
      state.errorMsg = null; // Reset errors
      const existingIndex = state.swapQueue.findIndex(
        (item) => item.shiftId === action.payload.shiftId
      );

      // If already selected, deselect it
      if (existingIndex >= 0) {
        state.swapQueue.splice(existingIndex, 1);
        return;
      }

      // Rule 1: Only 2 shifts can be selected at a time
      if (state.swapQueue.length >= 2) {
        state.errorMsg = "You can only select a maximum of two shifts to swap.";
        return;
      }

      // Rule 2: Must be the same level
      if (state.swapQueue.length === 1) {
        const firstSelectedItem = state.swapQueue[0];
        if (firstSelectedItem.level !== action.payload.level) {
          state.errorMsg = "Shift swaps are only allowed between users of the same level.";
          return;
        }
      }

      // Add to queue
      state.swapQueue.push(action.payload);
    },
    clearSwapError: (state) => {
      state.errorMsg = null;
    },
    clearSwapQueue: (state) => {
      state.swapQueue = [];
    }
  },
});

export const { toggleSwapSelection, clearSwapError, clearSwapQueue } = rosterSlice.actions;
export default rosterSlice.reducer;