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
