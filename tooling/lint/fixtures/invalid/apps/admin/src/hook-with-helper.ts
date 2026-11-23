import { useState } from "react";

/** 記事の題を表示の形に整える。 */
export const trimTitle = (title: string): string => title.trim();

/** 記事の題の状態。 */
export const useTitle = () => useState("");
