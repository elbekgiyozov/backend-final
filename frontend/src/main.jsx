import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { useAuthStore } from "./store/authStore";
import "./store/themeStore"; // import qilinishi bilan mavzuni <html> ga qo'llaydi

// Sahifa ochilganda tokenning amal qilishini tekshiramiz.
// Zustand store'ini komponentdan tashqarida ham chaqirsa bo'ladi —
// Context'dan farqi shu: Provider ichida bo'lish shart emas.
useAuthStore.getState().checkAuth();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
