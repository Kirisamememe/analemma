import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useLocation,
  useRouteContext,
  useRouter,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

import { enroll } from "../features/auth/enroll";
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
  const { api, authenticator } = useRouteContext({ from: "/enroll" });
  const token = readEnrollmentToken(
    useLocation({ select: (location) => location.hash }),
  );
  const enrollment = useMutation({
    mutationFn: async (name: string) =>
      enroll({ api, authenticator }, { token: token ?? "", name }),
    onSuccess: ({ _tag }) => {
      if (_tag === "Enrolled") {
        queryClient.clear();
        router.history.replace("/");
      }
    },
  });
  const outcome = enrollment.isError ? "Unexpected" : enrollment.data?._tag;
  const notice = outcome === undefined ? undefined : toEnrollNotice(outcome);

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
            onSubmit={(data) => {
              const name = data.get("name");

              enrollment.mutate(typeof name === "string" ? name : "");
            }}
          >
            <TextField
              autoComplete="off"
              description={t("enroll.nameDescription")}
              isRequired
              label={t("enroll.name")}
              maxLength={PASSKEY_NAME_MAX_LENGTH}
              name="name"
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
