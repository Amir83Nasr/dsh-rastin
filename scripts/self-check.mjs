/** Behavioral wiring check: executes the real client factory + apply with mocked ctx. Run: node scripts/self-check.mjs */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const captured = { regs: [] };
globalThis.window = {
  __ModuleLoader__: {
    load: (arg) => {
      captured.bundle = arg;
    },
  },
};

await import('../client.js');
const factory = captured.bundle.factory;
assert.equal(captured.bundle.id, '@amir83nasr/rastin');

const ReactStub = {
  createElement: (type, props, ...children) => ({ type, props, children }),
};
const mod = factory((name) => {
  if (name === 'react') return ReactStub;
  throw new Error(`unexpected require: ${name}`);
});
assert.deepEqual(mod.inject, ['slots']);

const noop = () => {};
const capturedEffects = [];
const mockCtx = {
  slots: {
    inject: (name, cb) => {
      captured.owner = name;
      cb();
      return noop;
    },
    register: (opts, comp) => {
      captured.regs.push({ slot: opts.name, id: opts.id, comp });
      return noop;
    },
  },
  effect: (fn, label) => {
    capturedEffects.push(label);
    const cleanup = fn();
    assert.equal(typeof cleanup, 'function', `effect ${label} returns cleanup`);
    return noop;
  },
};
mod.apply(mockCtx);

// Style seat + terminal canvas-font patch + auto-direction + todo auto-open, all with cleanup.
assert.deepEqual(capturedEffects, [
  'rastin: style',
  'rastin: terminal-font',
  'rastin: auto-direction',
  'rastin: todo open',
]);

// One global style entry on shell.overlay with no replace risk.
assert.equal(captured.owner, 'shell.overlay');
assert.equal(captured.regs.length, 1);
assert.equal(captured.regs[0].slot, 'shell.overlay');
assert.equal(captured.regs[0].id, 'rastin-style');
assert.equal(typeof captured.regs[0].comp, 'function');

// Face + direction + LTR-code rules present; real embedded font, no placeholder.
const src = readFileSync(new URL('../client.js', import.meta.url), 'utf8');
assert.match(src, /@font-face/);
assert.match(src, /font-family: 'IRANYekanX'/);
assert.match(src, /font-weight: 400/);
assert.match(src, /font-weight: 700/);
assert.match(src, /const FONT_BOLD_B64 = '[A-Za-z0-9+/=]{100,}/);
assert.match(src, /--dsw-font-family: 'IRANYekanX'/);
assert.match(src, /const FONT_B64 = '[A-Za-z0-9+/=]{100,}/);
assert.match(src, /data:font\/woff2;base64,\$\{FONT_B64\}/);
assert.doesNotMatch(src, /__RASTIN_FONT_B64__/);
assert.match(src, /\[data-chat-flow\]/);
assert.match(src, /\[data-queue-dock\]/);
assert.match(src, /\[data-question-key\]/);
assert.match(src, /\[data-plan-review-key\]/);
assert.match(src, /ask_user_question/);
assert.match(src, /direction: rtl/);
assert.match(src, /data-process-activity/);
assert.match(src, /data-turn-process/);
assert.match(src, /data-chat-flow-kind='tool-call'/);
assert.match(src, /data-chat-call-id/);
assert.match(src, /direction: ltr/);
// User bubbles align right under RTL (host flex-end flips side).
assert.match(src, /data-chat-flow-kind='user'/);
assert.match(src, /data-submission-echo/);
assert.match(src, /data-message-attachments/);
assert.match(src, /align-items: flex-start/);

// Auto-direction: each message seat follows its own prose (islands excluded).
assert.match(src, /installAutoDirection/);
assert.match(src, /detectSeatDir/);
assert.match(src, /orientSeat/);
assert.match(src, /seatText/);
assert.match(src, /SEAT_ISLAND/);
// Build inlines src/direction.js: template must not carry its own verdict copy.
assert.doesNotMatch(src, /detectSeatDir\(seat\.textContent/);
assert.match(src, /text-align: start/);
assert.match(src, /data-chat-flow-kind='turn-error'/);
assert.match(src, /data-chat-flow-kind='turn-max-tokens'/);
assert.match(src, /data-chat-flow-kind='model-retry'/);
// Sidebar md preview + pre-approval plan preview + plan card text share the same leading-run direction.
assert.match(src, /data-document-markdown/);
assert.match(src, /data-plan-preview/);
assert.match(src, /data-plan-review-key/);

// Terminal face: FiraMonoNerd embedded, canvas patch scoped to sidebar terminal.
assert.match(src, /font-family: 'FiraMonoNerd'/);
assert.match(src, /const TERMINAL_FONT_B64 = '[A-Za-z0-9+/=]{100,}/);
assert.match(src, /data:font\/woff2;base64,\$\{TERMINAL_FONT_B64\}/);
assert.match(src, /\[data-sidebar-terminal\]/);
assert.match(src, /installTerminalFont/);
assert.match(src, /CanvasRenderingContext2D/);
assert.match(src, /document\.fonts\.load/);
assert.match(src, /__rastinFontPatched/);

// Todo dock opens by default (host mounts it collapsed); user can re-collapse.
assert.match(src, /autoOpenTodoPanels/);
assert.match(src, /\[data-testid="todo-panel"\]/);
assert.match(src, /button\[aria-expanded="false"\]/);

console.log(
  'OK: 1 style seat, IranYekanX embedded, RTL on chat+queue+questions, LTR code, FiraMonoNerd on terminal, todo open by default',
);
