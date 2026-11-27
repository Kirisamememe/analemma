import { memo, type ReactNode, useCallback, useRef } from "react";

import { type FieldDefinition, REPEAT_MAX_ITEMS } from "@analemma/contract";

import { createContentForm } from "../content-form";
import { Branch, ContentGroup } from "../ui/content-group";
import type { ContentFieldsProps } from "./content-fields";
import { flattenContent } from "./logic/flat-content";
import {
  addRepeatItem,
  moveRepeatItem,
  removeRepeatItem,
  type RepeatChange,
  type RepeatFocus,
  repeatFocusKey,
} from "./logic/repeat-items";

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

/** repeat の1つの要素に渡す値。 */
type RepeatItemProps = {
  /** 要素の ID。 */
  id: string;
  /** repeat の場所。 */
  path: string;
  /** repeat の見出しの名前。 */
  label: string;
  /** 何番目の要素か(1から)。 */
  position: number;
  /** 最後の要素か。 */
  isLast: boolean;
  /** 要素に結び付いた誤り。 */
  error: string | undefined;
  /** 要素を上か下へ動かす関数。 */
  onMove: (id: string, direction: -1 | 1) => void;
  /** 要素を外す関数。 */
  onRemove: (id: string) => void;
  /** focus を移すボタンを覚える関数。 */
  remember: (focus: RepeatFocus) => (button: HTMLButtonElement | null) => void;
  /** 要素の項目を描く関数。 */
  children: (path: string, label: string) => ReactNode;
};

const RepeatItemContent = ({
  id,
  path,
  label,
  position,
  isLast,
  error,
  onMove,
  onRemove,
  remember,
  children,
}: RepeatItemProps): ReactNode => {
  const t = useTranslate();
  const item = path + "/" + id;
  const name = { label, position };
  const itemLabel = t("fixedPageEditor.item", name);

  return (
    <Branch parent="repeat" target="item">
      <ContentGroup
        actions={
          <>
            <Button
              aria-label={t("fixedPageEditor.up", name)}
              icon="arrow-up"
              iconWeight="bold"
              rounded="xs"
              ref={remember({ id, button: "up" })}
              size="sm"
              tone="quiet"
              isDisabled={position === 1}
              onPress={() => {
                onMove(id, -1);
              }}
            />
            <Button
              aria-label={t("fixedPageEditor.down", name)}
              icon="arrow-down"
              iconWeight="bold"
              rounded="xs"
              ref={remember({ id, button: "down" })}
              size="sm"
              tone="quiet"
              isDisabled={isLast}
              onPress={() => {
                onMove(id, 1);
              }}
            />
            <Button
              aria-label={t("fixedPageEditor.remove", name)}
              icon="trash-2"
              iconWeight="bold"
              rounded="xs"
              ref={remember({ id, button: "remove" })}
              size="sm"
              tone="quiet"
              onPress={() => {
                onRemove(id);
              }}
            />
          </>
        }
        error={error}
        kind="item"
        label={itemLabel}
      >
        {children(item, itemLabel)}
      </ContentGroup>
    </Branch>
  );
};

const RepeatItem = memo(RepeatItemContent);

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
