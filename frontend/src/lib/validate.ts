export function normalizeCyrillic(input: string): string {
  return input.replace(/[^А-Яа-яЁё\s-]/g, "");
}

export function isCyrillic(input: string): boolean {
  return input === "" || /^[А-Яа-яЁё\s-]+$/.test(input);
}
