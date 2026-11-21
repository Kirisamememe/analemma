import { RouterProvider, createBrowserHistory } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { LocaleContext } from "./i18n/locale-context";
import { toLocale } from "./i18n/locales";
import { createAppRouter } from "./router";
import "./ui/app.css";

const container = document.querySelector("#root");

if (container === null) {
  throw new Error("index.html に #root がありません");
}

createRoot(container).render(
  <StrictMode>
    <LocaleContext value={toLocale(document.documentElement.lang)}>
      <RouterProvider router={createAppRouter(createBrowserHistory())} />
    </LocaleContext>
  </StrictMode>,
);
