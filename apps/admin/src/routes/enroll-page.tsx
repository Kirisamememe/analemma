import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useLocation,
  useRouteContext,
  useRouter,
} from "@tanstack/react-router";
import { type ReactNode, useEffect, useState } from "react";

import { checkPasskeyName } from "../features/auth/check-passkey-name";
import { type EnrollInput, enroll } from "../features/auth/enroll";
import { readEnrollmentToken } from "../features/auth/read-enrollment-token";
import { toEnrollNotice } from "../features/auth/to-auth-notice";
import { useTranslation } from "../i18n/use-translation";
import { Center } from "../ui/layout/center";
import { Stack } from "../ui/layout/stack";
import { Text } from "../ui/layout/text";
import { PageHeader } from "../ui/patterns/page-header";
import { Button } from "../ui/primitives/button";
import { Form } from "../ui/primitives/form";
import { Link } from "../ui/primitives/link";
import { Notice } from "../ui/primitives/notice";
import { TextField } from "../ui/primitives/text-field";

const PASSKEY_NAME_MAX_LENGTH = 64;

/** 登録用 URL から、最初のパスキーを登録する画面。 */
export const EnrollPage = (): ReactNode => {
  const t = useTranslation();
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

      if (router.state.location.pathname.toLowerCase() === "/enroll") {
        router.history.replace("/");
      }
    },
  });
  const result = enrollment.isError ? "Unexpected" : enrollment.data?._tag;
  const outcome = enrollment.variables?.token === token ? result : undefined;
  const notice = outcome === undefined ? undefined : toEnrollNotice(outcome);

  useEffect(() => {
    if (hash !== "") {
      router.history.replace("/enroll");
    }
  }, [hash, router]);

  return (
    <Center width="sm">
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
  );
};
