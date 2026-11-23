import { useRef, type ReactNode } from "react";

import type { FieldDefinition } from "@analemma/contract";

import { createContentForm } from "../content-form";
import { Branch, ContentGroup } from "../ui/content-group";
import type { ContentFieldsProps } from "./content-fields";
import { flattenContent } from "./logic/flat-content";

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
  children: (path: string) => ReactNode;
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

  const remember = (key: string) => (element: HTMLButtonElement | null) => {
    if (element === null) buttons.current.delete(key);
    else buttons.current.set(key, element);
  };

  const focus = (key: string) => {
    requestAnimationFrame(() => buttons.current.get(key)?.focus());
  };

  return (
    <form.Field name={`items.${path}`}>
      {(field) => {
        const ids = field.state.value;

        const update = (next: string[]) => {
          field.handleChange(next);
          changed("content." + path);
        };

        return (
          <>
            {ids.map((id, index) => {
              const item = path + "/" + id;
              const label = { label: definition.label, position: index + 1 };

              const move = (direction: -1 | 1) => {
                const next = ids.toSpliced(index, 1);
                const to = index + direction;
                const atEdge = to === 0 || to === ids.length - 1;

                next.splice(to, 0, id);
                update(next);
                focus(id + ((direction === 1) === atEdge ? "up" : "down"));
              };

              return (
                <Branch key={id} parent="repeat" target="item">
                  <ContentGroup
                    actions={
                      <>
                        <Button
                          aria-label={t("fixedPageEditor.up", label)}
                          icon="arrow-up"
                          iconWeight="bold"
                          ref={remember(id + "up")}
                          size="sm"
                          tone="quiet"
                          isDisabled={index === 0}
                          onPress={() => {
                            move(-1);
                          }}
                        />
                        <Button
                          aria-label={t("fixedPageEditor.down", label)}
                          icon="arrow-down"
                          iconWeight="bold"
                          ref={remember(id + "down")}
                          size="sm"
                          tone="quiet"
                          isDisabled={index === ids.length - 1}
                          onPress={() => {
                            move(1);
                          }}
                        />
                        <Button
                          aria-label={t("fixedPageEditor.remove", label)}
                          icon="trash-2"
                          iconWeight="bold"
                          ref={remember(id + "remove")}
                          size="sm"
                          tone="quiet"
                          onPress={() => {
                            const next = ids[index + 1];
                            update(ids.toSpliced(index, 1));
                            focus(next === undefined ? "add" : next + "remove");
                          }}
                        />
                      </>
                    }
                    error={errors["content." + item]}
                    kind="item"
                    label={t("fixedPageEditor.item", label)}
                  >
                    {children(item)}
                  </ContentGroup>
                </Branch>
              );
            })}
            <Branch parent="repeat" target="add" isLast>
              <Button
                ref={remember("add")}
                size="sm"
                tone="secondary"
                onPress={() => {
                  const id = crypto.randomUUID();

                  const added = flattenContent(
                    createContentForm(definition.fields),
                    path + "/" + id + "/",
                  );

                  for (const [name, value] of Object.entries(added.content)) {
                    form.setFieldValue(`content.${name}`, value);
                  }

                  for (const [name, value] of Object.entries(added.items)) {
                    form.setFieldValue(`items.${name}`, value);
                  }

                  update([...ids, id]);
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
