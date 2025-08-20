import { useCallback, useState } from "react";
export function useAsyncAction<T>(fn: () => Promise<T>) {
  const [loading, setLoading] = useState(false);
  const run = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      return await fn();
    } finally {
      setLoading(false);
    }
  }, [fn, loading]);
  return { run, loading };
}
