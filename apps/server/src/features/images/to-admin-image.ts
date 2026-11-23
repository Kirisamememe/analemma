import type { ContractOutputs } from "@analemma/contract";

import { toDeliveryImagePath } from "@/features/images/delivery/delivery-image-path";
import type { DeliveryImageRow } from "@/features/images/queries/delivery-images.query";
import {
  type findNeighborIds,
  type ImageRow,
  isPublished,
} from "@/features/images/queries/images.query";

/** 管理画面に返す画像。 */
export type AdminImage = ContractOutputs["admin"]["images"]["get"];

const MINUTES_PER_HOUR = 60;

const twoDigits = (value: number): string => String(value).padStart(2, "0");

const toOffset = (minutes: number): string => {
  const absolute = Math.abs(minutes);

  return `${minutes < 0 ? "-" : "+"}${twoDigits(Math.trunc(absolute / MINUTES_PER_HOUR))}:${twoDigits(absolute % MINUTES_PER_HOUR)}`;
};

/** 画像の行と、その配信用の画像の行を、管理画面に返す形にする。 */
export const toAdminImage = (
  row: ImageRow,
  deliveryImages: readonly DeliveryImageRow[],
): AdminImage => ({
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
  published: isPublished(row),
  publishedAt: row.publishedAt?.toISOString() ?? null,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
  deliveryImages: deliveryImages
    .toSorted((a, b) => a.width - b.width)
    .map(({ height, imageId, width }) => ({
      width,
      height,
      url: toDeliveryImagePath(imageId, width),
    })),
});

/** DB で取得した前後の画像の ID を管理画面に返す形にする。 */
export const toAdminImageNeighbors = (
  row: NonNullable<Awaited<ReturnType<typeof findNeighborIds>>>,
): ContractOutputs["admin"]["images"]["neighbors"] => ({
  newer: row.newerId,
  older: row.olderId,
});
