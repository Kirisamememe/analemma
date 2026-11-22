import type { contract } from "@analemma/contract";

import type { Locale } from "../../i18n/locales";

import type { ApiInputs } from "@/api/api-types";

/** feature が参照する型。 */
export type Dependencies = [typeof contract, ApiInputs, Locale];
