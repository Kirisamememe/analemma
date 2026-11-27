import { useState } from "react";

import type { ApiOutputs } from "@/api/api-types";
import { useImage } from "@/components/images/hooks/use-image";

type Image = ApiOutputs["admin"]["images"]["get"];

type Visit = {
  /** 現在の URL の画像。 */
  id: string;
  /** 写真が切り替わるときの向き。 */
  direction?: "previous" | "next";
  /** 現在、情報と一緒に表示している写真。 */
  shown?: Image;
};

/** URL と表示中の写真を照らし合わせ、次の写真の準備を待つ。 */
export const useImageVisit = (id: string) => {
  const query = useImage(id, { keepDataOnRefreshError: true });
  const [visit, setVisit] = useState<Visit>({ id });

  const current =
    query._tag === "Loaded" && query.data._tag === "Succeeded"
      ? query.data.data
      : undefined;

  if (visit.id !== id) {
    setVisit({ ...visit, id, direction: id < visit.id ? "next" : "previous" });
  } else if (
    current !== undefined &&
    current !== visit.shown &&
    (visit.shown === undefined ||
      visit.shown.id === id ||
      current.deliveryImages.length === 0)
  ) {
    setVisit({ ...visit, shown: current });
  }

  const shown =
    query._tag === "Loading" ||
    current !== undefined ||
    (query._tag === "Failed" && visit.shown?.id === id)
      ? visit.shown
      : undefined;

  const pending =
    current !== undefined && current.id !== shown?.id ? current : undefined;

  const settle = (photoId: string) => {
    if (current?.id !== photoId) return;

    setVisit((latest) =>
      latest.id === photoId ? { ...latest, shown: current } : latest,
    );
  };

  return { id, direction: visit.direction, shown, pending, query, settle };
};
