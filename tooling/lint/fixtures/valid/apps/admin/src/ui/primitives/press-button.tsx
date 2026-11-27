import { Button } from "react-aria-components";

/** React Aria Components を包むボタン。 */
export const PressButton = ({ label }: Readonly<Record<"label", string>>) => (
  <Button>{label}</Button>
);
