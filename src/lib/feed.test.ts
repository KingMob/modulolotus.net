import assert from "node:assert/strict";
import test from "node:test";
import { parseFragment, serialize, type DefaultTreeAdapterMap } from "parse5";
import { prepareFeedContent } from "./feed.ts";

function excerpt(
  html: string,
  characterLimit = 3000,
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

test("truncation preserves nested list, link and code markup without cutting entities", () => {
  const result = excerpt(
    '<ul><li><a href="/more">A &amp; B</a></li><li><code>abcdef</code></li></ul><p>Later</p>',
    8,
  );
  assert.equal(result.truncated, true);
  assert.equal(
    result.html,
    '<ul><li><a href="/more">A &amp; B</a></li><li><code>abc</code></li></ul>',
  );
  assert.equal(textContent(parseFragment(result.html)), "A & Babc");
  assert.equal(serialize(parseFragment(result.html)), result.html);
});

test("Unicode text uses characters rather than bytes or half a surrogate pair", () => {
  const result = excerpt("<p>🌻🌷🌺abcd</p>", 3);
  assert.equal(result.html, "<p>🌻🌷🌺</p>");
  assert.equal(result.truncated, true);
});

test("an exact-length post remains complete, including trailing media", () => {
  assert.deepEqual(excerpt('<p>abc</p><img src="/photo.jpg">', 3), {
    html: '<p>abc</p><img src="/photo.jpg">',
    truncated: false,
  });
});

test("preformatted code retains indentation while HTML formatting whitespace does not consume the budget", () => {
  const result = excerpt("<p>abc</p>\n\n<pre><code>  xy\nzz</code></pre>", 7);
  assert.equal(result.html, "<p>abc</p> <pre><code>  xy</code></pre>");
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
