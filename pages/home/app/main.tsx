import React from "react";
import ReactDOM from "react-dom/client";
import App from "./routes";
import "@unocss/reset/tailwind.css";
import "uno.css";

const el = document.getElementById("root");
if (el === null) {
  throw new Error("root must exist");
}

ReactDOM.createRoot(el).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
