import { createLink } from "@tanstack/react-router";

import { RoutedLink } from "./routed-link";

/** 行き先を、route のパスと params で書くリンク。 */
export const RouteLink = createLink(RoutedLink);
