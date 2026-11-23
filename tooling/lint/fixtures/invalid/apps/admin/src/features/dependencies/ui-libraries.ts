import { Icon } from "lucide-react";
import { readFile } from "node:fs";
import { Button } from "react-aria-components";
import { tv } from "tailwind-variants";

/** 部品のライブラリと Node の API。 */
export const libraries = [Button, tv, Icon, readFile];
