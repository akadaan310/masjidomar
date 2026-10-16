// Minimal, safe Markdown → HTML. All input is HTML-escaped FIRST, then a small whitelist of
// syntax is applied: paragraphs, line breaks, **bold**, *italic*, "- " lists and [text](https://…)
// links. No raw HTML, no images, no javascript:/data: URLs. Output is safe for
// dangerouslySetInnerHTML because no user-controlled markup survives escaping.

const ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

function inline(escaped: string): string {
  return escaped
    .replace(/\[([^\]]{1,200})\]\((https:\/\/[^\s)"<>]{1,500}|mailto:[^\s)"<>]{1,200}|\/[^\s)"<>]{0,300})\)/g,
      (_m, text: string, href: string) => {
        const external = href.startsWith("https://");
        return `<a href="${href}"${external ? ' rel="noopener noreferrer nofollow" target="_blank"' : ""}>${text}</a>`;
      })
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>");
}

export function renderMarkdown(src: string): string {
  const blocks = escapeHtml(src.replace(/\r\n/g, "\n")).split(/\n{2,}/);
  return blocks
    .map((block) => {
      const lines = block.split("\n").filter((l) => l.trim() !== "");
      if (lines.length === 0) return "";
      if (lines.every((l) => /^\s*[-*] /.test(l))) {
        return `<ul>${lines.map((l) => `<li>${inline(l.replace(/^\s*[-*] /, ""))}</li>`).join("")}</ul>`;
      }
      if (lines.length === 1 && /^#{2,3} /.test(lines[0])) {
        return `<h3>${inline(lines[0].replace(/^#{2,3} /, ""))}</h3>`;
      }
      return `<p>${lines.map(inline).join("<br>")}</p>`;
    })
    .join("");
}

export function plainExcerpt(src: string, max = 180): string {
  const text = src.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[*#_`>-]/g, "").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}
