import assert from "node:assert/strict";
import test from "node:test";
import { parseFragment, serialize, type DefaultTreeAdapterMap } from "parse5";
import { prepareFeedContent } from "./feed.ts";

function excerpt(
  html: string,
  characterLimit = 3500,
  idPrefix = "post-example-",
) {
  return prepareFeedContent(html, {
    characterLimit,
    postUrl: "/blog/example",
    idPrefix,
  });
}

function textContent(node: DefaultTreeAdapterMap["node"]): string {
  if ("value" in node) return node.value;
  return "childNodes" in node ? node.childNodes.map(textContent).join("") : "";
}

test("short posts retain full formatted text, entities, links and embedded media", () => {
  const source =
    '<p>Hello <em>world</em> &amp; <a href="https://example.com">friends</a> 🌻.</p><iframe src="https://example.com/video"></iframe>';
  const result = excerpt(source);
  assert.equal(result.truncated, false);
  assert.equal(result.html, source);
});

test("excerpts stop at the last complete paragraph that fits", () => {
  const result = excerpt(
    "<p>First <em>paragraph</em>.</p>\n<p>Second paragraph.</p>\n<p>Last.</p>",
    30,
  );
  assert.deepEqual(result, {
    html: "<p>First <em>paragraph</em>.</p>",
    truncated: true,
  });
});

test("an oversized first list stays complete, including nested lists, links and entities", () => {
  const result = excerpt(
    '<ul><li><a href="/more">A &amp; B</a><ul><li>nested</li></ul></li><li><code>abcdef</code></li></ul><p>Later</p>',
    8,
  );
  assert.equal(result.truncated, true);
  assert.equal(
    result.html,
    '<ul><li><a href="/more">A &amp; B</a><ul><li>nested</li></ul></li><li><code>abcdef</code></li></ul>',
  );
  assert.equal(textContent(parseFragment(result.html)), "A & Bnestedabcdef");
  assert.equal(serialize(parseFragment(result.html)), result.html);
});

test("Unicode text uses characters rather than bytes or half a surrogate pair", () => {
  const result = excerpt("<p>🌻🌷🌺</p><p>abcd</p>", 3);
  assert.equal(result.html, "<p>🌻🌷🌺</p>");
  assert.equal(result.truncated, true);
});

test("an exact-length post remains complete, including trailing media", () => {
  assert.deepEqual(excerpt('<p>abc</p><img src="/photo.jpg">', 3), {
    html: '<p>abc</p><img src="/photo.jpg">',
    truncated: false,
  });
});

test("a first paragraph longer than the budget stays whole", () => {
  const paragraph = `<p>${"x".repeat(3501)} <em>ending</em>.</p>`;
  assert.deepEqual(excerpt(paragraph + "<p>Later.</p>"), {
    html: paragraph,
    truncated: true,
  });
});

test("an oversized single paragraph is a full post, including its trailing media", () => {
  const source = '<p>A whole long paragraph.</p><img src="/photo.jpg">';
  assert.deepEqual(excerpt(source, 3), { html: source, truncated: false });
});

test("leading media does not prevent retaining an oversized first paragraph", () => {
  const source = '<img src="/photo.jpg"><p>A whole long paragraph.</p>';
  assert.deepEqual(excerpt(source + "<p>Later.</p>", 3), {
    html: source,
    truncated: true,
  });
});

test("preformatted code retains indentation while HTML formatting whitespace does not consume the budget", () => {
  const source = "<p>abc</p>\n\n<pre><code>  xy\nzz</code></pre><p>Later.</p>";
  assert.deepEqual(excerpt(source, 10), {
    html: "<p>abc</p> <pre><code>  xy\nzz</code></pre>",
    truncated: true,
  });
  assert.deepEqual(excerpt(source, 9), {
    html: "<p>abc</p>",
    truncated: true,
  });
});

test("wrapped code blocks and blockquotes stay intact", () => {
  for (const block of [
    "<figure><pre><code>abcdef\n  gh</code></pre><figcaption>Example</figcaption></figure>",
    "<blockquote><p>First paragraph.</p><p>Second paragraph.</p></blockquote>",
  ]) {
    assert.deepEqual(excerpt(block + "<p>Later.</p>", 3), {
      html: block,
      truncated: true,
    });
  }
});

test("a heading is omitted when its following paragraph does not fit", () => {
  const result = excerpt(
    '<p>Intro.</p>\n<h2 id="next">Next</h2>\n<p>Paragraph.</p>',
    10,
  );
  assert.deepEqual(result, { html: "<p>Intro.</p>", truncated: true });
});

test("leading headings stay with an oversized first paragraph", () => {
  const result = excerpt(
    "<h2>Title</h2>\n<p>A whole paragraph.</p><p>Later.</p>",
    3,
  );
  assert.deepEqual(result, {
    html: "<h3>Title</h3> <p>A whole paragraph.</p>",
    truncated: true,
  });
});

test("retained headings and footnotes have unique IDs; omitted targets link to the full post", () => {
  const source =
    '<h2 id="intro">Hi</h2><p><a href="#intro">up</a><a href="#later">next</a></p><h2 id="later">Later text</h2>';
  const result = excerpt(source, 8);
  assert.equal(
    result.html,
    '<h3 id="post-example-intro">Hi</h3><p><a href="#post-example-intro">up</a><a href="/blog/example#later">next</a></p>',
  );
  const otherPost = excerpt(source, 8, "post-other-");
  assert.ok(otherPost.html.includes('id="post-other-intro"'));
  assert.ok(!otherPost.html.includes('id="post-example-intro"'));
});

test("footnote references support URL-encoded fragments and ARIA labels", () => {
  const result = excerpt(
    '<p id="note" aria-describedby="note-label"><a href="#caf%C3%A9">café</a></p><span id="note-label">note</span><p id="café">target</p>',
  );
  assert.ok(result.html.includes('href="#post-example-café"'));
  assert.ok(result.html.includes('aria-describedby="post-example-note-label"'));
});

test("references to omitted footnote labels do not leave dangling ARIA IDs", () => {
  const result = excerpt(
    '<p aria-describedby="later">abc</p><span id="later">label</span>',
    3,
  );
  assert.equal(result.html, "<p>abc</p>");
});

test("post scripts and styles are excluded from homepage excerpts and their text budget", () => {
  const result = excerpt(
    '<link rel="stylesheet" href="/chart.css"><style>p { color: red }</style><p>abc</p><script>launchChart()</script>',
    3,
  );
  assert.deepEqual(result, { html: "<p>abc</p>", truncated: false });
});

test("rejects invalid character limits", () => {
  for (const limit of [0, -1, 2.5, Infinity, NaN]) {
    assert.throws(() => excerpt("<p>text</p>", limit), RangeError);
  }
});
