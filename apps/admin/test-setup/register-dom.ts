import { GlobalRegistrator } from "@happy-dom/global-registrator";

type TransitionOptions = {
  /** DOM を更新する関数。 */
  readonly update: () => void;
};

GlobalRegistrator.register({ url: "http://localhost:5173/" });

Object.defineProperty(document, "startViewTransition", {
  value: ({ update }: TransitionOptions) => {
    update();
  },
});
