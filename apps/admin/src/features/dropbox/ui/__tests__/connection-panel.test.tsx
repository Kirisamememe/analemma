import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, mock, test } from "bun:test";

import {
  ConnectionNotice,
  ConnectPrompt,
} from "@/features/dropbox/ui/connection-panel";
import { renderWithI18n } from "@/testing/render-with-i18n";

afterEach(cleanup);

test("つなぐ操作を送り、うまくいかなかった理由があるときだけ知らせを出すこと", async () => {
  const onOpen = mock(() => undefined);

  renderWithI18n(
    <>
      <ConnectPrompt onOpen={onOpen} opening={false} />
      <ConnectionNotice failure="ImportRunning" />
      <ConnectionNotice failure={undefined} />
    </>,
    "ja",
  );

  await userEvent.click(
    screen.getByRole("button", { name: "Dropbox につなぐ" }),
  );

  expect(onOpen).toHaveBeenCalledTimes(1);
  expect(screen.getAllByRole("status")).toHaveLength(1);
});
