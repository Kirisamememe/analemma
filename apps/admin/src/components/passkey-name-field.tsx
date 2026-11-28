import type { ReactNode } from "react";

import { checkPasskeyName } from "./logic/check-passkey-name";

import { useTranslate } from "@/i18n/use-translate";
import { TextField } from "@/ui/primitives/form-fields";

/** パスキーの名前の入力欄に渡す値。 */
type PasskeyNameFieldProps = {
  /** 名前の変更を始めるときに入っている名前。 */
  defaultValue?: string;
  /** 入力できる文字数の上限。 */
  maxLength?: number;
  /** 名前の付け方の補足を出すか。 */
  showDescription?: boolean;
};

/** パスキーの名前を入力し、contract の決まりに合うか確かめる欄。 */
export const PasskeyNameField = ({
  defaultValue = "",
  maxLength,
  showDescription = false,
}: PasskeyNameFieldProps): ReactNode => {
  const t = useTranslate();

  return (
    <TextField
      autoComplete="off"
      defaultValue={defaultValue}
      description={showDescription ? t("enroll.guide.name") : undefined}
      requiredLabel={t("ui.required")}
      label={t("enroll.name")}
      maxLength={maxLength}
      name="name"
      validate={(value) => {
        const problem = checkPasskeyName(value);

        return problem === undefined ? undefined : t(problem);
      }}
    />
  );
};
