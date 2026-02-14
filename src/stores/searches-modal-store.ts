import { create } from "zustand";

interface SearchesModalStore {
  open: boolean;
  openModal: () => void;
  closeModal: () => void;
}

export const useSearchesModalStore = create<SearchesModalStore>()((set) => ({
  open: false,
  openModal: () => set({ open: true }),
  closeModal: () => set({ open: false }),
}));
