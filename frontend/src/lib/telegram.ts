import { init } from "@telegram-apps/sdk";

let ready = false;

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

export function initTGSDK() {
  if (ready) return true;
  try {
    init();
    ready = true;
  } catch {
    ready = false;
  }
  return ready;
}

export function isTGReady() {
  return ready;
}
