/**
 * installAutoDirection against a minimal DOM mock: streaming ticks,
 * LTR lock, idempotent writes, and LTR-island exclusion. Imports the real
 * orientSeat/seatText from src/direction.js (bundle inlines the same
 * file); any drift here is a bug signal.
 */
import assert from 'node:assert/strict';
import { orientSeat } from '../src/direction.js';

const orient = orientSeat;

function textNode(value, parent = null) {
  return { nodeType: 3, nodeValue: value, parentElement: parent };
}

function elem(tag, { attrs = {}, children = [] } = {}) {
  const map = new Map(Object.entries(attrs));
  const node = {
    nodeType: 1,
    tagName: tag,
    getAttribute: (k) => map.get(k) ?? null,
    setAttribute: (k, v) => {
      map.set(k, v);
    },
    removeAttribute: (k) => {
      map.delete(k);
    },
    matches: () => false,
    childNodes: children,
    textContent: '',
  };
  for (const kid of children) {
    kid.parent = node;
    if (kid.nodeType === 3) node.textContent += kid.nodeValue ?? '';
    else node.textContent += kid.textContent ?? '';
  }
  return node;
}

function island(tag, text) {
  const node = elem(tag, { children: [textNode(text)] });
  node.matches = () => true; // matches SEAT_ISLAND in the real impl
  return node;
}

function makeSeat(text) {
  const node = elem('div', { children: [textNode(text)] });
  node.matches = () => false;
  return node;
}

// Streaming fa answer: ticks stay rtl, writes only on change.
const fa = makeSeat('');
assert.equal(orient(fa), undefined);
assert.equal(fa.getAttribute('dir'), null);
fa.childNodes = [textNode('سلام')];
fa.textContent = 'سلام';
assert.equal(orient(fa), 'write');
assert.equal(fa.getAttribute('dir'), 'rtl');
fa.childNodes = [textNode('سلام دنیا چطوری')];
fa.textContent = 'سلام دنیا چطوری';
assert.equal(orient(fa), 'skip');
assert.equal(fa.getAttribute('dir'), 'rtl');

// Streaming en answer: first word is provisional LTR (no lock), second locks.
const en = makeSeat('');
orient(en);
en.childNodes = [textNode('Here')];
en.textContent = 'Here';
assert.equal(orient(en), 'write');
assert.equal(en.getAttribute('dir'), 'ltr');
assert.equal(en.getAttribute('data-rastin-dir'), null);
// A Persian continuation still flips the unlocked seat back to RTL.
en.childNodes = [textNode('Here سلام')];
en.textContent = 'Here سلام';
assert.equal(orient(en), 'write');
assert.equal(en.getAttribute('dir'), 'rtl');
en.childNodes = [textNode('Here is the fix')];
en.textContent = 'Here is the fix';
assert.equal(orient(en), 'write');
assert.equal(en.getAttribute('dir'), 'ltr');
// Later Persian never flips a locked seat.
en.childNodes = [textNode('Here is the fix برای مشکل شما')];
en.textContent = 'Here is the fix برای مشکل شما';
assert.equal(orient(en), undefined);
assert.equal(en.getAttribute('dir'), 'ltr');

// Lone English term then Persian: rtl from the verdict tick on.
const lone = makeSeat('Merge کن');
orient(lone);
assert.equal(lone.getAttribute('dir'), 'rtl');
assert.equal(lone.getAttribute('data-rastin-dir'), null);

// No letters at all: no verdict, seat untouched (inherits RTL from CSS).
const blank = makeSeat('123 ...');
assert.equal(orient(blank), undefined);
assert.equal(blank.getAttribute('dir'), null);
assert.equal(blank.getAttribute('data-rastin-dir'), null);
blank.childNodes = [textNode('123 ... Hello world')];
blank.textContent = '123 ... Hello world';
orient(blank);
assert.equal(blank.getAttribute('dir'), 'ltr');

// LTR islands don't vote: tool-call English above Persian prose stays RTL.
const toolSeat = elem('div', {
  children: [
    island('tool-call', 'Running tests passed'),
    textNode('سلام دنیا'),
  ],
});
toolSeat.textContent = 'Running tests passedسلام دنیا';
orient(toolSeat);
assert.equal(toolSeat.getAttribute('dir'), 'rtl');

// Same for code islands: English code then Persian prose stays RTL.
const codeSeat = elem('div', {
  children: [island('pre', 'const x = 1;'), textNode('سلام دنیا')],
});
codeSeat.textContent = 'const x = 1;سلام دنیا';
orient(codeSeat);
assert.equal(codeSeat.getAttribute('dir'), 'rtl');

// And the reverse: island Persian can't flip English prose to RTL.
const enSeat = elem('div', {
  children: [textNode('Here is the fix '), island('pre', 'سلام')],
});
enSeat.textContent = 'Here is the fix سلام';
orient(enSeat);
assert.equal(enSeat.getAttribute('dir'), 'ltr');
assert.equal(enSeat.getAttribute('data-rastin-dir'), 'ltr');

console.log(
  'OK: auto-direction orient (streaming, lock, idempotent, fallback, islands)',
);
