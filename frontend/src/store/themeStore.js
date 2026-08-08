/**
 * store/themeStore.js — mavzu (light/dark) holati.
 *
 * Tailwind'da dark mode `<html class="dark">` klassiga qarab ishlaydi,
 * shuning uchun holat o'zgarganda DOM'ga ham yozib qo'yamiz.
 */
import { create } from "zustand";

// Klassni <html> ga qo'yish/olib tashlash va tanlovni eslab qolish
const applyTheme = (dark) => {
  const root = document.documentElement;
  root.classList.toggle("dark", dark);
  localStorage.setItem("theme", dark ? "dark" : "light");
};

const initial = localStorage.getItem("theme") === "dark";
// Sahifa ochilishida darhol qo'llaymiz, aks holda bir lahza yorug' ko'rinib ketadi
applyTheme(initial);

export const useThemeStore = create((set) => ({
  dark: initial,
  toggle: () =>
    set((state) => {
      const dark = !state.dark;
      applyTheme(dark);
      return { dark };
    }),
}));
