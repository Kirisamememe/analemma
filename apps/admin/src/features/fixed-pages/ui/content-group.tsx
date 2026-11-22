import { useId, type ReactNode } from "react";

import { Stack, Text } from "@/ui/layout";

type ContentGroupProps = {
  /** まとまりの名前。 */
  label: string;
  /** フォームでの場所。 */
  name: string;
  /** まとまりに付いた誤りの知らせ。 */
  error: string | undefined;
  /** 中の項目と操作。 */
  children: ReactNode;
};

/** group・repeat・要素のラベルを中の項目に結び付ける。 */
export const ContentGroup = ({
  label,
  name,
  error,
  children,
}: ContentGroupProps): ReactNode => {
  const id = useId();
  return (
    <fieldset
      className="min-w-0 rounded-control border border-line p-4"
      data-field={name}
      tabIndex={-1}
      aria-describedby={error === undefined ? undefined : id}
    >
      <legend className="-ms-1 px-1">
        <Text as="span" variant="label">
          {label}
        </Text>
      </legend>
      <Stack gap={4}>
        {error !== undefined && (
          <div id={id} role="alert">
            <Text tone="danger" variant="caption">
              {error}
            </Text>
          </div>
        )}
        {children}
      </Stack>
    </fieldset>
  );
};
