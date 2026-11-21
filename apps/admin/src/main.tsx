import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { LocaleContext } from "./i18n/locale-context";
import { toLocale } from "./i18n/to-locale";
import { router } from "./router";
import "./ui/app.css";

const container = document.querySelector("#root");

if (container === null) {
  throw new Error("index.html に #root がありません");
}

createRoot(container).render(
  <StrictMode>
    <LocaleContext value={toLocale(document.documentElement.lang)}>
      <RouterProvider router={router} />
    </LocaleContext>
  </StrictMode>,
);
