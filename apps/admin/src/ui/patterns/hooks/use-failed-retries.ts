import { useState } from "react";

/** 描いている間に、取り直しが終わった回数を数える。 */
export const useFailedRetries = (isRetrying: boolean): number => {
  const [wasRetrying, setWasRetrying] = useState(isRetrying);
  const [failures, setFailures] = useState(0);

  if (isRetrying !== wasRetrying) {
    setWasRetrying(isRetrying);

    if (!isRetrying) setFailures(failures + 1);
  }

  return failures;
};
