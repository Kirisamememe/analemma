/** 後から読み込む。 */
export const loadLater = async (): Promise<unknown> => import("./split-import");
