export { addTestPasskey, passkeyIdOf } from "@/test-client/passkeys/add-test-passkey";
export {
  type AuthenticationCredentialJson,
  answerAuthentication,
  answerReauthentication,
} from "@/test-client/passkeys/answer-authentication";
export { answerRegistration } from "@/test-client/passkeys/answer-registration";
export { SUCCEEDED, catchErrorCode } from "@/test-client/catch-error-code";
export {
  TEST_INTERNAL_URL,
  TEST_ORIGIN,
  type TestClient,
  createTestClient,
  TEST_RP_ID,
  TEST_NOW,
  type TestBrowser,
} from "@/test-client/create-test-client";
export { listProcedurePaths } from "@/test-client/list-procedure-paths";
export {
  issueTestDeployToken,
  prepareTestKinds,
} from "@/test-client/prepare-test-kinds";
export {
  logInWithPasskey,
  signInAsAdmin,
  type TestPasskey,
} from "@/test-client/passkeys/sign-in-as-admin";
