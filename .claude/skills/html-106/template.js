const uiText = JSON.parse(document.getElementById("ui-text").textContent);
for (const attribute of ["aria-label", "title"]) {
  for (const element of document.querySelectorAll('[' + attribute + '^="ui."]')) {
    const key = element.getAttribute(attribute);
    element.setAttribute(attribute, uiText[key] ?? key);
  }
}

const palettes = JSON.parse(document.getElementById("color-palettes").textContent);
function applyCardColor(element, key = element.dataset.category) {
  if (!Object.hasOwn(palettes.cards, key)) return;
  const { hue, chroma } = palettes.cards[key];
  element.style.setProperty("--card-hue", hue);
  element.style.setProperty("--card-chroma", chroma);
}
applyCardColor(document.documentElement, "default");

for (const line of document.querySelectorAll(".line[data-speaker]")) {
  const key = line.dataset.speaker;
  if (!Object.hasOwn(palettes.speakers, key)) continue;
  const { background, text } = palettes.speakers[key];
  line.style.setProperty("--speaker-background", background);
  line.style.setProperty("--speaker-text", text);
}

const [heading, ...titleLabels] = document.title.split("｜");
const pageHeading = heading.trim();
const titleLabel = titleLabels.join("｜").trim();
document.querySelector(".masthead h1").textContent = pageHeading;
const toolbarTitle = document.querySelector(".toolbar-title");
toolbarTitle.textContent = pageHeading;
toolbarTitle.title = pageHeading;
document.querySelector(".masthead .kicker").textContent = titleLabel;

const emojiSource = document.getElementById("favicon-emoji");
const faviconEmoji = emojiSource?.content.textContent.trim();
if (faviconEmoji) {
  const headingIcon = document.createElement("span");
  headingIcon.setAttribute("aria-hidden", "true");
  headingIcon.textContent = faviconEmoji;
  emojiSource.before(headingIcon);
  const toolbarIcon = headingIcon.cloneNode(true);
  toolbarIcon.className = "toolbar-emoji";
  toolbarTitle.prepend(toolbarIcon);
}
const faviconSize = 64;
const faviconCanvas = document.createElement("canvas");
faviconCanvas.width = faviconSize;
faviconCanvas.height = faviconSize;
const faviconContext = faviconCanvas.getContext("2d");
if (faviconContext && faviconEmoji) {
  faviconContext.font = '52px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';
  faviconContext.textAlign = "center";
  faviconContext.textBaseline = "middle";
  faviconContext.fillText(faviconEmoji, faviconSize / 2, faviconSize / 2);

  const favicon = document.createElement("link");
  favicon.rel = "icon";
  favicon.type = "image/png";
  favicon.sizes.value = faviconSize + "x" + faviconSize;
  favicon.href = faviconCanvas.toDataURL("image/png");
  document.head.append(favicon);
}

const canReloadPage = /^(file|https?):$/.test(location.protocol);
const filename = location.pathname.split("/").at(-1);
const pageName = canReloadPage && /[.]html?$/i.test(filename) ? filename.replace(/[.]html?$/i, "") : pageHeading;
const documentId = document.querySelector('meta[name="html-106-document-id"]')?.content.trim();
const stateKey = documentId ? "html-106:card-state:" + documentId : pageName + ":card-state";
const cards = [...document.querySelectorAll(".card")];
function isCardOpen(card) {
  return card.hasAttribute("data-open");
}

function setCardOpen(card, open) {
  if (isCardOpen(card) === open) return;
  card.toggleAttribute("data-open", open);
  card.querySelector(":scope > .front > .card-header .card-toggle")?.setAttribute("aria-expanded", String(open));
  card.dispatchEvent(new Event("toggle"));
}

for (const card of cards) {
  const header = card.querySelector(":scope > .front > .card-header");
  header.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.target.closest(".subtree-toggle, a")) return;
    setCardOpen(card, !isCardOpen(card));
  });
}
const outline = document.querySelector("nav.contents");
const outlineLinks = new Map();
const outlineLists = new Map();

