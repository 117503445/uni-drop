import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface SettingsState {
  enableVConsole: boolean;
}

const initialState: SettingsState = {
  enableVConsole: false,
};

export const settingsSlice = createSlice({
  name: "setting",
  initialState,
  reducers: {
    setVConsole: (state, action: PayloadAction<boolean>) => {
      state.enableVConsole = action.payload;
    },
  },
});

// Action creators are generated for each case reducer function
export const { setVConsole } = settingsSlice.actions;

export default settingsSlice.reducer;
