import { type ReactNode, useCallback, useRef } from "react";

import { type FieldDefinition, REPEAT_MAX_ITEMS } from "@analemma/contract";

import { createContentForm } from "../../content-form";
import { Branch } from "../../ui/branch";
import type { ContentFieldsProps } from "../content-fields";
import { flattenContent } from "../logic/flat-content";
import {
  addRepeatItem,
  moveRepeatItem,
  removeRepeatItem,
  type RepeatChange,
  type RepeatFocus,
  repeatFocusKey,
} from "../logic/repeat-items";
import { RepeatItem } from "./repeat-item";

import { useTranslate } from "@/i18n/use-translate";
import { Button } from "@/ui/primitives/button";
import { Icon } from "@/ui/primitives/graphics";

type RepeatFieldProps = Pick<
  ContentFieldsProps,
  "form" | "changed" | "errors"
> & {
  /** repeat の定義。 */
  definition: Extract<
    FieldDefinition,
    Record<"fields", readonly FieldDefinition[]>
  >;
  /** repeat の場所。 */
  path: string;
  /** 各要素の項目を描く関数。 */
  children: (path: string, label: string) => ReactNode;
};

/** ID ごとに項目を描き、追加・削除・並べ替えを扱う。 */
export const RepeatField = ({
  form,
  path,
  definition,
  changed,
  errors,
  children,
}: RepeatFieldProps): ReactNode => {
  const t = useTranslate();
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const name = `items.${path}` as const;

  const remember = useCallback(
    (focus: RepeatFocus) => (element: HTMLButtonElement | null) => {
      const key = repeatFocusKey(focus);

      if (element === null) buttons.current.delete(key);
      else buttons.current.set(key, element);
    },
    [],
  );

  const apply = useCallback(
    (change: RepeatChange | undefined) => {
      if (change === undefined) return;

      form.setFieldValue(name, change.ids);
      changed("content." + path);
      requestAnimationFrame(() =>
        buttons.current.get(repeatFocusKey(change.focus))?.focus(),
      );
    },
    [form, name, changed, path],
  );

  const onMove = useCallback(
    (id: string, direction: -1 | 1) => {
      apply(moveRepeatItem(form.getFieldValue(name), { id, direction }));
    },
    [apply, form, name],
  );

  const onRemove = useCallback(
    (id: string) => {
      apply(removeRepeatItem(form.getFieldValue(name), id));
    },
    [apply, form, name],
  );

  return (
    <form.Field name={name}>
      {(field) => {
        const ids = field.state.value;
        const isFull = ids.length >= REPEAT_MAX_ITEMS;

        return (
          <>
            {ids.map((id, index) => (
              <RepeatItem
                key={id}
                id={id}
                path={path}
                label={definition.label}
                position={index + 1}
                isLast={index === ids.length - 1}
                error={errors["content." + path + "/" + id]}
                onMove={onMove}
                onRemove={onRemove}
                remember={remember}
              >
                {children}
              </RepeatItem>
            ))}
            <Branch
              parent="repeat"
              target="add"
              isLast
              note={
                isFull
                  ? t("fixedPageEditor.addLimit", { limit: REPEAT_MAX_ITEMS })
                  : undefined
              }
            >
              <Button
                ref={remember("add")}
                size="sm"
                tone="secondary"
                isDisabled={isFull}
                onPress={() => {
                  const id = crypto.randomUUID();
                  const change = addRepeatItem(ids, id);

                  if (change === undefined) return;

                  const added = flattenContent(
                    createContentForm(definition.fields),
                    path + "/" + id + "/",
                  );

                  for (const [key, value] of Object.entries(added.content)) {
                    form.setFieldValue(`content.${key}`, value);
                  }

                  for (const [key, value] of Object.entries(added.items)) {
                    form.setFieldValue(`items.${key}`, value);
                  }

                  apply(change);
                }}
              >
                <Icon name="plus" size="md" weight="bold" />
                {t("fixedPageEditor.add", { label: definition.label })}
              </Button>
            </Branch>
          </>
        );
      }}
    </form.Field>
  );
};
