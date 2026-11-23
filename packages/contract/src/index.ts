import type {
  InferContractRouterInputs,
  InferContractRouterOutputs,
} from "@orpc/contract";

import { enrollment } from "./auth/enrollment";
import { login } from "./auth/login";
import { passkeys } from "./auth/passkeys";
import { session } from "./auth/session";
import { dropbox } from "./dropbox/admin-dropbox";
import { fixedPages } from "./fixed-pages/admin-fixed-pages";
import { publicFixedPages } from "./fixed-pages/public-fixed-pages";
import { health } from "./health";
import { images } from "./images/admin-images";
import { publicImages } from "./images/public-images";
import { kinds } from "./kinds/admin-kinds";
import { deployKinds } from "./kinds/deploy-kinds";
import { deployTokens } from "./kinds/deploy-tokens";
import { series } from "./series/admin-series";
import { publicSeries } from "./series/public-series";

export {
  type FixedPageContent,
  fixedPageContent,
  fixedPageSlug,
  fixedPageTitle,
} from "./fixed-pages/fixed-page-values";
export {
  DROPBOX_REDIRECT_PATH,
  type DropboxImport,
} from "./dropbox/dropbox-values";
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
  PHOTO_MAX_BYTES,
  imageAlt,
  imageDescription,
  imageId,
  imageTitle,
} from "./images/image-values";
export { deployTokenName } from "./kinds/deploy-tokens";
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
} from "./auth/webauthn";

/** Analemma の API 全体の contract。 */
export const contract = {
  admin: {
    deployTokens,
    dropbox,
    fixedPages,
    images,
    kinds,
    passkeys,
    series,
    session,
  },
  auth: { enrollment, login },
  deploy: { kinds: deployKinds },
  public: {
    fixedPages: publicFixedPages,
    health,
    images: publicImages,
    series: publicSeries,
  },
};

/** contract の入力の型。 */
export type ContractInputs = InferContractRouterInputs<typeof contract>;

/** contract の出力の型。 */
export type ContractOutputs = InferContractRouterOutputs<typeof contract>;
