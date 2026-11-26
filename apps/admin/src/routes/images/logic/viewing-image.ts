/** 今のパスが、その画像の写真を見る画面か(大文字と小文字、末尾の `/` を区別しない)。 */
export const isViewingImage = (pathname: string, id: string): boolean =>
  pathname.toLowerCase().replace(/\/+$/v, "") === `/images/${id.toLowerCase()}`;
