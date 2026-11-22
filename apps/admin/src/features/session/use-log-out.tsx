import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouteContext, useRouter } from "@tanstack/react-router";

/** 今のセッションからログアウトする操作。 */
export const useLogOut = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { api } = useRouteContext({ from: "__root__" });

  return useMutation({
    mutationFn: async () => api.admin.session.logOut(),
    onSuccess: () => {
      queryClient.clear();
      void router.navigate({ to: "/login" });
    },
  });
};
