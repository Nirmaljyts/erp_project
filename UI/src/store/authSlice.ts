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
  openSidebarDropdown: string | null;
}

const savedToken = localStorage.getItem("token");
const savedUser = localStorage.getItem("user");
const savedDropdown = localStorage.getItem("openSidebarDropdown") || null;

const initialState: AuthState = {
  token: savedToken || null,
  user: savedUser ? JSON.parse(savedUser) : null,
  openSidebarDropdown: savedDropdown || null,
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

      state.openSidebarDropdown = null;
      localStorage.removeItem("openSidebarDropdown");
    },
    setOpenSidebarDropdown(state, action: PayloadAction<string | null>) {
      state.openSidebarDropdown = action.payload;

      if (action.payload) {
        localStorage.setItem("openSidebarDropdown", action.payload);
      } else {
        localStorage.removeItem("openSidebarDropdown");
      }
    },

    logout(state) {
      state.token = null;
      state.user = null;
      state.openSidebarDropdown = null;

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.clear();
    },
  },
});

export const { setCredentials, setOpenSidebarDropdown, logout } =
  authSlice.actions;

export default authSlice.reducer;
