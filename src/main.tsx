import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { applyTheme, readStoredTheme, usePlayerStore } from "./state/usePlayerStore";

// Apply the persisted theme BEFORE React mounts so the first paint
// already reflects the user's choice — no flash of the default theme.
const initialTheme = readStoredTheme()
applyTheme(initialTheme)
usePlayerStore.setState({ theme: initialTheme })

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
