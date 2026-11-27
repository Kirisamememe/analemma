import { useContext, type ReactNode } from "react";
import { useFocusWithin } from "react-aria";
import {
  DateFieldStateContext,
  DateInput as AriaDateInput,
  DateSegment,
} from "react-aria-components";

import { fieldControl } from "@/ui/primitives/form-fields/field-control";
import { typography } from "@/ui/typography";

type DateSegmentsProps = {
  /** focus が外れたときに呼ぶ関数。 */
  onBlur?: (incomplete: boolean) => void;
};

/** キーボードで日付の segment を編集する入力。 */
export const DateSegments = ({ onBlur }: DateSegmentsProps): ReactNode => {
  const state = useContext(DateFieldStateContext);

  const segments =
    state?.segments.filter((segment) => segment.isEditable) ?? [];

  const incomplete =
    segments.some((segment) => segment.isPlaceholder) &&
    segments.some((segment) => !segment.isPlaceholder);

  const {
    focusWithinProps: { onBlur: blurWithin, onFocus: focusWithin },
  } = useFocusWithin({
    onBlurWithin: () => {
      onBlur?.(incomplete);
    },
  });

  return (
    <div
      data-uncommitted-input={incomplete || undefined}
      onBlur={blurWithin}
      onFocus={focusWithin}
    >
      <AriaDateInput
        className={fieldControl({
          className: [
            "flex h-control items-center px-2 tabular-nums @max-3xs/nested-form:px-1 focus-within:focus-ring",
            typography({ role: "body" }),
          ],
        })}
      >
        {(segment) => (
          <DateSegment
            className="rounded-xs px-1 outline-hidden is-focused:focus-ring-inset is-placeholder:text-fg-muted"
            segment={segment}
          />
        )}
      </AriaDateInput>
    </div>
  );
};
