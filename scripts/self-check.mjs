/** Behavioral wiring check: executes the real client factory + apply with mocked ctx. Run: node scripts/self-check.mjs */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const captured = { regs: [] };

// Minimal DOM so the canvas-font patch runs for real (seat sweep finds none).
const seatList = [];
globalThis.document = {
  body: null,
  querySelectorAll: () => seatList,
  createElement: () => ({
    nodeType: 1,
    childNodes: [],
    setAttribute() {},
    getAttribute: () => null,
    matches: () => false,
  }),
  createTextNode: (text) => ({ nodeType: 3, nodeValue: text }),
  fonts: { load: () => Promise.resolve() },
};
function CanvasRenderingContext2D() {}
Object.defineProperty(CanvasRenderingContext2D.prototype, 'font', {
  configurable: true,
  get() {
    return '13px monospace';
  },
  set(value) {
    this._font = value;
  },
});

globalThis.window = {
  CanvasRenderingContext2D,
  __ModuleLoader__: {
    load: (arg) => {
      captured.bundle = arg;
    },
  },
};

await import('../client.js');
const factory = captured.bundle.factory;
assert.equal(captured.bundle.id, '@amir83nasr/dsh-rastin');

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
const capturedCleanups = [];
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
    capturedCleanups.push({ label, cleanup });
    return noop;
  },
};
// Host Config: line spacing tunable from Settings (1 tight .. 3 airy, default 2),
// prose alignment (start default / justify), plus central chat width
// (100 full / 75 / 50, default 100).
{
  const host = await import('../src/index.js');
  assert.equal(typeof host.apply, 'function');
  assert.ok(host.Config, 'host exports Config');
  assert.deepEqual(host.Config({}), {
    lineHeight: 2,
    textAlign: 'start',
    chatWidth: 100,
  });
  assert.deepEqual(host.Config({ lineHeight: 1.6 }), {
    lineHeight: 1.6,
    textAlign: 'start',
    chatWidth: 100,
  });
  assert.deepEqual(host.Config({ textAlign: 'justify' }), {
    lineHeight: 2,
    textAlign: 'justify',
    chatWidth: 100,
  });
  assert.deepEqual(host.Config({ chatWidth: 75 }), {
    lineHeight: 2,
    textAlign: 'start',
    chatWidth: 75,
  });
  assert.deepEqual(host.Config({ chatWidth: 50 }), {
    lineHeight: 2,
    textAlign: 'start',
    chatWidth: 50,
  });
  assert.throws(() => host.Config({ lineHeight: 5 }));
  assert.throws(() => host.Config({ lineHeight: 0.5 }));
  assert.throws(() => host.Config({ textAlign: 'wide' }));
  assert.throws(() => host.Config({ chatWidth: 60 }));
  assert.throws(() => host.Config({ chatWidth: 'wide' }));
}

mod.apply(mockCtx);

// Style seat + terminal canvas-font patch + auto-direction + composer
// direction + todo auto-open + chat width, all with cleanup.
assert.deepEqual(capturedEffects, [
  'rastin: style',
  'rastin: terminal-font',
  'rastin: auto-direction',
  'rastin: composer-direction',
  'rastin: todo open',
  'rastin: chat-width',
]);

// Canvas font patch: rewrites only sidebar-terminal canvases, restores on cleanup.
{
  const proto = CanvasRenderingContext2D.prototype;
  assert.equal(proto.__rastinFontPatched, true);
  const term = new CanvasRenderingContext2D();
  term.canvas = {
    closest: (sel) => (sel === '[data-sidebar-terminal]' ? {} : null),
  };
  term.font = '13px monospace';
  assert.equal(term._font, "13px 'FiraMonoNerd', monospace");
  term.font = '13px ui-monospace, monospace';
  assert.equal(term._font, "13px 'FiraMonoNerd', ui-monospace, monospace");
  term.font = "13px 'FiraMonoNerd', monospace";
  assert.equal(term._font, "13px 'FiraMonoNerd', monospace");
  const bare = new CanvasRenderingContext2D();
  bare.font = '13px monospace';
  assert.equal(bare._font, '13px monospace');
  assert.equal(typeof proto.__rastinFontPatchedCleanup, 'function');
  proto.__rastinFontPatchedCleanup();
  assert.equal(proto.__rastinFontPatched, undefined);
  assert.equal(
    Object.getOwnPropertyDescriptor(proto, 'font').get.call(
      new CanvasRenderingContext2D(),
    ),
    '13px monospace',
  );
}

