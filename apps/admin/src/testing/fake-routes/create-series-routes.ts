import { createImageRoutes } from "./create-image-routes";

import type { FakeOutput, FakeRoutes } from "@/testing/create-fake-api";
import { SAMPLE_IMAGES } from "@/testing/sample-photos";

export const SAMPLE_SERIES_ID = "019b0000-0000-7000-8000-000000000001";

/** シリーズと選択できる画像を持つ作り物の server。 */
export const createSeriesRoutes = (
  seed: "none" | "empty" | "photos" = "photos",
) => {
  type Entry = FakeOutput<"admin/series/create"> & Record<"imageIds", string[]>;
  const library = createImageRoutes(SAMPLE_IMAGES);

  const initial = {
    id: SAMPLE_SERIES_ID,
    name: "旅の写真",
    slug: "travel",
    description: null,
    published: false,
    publishedAt: null,
    imageIds:
      seed === "photos"
        ? library
            .images()
            .slice(0, 3)
            .map(({ id }) => id)
        : [],
  };

  const entries = new Map<string, Entry>();

  if (seed !== "none") entries.set(initial.id, initial);

  const taken = (slug: string, except?: string) =>
    [...entries.values()].some(
      (entry) => entry.slug === slug && entry.id !== except,
    );

  const detail = ({ imageIds, ...entry }: Entry) => {
    const available = new Map(
      library.images().map((image) => [image.id, image]),
    );

    const images = imageIds.flatMap((id) => available.get(id) ?? []);

    return { ...entry, images };
  };

  const summary = (stored: Entry) => {
    const { images, ...entry } = detail(stored);
    return {
      ...entry,
      imageCount: images.length,
      coverImage: images[0] ?? null,
    };
  };

  const missing = { error: "NOT_FOUND" } as const;

  const publication = (id: string, published: boolean) => {
    const entry = entries.get(id);

    if (entry === undefined) return missing;

    entry.published = published;
    entry.publishedAt = published
      ? (entry.publishedAt ?? new Date().toISOString())
      : null;

    return { output: entry };
  };

  return {
    ...library.routes,
    "admin/series/list": () => ({
      output: {
        series: [...entries.values()]
          .toReversed()
          .map((entry) => summary(entry)),
      },
    }),
    "admin/series/get": ({ id }) => {
      const entry = entries.get(id);
      return entry === undefined ? missing : { output: detail(entry) };
    },
    "admin/series/publish": ({ id }) => publication(id, true),
    "admin/series/unpublish": ({ id }) => publication(id, false),
    "admin/series/delete": ({ id }) =>
      entries.delete(id) ? { output: undefined } : missing,
    "admin/series/update": ({ id, ...fields }) => {
      const entry = entries.get(id);

      if (entry === undefined) return missing;

      if (taken(fields.slug, id)) return { error: "SLUG_TAKEN" };

      Object.assign(entry, fields);

      return { output: entry };
    },
    "admin/series/addImages": ({ id, imageIds }) => {
      const entry = entries.get(id);

      if (entry === undefined) return missing;

      const available = new Set(
        library.images().map(({ id: imageId }) => imageId),
      );

      if (imageIds.some((imageId) => !available.has(imageId))) return missing;

      entry.imageIds = [...new Set([...entry.imageIds, ...imageIds])];

      return { output: undefined };
    },
    "admin/series/removeImages": ({ id, imageIds }) => {
      const entry = entries.get(id);

      if (entry === undefined) return missing;

      entry.imageIds = entry.imageIds.filter(
        (imageId) => !imageIds.includes(imageId),
      );

      return { output: undefined };
    },
    "admin/series/reorder": ({ id, imageIds }) => {
      const entry = entries.get(id);

      if (entry === undefined) return missing;

      const current = new Set(detail(entry).images.map((image) => image.id));

      if (
        current.size !== imageIds.length ||
        new Set(imageIds).size !== current.size ||
        imageIds.some((imageId) => !current.has(imageId))
      ) {
        return { error: "ORDER_MISMATCH" };
      }

      entry.imageIds = [...imageIds];

      return { output: undefined };
    },
    "admin/series/create": (fields) => {
      if (taken(fields.slug)) return { error: "SLUG_TAKEN" };

      const entry = {
        ...fields,
        id: crypto.randomUUID(),
        published: false,
        publishedAt: null,
      };

      entries.set(entry.id, { ...entry, imageIds: [] });

      return { output: entry };
    },
  } satisfies FakeRoutes;
};
