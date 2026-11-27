import type { ContractOutputs } from "@analemma/contract";

import { toDeliveryImagePath } from "@/features/images/delivery/delivery-image-path";
import type { DeliveryImageRow } from "@/features/images/queries/delivery-images.query";
import type {
  findNeighborIds,
  ImageRow,
} from "@/features/images/queries/images.query";

/** 管理画面に返す画像。 */
export type AdminImage = ContractOutputs["admin"]["images"]["get"];

const MINUTES_PER_HOUR = 60;

const twoDigits = (value: number): string => String(value).padStart(2, "0");

const toOffset = (minutes: number): string => {
  const absolute = Math.abs(minutes);

  return `${minutes < 0 ? "-" : "+"}${twoDigits(Math.trunc(absolute / MINUTES_PER_HOUR))}:${twoDigits(absolute % MINUTES_PER_HOUR)}`;
};

const toImageDetails = (row: ImageRow) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  alt: row.alt,
  takenAt: row.takenAt?.replace(" ", "T") ?? null,
  takenAtOffset:
    row.takenAtOffsetMinutes === null
      ? null
      : toOffset(row.takenAtOffsetMinutes),
  camera: row.camera,
  lens: row.lens,
  focalLength: row.focalLength,
  fNumber: row.fNumber,
  exposureTime: row.exposureTime,
  iso: row.iso,
});

const toDeliveryImages = (rows: readonly DeliveryImageRow[], origin?: string) =>
  rows
    .toSorted((a, b) => a.width - b.width)
    .map(({ width, height, imageId }) => {
      const path = toDeliveryImagePath(imageId, width);
      return {
        width,
        height,
        url: origin === undefined ? path : new URL(path, origin).href,
      };
    });

/** 1枚の画像と幅ごとの配信用の画像を結合した行。 */
type ImageWithDelivery = {
  /** 公開している画像の行。 */
  readonly image: ImageRow | null;
  /** 配信用の画像の行。 */
  readonly deliveryImage: DeliveryImageRow | null;
};

/** 1枚の画像と幅ごとの配信用の画像を、公開サイトに返す形にする。 */
export const toPublishedImage = (
  rows: readonly ImageWithDelivery[],
  origin: string,
): ContractOutputs["public"]["images"]["get"] | undefined => {
  const image = rows[0]?.image;

  if (!image) return undefined;

  const deliveries = rows.flatMap(({ deliveryImage }) => deliveryImage ?? []);

  return {
    ...toImageDetails(image),
    deliveryImages: toDeliveryImages(deliveries, origin),
  };
};

/** 画像の行を管理画面に返す形にする。 */
export const toAdminImage = (
  row: ImageRow,
  deliveryImages: readonly DeliveryImageRow[],
): AdminImage => ({
  ...toImageDetails(row),
  deliveryImages: toDeliveryImages(deliveryImages),
  status: row.status,
  publishedAt: row.publishedAt?.toISOString() ?? null,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

/** DB で取得した前後の画像の ID を管理画面に返す形にする。 */
export const toAdminImageNeighbors = (
  row: NonNullable<Awaited<ReturnType<typeof findNeighborIds>>>,
): ContractOutputs["admin"]["images"]["neighbors"] => ({
  newer: row.newerId,
  older: row.olderId,
});