// One global style entry on shell.overlay with no replace risk.
assert.equal(captured.owner, 'shell.overlay');
assert.equal(captured.regs.length, 1);
assert.equal(captured.regs[0].slot, 'shell.overlay');
assert.equal(captured.regs[0].id, 'rastin-style');
assert.equal(typeof captured.regs[0].comp, 'function');

// Line spacing (settings: lineHeight) lands in the rendered CSS: default 2,
// custom values pass through, out-of-range values clamp to 1..3.
{
  const cssOf = (comp) => {
    const el = comp();
    return el.type(el.props).children.join('');
  };
  const base = cssOf(captured.regs[0].comp);
  assert.match(base, /\[data-plan-preview\]\{line-height:2\}/);
  // Lists (ordered and unordered) follow the same spacing, enforced on the
  // descendants because host typography sets its own li line-height.
  assert.match(base, /:is\(ul,ol,li\)\{line-height:2!important\}/);
  // Ordered lists in RTL (Persian) seats use Persian digit markers.
  assert.match(base, /\[data-chat-flow\] \[dir='rtl'\] ol/);
  assert.match(base, /list-style-type: persian/);

  mod.apply(mockCtx, { lineHeight: 1.6 });
  assert.equal(captured.regs.length, 2);
  assert.match(cssOf(captured.regs[1].comp), /line-height:1\.6/);
  assert.match(
    cssOf(captured.regs[1].comp),
    /:is\(ul,ol,li\)\{line-height:1\.6!important\}/,
  );

  mod.apply(mockCtx, { lineHeight: 99 });
  assert.equal(captured.regs.length, 3);
  assert.match(cssOf(captured.regs[2].comp), /line-height:3\}/);
}

// Paragraph alignment (settings: textAlign): start emits no rule (the var
// fallback covers it), justify sets --rastin-align on the prose containers.
{
  const cssOf = (comp) => {
    const el = comp();
    return el.type(el.props).children.join('');
  };
  assert.match(cssOf(captured.regs[0].comp), /var\(--rastin-align, start\)/);
  assert.doesNotMatch(cssOf(captured.regs[0].comp), /--rastin-align:justify/);
  mod.apply(mockCtx, { textAlign: 'justify' });
  const css = cssOf(captured.regs[captured.regs.length - 1].comp);
  assert.match(css, /--rastin-align:justify/);
  mod.apply(mockCtx, { textAlign: 'wide' });
  assert.doesNotMatch(
    cssOf(captured.regs[captured.regs.length - 1].comp),
    /--rastin-align:justify/,
  );
}

