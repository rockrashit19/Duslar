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
  const tg = (window as any).Telegram?.WebApp;
  if (!tg) return;
  const p: TP = tg.themeParams || {};
  setVar("--tg-bg", p.bg_color);
  setVar("--tg-text", p.text_color);
  setVar("--tg-hint", p.hint_color);
  setVar("--tg-link", p.link_color);
  setVar("--tg-button", p.button_color);
  setVar("--tg-button-text", p.button_text_color);
  setVar("--tg-secondary-bg", p.secondary_bg_color);
  try {
    tg.expand();
  } catch {}
  try {
    tg.setHeaderColor("secondary_bg_color");
  } catch {}
}
export function bindThemeListener() {
  const tg = (window as any).Telegram?.WebApp;
  if (!tg) return;
  tg.onEvent("themeChanged", applyTelegramTheme);
}
