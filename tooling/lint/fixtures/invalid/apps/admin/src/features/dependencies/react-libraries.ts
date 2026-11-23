import { useQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export { jsx } from "react/jsx-runtime";
export type { Meta } from "@storybook/react";

/** 画面が使う外のライブラリ。 */
export const dependencies = [useQuery, useRouteContext, useTranslation];
