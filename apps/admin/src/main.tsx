import { createBrowserHistory } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { createApiClient } from "./api/create-api-client";
import { App } from "./app";
import { createAuthenticator } from "./features/auth/webauthn/create-authenticator";
import { toLocale } from "./i18n/locales";
import { createApp } from "./router";
import "./ui/app.css";

const container = document.querySelector("#root");

if (container === null) {
  throw new Error("index.html に #root がありません");
}

const { router, queryClient } = createApp({
  history: createBrowserHistory(),
  api: createApiClient({
    origin: location.origin,
    fetch: async (request, init) => fetch(request, init),
  }),
  authenticator: createAuthenticator(navigator.credentials),
});

createRoot(container).render(
  <StrictMode>
    <App
      locale={toLocale(document.documentElement.lang)}
      queryClient={queryClient}
      router={router}
    />
  </StrictMode>,
);
