/** Leading-run seat direction (shared by the bundle + tests). */

// Hebrew + Arabic blocks (covers Persian); Latin + Cyrillic + Greek as LTR.
export const RTL_RANGE =
  /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;
export const LTR_RANGE = /[A-Za-z\u00C0-\u024F\u0370-\u03FF\u0400-\u04FF]/;

// Consecutive LTR words from the start needed to lock a mixed seat to LTR.
// A lone English tech term ("Merge کن") stays RTL; a real English opening
// ("Here is the fix ...") locks LTR. Pure single-script seats skip the gate.
export const MIN_LTR_WORDS = 2;

// Chars scanned per seat tick; the verdict only needs the leading run plus
// the first RTL word, so long streaming answers never pay a full scan.
const SCAN_CHARS = 2000;
const SCAN_WORDS = 12;

/**
 * Leading-run direction of a seat's own text.
 * @param text - seat textContent.
 * @returns verdict, or null when no letters yet (caller keeps inherited dir).
 *   A lone leading LTR word is a provisional 'ltr' without lock: a later
 *   Persian word still flips it to RTL, while a finished one-word answer
 *   keeps its LTR. Only a 2+ LTR run locks.
 */
export function detectSeatDir(text) {
  const words = [];
  let current = null;
  let scanned = 0;
  for (const ch of text) {
    if (scanned >= SCAN_CHARS || words.length >= SCAN_WORDS) break;
    scanned += 1;
    let d = null;
    if (RTL_RANGE.test(ch)) d = 'rtl';
    else if (LTR_RANGE.test(ch)) d = 'ltr';
    if (d === null) {
      if (current !== null) {
        words.push(current);
        current = null;
      }
      continue;
    }
    if (current === null) current = d;
    else if (current !== d) {
      words.push(current);
      current = d;
    }
  }
  if (current !== null) words.push(current);
  if (words.length === 0) return null;
  if (words[0] === 'rtl') return { dir: 'rtl', locked: false };
  let run = 0;
  for (const w of words) {
    if (w !== 'ltr') break;
    run += 1;
  }
  if (run >= MIN_LTR_WORDS) return { dir: 'ltr', locked: true };
  if (words.includes('rtl')) return { dir: 'rtl', locked: false };
  return { dir: 'ltr', locked: false };
}

// Subtrees whose text must not vote on the seat direction: they render as
// LTR islands (own CSS rules) but their English words would otherwise flip
// a Persian seat's leading run (e.g. a "Running tests" tool-call above
// "سلام دنیا"). Exact-match selectors only (no *=), shared with tests.
export const SEAT_ISLAND =
  "pre,code,[data-step-process],[data-chat-flow-kind='tool-call']," +
  "[data-chat-flow-kind='command'],[data-chat-call-id],[data-changed-files]," +
  '[data-clock],[data-process-activity],[data-turn-process],[data-chat-running]';

/**
 * Seat prose for the direction verdict: textContent minus LTR-island
 * subtrees, capped at SCAN_CHARS (the verdict never reads past it).
 * DOM-free fallback: seats without childNodes (tests, SSR) read raw
 * textContent; island filtering applies wherever childNodes exist.
 */
export function seatText(seat, limit = SCAN_CHARS) {
  const raw = seat.textContent ?? '';
  const roots = seat.childNodes;
  if (!roots || typeof roots.length !== 'number') return raw;
  const stack = [];
  for (let i = roots.length - 1; i >= 0; i--) stack.push(roots[i]);
  let out = '';
  while (stack.length > 0) {
    const node = stack.pop();
    if (node.nodeType === 3) {
      out += node.nodeValue ?? '';
      if (out.length >= limit) break;
    } else if (node.nodeType === 1) {
      if (typeof node.matches === 'function' && node.matches(SEAT_ISLAND))
        continue;
      const kids = node.childNodes;
      if (kids && kids.length) {
        for (let i = kids.length - 1; i >= 0; i--) stack.push(kids[i]);
      }
    }
  }
  return out;
}

/**
 * Orient one seat from its leading word run (shared by the bundle +
 * orient-check; the bundle inlines this file, tests import it).
 * @returns 'write' when dir was set, 'skip' when already correct,
 *   undefined when locked LTR or no letters yet.
 */
export function orientSeat(seat) {
  if (seat.getAttribute('data-rastin-dir') === 'ltr') return undefined;
  const verdict = detectSeatDir(seatText(seat));
  if (verdict === null) return undefined;
  if (seat.getAttribute('dir') === verdict.dir) return 'skip';
  if (verdict.locked) seat.setAttribute('data-rastin-dir', 'ltr');
  seat.setAttribute('dir', verdict.dir);
  return 'write';
}

// Flow arrows mirrored in RTL prose (glyph flip, copy intact). CSS cannot
// retarget one char, so each arrow gets an inline-block mirror span holding
// the exact char. Only the four directional arrows: symmetric ↔/⇔ need no
// mirror, ASCII "->"/"=>" need whole-token wrapping (per-char mirror would
// break them).
// ponytail: ceiling is full arrow ranges + ASCII tokens; upgrade path:
// widen ARROW_PART (ASCII needs token match, not per-char).
export const ARROW_PART = /([←→⇐⇒])/u;

/**
 * Mirror flow arrows of an RTL seat, unwrap on LTR (shared by the bundle +
 * orient-check; the bundle inlines this file, tests import it).
 * @param seat - message seat element.
 * @param doc - node factory (defaults to the seat's ownerDocument).
 * @returns wrapped/unwrapped node count (0 when already correct).
 */
export function mirrorSeatArrows(seat, doc = seat?.ownerDocument) {
  if (!doc || typeof doc.createElement !== 'function') return 0;
  const rtl = seat.getAttribute?.('dir') !== 'ltr';
  const roots = seat.childNodes;
  if (!roots || typeof roots.length !== 'number') return 0;
  const stack = [...roots].reverse();
  let changed = 0;
  while (stack.length > 0) {
    const node = stack.pop();
    if (node.nodeType === 1) {
      if (
        typeof node.getAttribute === 'function' &&
        node.getAttribute('data-rastin-mirror') !== null
      ) {
        if (!rtl) {
          node.replaceWith(doc.createTextNode(node.textContent ?? ''));
          changed += 1;
        }
        continue;
      }
      if (typeof node.matches === 'function' && node.matches(SEAT_ISLAND))
        continue;
      if (node.childNodes?.length)
        for (let i = node.childNodes.length - 1; i >= 0; i--)
          stack.push(node.childNodes[i]);
    } else if (node.nodeType === 3 && rtl) {
      const text = node.nodeValue ?? '';
      if (!ARROW_PART.test(text)) continue;
      const nodes = [];
      for (const part of text.split(ARROW_PART)) {
        if (part === '') continue;
        if (ARROW_PART.test(part)) {
          const span = doc.createElement('span');
          span.setAttribute('data-rastin-mirror', '');
          span.textContent = part;
          nodes.push(span);
        } else {
          nodes.push(doc.createTextNode(part));
        }
      }
      node.replaceWith(...nodes);
      changed += 1;
    }
  }
  // Merge split text runs back after an unwrap so streaming diffs stay cheap.
  if (!rtl) seat.normalize?.();
  return changed;
}
