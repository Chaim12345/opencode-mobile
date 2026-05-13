export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function formatTimestamp(ts?: number): string {
  const d = new Date(ts || Date.now());
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatMarkdown(text: string): string {
  if (!text) return '';
  let h = escapeHtml(text);

  // Code blocks
  h = h.replace(
    /```(\w*)\n?([\s\S]*?)```/g,
    (_, lang, code) => {
      const langLabel = lang || 'code';
      return `\n[code block: ${langLabel}]\n${code.trim()}\n[/code block]\n`;
    },
  );

  // inline code
  h = h.replace(/`([^`]+)`/g, '[code]$1[/code]');
  // bold
  h = h.replace(/\*\*([^*]+)\*\*/g, '*$1*');
  // headers
  h = h.replace(/^### (.+)$/gm, '\n$1\n');
  h = h.replace(/^## (.+)$/gm, '\n$1\n');
  h = h.replace(/^# (.+)$/gm, '\n$1\n');

  return h.trim();
}

export function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max) + '...';
}
