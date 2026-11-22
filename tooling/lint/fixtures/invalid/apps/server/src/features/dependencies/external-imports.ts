import "bun:test";
import "example/.";
import "example/..";
import type { InferContractRouterInputs } from "@orpc/contract";
import { getCookie } from "@orpc/server/helpers";
import type { SQL } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { contract } from "@analemma/contract/internal";

export type Login = InferContractRouterInputs<typeof contract>["auth"]["login"];
export type Filter = SQL;
export const cookie = getCookie(new Headers(), randomUUID());
