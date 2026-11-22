import { describe, expect, test } from "bun:test";

import {
  type CredentialsApi,
  type OptionsParser,
  createBrowserWebAuthn,
} from "../create-browser-web-authn";

const REQUEST: PublicKeyCredentialRequestOptionsJSON = {
  challenge: "AQID",
  rpId: "localhost",
  allowCredentials: [],
  userVerification: "required",
  timeout: 300_000,
};

const CREATION: PublicKeyCredentialCreationOptionsJSON = {
  challenge: "AQID",
  rp: { id: "localhost", name: "Analemma" },
  user: { id: "BAU", name: "admin", displayName: "管理者" },
  pubKeyCredParams: [{ type: "public-key", alg: -8 }],
  excludeCredentials: [
    { type: "public-key", id: "Y3JlZGVudGlhbA", transports: ["internal"] },
  ],
  authenticatorSelection: {
    residentKey: "required",
    requireResidentKey: true,
    userVerification: "required",
  },
  attestation: "none",
  timeout: 300_000,
};

const PARSED_REQUEST = { challenge: new Uint8Array([1, 2, 3]) };
const PARSED_CREATION = {
  challenge: new Uint8Array([1, 2, 3]),
  rp: { name: "Analemma" },
  user: { id: new Uint8Array([4, 5]), name: "admin", displayName: "管理者" },
  pubKeyCredParams: [],
};

/** 作り物のブラウザと、それが受け取ったもの。 */
type FakeBrowser = {
  /** パースした JSON の options。 */
  readonly parsed: unknown[];
  /** `navigator.credentials` の作り物に渡した options。 */
  readonly called: unknown[];
  /** 作り物の `navigator.credentials`。 */
  readonly credentials: CredentialsApi;
  /** 作り物の JSON のパース。 */
  readonly parser: OptionsParser;
};

const fakeBrowser = (json: unknown): FakeBrowser => {
  const parsed: unknown[] = [];
  const called: unknown[] = [];

  return {
    parsed,
    called,
    credentials: {
      get: (options) => {
        called.push(options);

        return Promise.resolve(json === null ? null : { toJSON: () => json });
      },
      create: (options) => {
        called.push(options);

        return Promise.resolve(json === null ? null : { toJSON: () => json });
      },
    },
    parser: {
      parseRequestOptionsFromJSON: (options) => {
        parsed.push(options);

        return PARSED_REQUEST;
      },
      parseCreationOptionsFromJSON: (options) => {
        parsed.push(options);

        return PARSED_CREATION;
      },
    },
  };
};

describe("createBrowserWebAuthn", () => {
  test("ログインでは、JSON の options をパースして publicKey に渡し、資格情報を toJSON() の値で返す", async () => {
    const browser = fakeBrowser({ id: "a" });
    const webAuthn = createBrowserWebAuthn(browser.credentials, browser.parser);

    expect(await webAuthn.get(REQUEST)).toEqual({ id: "a" });
    expect(browser.parsed).toEqual([REQUEST]);
    expect(browser.called).toEqual([{ publicKey: PARSED_REQUEST }]);
  });

  test("登録では、登録済みの資格情報を含む options をパースして渡し、signal も渡す", async () => {
    const browser = fakeBrowser({ id: "b" });
    const webAuthn = createBrowserWebAuthn(browser.credentials, browser.parser);
    const signal = new AbortController().signal;

    expect(await webAuthn.create(CREATION, signal)).toEqual({ id: "b" });
    expect(browser.parsed).toEqual([CREATION]);
    expect(browser.called).toEqual([{ publicKey: PARSED_CREATION, signal }]);
  });

  test("signal が無ければ、signal を渡さない", async () => {
    const browser = fakeBrowser({ id: "b" });

    await createBrowserWebAuthn(browser.credentials, browser.parser).create(
      CREATION,
    );

    expect(browser.called).toEqual([{ publicKey: PARSED_CREATION }]);
  });

  test("資格情報が返らなければ null を返す", async () => {
    const browser = fakeBrowser(null);
    const webAuthn = createBrowserWebAuthn(browser.credentials, browser.parser);

    expect(await webAuthn.get(REQUEST)).toBeNull();
    expect(await webAuthn.create(CREATION)).toBeNull();
  });
});
