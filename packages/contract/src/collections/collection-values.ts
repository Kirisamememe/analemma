import { z } from "zod";

import { fixedPageSlug } from "../fixed-pages/fixed-page-values";
import { imageDescription, imageTitle } from "../images/image-values";

/** コレクションの名前・slug・説明。 */
export const collectionFields = z.object({
  name: imageTitle.describe("コレクションの名前。"),
  slug: fixedPageSlug.describe("コレクションの slug。"),
  description: imageDescription
    .nullable()
    .describe("コレクションの説明。無ければ null。"),
});
