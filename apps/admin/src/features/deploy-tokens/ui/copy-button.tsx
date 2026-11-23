import type { ReactNode, Ref } from "react";

import { useTranslate } from "@/i18n/use-translate";
import { Button } from "@/ui/primitives/button";
import { Icon } from "@/ui/primitives/graphics";
import { tv } from "@/ui/tv";

const face = tv({
  base: "col-start-1 row-start-1 flex items-center justify-center gap-2",
  variants: {
    shown: {
      false: "invisible",
    },
  },
});

/** コピーのボタンに渡す値。 */
type CopyButtonProps = {
  /** ボタンで返す、コピーした結果。 */
  result: "Copied" | "Failed" | undefined;
  /** 押したときに呼ぶ関数。 */
  onPress: () => void;
  /** ボタンの要素(focus を移すときに使う)。 */
  ref?: Ref<HTMLButtonElement>;
};

/** コピーした結果を文言とアイコンで返す、トークンのコピーのボタン。 */
export const CopyButton = ({
  result,
  onPress,
  ref,
}: CopyButtonProps): ReactNode => {
  const t = useTranslate();
  const isCopied = result === "Copied";

  return (
    <>
      <Button onPress={onPress} ref={ref ?? null} tone="primary">
        <span className="grid">
          <span
            aria-hidden={result !== undefined}
            className={face({ shown: result === undefined })}
          >
            {t("deployTokens.copy")}
          </span>
          <span aria-hidden={!isCopied} className={face({ shown: isCopied })}>
            <Icon name="check" />
            {t("deployTokens.copiedLabel")}
          </span>
          <span
            aria-hidden={result !== "Failed"}
            className={face({ shown: result === "Failed" })}
          >
            <Icon name="circle-alert" />
            {t("deployTokens.copyFailedLabel")}
          </span>
        </span>
      </Button>
      <output className="sr-only">
        {result === undefined
          ? ""
          : t(isCopied ? "deployTokens.copied" : "deployTokens.copyFailed")}
      </output>
    </>
  );
};
