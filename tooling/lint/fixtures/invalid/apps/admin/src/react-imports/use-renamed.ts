import { useState } from "react";

/** 開いているかどうかの状態。 */
const useOpen = () => useState(false);

export { useOpen as openState };