for (const [index, card] of cards.entries()) {
  applyCardColor(card);
  const cardHeader = card.querySelector(":scope > .front > .card-header");
  if (!cardHeader) continue;
  const heading = cardHeader.querySelector(":scope > :is(h2, h3, h4, h5, h6)") ?? cardHeader;
  if (!card.id && !heading.id) {
    let id = "card-" + (index + 1);
    while (document.getElementById(id)) id += "-";
    card.id = id;
  }

  const parent = card.parentElement.closest(".card");
  let list = outlineLists.get(parent);
  if (!list) {
    list = document.createElement("ul");
    list.setAttribute("role", "list");
    const container = outlineLinks.get(parent)?.parentElement ?? outline;
    container.append(list);
    outlineLists.set(parent, list);
  }

  const item = document.createElement("li");
  if (card.dataset.category) {
    item.dataset.category = card.dataset.category;
    applyCardColor(item);
  }
  const link = document.createElement("a");
  link.href = "#" + encodeURIComponent(card.id || heading.id);
  const title = heading.cloneNode(true);
  title.querySelector(":scope > .label")?.remove();
  link.textContent = title.textContent.trim();
  item.append(link);
  list.append(item);
  outlineLinks.set(card, link);

  const sourceLabel = heading.querySelector(":scope > .label");
  if (!sourceLabel) continue;
  const label = sourceLabel.cloneNode(true);
  const spacer = label.cloneNode(true);
  spacer.classList.add("label-spacer");
  spacer.setAttribute("aria-hidden", "true");
  link.append(document.createElement("wbr"), spacer, label);
  link.title = label.textContent.trim();
}

const cardKey = (card) =>
  card.querySelector(":scope > .front > .card-header > [data-heading-id]")?.dataset.headingId.trim() ||
  card.id || card.getAttribute("aria-labelledby") ||
  card.querySelector(":scope > .front > .card-header > [id]")?.id;

