import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface SettingsState {
  enableVConsole: boolean;
  enablePageSpy: boolean;
}

const initialState: SettingsState = {
  enableVConsole: false,
  enablePageSpy: false,
};

export const settingsSlice = createSlice({
  name: "setting",
  initialState,
  reducers: {
    setVConsole: (state, action: PayloadAction<boolean>) => {
      state.enableVConsole = action.payload;
    },
    setPageSpy: (state, action: PayloadAction<boolean>) => {
      state.enablePageSpy = action.payload;
    },
  },
});

// Action creators are generated for each case reducer function
export const { setVConsole, setPageSpy } = settingsSlice.actions;

export default settingsSlice.reducer;
