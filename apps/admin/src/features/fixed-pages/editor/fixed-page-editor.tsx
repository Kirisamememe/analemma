import { type ReactNode, useCallback, useMemo, useRef, useState } from "react";

import { EditorContent } from "./frame/editor-content";
import type { FixedPageEditorProps } from "./hooks/use-editor-form";
import {
  type EditorHold,
  fieldsChangedSinceEditing,
  fieldsInUse,
  holdWhileDeleting,
  holdWhileEditing,
  pageInUse,
} from "./logic/editor-fields";

/** 種類の定義に沿って固定ページを作成・編集する、見出しとフォーム。 */
export const FixedPageEditor = (props: FixedPageEditorProps): ReactNode => {
  const [hold, setHold] = useState<EditorHold>({});
  const latest = props.kind.fields;
  const fields = fieldsInUse(hold, latest);
  const key = useMemo(() => JSON.stringify(fields), [fields]);
  const { acknowledged } = hold;
  const activeName = useRef<string>(undefined);

  const restoreFocus = useCallback((element: HTMLDivElement | null) => {
    if (element === null) return;

    if (activeName.current !== undefined) {
      const target =
        Array.from(element.querySelectorAll<HTMLElement>("[name]")).find(
          (field) =>
            field.getAttribute("name") === activeName.current &&
            field.tabIndex >= 0,
        ) ?? element.querySelector<HTMLElement>('[name="title"]');

      target?.focus();
      activeName.current = undefined;
    }

    return () => {
      const active = document.activeElement;

      if (active !== null && element.contains(active)) {
        activeName.current = active.getAttribute("name") ?? "title";
      }
    };
  }, []);

  const onEditing = useCallback(
    (editing: boolean) => {
      setHold((current) => holdWhileEditing(current, { editing, latest }));
    },
    [latest],
  );

  const onDeleteOpen = useCallback(
    (open: boolean) => {
      setHold((current) => holdWhileDeleting(current, { open, latest }));
    },
    [latest],
  );

  const pageProps = useMemo((): FixedPageEditorProps => {
    const kind = { ...props.kind, fields };

    if (props.page === undefined) return { ...props, kind };

    const before = props.page;

    return {
      ...props,
      kind,
      page: pageInUse({ acknowledged }, before),
      onSaved: (saved) => {
        setHold((current) => ({ ...current, acknowledged: { before, saved } }));
        props.onSaved(saved);
      },
    };
  }, [props, fields, acknowledged]); // 入力を始めた・やめただけでは作り直さず、フォームを描き直さない

  return (
    <div key={key} ref={restoreFocus}>
      <EditorContent
        pageProps={pageProps}
        fieldsChanged={fieldsChangedSinceEditing(hold, latest)}
        onDeleteOpen={onDeleteOpen}
        onEditing={onEditing}
      />
    </div>
  );
};
