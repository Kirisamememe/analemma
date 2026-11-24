import { z } from "zod";

import { fixedPageSlug } from "../fixed-pages/fixed-page-values";
import { imageDescription, imageTitle } from "../images/image-values";

/** 作品集の名前・slug・説明。 */
export const collectionFields = z.object({
  name: imageTitle.describe("作品集の名前。"),
  slug: fixedPageSlug.describe("作品集の slug。"),
  description: imageDescription
    .nullable()
    .describe("作品集の説明。無ければ null。"),
});
