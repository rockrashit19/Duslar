export function getInitData(): string {
  // @ts-ignore
  const tg = window?.Telegram?.WebApp;
  if (tg) {
    try {
      tg.ready();
      tg.expand?.();
    } catch {}
    return tg.initData || "";
  }
  return import.meta.env.VITE_INITDATA || "";
}
