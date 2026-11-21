import { oc } from "@orpc/contract";
import { z } from "zod";

/** server の状態を返す procedure の contract。 */
export const health = {
  get: oc
    .route({ method: "GET", path: "/health", summary: "server の状態" })
    .output(
      z.object({
        status: z.literal("ok").describe("server が動いていることを表す値。"),
      }),
    ),
};
