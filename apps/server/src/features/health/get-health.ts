import { publicProcedures } from "@/procedures";

/** server が動いていることを返す procedure。 */
export const getHealth = publicProcedures.health.get.handler(() => ({
  status: "ok",
}));
