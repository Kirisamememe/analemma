/** 画像の項目で行う操作。 */
export type ImageFieldAction =
  | {
      /** 選択を開く・取り消す・項目から外す。 */
      type: "choose" | "cancel" | "remove";
    }
  | {
      /** 選んだ画像を確定する。 */
      type: "confirm";
      /** 選んだ画像の ID。 */
      id: string;
    };

/** 操作の後に表示する Dialog と、フォームに残す画像の ID。 */
export const changeImageField = (
  value: string | null,
  action: ImageFieldAction,
) => {
  switch (action.type) {
    case "choose":
      return { open: true, value };
    case "cancel":
      return { open: false, value };
    case "remove":
      return { open: false, value: null };
    case "confirm":
      return {
        open: false,
        value:
          value?.toLowerCase() === action.id.toLowerCase() ? value : action.id,
      };
  }
};
