import type {
  InferContractRouterInputs,
  InferContractRouterOutputs,
} from "@orpc/contract";

import { enrollment } from "./enrollment";
import { fixedPages } from "./fixed-pages/admin-fixed-pages";
import { publicFixedPages } from "./fixed-pages/public-fixed-pages";
import { health } from "./health";
import { kinds } from "./kinds/admin-kinds";
import { deployKinds } from "./kinds/deploy-kinds";
import { deployTokens } from "./kinds/deploy-tokens";
import { login } from "./login";
import { passkeys } from "./passkeys";
import { session } from "./session";

export {
  type FixedPageContent,
  fixedPageContent,
} from "./fixed-pages/fixed-page-values";
export { type ContentIssue, contentIssues } from "./kinds/content-issues";
export {
  booleanValue,
  dateValue,
  longTextValue,
  numberValue,
  textValue,
  urlValue,
} from "./kinds/content-values";
export {
  type FieldDefinition,
  type FieldDefinitionInput,
  fieldDefinition,
  fieldDefinitions,
} from "./kinds/field-definition";
export {
  type KindDefinition,
  type KindDefinitionInput,
  kindDefinition,
  kindDefinitionList,
} from "./kinds/kind-definition";
export {
  type ContentSchemaOptions,
  type UnknownKeys,
  toContentSchema,
} from "./kinds/to-content-schema";
export {
  authenticationCredential,
  passkeyName,
  registrationCredential,
} from "./webauthn";

/** Analemma の API 全体の contract。 */
export const contract = {
  admin: { deployTokens, fixedPages, kinds, passkeys, session },
  auth: { enrollment, login },
  deploy: { kinds: deployKinds },
  public: { fixedPages: publicFixedPages, health },
};

/** contract の入力の型。 */
export type ContractInputs = InferContractRouterInputs<typeof contract>;

/** contract の出力の型。 */
export type ContractOutputs = InferContractRouterOutputs<typeof contract>;
