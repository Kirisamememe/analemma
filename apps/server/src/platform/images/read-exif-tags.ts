import {
  type ExpandedTags,
  type TagDescriptor,
  createReader,
} from "exifreader/core";
import { allFormats } from "exifreader/formats";
import * as exifTags from "exifreader/tags/exif";

type ExifGroup = NonNullable<ExpandedTags["exif"]>;

const DESCRIPTORS: ReadonlyMap<string, TagDescriptor> = new Map(
  Object.entries(exifTags),
);

type ReadableName = keyof ExifGroup & keyof typeof exifTags;

/** ExifReader が読める、Exif の tag の名前。 */
export type ExifTagName = {
  [Name in ReadableName]-?: "computed" extends keyof NonNullable<
    ExifGroup[Name]
  >
    ? Name
    : never;
}[ReadableName];

/** tag を読んだ値。 */
export type ExifValue = Exclude<
  NonNullable<ExifGroup[ExifTagName]>["computed"],
  undefined
>;

/** 写真の bytes から、名前を挙げた Exif の tag だけを読む。 */
export const readExifTags = async <const Name extends ExifTagName>(
  bytes: Uint8Array,
  names: readonly Name[],
): Promise<ReadonlyMap<Name, ExifValue>> => {
  const descriptors = names.flatMap((name) => DESCRIPTORS.get(name) ?? []);
  const reader = createReader({ formats: allFormats, tags: descriptors });
  const { exif } = await reader.load(bytes, { computed: true });

  return new Map(
    names.flatMap((name): [Name, ExifValue][] => {
      const key: ExifTagName = name;
      const value = exif?.[key]?.computed;

      return value === undefined ? [] : [[name, value]];
    }),
  );
};
