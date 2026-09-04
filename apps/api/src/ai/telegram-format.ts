/**
 * Light formatting helpers so AvalAI replies look clean in Telegram.
 */

/** Escape for Telegram HTML parse_mode. */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Convert common markdown-ish AI output into Telegram HTML.
 */
export function formatTelegramHtml(raw: string): string {
  let text = raw.trim();
  text = text.replace(/^[\s]*[-–—]\s+/gm, '• ');
  text = text.replace(/^[\s]*\*\s+/gm, '• ');

  const bold: string[] = [];
  text = text.replace(/\*\*(.+?)\*\*/g, (_, inner: string) => {
    bold.push(inner);
    return `§B${bold.length - 1}§`;
  });

  text = escapeHtml(text);
  text = text.replace(/§B(\d+)§/g, (_, i: string) => `<b>${escapeHtml(bold[Number(i)])}</b>`);
  text = text.replace(/\n{3,}/g, '\n\n');
  return text;
}
