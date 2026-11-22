import { createBrowserHistory } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { createApiClient } from "./api/create-api-client";
import { App } from "./app";
import {
  createAuthGate,
  gateAdminRequests,
} from "./features/auth/create-auth-gate";
import { createAuthenticator } from "./features/auth/webauthn/create-authenticator";
import { createI18n } from "./i18n/create-i18n";
import { toLocale } from "./i18n/locales";
import { syncLocale } from "./preferences/sync-locale";
import { createApp } from "./router";
import "./ui/app.css";

const container = document.querySelector("#root");

if (container === null) {
  throw new Error("index.html に #root がありません");
}

const i18n = createI18n(toLocale(document.documentElement.lang));

syncLocale(i18n);

const gate = createAuthGate();
const { router, queryClient } = createApp({
  history: createBrowserHistory(),
  api: createApiClient({
    origin: location.origin,
    fetch: gateAdminRequests(gate, async (request, init) =>
      fetch(request, init),
    ),
  }),
  authenticator: createAuthenticator(navigator.credentials),
  gate,
});

createRoot(container).render(
  <StrictMode>
    <App i18n={i18n} queryClient={queryClient} router={router} />
  </StrictMode>,
);
