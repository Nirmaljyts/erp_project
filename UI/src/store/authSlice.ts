import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  openSidebarDropdowns: string[];
}

const savedToken = localStorage.getItem("token");
const savedUser = localStorage.getItem("user");
const savedDropdowns = JSON.parse(
  localStorage.getItem("openSidebarDropdowns") || "[]"
);

const initialState: AuthState = {
  token: savedToken || null,
  user: savedUser ? JSON.parse(savedUser) : null,
  openSidebarDropdowns: savedDropdowns,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(
      state,
      action: PayloadAction<{ token: string; user: User }>
    ) {
      const { token, user } = action.payload;

      state.token = token;
      state.user = user;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      state.openSidebarDropdowns = [];
      localStorage.setItem("openSidebarDropdowns", "[]");
    },

    toggleSidebarDropdown(state, action: PayloadAction<string>) {
      const label = action.payload;

      if (state.openSidebarDropdowns.includes(label)) {
        state.openSidebarDropdowns = state.openSidebarDropdowns.filter(
          (x) => x !== label
        );
      } else {
        state.openSidebarDropdowns.push(label);
      }

      localStorage.setItem(
        "openSidebarDropdowns",
        JSON.stringify(state.openSidebarDropdowns)
      );
    },

    logout(state) {
      state.token = null;
      state.user = null;
      state.openSidebarDropdowns = [];

      localStorage.clear();
    },
  },
});

export const { setCredentials, toggleSidebarDropdown, logout } =
  authSlice.actions;

export default authSlice.reducer;
