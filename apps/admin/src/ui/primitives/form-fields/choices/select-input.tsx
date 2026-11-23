import { useContext, type ReactNode } from "react";
import {
  Button,
  Select as AriaSelect,
  SelectStateContext,
  SelectValue,
} from "react-aria-components";
import { useTranslation } from "react-i18next";

import {
  fieldControl,
  fieldRoot,
} from "@/ui/primitives/form-fields/field-control";
import { Icon } from "@/ui/primitives/graphics";
import { ListBoxPopover } from "@/ui/primitives/overlays";
import { typography } from "@/ui/typography";

/** Select の選択肢。 */
export type SelectOption = {
  /** 選択肢の値。 */
  readonly value: string;
  /** 選択肢のラベル。 */
  readonly label: string;
};

/** 選択肢の入力に渡す値。 */
export type SelectInputProps = {
  /** フォームのキー。 */
  name?: string | undefined;
  /** アクセシブルな名前。 */
  "aria-label"?: string | undefined;
  /** 選択肢。 */
  options: readonly SelectOption[];
  /** 最初に選んでおく値。 */
  defaultValue?: string | undefined;
  /** 呼び出し元で管理する選択値。 */
  value?: string | null | undefined;
  /** 選択が必須か。 */
  isRequired?: boolean | undefined;
  /** 無効か。 */
  isDisabled?: boolean | undefined;
  /** 誤りがあるか。 */
  isInvalid?: boolean | undefined;
  /** 選択値が変わったときに呼ぶ関数。 */
  onChange?: ((value: string | null) => void) | undefined;
  /** focus が外れたときに呼ぶ関数。 */
  onBlur?: (() => void) | undefined;
  /** 入力の検証に使う React Aria Components の指定。 */
  validationBehavior?: "aria" | "native" | undefined;
};

type SelectRootProps = Omit<SelectInputProps, "options"> & {
  /** Select を構成する部品。 */
  children: ReactNode;
};

/** Select の状態と関連付けを子の部品に渡す。 */
export const SelectRoot = ({
  "aria-label": ariaLabel,
  name,
  defaultValue,
  isRequired = false,
  isDisabled = false,
  value,
  isInvalid,
  onBlur,
  onChange,
  validationBehavior,
  children,
}: SelectRootProps): ReactNode => {
  const selectedValue = value === null && !isRequired ? "" : value;

  const state = {
    ...(ariaLabel === undefined ? {} : { "aria-label": ariaLabel }),
    ...(name === undefined ? {} : { name }),
    ...(selectedValue === undefined ? {} : { value: selectedValue }),
    ...(isInvalid === undefined ? {} : { isInvalid }),
    ...(validationBehavior === undefined ? {} : { validationBehavior }),
  };

  return (
    <AriaSelect
      className={fieldRoot()}
      defaultValue={defaultValue ?? null}
      isDisabled={isDisabled}
      isRequired={isRequired}
      onBlur={() => {
        onBlur?.();
      }}
      onChange={(key) => {
        onChange?.(typeof key === "string" && key !== "" ? key : null);
      }}
      // oxlint-disable-next-line project/styling-boundary -- React Aria の未指定の props を省く。見た目の props は含まない。
      {...state}
    >
      {children}
    </AriaSelect>
  );
};

/** 選択のボタンと選択肢の一覧。 */
export const SelectControl = ({
  options,
  isRequired,
}: Pick<SelectInputProps, "isRequired" | "options">): ReactNode => {
  const { t } = useTranslation();
  const state = useContext(SelectStateContext);
  const placeholder = t("ui.select.placeholder");

  const choices =
    isRequired === true
      ? options
      : [{ value: "", label: t("ui.select.none") }, ...options];

  return (
    <>
      <Button
        className={fieldControl({
          className: [
            "flex h-control items-center justify-between gap-2 px-3 @max-3xs/nested-form:px-1",
            typography({ role: "body" }),
          ],
        })}
        data-invalid={
          state?.displayValidation.isInvalid === true ? true : undefined
        }
      >
        <SelectValue className="min-w-0 flex-1 truncate text-start is-placeholder:text-fg-muted">
          {({ isPlaceholder, selectedText }) =>
            isPlaceholder ? placeholder : selectedText
          }
        </SelectValue>
        <span className="flex text-fg-muted">
          <Icon name="chevron-down" />
        </span>
      </Button>
      <ListBoxPopover options={choices} />
    </>
  );
};

/** 選択肢から1つを選ぶ入力。 */
export const SelectInput = ({
  "aria-label": ariaLabel,
  name,
  defaultValue,
  value,
  isDisabled,
  isInvalid,
  isRequired,
  onBlur,
  onChange,
  validationBehavior,
  options,
}: SelectInputProps): ReactNode => (
  <SelectRoot
    aria-label={ariaLabel}
    name={name}
    defaultValue={defaultValue}
    value={value}
    isDisabled={isDisabled}
    isInvalid={isInvalid}
    isRequired={isRequired}
    onBlur={onBlur}
    onChange={onChange}
    validationBehavior={validationBehavior}
  >
    <SelectControl isRequired={isRequired} options={options} />
  </SelectRoot>
);
