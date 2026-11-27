import { expect, test } from "bun:test";

import { Mark } from "../one-component";

const Frame = () => <Mark />;

const Twice = () => (
  <>
    <Frame />
    <Frame />
  </>
);

test("確かめるための component を、同じファイルに幾つか書けること", () => {
  expect(<Twice />).toBeDefined();
});
