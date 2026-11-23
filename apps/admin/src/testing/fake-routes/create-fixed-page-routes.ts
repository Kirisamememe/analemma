import {
  type ContentIssue,
  type FixedPageContent,
  type KindDefinition,
  type KindDefinitionInput,
  kindDefinition,
  toContentSchema,
} from "@analemma/contract";

import type {
  FakeInput,
  FakeOutput,
  FakeReply,
  FakeRoutes,
} from "@/testing/create-fake-api";

/** 作り物の server に最初に置く、1つの固定ページ。 */
export type FakeFixedPageSeed = {
  /** 種類の名前。 */
  readonly kind: string;
  /** slug。 */
  readonly slug: string;
  /** タイトル。 */
  readonly title: string;
  /** 公開しているか。 */
  readonly published?: boolean;
  /** 中身。 */
  readonly content?: FixedPageContent;
};

/** 作り物の server に置く固定ページと種類。 */
export type FakeFixedPageState = {
  /** 種類の定義。 */
  readonly kinds?: readonly KindDefinitionInput[];
  /** 並び順に並べた固定ページ。 */
  readonly pages?: readonly FakeFixedPageSeed[];
};

/** 作り物の server が持つ、1つの固定ページ。 */
export type FakeFixedPage = FakeOutput<"admin/fixedPages/get">;

type FixedPagePath =
  | "admin/fixedPages/create"
  | "admin/fixedPages/delete"
  | "admin/fixedPages/get"
  | "admin/fixedPages/list"
  | "admin/fixedPages/publish"
  | "admin/fixedPages/reorder"
  | "admin/fixedPages/unpublish"
  | "admin/fixedPages/update"
  | "admin/kinds/get"
  | "admin/kinds/list"
  | "admin/session/get";

type FixedPageReplies = { [Path in FixedPagePath]: FakeReply<Path> };

type ReplyOverrides = {
  [Path in FixedPagePath]?:
    | (() => FixedPageReplies[Path] | Promise<FixedPageReplies[Path]>)
    | undefined;
};

const FIRST_MOMENT = Date.parse("2026-03-01T09:00:00.000Z");
const MINUTE = 60_000;
const SESSION_EXPIRES_AT = "2026-03-02T09:00:00.000Z";
const MAX_ISSUES = 20;

const summaryOf = ({
  content: _content,
  ...summary
}: FakeFixedPage): FakeOutput<"admin/fixedPages/list">["pages"][number] =>
  summary;

const withSortedKeys = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((item: unknown) => withSortedKeys(item));
  }

  if (typeof value !== "object" || value === null) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .toSorted(([a], [b]) => (a < b ? -1 : Number(a > b)))
      .map(([key, item]) => [key, withSortedKeys(item)]),
  );
};

const sameContent = (a: FixedPageContent, b: FixedPageContent): boolean =>
  JSON.stringify(withSortedKeys(a)) === JSON.stringify(withSortedKeys(b));

type InvalidContent = {
  /** 失敗の code。 */
  readonly error: "INVALID_CONTENT";
  /** 中身が定義に合わない場所。 */
  readonly data: {
    /** 合わない理由の並び。 */
    readonly issues: ContentIssue[];
  };
};

const checkContent = (
  kind: KindDefinition,
  content: FixedPageContent,
): InvalidContent | undefined => {
  const result = toContentSchema({
    fields: kind.fields,
    unknownKeys: "keep",
  }).safeParse(content);

  return result.success
    ? undefined
    : {
        error: "INVALID_CONTENT",
        data: {
          issues: result.error.issues
            .slice(0, MAX_ISSUES)
            .map(({ code, message, path }) => ({
              path: path.map((key) =>
                typeof key === "symbol" ? String(key) : key,
              ),
              code,
              message,
            })),
        },
      };
};

