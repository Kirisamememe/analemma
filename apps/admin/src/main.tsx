import { createBrowserHistory } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { createApiClient } from "./api/create-api-client";
import { App } from "./app";
import {
  createAuthGate,
  gateAdminRequests,
} from "./features/auth/create-auth-gate";
import {
  type WebAuthn,
  createAuthenticator,
} from "./features/auth/webauthn/create-authenticator";
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

const toJson = (credential: Credential | null): unknown =>
  credential instanceof PublicKeyCredential ? credential.toJSON() : null;

const webAuthn: WebAuthn = {
  get: async (options) =>
    toJson(
      await navigator.credentials.get({
        publicKey: PublicKeyCredential.parseRequestOptionsFromJSON(options),
      }),
    ),
  create: async (options, signal) =>
    toJson(
      await navigator.credentials.create({
        publicKey: PublicKeyCredential.parseCreationOptionsFromJSON(options),
        ...(signal === undefined ? {} : { signal }),
      }),
    ),
};

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
