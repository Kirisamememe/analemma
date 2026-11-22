import { useContext, type ReactNode } from "react";
import {
  Button,
  ListBox,
  ListBoxItem,
  Popover,
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
  readonly name?: string | undefined;
  /** アクセシブルな名前。 */
  readonly "aria-label"?: string | undefined;
  /** 選択肢。 */
  readonly options: readonly SelectOption[];
  /** 最初に選んでおく値。 */
  readonly defaultValue?: string | undefined;
  /** 呼び出し元で管理する選択値。 */
  readonly value?: string | null | undefined;
  /** 選択が必須か。 */
  readonly isRequired?: boolean | undefined;
  /** 無効か。 */
  readonly isDisabled?: boolean | undefined;
  /** 誤りがあるか。 */
  readonly isInvalid?: boolean | undefined;
  /** 選択値が変わったときに呼ぶ関数。 */
  readonly onChange?: ((value: string | null) => void) | undefined;
  /** focus が外れたときに呼ぶ関数。 */
  readonly onBlur?: (() => void) | undefined;
  /** 入力の検証に使う React Aria Components の指定。 */
  readonly validationBehavior?: "aria" | "native" | undefined;
};

type SelectRootProps = Omit<SelectInputProps, "options"> & {
  /** Select を構成する部品。 */
  readonly children: ReactNode;
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
  const state = {
    ...(ariaLabel === undefined ? {} : { "aria-label": ariaLabel }),
    ...(name === undefined ? {} : { name }),
    ...(value === undefined ? {} : { value }),
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
            "flex h-control items-center justify-between gap-2 px-3",
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
      <Popover
        className="z-overlay w-(--trigger-width) overflow-y-auto overscroll-contain rounded-control bg-surface text-fg shadow-overlay outline outline-fg/10"
        offset={4}
      >
        <ListBox
          className="flex flex-col gap-1 p-1 outline-hidden"
          items={choices}
        >
          {({ label: optionLabel, value: optionValue }) => (
            <ListBoxItem
              className={typography({
                role: "body",
                className:
                  "group flex items-start justify-between gap-2 rounded-xs px-2 py-1 text-fg outline-hidden is-hovered:state-hover is-focus-shown:focus-ring-inset is-pressed:state-pressed is-selected:bg-fg/10",
              })}
              id={optionValue}
              textValue={optionLabel}
            >
              <span className="wrap-anywhere">{optionLabel}</span>
              <span className="flex h-5 shrink-0 items-center opacity-0 group-is-selected:opacity-100">
                <Icon name="check" />
              </span>
            </ListBoxItem>
          )}
        </ListBox>
      </Popover>
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
