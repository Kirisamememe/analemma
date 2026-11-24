import type { FakeOutput, FakeRoutes } from "@/testing/create-fake-api";

/** 作り物の server の、Dropbox との接続の状態。 */
export type FakeDropboxConnection = FakeOutput<"admin/dropbox/get">;

/** 作り物の server の、App folder の写真。 */
export type FakeDropboxPhoto =
  FakeOutput<"admin/dropbox/photos">["photos"][number];

/** 作り物の server の、取り込みの進み具合。 */
export type FakeDropboxImport = NonNullable<
  FakeOutput<"admin/dropbox/getImport">
>;

/** 作り物の Dropbox に、最初に置く状態。 */
export type FakeDropboxSeed = {
  /** 接続の状態。 */
  readonly connection?: FakeDropboxConnection;
  /** App folder の写真。 */
  readonly photos?: readonly FakeDropboxPhoto[];
  /** 最後に始めた取り込み。 */
  readonly run?: FakeDropboxImport;
  /** 写真を読むときに、Dropbox の側で切られていたことにするか。 */
  readonly lost?: boolean;
};

/** つないだときの接続の状態。 */
export const FAKE_DROPBOX_CONNECTED: FakeDropboxConnection = {
  status: "connected",
  accountName: "Kirisame Test",
  accountEmail: "photos@example.com",
  connectedAt: "2026-03-01T09:00:00.000Z",
};

/** Dropbox の認可の画面から戻った URL に付いた値。 */
type FakeDropboxReturn = {
  /** Dropbox が付けた code。 */
  readonly code: string;
  /** 認可を始めたときの state。 */
  readonly state: string;
};

/** 取り込みを始める写真。 */
type FakeImportInput = {
  /** 写真の ID と、選んだときの content_hash。 */
  readonly photos: readonly Pick<FakeDropboxPhoto, "id" | "contentHash">[];
};

/** 作り物の Dropbox が、許可した後に付ける code と state。 */
export const FAKE_DROPBOX_RETURN: FakeDropboxReturn = {
  code: "approved",
  state: "fake-state",
};

const STARTED_AT = "2026-03-01T09:10:00.000Z";
const FINISHED_AT = "2026-03-01T09:12:00.000Z";
const IMAGE_ID_PREFIX = "019b0000-0000-7000-8000-";

/** 作り物の server の、Dropbox につないで写真を取り込む procedure を作る。 */
export const createDropboxRoutes = (seed: FakeDropboxSeed = {}) => {
  let connection: FakeDropboxConnection = seed.connection ?? {
    status: "disconnected",
  };
  let run: FakeDropboxImport | null = seed.run ?? null;
  let added = 0;
  const photos = seed.photos ?? [];
  const isRunning = (): boolean => run?.finishedAt === null;

  const routes = {
    "admin/dropbox/get": () => ({ output: connection }),
    "admin/dropbox/authorize": () => {
      if (connection.status === "unconfigured") {
        return { error: "NOT_CONFIGURED" } as const;
      }

      return connection.status === "connected"
        ? ({ error: "ALREADY_CONNECTED" } as const)
        : {
            output: {
              url: `https://www.dropbox.com/oauth2/authorize?state=${FAKE_DROPBOX_RETURN.state}`,
            },
          };
    },
    "admin/dropbox/connect": ({ code, state }: FakeDropboxReturn) => {
      if (state !== FAKE_DROPBOX_RETURN.state) {
        return { error: "AUTHORIZATION_EXPIRED" } as const;
      }

      if (code !== FAKE_DROPBOX_RETURN.code) {
        return { error: "AUTHORIZATION_REJECTED" } as const;
      }

      connection = FAKE_DROPBOX_CONNECTED;

      return { output: connection };
    },
    "admin/dropbox/disconnect": () => {
      if (isRunning()) return { error: "IMPORT_RUNNING" } as const;

      connection = { status: "disconnected" };

      return { output: undefined };
    },
    "admin/dropbox/photos": () => {
      if (connection.status !== "connected") {
        return { error: "NOT_CONNECTED" } as const;
      }

      return seed.lost === true
        ? ({ error: "CONNECTION_LOST" } as const)
        : { output: { photos: [...photos] } };
    },
    "admin/dropbox/startImport": ({ photos: selected }: FakeImportInput) => {
      if (isRunning()) return { error: "IMPORT_RUNNING" } as const;

      run = {
        startedAt: STARTED_AT,
        finishedAt: null,
        photos: selected.map(({ id }) => ({
          id,
          path: photos.find((photo) => photo.id === id)?.path ?? "",
          status: "waiting",
          imageId: null,
        })),
      };

      return { output: run };
    },
    "admin/dropbox/getImport": () => ({ output: run }),
  } satisfies FakeRoutes;

  return {
    routes,
    /** 待っている先頭の写真を、画像を足したことにする。 */
    advance: (): void => {
      if (run === null) return;

      const index = run.photos.findIndex(({ status }) => status === "waiting");

      added += 1;

      const next = run.photos.map((photo, at) =>
        at === index
          ? {
              ...photo,
              status: "added" as const,
              imageId: `${IMAGE_ID_PREFIX}${String(added).padStart(12, "0")}`,
            }
          : photo,
      );

      const finished = next.every(({ status }) => status !== "waiting");

      run = { ...run, photos: next, finishedAt: finished ? FINISHED_AT : null };
    },
  };
};
