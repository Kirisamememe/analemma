import { createBrowserHistory } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { createApiClient } from "@/api/create-api-client";
import { App, createApp } from "@/app";
import {
  createAuthGate,
  gateAdminRequests,
} from "@/features/auth/create-auth-gate";
import {
  createAuthenticator,
  createBrowserWebAuthn,
} from "@/features/auth/webauthn";
import { createI18n } from "@/i18n/create-i18n";
import { toLocale } from "@/i18n/locales";
import { syncLocale } from "@/preferences/sync-locale";
import "@/ui/app.css";

const container = document.querySelector("#root");

if (container === null) {
  throw new Error("index.html に #root がありません");
}

const i18n = createI18n(toLocale(document.documentElement.lang));

syncLocale(i18n);

const asJsonCredential = (
  credential: Credential | null,
): PublicKeyCredential | null =>
  credential instanceof PublicKeyCredential ? credential : null;

const webAuthn = createBrowserWebAuthn(
  {
    get: async (options) =>
      asJsonCredential(await navigator.credentials.get(options)),
    create: async (options) =>
      asJsonCredential(await navigator.credentials.create(options)),
  },
  PublicKeyCredential,
);

const gate = createAuthGate();
const { router, queryClient } = createApp({
  history: createBrowserHistory(),
  api: createApiClient({
    origin: location.origin,
    fetch: gateAdminRequests(gate, async (request, init) =>
      fetch(request, init),
    ),
  }),
  authenticator: createAuthenticator(webAuthn),
  gate,
});

createRoot(container).render(
  <StrictMode>
    <App i18n={i18n} queryClient={queryClient} router={router} />
  </StrictMode>,
);
