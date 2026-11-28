import type {
  FakeInput,
  FakeOutput,
  FakeReply,
  FakeRoutes,
} from "@/testing/create-fake-api";

/** 作り物の server が持つ、1つの画像。 */
export type FakeImage = FakeOutput<"admin/images/get">;

/** 作り物の server に最初に置く画像のプロパティ。 */
export type FakeImageSeed = Partial<
  Omit<FakeImage, "id" | "status" | "publishedAt" | "createdAt" | "updatedAt">
> & {
  /** 画像を公開しているか。 */
  readonly published?: boolean;
  /** 変換を終えていない画像の状態。 */
  readonly status?: Exclude<FakeImage["status"], "published" | "unpublished">;
};

type ImagePath =
  | "admin/images/delete"
  | "admin/images/get"
  | "admin/images/list"
  | "admin/images/neighbors"
  | "admin/images/publish"
  | "admin/images/unpublish"
  | "admin/images/update"
  | "admin/images/upload"
  | "admin/session/get";

type ImageReplies = { [Path in ImagePath]: FakeReply<Path> };

type ReplyOverrides = {
  [Path in ImagePath]?:
    | (() => ImageReplies[Path] | Promise<ImageReplies[Path]>)
    | undefined;
};

const FIRST_MOMENT = Date.parse("2026-03-01T09:00:00.000Z");
const MINUTE = 60_000;
const SESSION_EXPIRES_AT = "2026-03-02T09:00:00.000Z";

const EMPTY = {
  title: null,
  description: null,
  alt: null,
  takenAt: null,
  takenAtOffset: null,
  camera: null,
  lens: null,
  focalLength: null,
  fNumber: null,
  exposureTime: null,
  iso: null,
} satisfies Partial<FakeImage>;

const PHOTO_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/heic",
  "image/heif",
]);

const isPhoto = ({ name, type }: File): boolean =>
  PHOTO_TYPES.has(type) || /\.(?:jpe?g|png|webp|avif|hei[cf])$/iv.test(name);

/** 画像の procedure を、状態ごと真似る作り物の server の応答を作る。 */
export const createImageRoutes = (
  seeds: readonly FakeImageSeed[] = [],
  uploaded: FakeImageSeed = {},
) => {
  let ticks = 0;

  const now = (): string => {
    const moment = new Date(FIRST_MOMENT + ticks * MINUTE).toISOString();

    ticks += 1;

    return moment;
  };

  const create = ({
    published = true,
    status,
    deliveryImages = [],
    ...seed
  }: FakeImageSeed): FakeImage => {
    const moment = now();

    created += 1;

    return {
      ...EMPTY,
      tags: [],
      ...seed,
      id: `019b0000-0000-7000-8000-${String(created).padStart(12, "0")}`,
      status: status ?? (published ? "published" : "unpublished"),
      publishedAt: status === undefined && published ? moment : null,
      deliveryImages: deliveryImages.toSorted((a, b) => a.width - b.width),
      createdAt: moment,
      updatedAt: moment,
    };
  };

  let created = 0;
  let images: FakeImage[] = seeds
    .toReversed() // 古いものから作り、ID を作った順に大きくする
    .map((seed) => create(seed))
    .toReversed();

  const overrides: ReplyOverrides = {};

  const handle = <Path extends ImagePath>(
    path: Path,
    success: (input: FakeInput<Path>) => ImageReplies[Path],
  ) => {
    const replyBeforeInput = ():
      | ImageReplies[Path]
      | Promise<ImageReplies[Path]>
      | undefined => {
      const override = overrides[path];

      overrides[path] = undefined;

      return override?.();
    };

    return Object.assign((input: FakeInput<Path>) => success(input), {
      replyBeforeInput,
    });
  };

  const findImage = (id: string): FakeImage | undefined =>
    images.find((image) => image.id === id.toLowerCase());

  const replaceImage = (next: FakeImage): FakeImage => {
    images = images.map((image) => (image.id === next.id ? next : image));

    return next;
  };

  const changeImage =
    (change: (image: FakeImage) => FakeImage) =>
    ({ id }: Record<"id", string>) => {
      const image = findImage(id);

      return image === undefined
        ? ({ error: "NOT_FOUND" } as const)
        : { output: replaceImage(change(image)) };
    };

  return {
    routes: {
      "admin/session/get": handle("admin/session/get", () => ({
        output: { expiresAt: SESSION_EXPIRES_AT },
      })),
      "admin/images/list": handle("admin/images/list", ({ cursor, limit }) => {
        const after =
          cursor === undefined
            ? images
            : images.filter(({ id }) => id < cursor.toLowerCase());

        const page = after.slice(0, limit);

        return {
          output: {
            images: page,
            nextCursor: after.length > limit ? (page.at(-1)?.id ?? null) : null,
          },
        };
      }),
      "admin/images/get": handle("admin/images/get", ({ id }) => {
        const image = findImage(id);

        return image === undefined ? { error: "NOT_FOUND" } : { output: image };
      }),
      "admin/images/neighbors": handle("admin/images/neighbors", ({ id }) => {
        const index = images.findIndex(
          (image) => image.id === id.toLowerCase(),
        );

        return index < 0
          ? { error: "NOT_FOUND" }
          : {
              output: {
                newer: images[index - 1]?.id ?? null,
                older: images[index + 1]?.id ?? null,
              },
            };
      }),
      "admin/images/update": handle(
        "admin/images/update",
        ({ id, title, description, alt }) =>
          changeImage((image) => ({
            ...image,
            title,
            description,
            alt,
            updatedAt:
              image.title === title &&
              image.description === description &&
              image.alt === alt
                ? image.updatedAt
                : now(),
          }))({ id }),
      ),
      "admin/images/publish": handle(
        "admin/images/publish",
        changeImage((image) => ({
          ...image,
          status: "published" as const,
          publishedAt: image.publishedAt ?? now(),
        })),
      ),
      "admin/images/unpublish": handle(
        "admin/images/unpublish",
        changeImage((image) => ({
          ...image,
          status: "unpublished" as const,
          publishedAt: null,
        })),
      ),
      "admin/images/upload": handle("admin/images/upload", ({ photo }) => {
        if (!isPhoto(photo)) {
          return { error: "UNSUPPORTED_FORMAT" };
        }

        const image = create(uploaded);

        images = [image, ...images];

        return { output: image };
      }),
      "admin/images/delete": handle("admin/images/delete", ({ id }) => {
        const image = findImage(id);

        if (image === undefined) {
          return { error: "NOT_FOUND" };
        }

        images = images.filter((other) => other.id !== image.id);

        return { output: undefined };
      }),
    } satisfies FakeRoutes,
    images: (): readonly FakeImage[] => images,
    /** 変換を待つ画像を、変換を終えた状態にする。 */
    convert: (
      id: string,
      change: Pick<FakeImage, "status"> &
        Partial<Pick<FakeImage, "deliveryImages">>,
    ): void => {
      const image = findImage(id);

      if (image === undefined) return;

      replaceImage({
        ...image,
        ...change,
        publishedAt: change.status === "published" ? now() : null,
      });
    },
    replyNext: <Path extends ImagePath>(
      path: Path,
      reply: NonNullable<ReplyOverrides[Path]>,
    ): void => {
      overrides[path] = reply;
    },
  };
};
