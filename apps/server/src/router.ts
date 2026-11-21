import { implement } from "@orpc/server";

import { contract } from "@analemma/contract";

import type { RequestContext } from "./context";
import { getReauthenticationOptions } from "./features/auth/current-session/get-reauthentication-options";
import { getSession } from "./features/auth/current-session/get-session";
import { logOut } from "./features/auth/current-session/log-out";
import { logOutAllSessions } from "./features/auth/current-session/log-out-all-sessions";
import { enrollPasskey } from "./features/auth/enrollment/enroll-passkey";
import { getEnrollmentOptions } from "./features/auth/enrollment/get-enrollment-options";
import { getLoginOptions } from "./features/auth/login/get-login-options";
import { logIn } from "./features/auth/login/log-in";
import { addPasskey } from "./features/auth/passkeys/add-passkey";
import { deletePasskey } from "./features/auth/passkeys/delete-passkey";
import { getPasskeyOptions } from "./features/auth/passkeys/get-passkey-options";
import { listPasskeys } from "./features/auth/passkeys/list-passkeys";
import { renamePasskey } from "./features/auth/passkeys/rename-passkey";
import { issueDeployToken } from "./features/deploy-tokens/issue-deploy-token";
import { listDeployTokens } from "./features/deploy-tokens/list-deploy-tokens";
import { revokeDeployToken } from "./features/deploy-tokens/revoke-deploy-token";
import { getHealth } from "./features/health/get-health";
import { adminProcedures, authProcedures } from "./procedures";

/** 全 feature の procedure を束ねたルーター。 */
export const router = implement(contract)
  .$context<RequestContext>()
  .router({
    admin: adminProcedures.router({
      deployTokens: {
        list: listDeployTokens,
        issue: issueDeployToken,
        revoke: revokeDeployToken,
      },
      passkeys: {
        list: listPasskeys,
        registrationOptions: getPasskeyOptions,
        register: addPasskey,
        rename: renamePasskey,
        delete: deletePasskey,
      },
      session: {
        get: getSession,
        reauthenticationOptions: getReauthenticationOptions,
        logOut,
        logOutAll: logOutAllSessions,
      },
    }),
    auth: authProcedures.router({
      enrollment: { options: getEnrollmentOptions, register: enrollPasskey },
      login: { options: getLoginOptions, verify: logIn },
    }),
    public: { health: { get: getHealth } },
  });
