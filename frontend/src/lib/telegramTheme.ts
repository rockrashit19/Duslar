type TP = Partial<{
  bg_color: string;
  text_color: string;
  hint_color: string;
  link_color: string;
  button_color: string;
  button_text_color: string;
  secondary_bg_color: string;
}>;

function setVar(k: string, v?: string) {
  if (!v) return;
  document.documentElement.style.setProperty(k, v);
}

export function applyTelegramTheme() {
  const tp = (window as any).Telegram?.WebApp?.themeParams;
  if (!tp) return;
  const root = document.documentElement;
  if (tp.bg_color) root.style.setProperty("--tg-bg", tp.bg_color);
  if (tp.text_color) root.style.setProperty("--tg-text", tp.text_color);
  if (tp.link_color) root.style.setProperty("--tg-link", tp.link_color);
}

export function bindThemeListener() {
  const WA = (window as any).Telegram?.WebApp;
  if (!WA) return;
  WA.onEvent("themeChanged", applyTelegramTheme);
  WA.ready();
}
