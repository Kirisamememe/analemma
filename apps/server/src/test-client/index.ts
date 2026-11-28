export {
  addTestPasskey,
  passkeyIdOf,
} from "@/test-client/passkeys/add-test-passkey";
export {
  type AuthenticationCredentialJson,
  answerAuthentication,
  answerReauthentication,
} from "@/test-client/passkeys/answer-authentication";
export { answerRegistration } from "@/test-client/passkeys/answer-registration";
export { SUCCEEDED, catchErrorCode } from "@/test-client/catch-error-code";
export { connectTestDropbox } from "@/test-client/connect-test-dropbox";
export {
  type FakeDropbox,
  TEST_DROPBOX_ACCOUNT,
  TEST_DROPBOX_APP,
} from "@/test-client/create-fake-dropbox";
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
  holdFirstConversion,
  photo,
  uploadRequest,
} from "@/test-client/images/photo-uploads";
export {
  insertImages,
  openTestDatabase,
} from "@/test-client/images/seed-images";
export {
  issueTestDeployToken,
  prepareTestKinds,
} from "@/test-client/prepare-test-kinds";
export {
  logInWithPasskey,
  signInAsAdmin,
  type TestPasskey,
} from "@/test-client/passkeys/sign-in-as-admin";
