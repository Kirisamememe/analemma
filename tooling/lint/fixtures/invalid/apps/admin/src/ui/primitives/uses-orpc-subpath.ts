import type { RPCLink } from "@orpc/client/fetch";

/** primitives が、API の通信の型を知る。 */
export type Transport = RPCLink<object>;
