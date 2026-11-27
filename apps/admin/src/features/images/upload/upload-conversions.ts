import { useUploadConversions } from "./hooks/use-upload-conversions";

/** 変換の結果の取り直しを購読する部品に渡す値。 */
type UploadConversionsProps = Parameters<typeof useUploadConversions>[0];

/** 変換の結果の取り直しを、親から切り離して購読する、何も描かない部品。 */
export const UploadConversions = (props: UploadConversionsProps): null => {
  useUploadConversions(props);

  return null;
};
