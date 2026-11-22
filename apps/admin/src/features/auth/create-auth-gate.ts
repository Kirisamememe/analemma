import type { ApiClientOptions } from "../../api/create-api-client";

/** ログインの最中に、管理用 API を送らせない gate。 */
export type AuthGate = {
  /** 管理用 API を、ログインの最中なら終わるまで待ってから送る。 */
  readonly sendAdmin: <T>(send: () => Promise<T>) => Promise<T>;
  /** 送っている管理用 API が終わるのを待ってから、ログインを流す。 */
  readonly authenticate: <T>(run: () => Promise<T>) => Promise<T>;
};

const ADMIN_PATH = "/api/admin/";

/** ログインと管理用 API が重ならないようにする gate を作る。 */
export const createAuthGate = (): AuthGate => {
  let inFlight = 0;
  let idle: PromiseWithResolvers<undefined> | undefined;
  let authentication: Promise<void> | undefined;

  const waitUntilIdle = async (): Promise<void> => {
    if (inFlight > 0) {
      idle ??= Promise.withResolvers<undefined>();
      await idle.promise;
    }
  };

  const sendAdmin = async <T>(send: () => Promise<T>): Promise<T> => {
    if (authentication !== undefined) {
      await authentication;

      return sendAdmin(send);
    }

    inFlight += 1;

    try {
      return await send();
    } finally {
      inFlight -= 1;

      if (inFlight === 0) {
        idle?.resolve(undefined);
        idle = undefined;
      }
    }
  };

  const authenticate = async <T>(run: () => Promise<T>): Promise<T> => {
    if (authentication !== undefined) {
      await authentication;

      return authenticate(run);
    }

    const done = Promise.withResolvers<undefined>();

    authentication = done.promise;

    try {
      await waitUntilIdle();

      return await run();
    } finally {
      authentication = undefined;
      done.resolve(undefined);
    }
  };

  return { sendAdmin, authenticate };
};

/** 管理用 API のリクエストだけを、gate を通して送る fetch にする。 */
export const gateAdminRequests =
  (
    gate: AuthGate,
    fetch: ApiClientOptions["fetch"],
  ): ApiClientOptions["fetch"] =>
  (request, init) =>
    new URL(request.url).pathname.startsWith(ADMIN_PATH)
      ? gate.sendAdmin(async () => fetch(request, init))
      : fetch(request, init);
