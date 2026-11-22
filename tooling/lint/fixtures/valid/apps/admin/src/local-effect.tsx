const useEffect = (value: string) => value.trim();

/** 文字列の前後の空白を取る hook。 */
export const useTrimmedTitle = (title: string) => useEffect(title);
