import type { ReactNode } from "react";

import { Text } from "@/ui/layout/text";
import { type TypographyRole, typography } from "@/ui/typography";

const isRole = (name: string): name is TypographyRole =>
  name in typography.variants.role;

const ROLES = Object.keys(typography.variants.role).filter((name) =>
  isRole(name),
);

/** `TypeSpecimen` に渡す値。 */
type TypeSpecimenProps = {
  /** 文字の役割ごとに描く見本の文。 */
  readonly sample: string;
  /** 見本の文の言語(言語ごとの字体で描く)。 */
  readonly lang: string;
};

/** 文字の役割ごとの、大きさと行間の組と太さを並べた見本。 */
export const TypeSpecimen = ({
  sample,
  lang,
}: TypeSpecimenProps): ReactNode => (
  <dl className="flex max-w-lg flex-col gap-6">
    {ROLES.map((role) => (
      <div className="flex flex-col gap-1" key={role}>
        <dt>
          <Text tone="muted" variant="caption">
            {role}({typography({ role })})
          </Text>
        </dt>
        <dd className={typography({ role })} lang={lang}>
          {sample}
        </dd>
      </div>
    ))}
  </dl>
);
