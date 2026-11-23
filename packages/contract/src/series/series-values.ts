import { z } from "zod";

import { fixedPageSlug } from "../fixed-pages/fixed-page-values";
import { imageDescription, imageTitle } from "../images/image-values";

/** シリーズの名前・slug・説明。 */
export const seriesFields = z.object({
  name: imageTitle.describe("シリーズの名前。"),
  slug: fixedPageSlug.describe("シリーズの slug。"),
  description: imageDescription
    .nullable()
    .describe("シリーズの説明。無ければ null。"),
});
