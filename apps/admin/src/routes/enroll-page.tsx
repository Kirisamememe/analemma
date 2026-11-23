import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Navigate,
  useLocation,
  useRouteContext,
  useRouter,
} from "@tanstack/react-router";
import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";

import { PasskeyNameField } from "@/components/passkey-name-field";
import { readEnrollmentToken } from "@/features/auth/logic/read-enrollment-token";
import { toEnrollNotice } from "@/features/auth/logic/to-auth-notice";
import { type EnrollInput, enroll } from "@/features/auth/queries/enroll";
import { AppShell, Center, Stack, Text } from "@/ui/layout";
import { PageHeader } from "@/ui/patterns";
import { Button } from "@/ui/primitives/button";
import { Form } from "@/ui/primitives/form";
import { Link } from "@/ui/primitives/navigation";
import { Notice } from "@/ui/primitives/notice";
import { useFailureToast } from "@/ui/primitives/overlays";

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
  const failure = useFailureToast();
  const enrollment = useMutation({
    mutationFn: async (input: EnrollInput) =>
      gate.authenticate(async () => enroll({ api, authenticator }, input)),
    onSuccess: ({ _tag }) => {
      const notice = toEnrollNotice(_tag);

      if (notice?.place === "Toast") {
        failure.show(t(notice.message));
      }

      if (_tag !== "Enrolled") {
        return;
      }

      queryClient.clear();

      if (router.state.matches.some(({ routeId }) => routeId === "/enroll")) {
        router.history.replace("/");
      }
    },
    onError: () => {
      failure.show(t("enroll.failed"));
    },
  });
  const result = enrollment.data?._tag;
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

                failure.close();
                enrollment.mutate({
                  token,
                  name: typeof name === "string" ? name : "",
                });
              }}
            >
              <PasskeyNameField
                maxLength={PASSKEY_NAME_MAX_LENGTH}
                showDescription
              />
              {notice?.place === "Notice" && (
                <Notice tone="danger">{t(notice.message)}</Notice>
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
