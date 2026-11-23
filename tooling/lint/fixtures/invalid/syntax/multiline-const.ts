const pageKey = "pages";
const kindKey = "kinds";
const pages = new URLSearchParams({
  key: pageKey,
});
const kinds = new URLSearchParams({
  key: kindKey,
});
pages.sort();
kinds.sort();
export const params = new URLSearchParams({
  key: pageKey,
});
params.sort();

export const sorted = new URLSearchParams({
  key: kindKey,
});

sorted.sort();
export type QueryKey = {
  readonly key: string;
};
