const MAX_LEN = 32_000;

function nodeToMd(node: Node, listDepth = 0, listType: "ul" | "ol" | null = null, listIndex = 0): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return (node.textContent ?? "").replace(/\s+/g, " ");
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return "";
  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();

  if (tag === "script" || tag === "style" || tag === "noscript" || tag === "svg") return "";

  const childMd = (lt: "ul" | "ol" | null = null): string => {
    let i = 0;
    let out = "";
    for (const child of Array.from(el.childNodes)) {
      if ((child as HTMLElement).tagName?.toLowerCase() === "li") i++;
      out += nodeToMd(child, listDepth + (lt ? 1 : 0), lt ?? listType, i);
    }
    return out;
  };

  switch (tag) {
    case "br": return "\n";
    case "hr": return "\n\n---\n\n";
    case "p":  return `\n\n${childMd().trim()}\n\n`;
    case "h1": return `\n\n# ${childMd().trim()}\n\n`;
    case "h2": return `\n\n## ${childMd().trim()}\n\n`;
    case "h3": return `\n\n### ${childMd().trim()}\n\n`;
    case "h4": return `\n\n#### ${childMd().trim()}\n\n`;
    case "h5": return `\n\n##### ${childMd().trim()}\n\n`;
    case "h6": return `\n\n###### ${childMd().trim()}\n\n`;
    case "strong":
    case "b":  return `**${childMd().trim()}**`;
    case "em":
    case "i":  return `*${childMd().trim()}*`;
    case "code": return `\`${childMd().trim()}\``;
    case "a": {
      const href = el.getAttribute("href") ?? "";
      const text = childMd().trim();
      return href ? `[${text}](${href})` : text;
    }
    case "ul": return `\n${childMd("ul")}\n`;
    case "ol": return `\n${childMd("ol")}\n`;
    case "li": {
      const indent = "  ".repeat(Math.max(0, listDepth));
      const marker = listType === "ol" ? `${listIndex}.` : "-";
      return `${indent}${marker} ${childMd().trim()}\n`;
    }
    case "div":
    case "section":
    case "article":
    case "main": return `${childMd()}\n`;
    default: return childMd();
  }
}

function collapseBlankLines(md: string): string {
  return md.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function htmlToMarkdown(html: string): string {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;
  const md = collapseBlankLines(nodeToMd(wrapper));
  return md.length > MAX_LEN ? md.slice(0, MAX_LEN) + "\n\n[…truncated]" : md;
}

export function elementToMarkdown(el: Element | null): string {
  if (!el) return "";
  return htmlToMarkdown(el.innerHTML);
}
