/** 同じシリーズへの書き込みを順に送る mutation scope。 */
export const seriesMutationScope = (id: string): string => `series:${id}`;
