/** 記事を1件ずつ読む。 */
export const readAll = async (
  ids: readonly string[],
  read: (id: string) => Promise<string>,
): Promise<string[]> => {
  const bodies: string[] = [];

  for (const id of ids) {
    bodies.push(await read(id));
  }

  return bodies;
};
