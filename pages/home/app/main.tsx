import React from "react";
import ReactDOM from "react-dom/client";
import App from "./routes";
import "uno.css";
import ResizeObserverPolyfill from "resize-observer-polyfill";

if (typeof window === "undefined") {
  global.ResizeObserver = ResizeObserverPolyfill;
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
