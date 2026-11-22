import { enrollment } from "./enrollment";
import { health } from "./health";
import { kinds } from "./kinds/admin-kinds";
import { deployKinds } from "./kinds/deploy-kinds";
import { deployTokens } from "./kinds/deploy-tokens";
import { login } from "./login";
import { passkeys } from "./passkeys";
import { session } from "./session";

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

/** Analemma の API 全体の contract。 */
export const contract = {
  admin: { deployTokens, kinds, passkeys, session },
  auth: { enrollment, login },
  deploy: { kinds: deployKinds },
  public: { health },
};
