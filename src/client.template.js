window.__ModuleLoader__.load({
  id: '@amir83nasr/rastin',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    // IranYekanX Regular + Bold, base64 data URI so the faces ship inside the bundle.
    const FONT_B64 = '__IRANYEKAN_B64__';
    const FONT_BOLD_B64 = '__IRANYEKAN_BOLD_B64__';
    // FiraMono Nerd Font Mono Regular (terminal), woff2 data URI.
    const TERMINAL_FONT_B64 = '__FIRAMONO_B64__';

    const css = `
@font-face {
  font-family: 'IRANYekanX';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url(data:font/woff2;base64,${FONT_B64}) format('woff2');
}
@font-face {
  font-family: 'IRANYekanX';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url(data:font/woff2;base64,${FONT_BOLD_B64}) format('woff2');
}
@font-face {
  font-family: 'FiraMonoNerd';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url(data:font/woff2;base64,${TERMINAL_FONT_B64}) format('woff2');
}
/* Sidebar terminal (xterm v6 draws on canvas, so CSS alone cannot restyle
   glyphs; the canvas font setter patch in apply() does that. This covers
   the DOM fallback and the char-measure element. */
[data-sidebar-terminal] .xterm,
[data-sidebar-terminal] .xterm-rows {
  font-family: 'FiraMonoNerd', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace !important;
}
/* Product face for the whole app (host reads --dsw-font-family everywhere). */
:root {
  --dsw-font-family: 'IRANYekanX', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC',
    'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}
/* Transcript, queue, and question surfaces read RTL on the product face. */
[data-chat-flow], [data-queue-dock], [data-question-key], [data-plan-review-key],
[data-tool='ask_user_question'] {
  direction: rtl;
  font-family: var(--dsw-font-family);
}
/* Queue dock internals: host hardcodes LTR chrome (header/row text-align,
   row padding, preview direction). Flip to RTL geometry. */
[data-queue-dock] {
  text-align: right;
}
[data-queue-dock] [class*='header'] {
  text-align: right !important;
}
[data-queue-dock] [class*='row'] {
  padding-left: 5px !important;
  padding-right: 12px !important;
}
[data-queue-dock] [class*='preview'],
[data-queue-dock] [class*='editor'],
[data-queue-dock] textarea {
  direction: rtl;
  text-align: right;
}
[data-queue-dock] [class*='count'] {
  font-family: var(--dsw-font-family) !important;
}
[data-question-key] {
  text-align: right;
}
[data-question-key] [class*='header'] {
  padding-left: 16px !important;
  padding-right: 24px !important;
}
[data-question-key] [class*='option'],
[data-question-key] [class*='customRow'] {
  padding-left: 12px !important;
  padding-right: 8px !important;
  text-align: right !important;
}
[data-question-key] [class*='footer'] {
  padding-left: 10px !important;
  padding-right: 18px !important;
}
[data-question-key] [class*='feedback'] {
  text-align: right !important;
}
[data-question-key] [class*='fieldInput'],
[data-question-key] textarea,
[data-question-key] [class*='customBlock'] {
  direction: rtl;
  text-align: right;
}
/* Process status titles + live running status stay LTR so English labels anchor left. */
[data-step-process] [data-process-activity],
[data-turn-process],
[data-chat-running] {
  direction: ltr;
  text-align: left;
  align-items: flex-start !important;
}
/* Sidebar md preview + pre-approval plan preview follow the same leading-run
   direction as chat seats: installAutoDirection writes their dir, start
   aligns the block to it. */
[data-document-markdown],
[data-plan-preview] {
  direction: rtl;
  text-align: start;
  font-family: var(--dsw-font-family);
}
/* Message text follows its own leading word run: installAutoDirection writes
   each seat's dir (two-plus LTR words from the start flip a mixed seat to
   LTR; a lone English term stays RTL), and start then aligns the block to
   it. Layout (bubble side, row order) stays RTL either way. */
[data-chat-flow] [data-chat-flow-kind='assistant-step'],
[data-chat-flow] [data-chat-flow-kind='user'],
[data-chat-flow] [data-chat-flow-kind='steering'],
[data-chat-flow] [data-chat-flow-kind='turn-error'],
[data-chat-flow] [data-chat-flow-kind='turn-max-tokens'],
[data-chat-flow] [data-chat-flow-kind='model-retry'],
[data-chat-flow] [data-submission-echo],
[data-chat-flow] [data-pending-steering],
[data-plan-review-key] [class*='summary'],
[data-plan-review-key] [class*='title'],
[data-plan-review-key] [class*='description'] {
  text-align: start;
}
/* User bubbles stay on the right under RTL: host aligns the row/stack
   columns with flex-end (right in LTR, left in RTL), so flip those two
   levels to flex-start (right in RTL). Attachments row likewise. */
[data-chat-flow] [data-chat-flow-kind='user'] > div,
[data-chat-flow] [data-chat-flow-kind='steering'] > div,
[data-chat-flow] [data-submission-echo],
[data-chat-flow] [data-pending-steering],
[data-chat-flow] [data-chat-flow-kind='user'] > div > div:first-child,
[data-chat-flow] [data-chat-flow-kind='steering'] > div > div:first-child,
[data-chat-flow] [data-submission-echo] > div:first-child,
[data-chat-flow] [data-pending-steering] > div:first-child {
  align-items: flex-start !important;
}
[data-chat-flow] [data-message-attachments] {
  justify-content: flex-start !important;
}
/* Work-detail rows (tool calls, commands) stay LTR so English summaries anchor left. */
[data-chat-flow] [data-step-process],
[data-chat-flow] [data-chat-flow-kind='tool-call'],
[data-chat-flow] [data-chat-flow-kind='command'],
[data-chat-flow] [data-chat-call-id] {
  direction: ltr;
  text-align: left;
}
/* Edited-files card (end-of-turn report) stays LTR so paths and counts anchor left. */
[data-chat-flow] [data-changed-files] {
  direction: ltr;
  text-align: left;
}
/* Message action rows (copy, like/dislike, branch, clock) stay LTR so icon order anchors left. */
[data-chat-flow] [data-clock] {
  direction: ltr;
}
/* Code keeps LTR inside the RTL surfaces. */
[data-chat-flow] pre, [data-chat-flow] code,
[data-question-key] pre, [data-question-key] code,
[data-plan-review-key] pre, [data-plan-review-key] code,
[data-document-markdown] pre, [data-document-markdown] code,
[data-plan-preview] pre, [data-plan-preview] code {
  direction: ltr;
  text-align: left;
}
`;

    const TERMINAL_FACE = 'FiraMonoNerd';

    // xterm reads its fontFamily option at construction (canvas renderer),
    // so a stylesheet cannot change terminal glyphs from outside the bundle.
    // Patch the canvas 2d font setter, scoped to the sidebar terminal node.
    // ponytail: ceiling is option-level config (no slot exposes xterm opts);
    // upgrade path: set fontFamily at Terminal construction when DSH exposes it.
    function installTerminalFont() {
      if (typeof document === 'undefined') return () => {};
      const Ctx = window.CanvasRenderingContext2D;
      const proto = Ctx && Ctx.prototype;
      const desc = proto && Object.getOwnPropertyDescriptor(proto, 'font');
      if (!proto || !desc || typeof desc.set !== 'function') return () => {};
      // Double-apply (StrictMode-style remount) shares one patch; the saved
      // cleanup is idempotent so both effect cleanups can run it safely.
      if (proto.__rastinFontPatched)
        return proto.__rastinFontPatchedCleanup ?? (() => {});
      const set = desc.set;
      Object.defineProperty(proto, 'font', {
        configurable: true,
        get: desc.get,
        set(v) {
          if (
            typeof v === 'string' &&
            v.indexOf(TERMINAL_FACE) === -1 &&
            v.indexOf('monospace') !== -1 &&
            this.canvas &&
            this.canvas.closest &&
            this.canvas.closest('[data-sidebar-terminal]')
          ) {
            if (v.indexOf('ui-monospace') !== -1) {
              v = v.replace('ui-monospace', `'${TERMINAL_FACE}', ui-monospace`);
            } else {
              // Weight/style prefixes (e.g. `bold 13px monospace`) precede
              // the size, so anchor on the size token, not line start.
              v = v.replace(/(\d+(?:\.\d+)?px\s+)/, `$1'${TERMINAL_FACE}', `);
            }
          }
          set.call(this, v);
        },
      });
      proto.__rastinFontPatched = true;
      if (document.fonts && document.fonts.load) {
        document.fonts.load(`13px "${TERMINAL_FACE}"`).catch(() => {});
      }
      const cleanup = () => {
        if (Object.getOwnPropertyDescriptor(proto, 'font')?.set === set) return; // third-party replaced our patch — don't clobber theirs.
        Object.defineProperty(proto, 'font', desc);
        delete proto.__rastinFontPatched;
        delete proto.__rastinFontPatchedCleanup;
      };
      proto.__rastinFontPatchedCleanup = cleanup;
      return cleanup;
    }

    function RastinStyle() {
      return h('style', { 'data-rastin': '' }, css);
    }

    // Each seat's own prose decides its dir (tool-call/command/code islands
    // excluded by seatText): two or more consecutive LTR words from the start
    // flip a mixed seat to LTR (a real English opening), while a lone English
    // term ("Merge کن") stays RTL. Matches src/direction.js (inlined below);
    // streaming ticks re-run the verdict, and a settled LTR run locks so
    // later Persian words never flip it back.
    // ponytail: ceiling is DOM-level (no slot prop exposes message text);
    // upgrade path: host dir=auto or a slot prop when the host adds one.
    // Inlined from src/direction.js by scripts/build.mjs (single source of truth).
    /*__RASTIN_DIRECTION__*/
    const SEAT_SELECTOR =
      "[data-chat-flow] [data-chat-flow-kind='assistant-step']," +
      "[data-chat-flow] [data-chat-flow-kind='user']," +
      "[data-chat-flow] [data-chat-flow-kind='steering']," +
      "[data-chat-flow] [data-chat-flow-kind='turn-error']," +
      "[data-chat-flow] [data-chat-flow-kind='turn-max-tokens']," +
      "[data-chat-flow] [data-chat-flow-kind='model-retry']," +
      '[data-chat-flow] [data-submission-echo],' +
      '[data-chat-flow] [data-pending-steering],' +
      '[data-document-markdown],' +
      '[data-plan-preview],' +
      "[data-plan-review-key] [class*='title']," +
      "[data-plan-review-key] [class*='description']";
    function installAutoDirection() {
      if (
        typeof document === 'undefined' ||
        typeof MutationObserver === 'undefined'
      )
        return () => {};
      // orientSeat inlined from src/direction.js above (single source).
      const orient = (seat) => orientSeat(seat);
      const sweep = () => {
        if (!document.querySelectorAll) return;
        for (const seat of document.querySelectorAll(SEAT_SELECTOR))
          orient(seat);
      };
      sweep();
      const pending = new Set();
      let sweepQueued = false;
      let rafId = 0;
      const schedule =
        typeof requestAnimationFrame === 'function'
          ? requestAnimationFrame
          : (cb) => setTimeout(cb, 0);
      const cancel =
        typeof cancelAnimationFrame === 'function'
          ? cancelAnimationFrame
          : clearTimeout;
      const flush = () => {
        rafId = 0;
        if (sweepQueued) {
          sweepQueued = false;
          sweep();
        } else {
          for (const seat of pending) orient(seat);
        }
        pending.clear();
      };
      const queue = () => {
        if (rafId) return;
        rafId = schedule(flush);
      };
      const obs = new MutationObserver((records) => {
        for (const record of records) {
          // Streaming ticks target text nodes (no .closest): route through
          // the parent element so the seat orients directly instead of
          // falling through to a full-document sweep per tick.
          const target = record.target;
          const host =
            target !== null &&
            typeof target === 'object' &&
            target.nodeType === 3
              ? target.parentElement
              : target;
          if (
            host === null ||
            typeof host !== 'object' ||
            !('closest' in host)
          ) {
            if (record.type === 'childList') sweepQueued = true;
            continue;
          }
          const seat = host.closest(SEAT_SELECTOR);
          // characterData inside a known seat queues just that seat — only a
          // structural add outside any seat needs the full sweep.
          if (seat === null || seat === undefined) {
            if (record.type === 'childList') sweepQueued = true;
            continue;
          }
          pending.add(seat);
        }
        // Batch a streaming burst into one orient pass per frame; a new seat
        // (fresh assistant-step node surfacing as childList on an ancestor,
        // not inside a known seat) sweeps once to catch it.
        if (pending.size > 0 || sweepQueued) queue();
      });
      if (document.body)
        obs.observe(document.body, {
          childList: true,
          subtree: true,
          characterData: true,
        });
      return () => {
        if (rafId) cancel(rafId);
        rafId = 0;
        pending.clear();
        sweepQueued = false;
        obs.disconnect();
        if (!document.querySelectorAll) return;
        for (const seat of document.querySelectorAll(SEAT_SELECTOR)) {
          seat.removeAttribute('dir');
          seat.removeAttribute('data-rastin-dir');
        }
      };
    }

    // Host TodoPanel mounts collapsed (useState(true)) with no config switch,
    // so open it once. One-shot: after the first panel opens, the observer
    // disconnects and later collapses stay collapsed (user collapse respected).
    // ponytail: ceiling is DOM-level (no slot prop exposes collapsed);
    // upgrade path: host option or shadow entry if host adds one.
    function autoOpenTodoPanels() {
      if (
        typeof document === 'undefined' ||
        typeof MutationObserver === 'undefined'
      )
        return () => {};
      let done = false;
      let obs = null;
      const sweep = () => {
        if (done || !document.querySelectorAll) return;
        for (const panel of document.querySelectorAll(
          '[data-testid="todo-panel"]',
        )) {
          const btn =
            typeof panel.querySelector === 'function'
              ? panel.querySelector(
                  ':scope > button[aria-expanded="false"], :scope button[aria-expanded="false"]',
                )
              : null;
          if (btn !== null && btn !== undefined) {
            btn.click();
            done = true;
            if (obs) obs.disconnect();
            break;
          }
        }
      };
      sweep();
      if (!done) {
        obs = new MutationObserver(sweep);
        if (document.body)
          obs.observe(document.body, { childList: true, subtree: true });
      }
      return () => {
        done = true;
        if (obs) obs.disconnect();
      };
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        ctx.effect(
          () =>
            ctx.slots.inject('shell.overlay', () =>
              ctx.slots.register(
                { name: 'shell.overlay', id: 'rastin-style' },
                RastinStyle,
              ),
            ),
          'rastin: style',
        );
        ctx.effect(() => installTerminalFont(), 'rastin: terminal-font');
        ctx.effect(() => installAutoDirection(), 'rastin: auto-direction');
        ctx.effect(() => autoOpenTodoPanels(), 'rastin: todo open');
      },
    };
  },
});
