import { create } from "zustand";

/** Error codes returned by GitHub OAuth callback. */
export type LoginErrorCode =
  | "invalid_state"
  | "token_exchange"
  | "no_email"
  | string;

interface LoginModalStore {
  open: boolean;
  error: LoginErrorCode | null;
  openLoginModal: (error?: LoginErrorCode) => void;
  closeLoginModal: () => void;
}

export const useLoginModalStore = create<LoginModalStore>()((set) => ({
  open: false,
  error: null,

  openLoginModal: (error) =>
    set({ open: true, error: error ?? null }),

  closeLoginModal: () =>
    set({ open: false, error: null }),
}));
