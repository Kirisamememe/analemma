import type { AppContext } from "@/context";
import { isSessionActive } from "@/features/auth/session/resume-session";
import { parseDeliveryImagePath } from "@/features/images/delivery/delivery-image-path";
import { findDeliveryImageFile } from "@/features/images/queries/delivery-images.query";
import { isPublished } from "@/features/images/queries/images.query";
import { readSessionCookie, toSessionCookie } from "@/platform/session-cookie";

const PUBLISHED_CACHE = "public, max-age=3600, must-revalidate";
const UNPUBLISHED_CACHE = "private, no-store";
const SESSION_SITES = new Set(["same-origin", "none"]);

const notFound = (): Response =>
  new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });

const hasAdminSession = async (
  context: AppContext,
  request: Request,
): Promise<boolean> => {
  const token = readSessionCookie(
    request.headers,
    toSessionCookie(context.relyingParty.origin),
  );

  return (
    SESSION_SITES.has(request.headers.get("sec-fetch-site") ?? "") &&
    token !== undefined &&
    isSessionActive({ db: context.db, token, now: context.clock.now() })
  );
};

/** 外部用のポートで、配信用の画像のファイルを返す handler。 */
export const serveDeliveryImage = async (
  context: AppContext,
  request: Request,
): Promise<Response> => {
  const target = parseDeliveryImagePath(new URL(request.url).pathname);

  const found =
    target === undefined
      ? undefined
      : await findDeliveryImageFile(context.db, target);

  if (target === undefined || found === undefined) {
    return notFound();
  }

  const published = isPublished(found);

  if (!published && !(await hasAdminSession(context, request))) {
    return notFound();
  }

  const file = await context.storage.read(found.fileKey);

  if (file === undefined) {
    context.logger.write({
      level: "error",
      message: "配信用の画像のファイルが置き場所に無い",
      details: { ...target, fileKey: found.fileKey },
    });

    return notFound();
  }

  return new Response(file, {
    headers: {
      "Content-Type": "image/avif",
      "Cache-Control": published ? PUBLISHED_CACHE : UNPUBLISHED_CACHE,
    },
  });
};
