import { describe, expect, test } from "bun:test";

import { formatFileSize } from "@/components/photo-progress/logic/format-file-size";

describe("formatFileSize", () => {
  test("1 MB に満たなければ KB に切り上げ、ほかは MB を小数1桁までで書くこと", () => {
    expect(formatFileSize("en", 1)).toBe("1 kB");
    expect(formatFileSize("en", 1536)).toBe("2 kB");
    expect(formatFileSize("en", 19_293_798)).toBe("18.4 MB");
  });
});