/** 固定ページと種類の procedure を、状態ごと真似る作り物の server の応答を作る。 */
export const createFixedPageRoutes = ({
  kinds: kindSeeds = [],
  pages: pageSeeds = [],
}: FakeFixedPageState) => {
  let ticks = 0;

  const now = (): string => {
    const moment = new Date(FIRST_MOMENT + ticks * MINUTE).toISOString();

    ticks += 1;

    return moment;
  };

  let created = 0;

  const nextId = (): string => {
    created += 1;

    return `019a0000-0000-7000-8000-${String(created).padStart(12, "0")}`;
  };

  const kindsCreatedAt = now();
  const kinds = kindSeeds.map((seed) => kindDefinition.parse(seed));
  let pages: FakeFixedPage[] = pageSeeds.map((seed, position) => {
    const moment = now();

    return {
      id: nextId(),
      kind: seed.kind,
      slug: seed.slug,
      title: seed.title,
      published: seed.published ?? false,
      publishedAt: seed.published === true ? moment : null,
      position,
      createdAt: moment,
      updatedAt: moment,
      content: seed.content ?? {},
    };
  });
  const overrides: ReplyOverrides = {};

  const handle = <Path extends FixedPagePath>(
    path: Path,
    success: (input: FakeInput<Path>) => FixedPageReplies[Path],
  ) => {
    const replyBeforeInput = ():
      | FixedPageReplies[Path]
      | Promise<FixedPageReplies[Path]>
      | undefined => {
      const override = overrides[path];

      overrides[path] = undefined;

      return override?.();
    };

    return Object.assign((input: FakeInput<Path>) => success(input), {
      replyBeforeInput,
    });
  };

  const findPage = (id: string): FakeFixedPage | undefined =>
    pages.find((page) => page.id === id.toLowerCase());

  const isSlugTaken = (slug: string, except?: string): boolean =>
    pages.some((page) => page.slug === slug && page.id !== except);

  const replacePage = (next: FakeFixedPage): FakeFixedPage => {
    pages = pages.map((page) => (page.id === next.id ? next : page));

    return next;
  };

  const sorted = (): FakeFixedPage[] =>
    pages.toSorted(
      (a, b) =>
        a.position - b.position ||
        a.createdAt.localeCompare(b.createdAt) ||
        a.id.localeCompare(b.id),
    );

  const kindSummaryOf = ({ name, label }: KindDefinition) => ({
    name,
    label,
    createdAt: kindsCreatedAt,
    updatedAt: kindsCreatedAt,
  });

  return {
    routes: {
      "admin/session/get": handle("admin/session/get", () => ({
        output: { expiresAt: SESSION_EXPIRES_AT },
      })),
      "admin/kinds/list": handle("admin/kinds/list", () => ({
        output: { kinds: kinds.map((kind) => kindSummaryOf(kind)) },
      })),
      "admin/kinds/get": handle("admin/kinds/get", (input) => {
        const kind = kinds.find(({ name }) => name === input.name);

        return kind === undefined
          ? { error: "NOT_FOUND" }
          : { output: { ...kindSummaryOf(kind), fields: kind.fields } };
      }),
      "admin/fixedPages/list": handle("admin/fixedPages/list", () => ({
        output: { pages: sorted().map((page) => summaryOf(page)) },
      })),
      "admin/fixedPages/get": handle("admin/fixedPages/get", (input) => {
        const page = findPage(input.id);

        return page === undefined ? { error: "NOT_FOUND" } : { output: page };
      }),
      "admin/fixedPages/create": handle("admin/fixedPages/create", (input) => {
        const kind = kinds.find(({ name }) => name === input.kind);

        if (kind === undefined) {
          return { error: "UNKNOWN_KIND" };
        }

        const invalid = checkContent(kind, input.content);

        if (invalid !== undefined) {
          return invalid;
        }

        if (isSlugTaken(input.slug)) {
          return { error: "SLUG_TAKEN" };
        }

        const moment = now();

        const page: FakeFixedPage = {
          id: nextId(),
          kind: input.kind,
          slug: input.slug,
          title: input.title,
          published: false,
          publishedAt: null,
          position: Math.max(-1, ...pages.map(({ position }) => position)) + 1,
          createdAt: moment,
          updatedAt: moment,
          content: input.content,
        };

        pages = [...pages, page];

        return { output: page };
      }),
      "admin/fixedPages/update": handle("admin/fixedPages/update", (input) => {
        const page = findPage(input.id);

        if (page === undefined) {
          return { error: "NOT_FOUND" };
        }

        const kind = kinds.find(({ name }) => name === page.kind);

        const invalid =
          kind === undefined ? undefined : checkContent(kind, input.content);

        if (invalid !== undefined) {
          return invalid;
        }

        if (isSlugTaken(input.slug, page.id)) {
          return { error: "SLUG_TAKEN" };
        }

        const changed =
          page.slug !== input.slug ||
          page.title !== input.title ||
          !sameContent(page.content, input.content);

        return {
          output: replacePage({
            ...page,
            slug: input.slug,
            title: input.title,
            content: input.content,
            updatedAt: changed ? now() : page.updatedAt,
          }),
        };
      }),
      "admin/fixedPages/publish": handle(
        "admin/fixedPages/publish",
        (input) => {
          const page = findPage(input.id);

          return page === undefined
            ? { error: "NOT_FOUND" }
            : {
                output: summaryOf(
                  replacePage({
                    ...page,
                    published: true,
                    publishedAt: page.publishedAt ?? now(),
                  }),
                ),
              };
        },
      ),
      "admin/fixedPages/unpublish": handle(
        "admin/fixedPages/unpublish",
        (input) => {
          const page = findPage(input.id);

          return page === undefined
            ? { error: "NOT_FOUND" }
            : {
                output: summaryOf(
                  replacePage({ ...page, published: false, publishedAt: null }),
                ),
              };
        },
      ),
      "admin/fixedPages/reorder": handle(
        "admin/fixedPages/reorder",
        (input) => {
          const ids = input.ids.map((id) => id.toLowerCase());

          if (
            ids.length !== pages.length ||
            new Set(ids).size !== ids.length ||
            ids.some((id) => findPage(id) === undefined)
          ) {
            return { error: "ORDER_MISMATCH" };
          }

          pages = pages.map((page) => ({
            ...page,
            position: ids.indexOf(page.id),
          }));

          return {
            output: { pages: sorted().map((page) => summaryOf(page)) },
          };
        },
      ),
      "admin/fixedPages/delete": handle("admin/fixedPages/delete", (input) => {
        const page = findPage(input.id);

        if (page === undefined) {
          return { error: "NOT_FOUND" };
        }

        pages = pages.filter(({ id }) => id !== page.id);

        return { output: undefined };
      }),
    } satisfies FakeRoutes,
    pages: (): readonly FakeFixedPage[] => sorted(),
    replyNext: <Path extends FixedPagePath>(
      path: Path,
      reply: NonNullable<ReplyOverrides[Path]>,
    ): void => {
      overrides[path] = reply;
    },
  };
};