// Composer input follows its own leading run with no lock: typing flips dir
// live, clearing the box removes dir again, cleanup detaches the listener.
{
  const listeners = {};
  const removed = [];
  const fakeInput = {
    value: 'سلام دنیا',
    getAttribute(k) {
      return this[`@${k}`] ?? null;
    },
    setAttribute(k, v) {
      this[`@${k}`] = v;
    },
    removeAttribute(k) {
      delete this[`@${k}`];
    },
    closest(sel) {
      return sel === '[data-composer-input]' ? this : null;
    },
  };
  const origQSA = globalThis.document.querySelectorAll;
  const origAEL = globalThis.document.addEventListener;
  const origREL = globalThis.document.removeEventListener;
  const origMO = globalThis.MutationObserver;
  globalThis.document.querySelectorAll = (sel) =>
    sel === '[data-composer-input]' ? [fakeInput] : [];
  globalThis.document.addEventListener = (type, fn) => {
    listeners[type] = fn;
  };
  globalThis.document.removeEventListener = (type) => {
    removed.push(type);
  };
  globalThis.MutationObserver = class {
    observe() {}
    disconnect() {}
  };
  try {
    const cleanupsBefore = capturedCleanups.length;
    mod.apply(mockCtx, {});
    // Sweep oriented the Persian value.
    assert.equal(fakeInput['@dir'], 'rtl');
    // Typing English flips live (no LTR lock in the composer).
    fakeInput.value = 'Here is the fix';
    listeners['input']({ target: fakeInput });
    assert.equal(fakeInput['@dir'], 'ltr');
    // A lone English term stays RTL.
    fakeInput.value = 'Merge کن';
    listeners['input']({ target: fakeInput });
    assert.equal(fakeInput['@dir'], 'rtl');
    // Clearing removes dir so the placeholder falls back to the host.
    fakeInput.value = '';
    listeners['input']({ target: fakeInput });
    assert.equal(fakeInput['@dir'], undefined);
    // Cleanup detaches the document listener.
    const composerCleanup = capturedCleanups
      .slice(cleanupsBefore)
      .find((c) => c.label === 'rastin: composer-direction').cleanup;
    composerCleanup();
    assert.ok(removed.includes('input'));
  } finally {
    globalThis.document.querySelectorAll = origQSA;
    if (origAEL === undefined) delete globalThis.document.addEventListener;
    else globalThis.document.addEventListener = origAEL;
    if (origREL === undefined) delete globalThis.document.removeEventListener;
    else globalThis.document.removeEventListener = origREL;
    if (origMO === undefined) delete globalThis.MutationObserver;
    else globalThis.MutationObserver = origMO;
  }
}

