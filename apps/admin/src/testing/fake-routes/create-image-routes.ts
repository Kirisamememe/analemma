import type {
  FakeInput,
  FakeOutput,
  FakeReply,
  FakeRoutes,
} from "@/testing/create-fake-api";

/** 作り物の server が持つ、1つの画像。 */
export type FakeImage = FakeOutput<"admin/images/get">;

/** 作り物の server に最初に置く、1つの画像(省いた項目は null)。 */
export type FakeImageSeed = Partial<
  Omit<
    FakeImage,
    "id" | "published" | "publishedAt" | "createdAt" | "updatedAt"
  >
> & {
  /** 公開しているか(省くと公開)。 */
  readonly published?: boolean;
};

type ImagePath =
  | "admin/images/delete"
  | "admin/images/get"
  | "admin/images/list"
  | "admin/images/publish"
  | "admin/images/unpublish"
  | "admin/images/update"
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
  deliveryImages: [],
} satisfies Partial<FakeImage>;

/** 画像の procedure を、状態ごと真似る作り物の server の応答を作る。 */
export const createImageRoutes = (seeds: readonly FakeImageSeed[] = []) => {
  let ticks = 0;

  const now = (): string => {
    const moment = new Date(FIRST_MOMENT + ticks * MINUTE).toISOString();

    ticks += 1;

    return moment;
  };

  const create = ({ published = true, ...seed }: FakeImageSeed): FakeImage => {
    const moment = now();

    created += 1;

    return Object.assign(structuredClone(EMPTY), seed, {
      id: `019b0000-0000-7000-8000-${String(created).padStart(12, "0")}`,
      published,
      publishedAt: published ? moment : null,
      createdAt: moment,
      updatedAt: moment,
    });
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
          published: true,
          publishedAt: image.publishedAt ?? now(),
        })),
      ),
      "admin/images/unpublish": handle(
        "admin/images/unpublish",
        changeImage((image) => ({
          ...image,
          published: false,
          publishedAt: null,
        })),
      ),
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
    replyNext: <Path extends ImagePath>(
      path: Path,
      reply: NonNullable<ReplyOverrides[Path]>,
    ): void => {
      overrides[path] = reply;
    },
  };
};
