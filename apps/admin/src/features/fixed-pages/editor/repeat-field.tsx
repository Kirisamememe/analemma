import { useRef, type ReactNode } from "react";

import type { FieldDefinition } from "@analemma/contract";

import { createContentForm } from "../content-form";
import { ContentGroup } from "../ui/content-group";
import type { ContentFieldsProps } from "./content-fields";
import { flattenContent } from "./flat-content";

import { useTranslate } from "@/i18n/use-translate";
import { Cluster, Stack } from "@/ui/layout";
import { Button } from "@/ui/primitives/button";

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
          <Stack gap={3}>
            {ids.map((id, index) => {
              const item = path + "/" + id;
              const label = { label: definition.label, position: index + 1 };
              const move = (direction: -1 | 1) => {
                const next = ids.toSpliced(index, 1);
                next.splice(index + direction, 0, id);
                update(next);
                focus(id + (direction === 1 ? "down" : "up"));
              };

              return (
                <ContentGroup
                  key={id}
                  name={"content." + item}
                  error={errors["content." + item]}
                  label={t("fixedPages.item", label)}
                >
                  {children(item)}
                  <Cluster gap={2}>
                    <Button
                      ref={remember(id + "up")}
                      size="sm"
                      allowFocusWhenDisabled
                      isDisabled={index === 0}
                      onPress={() => {
                        move(-1);
                      }}
                    >
                      {t("fixedPages.up", label)}
                    </Button>
                    <Button
                      ref={remember(id + "down")}
                      size="sm"
                      allowFocusWhenDisabled
                      isDisabled={index === ids.length - 1}
                      onPress={() => {
                        move(1);
                      }}
                    >
                      {t("fixedPages.down", label)}
                    </Button>
                    <Button
                      ref={remember(id + "remove")}
                      size="sm"
                      onPress={() => {
                        const next = ids[index + 1];
                        update(ids.toSpliced(index, 1));
                        focus(next === undefined ? "add" : next + "remove");
                      }}
                    >
                      {t("fixedPages.remove", label)}
                    </Button>
                  </Cluster>
                </ContentGroup>
              );
            })}
            <Cluster>
              <Button
                ref={remember("add")}
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
                {t("fixedPages.add", { label: definition.label })}
              </Button>
            </Cluster>
          </Stack>
        );
      }}
    </form.Field>
  );
};
