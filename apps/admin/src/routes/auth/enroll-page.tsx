import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Navigate,
  useLocation,
  useRouteContext,
  useRouter,
} from "@tanstack/react-router";
import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";

import { EnrollForm } from "./enroll-form";

import { readEnrollmentToken } from "@/features/auth/logic/read-enrollment-token";
import { toEnrollNotice } from "@/features/auth/logic/to-auth-notice";
import { type EnrollInput, enroll } from "@/features/auth/queries/enroll";
import { AppShell, Center, Stack } from "@/ui/layout";
import { PageHeader } from "@/ui/patterns";
import { Notice } from "@/ui/primitives/notice";
import { useFailureToast } from "@/ui/primitives/overlays";

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
            <EnrollForm
              isPending={enrollment.isPending}
              onSubmit={(name) => {
                failure.close();
                enrollment.mutate({ token, name });
              }}
              outcome={outcome}
            />
          )}
        </Stack>
      </Center>
    </AppShell>
  );
};
