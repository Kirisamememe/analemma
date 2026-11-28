import { z } from "zod";

import { textValue } from "../kinds/content-values";

/** 画像に付けるタグの ID。 */
export const imageTagId = z.uuid().describe("画像に付けるタグの ID。");

/** 画像に付けるタグの ID と名前。 */
export const imageTagSummary = z.object({
  id: imageTagId,
  name: z.string().trim().max(200).pipe(textValue).describe("タグの名前。"),
});
