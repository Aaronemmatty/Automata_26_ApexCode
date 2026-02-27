/**
 * src/store/authStore.js
 * ──────────────────────
 * Zustand store for authentication state.
 * Persists token in localStorage.
 */
import { create } from "zustand";
import { authAPI } from "../lib/api";

export const useAuthStore = create((set, get) => ({
  user:    null,
  token:   localStorage.getItem("sais_token") || null,
  loading: false,

  // ── Actions ─────────────────────────────────────────────
  login: async (email, password) => {
    set({ loading: true });
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem("sais_token", data.access_token);
    set({ token: data.access_token, loading: false });
    await get().fetchMe();
    return data;
  },

  register: async (email, full_name, password) => {
    set({ loading: true });
    const { data } = await authAPI.register({ email, full_name, password });
    set({ loading: false });
    return data;
  },

  fetchMe: async () => {
    try {
      const { data } = await authAPI.me();
      set({ user: data });
    } catch {
      get().logout();
    }
  },

  logout: () => {
    localStorage.removeItem("sais_token");
    set({ user: null, token: null });
  },

  isAuthenticated: () => !!get().token,
}));