function readState() {
  try {
    const value = JSON.parse(localStorage.getItem(stateKey) ?? "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

const restoredState = readState();
for (const card of cards) {
  const key = cardKey(card);
  if (typeof restoredState[key] === "boolean") setCardOpen(card, restoredState[key]);
}
const lastOpen = new Map(cards.map((card) => [cardKey(card), isCardOpen(card)]));

function saveOpenCards() {
  const changes = Object.fromEntries(cards
    .filter((card) => lastOpen.get(cardKey(card)) !== isCardOpen(card))
    .map((card) => [cardKey(card), isCardOpen(card)]));
  if (Object.keys(changes).length === 0) return;
  try {
    localStorage.setItem(stateKey, JSON.stringify({ ...readState(), ...changes }));
    for (const [key, open] of Object.entries(changes)) lastOpen.set(key, open);
  } catch {
    // Card toggles also work when the preview does not expose localStorage.
  }
}

for (const card of cards) card.addEventListener("toggle", saveOpenCards);
window.addEventListener("pagehide", saveOpenCards);

const subtreeActions = [
  { symbol: "➕", labelKey: "ui.expandAll", open: true },
  { symbol: "➖", labelKey: "ui.collapseAll", open: false },
];

function createCardControls(targetCards, title) {
  const controls = document.createElement("span");
  controls.className = "subtree-controls";
  const buttons = [];

  for (const { symbol, labelKey, open } of subtreeActions) {
    const label = uiText[labelKey];
    const button = document.createElement("button");
    button.type = "button";
    button.className = "subtree-toggle";
    button.textContent = symbol;
    button.title = label;
    button.setAttribute("aria-label", label + " (" + title + ")");

    button.addEventListener("click", (event) => {
      if (event.defaultPrevented) return;
      event.preventDefault();

      for (const card of targetCards) setCardOpen(card, open);
      saveOpenCards();
    });

    controls.append(button);
    buttons.push({ button, open });
  }

  function updateDisabled() {
    for (const { button, open } of buttons) {
      button.disabled = targetCards.every((card) => isCardOpen(card) === open);
    }
  }

  const observer = new MutationObserver(updateDisabled);
  for (const card of targetCards) {
    observer.observe(card, { attributes: true, attributeFilter: ["data-open"] });
  }
  updateDisabled();
  return controls;
}

for (const card of cards) {
  const heading = card.querySelector(":scope > .front > .card-header");
  const subtree = [card, ...card.querySelectorAll(".card")];
  heading?.append(createCardControls(subtree, heading.textContent.trim()));
}

function reveal(hash, openTarget) {
  let id = hash.slice(1);
  try {
    id = decodeURIComponent(id);
  } catch {
    return;
  }
  const target = document.getElementById(id);
  if (!target) return;
  let card = target.closest(".card");
  if (!openTarget && (target === card || target.closest(".card-header"))) {
    card = card?.parentElement.closest(".card");
  }
  for (; card; card = card.parentElement.closest(".card")) setCardOpen(card, true);
  return target;
}

if (!reloading) reveal(location.hash, false)?.scrollIntoView();
outline.addEventListener("click", (event) => {
  const link = event.target.closest('a[href^="#"]');
  if (link && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
    reveal(link.hash, true);
  }
});
window.addEventListener("hashchange", () => reveal(location.hash, true)?.scrollIntoView());

const viewport = window.visualViewport;
let outlineFrame = null;
let currentOutlineLink;

function updateOutline() {
  outlineFrame = null;
  const midpoint = viewport ? viewport.offsetTop + viewport.height / 2 : window.innerHeight / 2;
  const currentCard = cards.findLast((card) => {
    if (!outlineLinks.has(card) || card.parentElement.closest(".card:not([data-open])")) return false;
    const { top, bottom } = card.getBoundingClientRect();
    if (midpoint < top) return false;
    if (midpoint < bottom) return true;
    const nextCard = card.nextElementSibling;
    return nextCard?.matches(".card") && midpoint < nextCard.getBoundingClientRect().top;
  });
  let link = outlineLinks.get(currentCard);
  const cardBody = currentCard && isCardOpen(currentCard) ? currentCard.querySelector(":scope > .card-body") : null;
  if (cardBody) {
    const { bottom } = cardBody.getBoundingClientRect();
    const paddingBottom = parseFloat(getComputedStyle(cardBody).paddingBottom);
    if (midpoint >= bottom - paddingBottom) {
      const lastVisibleCard = [...cardBody.querySelectorAll(".card")].findLast((card) =>
        outlineLinks.has(card) && !card.parentElement.closest(".card:not([data-open])"));
      link = outlineLinks.get(lastVisibleCard) ?? link;
    }
  }
  if (link === currentOutlineLink) return;
  currentOutlineLink?.removeAttribute("aria-current");
  link?.setAttribute("aria-current", "location");
  currentOutlineLink = link;

  if (!link || outline.scrollHeight <= outline.clientHeight) return;
  const style = getComputedStyle(outline);
  const panelTop = outline.getBoundingClientRect().top + outline.clientTop;
  const visibleTop = panelTop + parseFloat(style.scrollPaddingBlockStart);
  const visibleBottom = panelTop + outline.clientHeight - parseFloat(style.scrollPaddingBlockEnd);
  const { top, bottom } = link.getBoundingClientRect();
  if (top < visibleTop || bottom - top > visibleBottom - visibleTop) {
    outline.scrollTop += top - visibleTop;
  } else if (bottom > visibleBottom) {
    outline.scrollTop += bottom - visibleBottom;
  }
}

function scheduleOutlineUpdate() {
  if (outlineFrame === null) outlineFrame = requestAnimationFrame(updateOutline);
}

window.addEventListener("scroll", scheduleOutlineUpdate, { passive: true });
window.addEventListener("resize", scheduleOutlineUpdate);
viewport?.addEventListener("scroll", scheduleOutlineUpdate, { passive: true });
viewport?.addEventListener("resize", scheduleOutlineUpdate);
for (const card of cards) card.addEventListener("toggle", scheduleOutlineUpdate);
scheduleOutlineUpdate();

const reloadButton = document.querySelector("#reload-page");
reloadButton.before(createCardControls(cards, uiText["ui.allCards"]));
const reloadStatus = document.querySelector("#reload-status");
reloadButton.addEventListener("click", () => {
  saveOpenCards();
  if (canReloadPage) {
    location.reload();
    return;
  }
  reloadStatus.textContent = uiText["ui.reloadPreview"];
});

let press;
document.addEventListener("pointerdown", (event) => {
  if (!event.isPrimary) return;
  const heading = event.target.closest(".card > .front > .card-header");
  press = heading && event.button === 0
    ? { heading, pointerId: event.pointerId, x: event.clientX, y: event.clientY, moved: false }
    : undefined;
}, true);

function recordMovement(event) {
  if (press?.pointerId === event.pointerId &&
      Math.hypot(event.clientX - press.x, event.clientY - press.y) >= 4) press.moved = true;
}

document.addEventListener("pointermove", recordMovement, true);
document.addEventListener("pointerup", recordMovement, true);
document.addEventListener("pointercancel", (event) => {
  if (press?.pointerId === event.pointerId) press = undefined;
}, true);
document.addEventListener("click", (event) => {
  if (event.detail > 0 && press?.moved && event.target.closest(".card > .front > .card-header") === press.heading) {
    event.preventDefault();
  }
  press = undefined;
}, true);

window.Prism?.highlightAllUnder(document.querySelector("main"));

function readText(block, visibleOnly = true) {
  if (visibleOnly && !block.getClientRects().length) return null;

  const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
  const parts = [];
  let text = "";
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const parent = node.parentElement;
    if (!node.length || (visibleOnly && (!parent.getClientRects().length ||
        getComputedStyle(parent).visibility !== "visible"))) continue;
    parts.push({ node, start: text.length, end: text.length + node.length });
    text += node.data;
  }
  return { text, parts };
}

function toDOMRange(index, start, end) {
  const rawStart = index.offsets?.starts[start] ?? start;
  const rawEnd = index.offsets?.ends[end - 1] ?? end;
  if (rawStart >= rawEnd) return null;

  const first = index.parts.find(part => part.end > rawStart);
  const last = index.parts.find(part => part.end >= rawEnd);
  const range = new Range();
  range.setStart(first.node, rawStart - first.start);
  range.setEnd(last.node, rawEnd - last.start);
  return range;
}

function installDiffHighlights() {
  const registry = window.CSS?.highlights;
  if (!registry || typeof Highlight !== "function") return;
  const added = new Highlight();
  const removed = new Highlight();
  added.priority = removed.priority = -1;
  const breaks = [];
  const observer = new ResizeObserver(positionBreaks);

  function tokenize(text, pattern = /[A-Z]+(?=[A-Z][a-z])|[A-Z]?[a-z]+|[A-Z]+|\n|[^\S\n]+|\d+|./gu) {
    return Array.from(text.matchAll(pattern), ({ 0: value, index: start }) =>
      ({ value, start, end: start + value.length }));
  }

  function align(oldTokens, newTokens) {
    const equal = (i, j) => oldTokens[i].value === newTokens[j].value;
    const pairs = [];
    let start = 0;
    let endOld = oldTokens.length;
    let endNew = newTokens.length;
    while (start < endOld && start < endNew && equal(start, start)) {
      pairs.push([start, start]);
      start++;
    }
    while (endOld > start && endNew > start && equal(endOld - 1, endNew - 1)) {
      endOld--;
      endNew--;
    }

    const width = endNew - start + 1;
    const cells = (endOld - start + 1) * width;
    if (endOld > start && endNew > start) {
      if (cells > 250000) return null;
      const scores = new Uint32Array(cells);
      const offset = (i, j) => (i - start) * width + j - start;
      for (let i = endOld - 1; i >= start; i--) {
        for (let j = endNew - 1; j >= start; j--) {
          const skip = Math.max(scores[offset(i + 1, j)], scores[offset(i, j + 1)]);
          const keep = equal(i, j) ? oldTokens[i].value.length + scores[offset(i + 1, j + 1)] : 0;
          scores[offset(i, j)] = Math.max(skip, keep);
        }
      }
      for (let i = start, j = start; i < endOld && j < endNew;) {
        if (equal(i, j) && scores[offset(i, j)] === oldTokens[i].value.length + scores[offset(i + 1, j + 1)]) {
          pairs.push([i++, j++]);
        } else if (scores[offset(i, j + 1)] >= scores[offset(i + 1, j)]) {
          j++;
        } else {
          i++;
        }
      }
    }
    for (let i = endOld, j = endNew; i < oldTokens.length; i++, j++) pairs.push([i, j]);
    return pairs;
  }

  function findChanges(oldText, newText) {
    const a = tokenize(oldText);
    const b = tokenize(newText);
    const pairs = align(a, b);
    if (!pairs) return null;
    const oldMask = new Uint8Array(oldText.length).fill(1);
    const newMask = new Uint8Array(newText.length).fill(1);
    let oldEnd = 0;
    let newEnd = 0;
    const clear = (mask, token, base = 0) => mask.fill(0, base + token.start, base + token.end);

    for (const [i, j] of [...pairs, [a.length, b.length]]) {
      const oldStart = a[i]?.start ?? oldText.length;
      const newStart = b[j]?.start ?? newText.length;
      const before = oldText.slice(oldEnd, oldStart);
      const after = newText.slice(newEnd, newStart);
      // Refine a split or join when one fragment is preserved across the changed line breaks.
      if (before && after && before.includes("\n") !== after.includes("\n")) {
        const oldChars = tokenize(before, /./gsu);
        const newChars = tokenize(after, /./gsu);
        const same = align(oldChars, newChars);
        const unbroken = before.includes("\n") ? newChars : oldChars;
        if (same?.length === unbroken.length) {
          for (const [x, y] of same) {
            clear(oldMask, oldChars[x], oldEnd);
            clear(newMask, newChars[y], newEnd);
          }
        }
      }
      if (a[i]) {
        clear(oldMask, a[i]);
        clear(newMask, b[j]);
        oldEnd = a[i].end;
        newEnd = b[j].end;
      }
    }
    return [oldMask, newMask];
  }

  function positionBreaks() {
    for (const { pre, range, mark } of breaks) {
      const rect = range.getBoundingClientRect();
      mark.style.visibility = rect.height ? "" : "hidden";
      if (!rect.height) continue;
      const frame = pre.getBoundingClientRect();
      mark.style.left = (rect.right - frame.left - pre.clientLeft + pre.scrollLeft) + "px";
      mark.style.top = (rect.top - frame.top - pre.clientTop + pre.scrollTop) + "px";
      mark.style.height = rect.height + "px";
    }
  }

  for (const code of document.querySelectorAll("pre > code.diff-highlight")) {
    const pre = code.parentElement;
    const index = readText(code, false);
    const lines = index.text.split("\n");
    let inHunk = !lines.some(line => line.startsWith("@@ "));
    let offset = 0;
    let previous;
    let layer;
    let oldRows = [];
    let newRows = [];

    function paint(rows, mask, highlight) {
      let start = 0;
      for (const row of rows) {
        const end = start + row.text.length;
        for (let i = start; i < end;) {
          if (!mask[i]) { i++; continue; }
          let next = i + 1;
          while (next < end && mask[next]) next++;
          highlight.add(toDOMRange(index, row.offset + i - start, row.offset + next - start));
          i = next;
        }
        if (row.eol && mask[end]) {
          if (!layer) {
            layer = document.createElement("span");
            layer.className = "diff-break-layer";
            layer.setAttribute("aria-hidden", "true");
            pre.append(layer);
            observer.observe(code);
          }
          const lineEnd = row.offset + row.text.length;
          const range = toDOMRange(index, row.offset - 1, lineEnd);
          range.collapse(false);
          const mark = document.createElement("span");
          mark.className = highlight === removed ? "diff-break removed" : "diff-break";
          layer.append(mark);
          breaks.push({ pre, range, mark });
        }
        start = end + Number(row.eol);
      }
    }

    function flush() {
      if (oldRows.length && newRows.length) {
        const join = rows => rows.map(row => row.text + (row.eol ? "\n" : "")).join("");
        const masks = findChanges(join(oldRows), join(newRows));
        if (masks) {
          paint(oldRows, masks[0], removed);
          paint(newRows, masks[1], added);
        }
      }
      oldRows = [];
      newRows = [];
      previous = undefined;
    }

    for (const line of lines) {
      if (line.startsWith("@@ ")) {
        flush();
        inHunk = true;
      } else if (line.startsWith("diff --git ")) {
        flush();
        inHunk = false;
      } else if (line === "\\ No newline at end of file" && previous) {
        previous.eol = false;
      } else if (inHunk && (line[0] === "-" || line[0] === "+")) {
        if (line[0] === "-" && newRows.length) flush();
        previous = { text: line.slice(1), offset: offset + 1, eol: true };
        (line[0] === "-" ? oldRows : newRows).push(previous);
      } else {
        flush();
      }
      offset += line.length + 1;
    }
    flush();
  }
  registry.set("diff-added", added);
  registry.set("diff-removed", removed);
  positionBreaks();
  if (breaks.length) document.fonts.ready.then(positionBreaks);
}

installDiffHighlights();

function installSelectionHighlights() {
  const registry = window.CSS?.highlights;
  if (!registry || typeof Highlight !== "function") return;

  const name = "selection-match";
  const collapsibleSpace = /[ \t\r\n]/;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const effects = [];
  const effectHosts = new Set();

  function readPageText() {
    const chunks = [];
    let current = null;

    function visit(element, host) {
      const style = getComputedStyle(element);
      if (style.display === "none" || style.opacity === "0") return;

      if (element.matches("pre, br")) {
        if (element.matches("pre")) {
          const raw = readText(element);
          if (raw?.text) chunks.push({ host: element, code: true, ...raw });
        }
        current = null;
        return;
      }

      if (style.display !== "inline" && style.display !== "contents") host = element;
      for (const child of element.childNodes) {
        if (child.nodeType === Node.ELEMENT_NODE) {
          visit(child, host);
        } else if (child.nodeType === Node.TEXT_NODE && child.length &&
                   style.visibility === "visible" && style.userSelect !== "none") {
          if (current?.host !== host) {
            current = { host, text: "", parts: [] };
            chunks.push(current);
          }
          current.parts.push({ node: child, start: current.text.length, end: current.text.length + child.length });
          current.text += child.data;
        }
      }
    }

    visit(document.body, document.body);
    const index = [];
    let text = "";
    for (const chunk of chunks) {
      const { code, host, parts } = chunk;
      const raw = chunk.text;
      const fallback = raw.replace(/[ \t\r\n]+/g, " ").replace(/^ | $/g, "");
      if (!code && !fallback) continue;
      const rendered = code ? raw : host.innerText ?? fallback;
      const offsets = code ? null : mapRenderedText(raw, rendered);
      const value = code || offsets ? rendered : fallback;
      if (!value) continue;

      // Keep code whitespace literal and give each layout-block boundary one separator.
      if (index.length) text += "\n";
      index.push({
        host,
        parts,
        text: value,
        offsets: code ? null : offsets ?? mapRenderedText(raw, value),
        start: text.length,
        end: text.length + value.length
      });
      text += value;
    }
    return { text, chunks: index };
  }

  function spaceEnd(text, start) {
    while (start < text.length && collapsibleSpace.test(text[start])) start++;
    return start;
  }

  function mapRenderedText(raw, rendered) {
    const starts = [];
    const ends = [];
    let source = 0;
    let display = 0;

    // Use the browser's rendered text to align whitespace across inline nodes.
    while (source < raw.length || display < rendered.length) {
      const sourceEnd = spaceEnd(raw, source);
      const displayEnd = spaceEnd(rendered, display);
      const sameSpace = raw.slice(source, sourceEnd) === rendered.slice(display, displayEnd);
      for (let index = display; index < displayEnd; index++) {
        const offset = source + index - display;
        starts.push(sameSpace ? offset : source);
        ends.push(sameSpace ? offset + 1 : sourceEnd);
      }
      source = sourceEnd;
      display = displayEnd;

      if (source === raw.length && display === rendered.length) break;
      if (raw[source] !== rendered[display]) return null;
      starts.push(source++);
      ends.push(source);
      display++;
    }
    return { starts, ends };
  }

  function textOffset(parts, container, offset) {
    const point = new Range();
    point.setStart(container, offset);
    point.collapse(true);
    for (const part of parts) {
      if (part.node === container) return part.start + offset;
      if (point.comparePoint(part.node, 0) >= 0) return part.start;
    }
    return parts.at(-1)?.end ?? 0;
  }

  function selectedOffsets(chunks, range) {
    let start = null;
    let end = null;
    for (const chunk of chunks) {
      const first = chunk.parts[0].node;
      const last = chunk.parts.at(-1).node;
      if (range.comparePoint(last, last.length) < 0) continue;
      if (range.comparePoint(first, 0) > 0) break;

      const rawStart = textOffset(chunk.parts, range.startContainer, range.startOffset);
      const rawEnd = textOffset(chunk.parts, range.endContainer, range.endOffset);
      if (rawStart >= rawEnd) continue;
      const left = chunk.offsets?.ends.findIndex(offset => offset > rawStart) ?? rawStart;
      const next = chunk.offsets?.starts.findIndex(offset => offset >= rawEnd) ?? rawEnd;
      const right = next < 0 ? chunk.text.length : next;
      if (left < 0 || right <= left) continue;
      start ??= chunk.start + left;
      end = chunk.start + right;
    }
    return { start, end };
  }

  function clearMatchEffects() {
    for (const effect of effects) effect.remove();
    effects.length = 0;
    for (const host of effectHosts) host.classList.remove("selection-match-host");
    effectHosts.clear();
  }

  function matchLineRects(index, range) {
    const rects = [];
    const fragment = new Range();
    const first = index.parts.findIndex(part => part.node === range.startContainer);
    for (let partIndex = first; partIndex < index.parts.length; partIndex++) {
      const { node } = index.parts[partIndex];
      const isLast = node === range.endContainer;
      fragment.setStart(node, partIndex === first ? range.startOffset : 0);
      fragment.setEnd(node, isLast ? range.endOffset : node.length);
      for (const rect of fragment.getClientRects()) {
        if (rect.width && rect.height) {
          const { left, top, right, bottom } = rect;
          rects.push({ left, top, right, bottom });
        }
      }
      if (isLast) break;
    }

    rects.sort((a, b) => a.top - b.top || a.left - b.left);
    const lines = [];
    for (const rect of rects) {
      const last = lines.at(-1);
      if (last && Math.abs(last.top - rect.top) < .5 &&
          Math.abs(last.bottom - rect.bottom) < .5 && rect.left <= last.right + .5) {
        last.right = Math.max(last.right, rect.right);
      } else {
        lines.push(rect);
      }
    }
    return lines;
  }

  function drawMatchEffect(host, index, range) {
    if (getComputedStyle(host).position === "static") {
      host.classList.add("selection-match-host");
      effectHosts.add(host);
    }
    const frame = host.getBoundingClientRect();
    const left = frame.left + host.clientLeft - host.scrollLeft;
    const top = frame.top + host.clientTop - host.scrollTop;
    for (const rect of matchLineRects(index, range)) {
      const effect = document.createElement("span");
      effect.className = "selection-match-sheen";
      effect.setAttribute("aria-hidden", "true");
      effect.style.left = `${rect.left - left}px`;
      effect.style.top = `${rect.top - top}px`;
      effect.style.width = `${rect.right - rect.left}px`;
      effect.style.height = `${rect.bottom - rect.top}px`;
      host.append(effect);
      effects.push(effect);
    }
  }

  function updateSelectionHighlights() {
    frame = null;
    clearMatchEffects();
    const selection = window.getSelection();
    if (!selection?.rangeCount || selection.isCollapsed) {
      registry.delete(name);
      return;
    }

    const { text, chunks } = readPageText();
    const { start, end } = selectedOffsets(chunks, selection.getRangeAt(0));
    const query = start === null ? "" : text.slice(start, end);
    if (!query) {
      registry.delete(name);
      return;
    }

    const animate = !reducedMotion.matches && CSS.supports("mix-blend-mode", "multiply");
    const matches = new Highlight();
    let firstChunk = 0;
    for (let match = text.indexOf(query); match !== -1; match = text.indexOf(query, match + 1)) {
      if (match === start) continue;
      const matchEnd = match + query.length;
      while (chunks[firstChunk].end <= match) firstChunk++;
      for (let chunkIndex = firstChunk; chunkIndex < chunks.length; chunkIndex++) {
        const chunk = chunks[chunkIndex];
        if (chunk.start >= matchEnd) break;
        const range = toDOMRange(chunk, Math.max(0, match - chunk.start), Math.min(chunk.text.length, matchEnd - chunk.start));
        if (!range) continue;
        matches.add(range);
        if (animate) drawMatchEffect(chunk.host, chunk, range);
      }
    }

    if (matches.size) registry.set(name, matches);
    else registry.delete(name);
  }

  let frame = null;
  function scheduleSelectionHighlights() {
    if (frame === null) frame = requestAnimationFrame(updateSelectionHighlights);
  }

  document.addEventListener("selectionchange", scheduleSelectionHighlights);
  window.addEventListener("resize", scheduleSelectionHighlights);
  reducedMotion.addEventListener("change", scheduleSelectionHighlights);
  for (const card of cards) card.addEventListener("toggle", scheduleSelectionHighlights);
}

installSelectionHighlights();
