import { useEffect } from "react";

export function usePendingNotification(
  isPending: boolean,
  onPendingChange?: (isPending: boolean) => void
) {
  useEffect(() => {
    if (!isPending || !onPendingChange) {
      return;
    }

    onPendingChange(true);
    return () => onPendingChange(false);
  }, [isPending, onPendingChange]);
}
