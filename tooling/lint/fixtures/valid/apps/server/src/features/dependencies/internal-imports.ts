import { contract } from "@analemma/contract";

import type { Fragment } from "../posts/queries/fragment.query";

import type { Fragment as AliasedFragment } from "@/features/posts/queries/fragment.query";

export const auth = contract.auth;

/** 2つのパスから読んだ SQL の断片。 */
export type Fragments = [Fragment, AliasedFragment];

export { current } from ".";
export { parent } from "..";
