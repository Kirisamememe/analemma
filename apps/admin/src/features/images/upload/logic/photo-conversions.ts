import type { PhotoUpload, UploadStatus } from "./photo-uploads";

import type { ApiOutputs } from "@/api/api-types";

const STATUS_OF_IMAGE = {
  processing: "converting",
  unreadable: "unreadable",
  interrupted: "interrupted",
  unpublished: "added",
  published: "added",
} as const satisfies Record<
  ApiOutputs["admin"]["images"]["upload"]["status"],
  UploadStatus
>;

/** 受け取られた写真に、作った画像の ID と、その画像の状態に合う状態を持たせる。 */
export const withAdded =
  (
    id: number,
    image: Pick<
      ApiOutputs["admin"]["images"]["upload"],
      "id" | "status" | "deliveryImages"
    >,
  ) =>
  (uploads: readonly PhotoUpload[]): readonly PhotoUpload[] =>
    uploads.map((upload) =>
      upload.id === id
        ? {
            ...upload,
            status: STATUS_OF_IMAGE[image.status],
            progress: undefined,
            imageId: image.id,
            previewUrl: image.deliveryImages[0]?.url,
          }
        : upload,
    );

/** 取り直した変換の結果と、それを待っていた写真。 */
export type ConversionResult = {
  /** 一覧の中で写真を見分ける番号。 */
  readonly id: number;
  /** 結果を待っていた画像の ID。 */
  readonly imageId: string;
  /** 取り直した画像(無くなっていたら undefined)。 */
  readonly image:
    | Pick<ApiOutputs["admin"]["images"]["get"], "status" | "deliveryImages">
    | undefined;
};

/** 同じ画像の変換の結果を今も待っている写真にだけ、取り直した結果を当てる。 */
export const withConverted =
  ({ id, imageId, image }: ConversionResult) =>
  (uploads: readonly PhotoUpload[]): readonly PhotoUpload[] =>
    uploads.map((upload) => {
      const isWaiting =
        upload.id === id &&
        upload.imageId === imageId &&
        upload.status === "converting";

      if (!isWaiting) return upload;

      return image === undefined
        ? { ...upload, status: "interrupted", imageId: undefined }
        : {
            ...upload,
            status: STATUS_OF_IMAGE[image.status],
            previewUrl: image.deliveryImages[0]?.url,
          };
    });

/** 変換を終えられなかった写真を、前の画像を消している状態にするか、その状態から戻す。 */
export const withRetryStarted =
  (id: number, started: boolean) =>
  (uploads: readonly PhotoUpload[]): readonly PhotoUpload[] =>
    uploads.map((upload) =>
      upload.id === id &&
      upload.status === (started ? "interrupted" : "replacing")
        ? { ...upload, status: started ? "replacing" : "interrupted" }
        : upload,
    );

/** 前の画像を消している写真が、その画像のまま一覧に残っているか。 */
export const isReplacing = (
  uploads: readonly PhotoUpload[],
  { id, imageId }: Pick<ConversionResult, "id" | "imageId">,
): boolean =>
  uploads.some(
    (upload) =>
      upload.id === id &&
      upload.imageId === imageId &&
      upload.status === "replacing",
  );

/** 変換の結果を待っている写真のうち、いちばん先に受け取られた写真を返す。 */
export const nextConverting = (
  uploads: readonly PhotoUpload[],
): (PhotoUpload & Record<"imageId", string>) | undefined =>
  uploads
    .flatMap((upload) =>
      upload.status === "converting" && upload.imageId !== undefined
        ? [{ ...upload, imageId: upload.imageId }]
        : [],
    )
    .toSorted((a, b) => (a.imageId < b.imageId ? -1 : 1))
    .at(0);
