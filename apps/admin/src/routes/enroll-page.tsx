import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Navigate,
  useLocation,
  useRouteContext,
  useRouter,
} from "@tanstack/react-router";
import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";

import { checkPasskeyName } from "../features/auth/check-passkey-name";
import { type EnrollInput, enroll } from "../features/auth/enroll";
import { readEnrollmentToken } from "../features/auth/read-enrollment-token";
import { toEnrollNotice } from "../features/auth/to-auth-notice";
import { AppShell } from "../ui/layout/app-shell";
import { Center } from "../ui/layout/center";
import { Stack } from "../ui/layout/stack";
import { Text } from "../ui/layout/text";
import { PageHeader } from "../ui/patterns/page-header";
import { Button } from "../ui/primitives/button";
import { Form } from "../ui/primitives/form";
import { TextField } from "../ui/primitives/form-fields/text-field";
import { Link } from "../ui/primitives/navigation/link";
import { Notice } from "../ui/primitives/notice";

const PASSKEY_NAME_MAX_LENGTH = 64;

/** 登録用 URL から、最初のパスキーを登録する画面。 */
export const EnrollPage = (): ReactNode => {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { api, authenticator, gate } = useRouteContext({ from: "/enroll" });
  const hash = useLocation({ select: (location) => location.hash });
  const [opened, setOpened] = useState(() => ({
    hash,
    token: readEnrollmentToken(hash),
  }));

  if (hash !== "" && hash !== opened.hash) {
    setOpened({ hash, token: readEnrollmentToken(hash) });
  }

  const { token } = opened;
  const enrollment = useMutation({
    mutationFn: async (input: EnrollInput) =>
      gate.authenticate(async () => enroll({ api, authenticator }, input)),
    onSuccess: ({ _tag }) => {
      if (_tag !== "Enrolled") {
        return;
      }

      queryClient.clear();

      if (router.state.matches.some(({ routeId }) => routeId === "/enroll")) {
        router.history.replace("/");
      }
    },
  });
  const result = enrollment.isError ? "Unexpected" : enrollment.data?._tag;
  const outcome = enrollment.variables?.token === token ? result : undefined;
  const notice = outcome === undefined ? undefined : toEnrollNotice(outcome);

  return (
    <AppShell>
      <Center width="sm">
        {hash !== "" && <Navigate replace to="/enroll" />}
        <Stack gap={6}>
          <PageHeader
            description={t("enroll.description")}
            title={t("enroll.title")}
          />
          {token === undefined ? (
            <Notice tone="danger">{t("enroll.missingToken")}</Notice>
          ) : (
            <Form
              isPending={enrollment.isPending}
              onSubmit={(data) => {
                const name = data.get("name");

                enrollment.mutate({
                  token,
                  name: typeof name === "string" ? name : "",
                });
              }}
            >
              <TextField
                autoComplete="off"
                description={t("enroll.nameDescription")}
                isRequired
                label={t("enroll.name")}
                maxLength={PASSKEY_NAME_MAX_LENGTH}
                name="name"
                validate={(value) => {
                  const problem = checkPasskeyName(value);

                  return problem === undefined ? undefined : t(problem);
                }}
              />
              {notice !== undefined && (
                <Notice tone={notice.tone}>{t(notice.message)}</Notice>
              )}
              {outcome === "AlreadyRegistered" && (
                <Text>
                  <Link href="/login">{t("enroll.signIn")}</Link>
                </Text>
              )}
              <Button
                isPending={enrollment.isPending}
                tone="primary"
                type="submit"
              >
                {t("enroll.submit")}
              </Button>
            </Form>
          )}
        </Stack>
      </Center>
    </AppShell>
  );
};