// Central chat width (settings: chatWidth) scales the host conversation vars
// from a saved copy; 100 is the identity default, 75/50 narrow the column.
// Body attribute drives the static rules so only the value needs an effect.
{
  const cssOf = (comp) => {
    const el = comp();
    return el.type(el.props).children.join('');
  };
  const base = cssOf(captured.regs[0].comp);
  assert.match(base, /body\[data-rastin-chat-width='75'\]/);
  assert.match(base, /--rastin-conversation-scale: 0\.75/);
  assert.match(base, /body\[data-rastin-chat-width='50'\]/);
  assert.match(base, /--rastin-conversation-scale: 0\.5/);
  assert.match(base, /\[data-phase\][\s\S]*\[data-conversation-content\]/);
  assert.match(base, /--rastin-host-content-width/);
  assert.match(base, /--dsh-chat-content-width: calc\(/);
  assert.match(base, /--dsh-composer-card-max-width: calc\(/);

  const attrs = {};
  globalThis.document.body = {
    setAttribute: (k, v) => {
      attrs[k] = v;
    },
    removeAttribute: (k) => {
      delete attrs[k];
    },
  };
  const cleanupsBefore = capturedCleanups.length;
  mod.apply(mockCtx, { chatWidth: 75 });
  assert.equal(attrs['data-rastin-chat-width'], '75');
  const widthCleanup = capturedCleanups
    .slice(cleanupsBefore)
    .find((c) => c.label === 'rastin: chat-width').cleanup;
  widthCleanup();
  assert.equal(attrs['data-rastin-chat-width'], undefined);
  mod.apply(mockCtx, { chatWidth: 60 });
  assert.equal(attrs['data-rastin-chat-width'], '100');
  mod.apply(mockCtx, {});
  assert.equal(attrs['data-rastin-chat-width'], '100');
}

// Face + direction + LTR-code rules present; real embedded font, no placeholder.
const src = readFileSync(new URL('../client.js', import.meta.url), 'utf8');
assert.match(src, /@font-face/);
assert.match(src, /font-family: 'IRANYekanX'/);
assert.match(src, /font-weight: 400/);
assert.match(src, /font-weight: 700/);
assert.match(src, /const FONT_BOLD_B64 = '[A-Za-z0-9+/=]{100,}/);
assert.match(src, /--dsw-font-family: 'IRANYekanX'/);
// Host body re-declares --dsw-font-family (shadowing :root) and its base font
// rule reads --dsh-font-family-text, so :root must set that hook as well.
assert.match(src, /--dsh-font-family-text: 'IRANYekanX'/);
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
// LTR islands need their own bidi scope or mirrored chars (→ < >) flip inside RTL prose.
assert.match(src, /unicode-bidi: isolate/);
// Selection + counter rules keep RTL runs unclipped and unmirrored.
assert.match(src, /::selection/);
assert.match(src, /color-mix\(in srgb/);
// User bubbles align right under RTL (host flex-end flips side).
assert.match(src, /data-chat-flow-kind='user'/);
assert.match(src, /data-submission-echo/);
assert.match(src, /data-message-attachments/);
assert.match(src, /align-items: flex-start/);

// Auto-direction: each message seat follows its own prose (islands excluded).
assert.match(src, /installAutoDirection/);
assert.match(src, /detectSeatDir/);
assert.match(src, /orientSeat/);
assert.match(src, /mirrorSeatArrows/);
assert.match(src, /data-rastin-mirror/);
assert.match(src, /scaleX\(-1\)/);
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
// md fallback dir must not override installAutoDirection's dir (CSS beats dir attr).
assert.match(src, /data-document-markdown\]:not\(\[dir\]\)/);
assert.match(src, /data-plan-review-key/);

// Terminal face: FiraMonoNerd embedded, canvas patch scoped to sidebar terminal.
assert.match(src, /font-family: 'FiraMonoNerd'/);
assert.match(src, /const TERMINAL_FONT_B64 = '[A-Za-z0-9+/=]{100,}/);
assert.match(src, /data:font\/woff2;base64,\$\{TERMINAL_FONT_B64\}/);
// Size guard: full nerd embed dominates the bundle; warn (don't fail) past 2MB.
{
  const { statSync } = await import('node:fs');
  const bytes = statSync(new URL('../client.js', import.meta.url)).size;
  assert.ok(bytes < 2 * 1024 * 1024, `client.js ${bytes} bytes exceeds 2MB`);
}
assert.match(src, /\[data-sidebar-terminal\]/);
assert.match(src, /installTerminalFont/);
assert.match(src, /CanvasRenderingContext2D/);
assert.match(src, /document\.fonts\.load/);
assert.match(src, /__rastinFontPatched/);

// Todo dock opens by default (host mounts it collapsed); user can re-collapse.
assert.match(src, /autoOpenTodoPanels/);
assert.match(src, /\[data-testid="todo-panel"\]/);
assert.match(src, /button\[aria-expanded="false"\]/);
// Todo panel reads RTL like chat+queue+questions, with per-item leading-run direction.
assert.match(src, /\[data-testid='todo-panel'\]/);
assert.match(src, /todo-panel.*text-align: start/s);
assert.match(src, /\[data-testid='todo-panel'\] li/);
assert.match(src, /todo-panel.*\[class\*='count'\]/s);

// Central chat width: body attribute scales the host conversation vars.
assert.match(src, /installChatWidth/);
assert.match(src, /normalizeChatWidth/);
assert.match(src, /data-rastin-chat-width/);
assert.match(src, /rastin: chat-width/);

// Composer direction + prose alignment + RTL tables.
assert.match(src, /installComposerDirection/);
assert.match(src, /\[data-composer-input\]/);
assert.match(src, /rastin: composer-direction/);
assert.match(src, /--rastin-align/);
assert.match(src, /:is\(th, td, caption\)/);

console.log(
  'OK: 1 style seat, IranYekanX embedded, RTL on chat+queue+questions+todos, LTR code, FiraMonoNerd on terminal, todo open by default, line spacing + chat width + prose alignment from settings, persian list markers, rtl tables, composer direction',
);
