import { parseFragment, serialize, type DefaultTreeAdapterMap } from "parse5";

type Parent = DefaultTreeAdapterMap["parentNode"];
type Child = DefaultTreeAdapterMap["childNode"];
type Element = DefaultTreeAdapterMap["element"];

const nonContentTags = new Set(["script", "style", "link", "template"]);

/** Build an excerpt from rendered HTML, preserving its structure and local links. */
export function prepareFeedContent(
  html: string,
  {
    characterLimit,
    postUrl,
    idPrefix,
  }: {
    characterLimit: number;
    postUrl: string;
    idPrefix: string;
  },
) {
  if (!Number.isInteger(characterLimit) || characterLimit < 1) {
    throw new RangeError(
      "The feed character limit must be a positive integer.",
    );
  }

  const fragment = parseFragment(html);
  let characterCount = 0;

  function prepare(parent: Parent, preformatted = false) {
    parent.childNodes = parent.childNodes.filter((node) => {
      if ("tagName" in node) {
        // A post's scripts and styles belong on its own page, not in the feed.
        if (nonContentTags.has(node.tagName)) return false;
        if (/^h[1-6]$/.test(node.tagName)) {
          node.tagName =
            node.nodeName = `h${Math.min(6, Math.max(3, Number(node.tagName[1]) + 1))}`;
        }
        prepare(node, preformatted || node.tagName === "pre");
      } else if (node.nodeName === "#text" && "value" in node) {
        if (!preformatted)
          node.value = node.value.replace(/[\t\n\f\r ]+/g, " ");
        if (preformatted || node.value.trim()) {
          characterCount += Array.from(node.value).length;
        }
      }
      return true;
    });
  }
  prepare(fragment);

  const truncated = characterCount > characterLimit;
  if (truncated) {
    let remaining = characterLimit;
    function truncate(parent: Parent, preformatted = false) {
      const children: Child[] = [];
      for (const node of parent.childNodes) {
        if (remaining === 0) break;
        if ("tagName" in node) {
          truncate(node, preformatted || node.tagName === "pre");
        } else if (node.nodeName === "#text" && "value" in node) {
          if (preformatted || node.value.trim()) {
            const characters = Array.from(node.value);
            node.value = characters.slice(0, remaining).join("");
            remaining = Math.max(0, remaining - characters.length);
          }
        }
        children.push(node);
      }
      parent.childNodes = children;
    }
    truncate(fragment);
  }

  const elements: Element[] = [];
  function collect(parent: Parent) {
    for (const node of parent.childNodes) {
      if ("tagName" in node) {
        elements.push(node);
        collect(node);
      }
    }
  }
  collect(fragment);

  const retainedIds = new Set<string>();
  for (const element of elements) {
    const id = element.attrs.find((attr) => attr.name === "id");
    if (id) {
      retainedIds.add(id.value);
      id.value = idPrefix + id.value;
    }
  }
  for (const element of elements) {
    for (const attr of element.attrs) {
      if (attr.name === "href" && attr.value.startsWith("#")) {
        let target = attr.value.slice(1);
        try {
          target = decodeURIComponent(target);
        } catch {
          /* Preserve malformed author URLs. */
        }
        attr.value = retainedIds.has(target)
          ? `#${idPrefix}${target}`
          : postUrl + attr.value;
      } else if (
        ["aria-describedby", "aria-labelledby", "for"].includes(attr.name)
      ) {
        const references = attr.value
          .split(/\s+/)
          .filter((id) => retainedIds.has(id));
        if (references.length) {
          attr.value = references.map((id) => idPrefix + id).join(" ");
        } else {
          element.attrs = element.attrs.filter(
            (candidate) => candidate !== attr,
          );
        }
      }
    }
  }

  return { html: serialize(fragment), truncated };
}
