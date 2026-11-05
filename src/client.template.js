window.__ModuleLoader__.load({
  id: '@amir83nasr/dsh-rastin',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    // IranYekanX Regular + Bold, base64 data URI so the faces ship inside the bundle.
    const FONT_B64 = '__IRANYEKAN_B64__';
    const FONT_BOLD_B64 = '__IRANYEKAN_BOLD_B64__';
    // FiraMono Nerd Font Mono Regular (terminal), woff2 data URI.
    // ponytail: ceiling is full-file embed (~1.2MB of the ~1.7MB bundle);
    // subsetting to ASCII+box-drawing would shrink it but drops the nerd
    // icons the terminal actually renders. Upgrade path: subset only when
    // an icon-inventory proves which PUA ranges xterm really draws.
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
/* Product face for the whole app. The host theme re-declares --dsw-font-family
   on body (which shadows any :root value for the entire subtree) and its base
   font rule reads --dsh-font-family-text, so :root must set that hook too;
   the host's own body rule then resolves to IRANYekanX. An explicit user font
   choice in settings (body inline style) still wins, which is the correct
   precedence. */
:root {
  --dsh-font-family-text: 'IRANYekanX', -apple-system, BlinkMacSystemFont, 'Segoe UI',
    'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica,
    Arial, sans-serif;
  --dsw-font-family: 'IRANYekanX', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC',
    'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}
/* Transcript, queue, question, and todo surfaces read RTL on the product face. */
[data-chat-flow], [data-queue-dock], [data-question-key], [data-plan-review-key],
[data-tool='ask_user_question'], [data-testid='todo-panel'] {
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
/* Todo panel: host mounts it LTR with no RTL hook of its own, so the bundle
   owns the geometry (same pattern as queue-dock/question-key). The panel
   itself stays RTL; each item's own leading run (installAutoDirection below)
   flips pure-English todos back to LTR via text-align: start. */
[data-testid='todo-panel'] {
  text-align: right;
}
[data-testid='todo-panel'] [class*='header'] {
  text-align: right !important;
}
[data-testid='todo-panel'] [class*='item'],
[data-testid='todo-panel'] [class*='row'],
[data-testid='todo-panel'] li {
  padding-left: 8px !important;
  padding-right: 12px !important;
  text-align: start;
}
[data-testid='todo-panel'] [class*='title'],
[data-testid='todo-panel'] [class*='label'],
[data-testid='todo-panel'] [class*='description'],
[data-testid='todo-panel'] [class*='content'] {
  text-align: start;
}
[data-testid='todo-panel'] textarea,
[data-testid='todo-panel'] [class*='editor'] {
  direction: rtl;
  text-align: right;
}
/* Process status titles + live running status stay LTR so English labels anchor left. */
[data-step-process] [data-process-activity],
[data-turn-process],
[data-chat-running] {
  direction: ltr;
  unicode-bidi: isolate;
  text-align: left;
  align-items: flex-start !important;
}
/* Sidebar md preview + pre-approval plan preview follow the same leading-run
   direction as chat seats: installAutoDirection writes their dir, start
   aligns the block to it. */
[data-document-markdown]:not([dir]),
[data-plan-preview]:not([dir]) {
  direction: rtl;
}
/* Prose alignment reads --rastin-align (settings: textAlign sets it to justify
   on the containers; fallback start). Chrome rules below keep their own
   explicit alignment. */
[data-document-markdown],
[data-plan-preview] {
  text-align: var(--rastin-align, start);
  font-family: var(--dsw-font-family);
}
/* Message text follows its own leading word run: installAutoDirection writes
   each seat's dir (two-plus LTR words from the start flip a mixed seat to
   LTR; a lone English term stays RTL), and start then aligns the block to
   it. Layout (bubble side, row order) stays RTL either way. Flow arrows
   (→ ⇒ …) get a per-glyph mirror span so they point the RTL way; the span
   holds the exact char, so selection and copy stay intact. */
[data-chat-flow] [data-chat-flow-kind='assistant-step'] [data-rastin-mirror],
[data-chat-flow] [data-chat-flow-kind='user'] [data-rastin-mirror],
[data-chat-flow] [data-chat-flow-kind='steering'] [data-rastin-mirror],
[data-chat-flow] [data-chat-flow-kind='turn-error'] [data-rastin-mirror],
[data-chat-flow] [data-chat-flow-kind='turn-max-tokens'] [data-rastin-mirror],
[data-chat-flow] [data-chat-flow-kind='model-retry'] [data-rastin-mirror],
[data-chat-flow] [data-submission-echo] [data-rastin-mirror],
[data-chat-flow] [data-pending-steering] [data-rastin-mirror],
[data-document-markdown] [data-rastin-mirror],
[data-plan-preview] [data-rastin-mirror],
[data-plan-review-key] [data-rastin-mirror],
[data-testid='todo-panel'] [data-rastin-mirror] {
  display: inline-block;
  transform: scaleX(-1);
}
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
[data-plan-review-key] [class*='description'],
[data-testid='todo-panel'] [class*='item'],
[data-testid='todo-panel'] [class*='row'],
[data-testid='todo-panel'] li {
  text-align: var(--rastin-align, start);
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
  unicode-bidi: isolate;
  text-align: left;
}
/* Edited-files card (end-of-turn report) stays LTR so paths and counts anchor left. */
[data-chat-flow] [data-changed-files] {
  direction: ltr;
  unicode-bidi: isolate;
  text-align: left;
}
/* Message action rows (copy, like/dislike, branch, clock) stay LTR so icon order anchors left. */
[data-chat-flow] [data-clock] {
  direction: ltr;
  unicode-bidi: isolate;
}
/* Code keeps LTR inside the RTL surfaces. */
[data-chat-flow] pre, [data-chat-flow] code,
[data-question-key] pre, [data-question-key] code,
[data-plan-review-key] pre, [data-plan-review-key] code,
[data-document-markdown] pre, [data-document-markdown] code,
[data-plan-preview] pre, [data-plan-preview] code,
[data-testid='todo-panel'] pre, [data-testid='todo-panel'] code {
  direction: ltr;
  unicode-bidi: isolate;
  text-align: left;
}
/* Selection inside RTL prose reads as one run; without an explicit rule the
   host's LTR selection background can clip at bidi boundaries. */
[data-chat-flow] ::selection,
[data-queue-dock] ::selection,
[data-question-key] ::selection,
[data-plan-review-key] ::selection,
[data-testid='todo-panel'] ::selection {
  background: color-mix(in srgb, var(--dsw-alias-brand-primary) 30%, transparent);
}
/* Persian digits and units inside queue/todo counters inherit the seat's RTL so
   "۳ مورد" never mirrors to "مورد ۳". */
[data-queue-dock] [class*='count'],
[data-testid='todo-panel'] [class*='count'] {
  direction: inherit;
  unicode-bidi: isolate;
}
/* Composer input follows its own leading run (installComposerDirection
   writes dir from the current value); start aligns the text to it. */
[data-composer-input] {
  text-align: start;
}
/* Ordered lists inside RTL (Persian) seats use Persian digit markers (۱۲۳…);
   LTR seats keep Western numerals. Scoped to auto-directed seats (dir), so
   the direction verdict — not container CSS — decides the numerals. */
[data-chat-flow] [dir='rtl'] ol,
[data-document-markdown][dir='rtl'] ol,
[data-plan-preview][dir='rtl'] ol,
[data-testid='todo-panel'][dir='rtl'] ol,
[data-testid='todo-panel'] [dir='rtl'] ol,
[data-plan-review-key] [dir='rtl'] ol {
  list-style-type: persian;
}
/* Tables inside RTL (Persian) seats keep RTL column order with start-aligned
   cells and captions; LTR seats are untouched. Scoped to auto-directed seats
   (dir) like the Persian markers above. */
[data-chat-flow] [dir='rtl'] table,
[data-document-markdown][dir='rtl'] table,
[data-plan-preview][dir='rtl'] table,
[data-testid='todo-panel'][dir='rtl'] table,
[data-testid='todo-panel'] [dir='rtl'] table,
[data-plan-review-key] [dir='rtl'] table {
  direction: rtl;
}
[data-chat-flow] [dir='rtl'] :is(th, td, caption),
[data-document-markdown][dir='rtl'] :is(th, td, caption),
[data-plan-preview][dir='rtl'] :is(th, td, caption),
[data-testid='todo-panel'][dir='rtl'] :is(th, td, caption),
[data-testid='todo-panel'] [dir='rtl'] :is(th, td, caption),
[data-plan-review-key] [dir='rtl'] :is(th, td, caption) {
  text-align: start;
}
/* Sidebar chrome (workspace header, session/history rows) has no host
   data- hook and no slot seat, so no rule targets it: class-based selectors
   would break on the next host rename.
   ponytail: ceiling is host cooperation (a data- attr or slot on the
   sidebar browser region); upgrade path: add the rule when DSH exposes one. */
/* Central chat width (settings: chatWidth). The host sizes the conversation
   through --dsh-chat-content-width / --dsh-composer-card-max-width on
   [data-phase] > [data-conversation-content] > *; narrowing overrides those
   vars from a saved copy of the host values (self-reference would be
   guaranteed-invalid), scaled by body[data-rastin-chat-width]. 100 keeps
   scale 1 (identity) so the default changes nothing. */
body[data-rastin-chat-width='75'] {
  --rastin-conversation-scale: 0.75;
}
body[data-rastin-chat-width='50'] {
  --rastin-conversation-scale: 0.5;
}
body[data-rastin-chat-width] [data-phase] > [data-conversation-content] {
  --rastin-host-content-width: var(--dsh-chat-content-width);
  --rastin-host-card-max-width: var(--dsh-composer-card-max-width);
}
body[data-rastin-chat-width] [data-phase] > [data-conversation-content] > * {
  --dsh-chat-content-width: calc(
    var(--rastin-host-content-width) * var(--rastin-conversation-scale, 1)
  ) !important;
  --dsh-composer-card-max-width: calc(
    var(--rastin-host-card-max-width) - var(--rastin-host-content-width) *
      (1 - var(--rastin-conversation-scale, 1))
  ) !important;
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
      const wrapper = {
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
      };
      Object.defineProperty(proto, 'font', wrapper);
      proto.__rastinFontPatched = true;
      if (document.fonts && document.fonts.load) {
        document.fonts.load(`13px "${TERMINAL_FACE}"`).catch(() => {});
      }
      const cleanup = () => {
        // Only undo our own patch; a third-party replacement stays untouched.
        if (Object.getOwnPropertyDescriptor(proto, 'font')?.set !== wrapper.set)
          return;
        Object.defineProperty(proto, 'font', desc);
        delete proto.__rastinFontPatched;
        delete proto.__rastinFontPatchedCleanup;
      };
      proto.__rastinFontPatchedCleanup = cleanup;
      return cleanup;
    }

    // Line spacing (settings: lineHeight). A unitless line-height multiplier
    // for the Persian prose surfaces; missing or out-of-range values fall
    // back to the default. Editing the setting restarts the plugin, so
    // apply() rebuilds this style seat with the new value.
    const LINE_HEIGHT_DEFAULT = 2;
    function normalizeLineHeight(value) {
      const n = typeof value === 'number' ? value : Number(value);
      if (!Number.isFinite(n)) return LINE_HEIGHT_DEFAULT;
      return Math.min(3, Math.max(1, n));
    }
    // Keep in sync with the RTL surface selectors of the base rule above
    // (transcript, queue, question, plan-review, ask_user_question, todos)
    // plus the markdown surfaces, which share the product face.
    const SPACING_SELECTOR =
      '[data-chat-flow],[data-queue-dock],[data-question-key],[data-plan-review-key],' +
      "[data-tool='ask_user_question'],[data-testid='todo-panel']," +
      '[data-document-markdown],[data-plan-preview]';
    function spacingCss(lineHeight) {
      const v = normalizeLineHeight(lineHeight);
      // Host typography sets its own li line-height, which is why lists
      // render tighter than the container value — so restate it on list
      // descendants (ordered and unordered alike); the container rule above
      // stays at normal specificity.
      return (
        `${SPACING_SELECTOR}{line-height:${v}}` +
        `${SPACING_SELECTOR} :is(ul,ol,li){line-height:${v}!important}`
      );
    }

    // Paragraph alignment (settings: textAlign). Only 'justify' emits a rule:
    // it sets --rastin-align on the prose containers, which the prose
    // text-align rules above read via var(--rastin-align, start).
    function alignCss(textAlign) {
      if (textAlign !== 'justify') return '';
      return `${SPACING_SELECTOR}{--rastin-align:justify}`;
    }

    function RastinStyle({ lineHeight, textAlign }) {
      return h(
        'style',
        { 'data-rastin': '' },
        css + spacingCss(lineHeight) + alignCss(textAlign),
      );
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
      "[data-plan-review-key] [class*='description']," +
      "[data-testid='todo-panel']," +
      "[data-testid='todo-panel'] [class*='item']," +
      "[data-testid='todo-panel'] [class*='row']," +
      "[data-testid='todo-panel'] li";
    function installAutoDirection() {
      if (
        typeof document === 'undefined' ||
        typeof MutationObserver === 'undefined'
      )
        return () => {};
      // orientSeat + mirrorSeatArrows inlined from src/direction.js above (single source).
      const orient = (seat) => {
        orientSeat(seat);
        mirrorSeatArrows(seat, document);
      };
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
          for (const mirror of seat.querySelectorAll('[data-rastin-mirror]')) {
            const text = document.createTextNode(mirror.textContent ?? '');
            mirror.replaceWith(text);
          }
          seat.normalize?.();
        }
      };
    }

    // Composer input follows its own leading run: the box orients from the
    // current value on every input event, with no LTR lock — clearing the box
    // removes dir so the placeholder falls back to the host. Arrow mirroring
    // stays a render-time concern (seats only); a field value cannot hold
    // mirror spans.
    // ponytail: ceiling is the host hook ([data-composer-input]); upgrade
    // path: a slot prop for the draft text when the host adds one.
    const COMPOSER_SELECTOR = '[data-composer-input]';
    function orientComposerInput(el) {
      const text =
        typeof el.value === 'string' ? el.value : (el.textContent ?? '');
      const verdict = detectSeatDir(text);
      if (verdict === null) {
        el.removeAttribute('dir');
        return;
      }
      if (el.getAttribute('dir') !== verdict.dir)
        el.setAttribute('dir', verdict.dir);
    }
    function installComposerDirection() {
      if (
        typeof document === 'undefined' ||
        typeof MutationObserver === 'undefined'
      )
        return () => {};
      if (!document.querySelectorAll) return () => {};
      const sweep = () => {
        for (const el of document.querySelectorAll(COMPOSER_SELECTOR))
          orientComposerInput(el);
      };
      sweep();
      const onInput = (e) => {
        const t = e && e.target;
        const el =
          t !== null && typeof t === 'object' && typeof t.closest === 'function'
            ? t.closest(COMPOSER_SELECTOR)
            : null;
        if (el) orientComposerInput(el);
      };
      const listen =
        typeof document.addEventListener === 'function'
          ? document.addEventListener.bind(document)
          : null;
      if (listen) listen('input', onInput, true);
      const obs = new MutationObserver((records) => {
        for (const record of records) {
          if (record.type !== 'childList') continue;
          for (const node of record.addedNodes ?? []) {
            if (node.nodeType !== 1 || typeof node.matches !== 'function')
              continue;
            if (node.matches(COMPOSER_SELECTOR)) orientComposerInput(node);
            else if (node.querySelectorAll)
              for (const el of node.querySelectorAll(COMPOSER_SELECTOR))
                orientComposerInput(el);
          }
        }
      });
      if (document.body)
        obs.observe(document.body, { childList: true, subtree: true });
      return () => {
        obs.disconnect();
        if (listen && typeof document.removeEventListener === 'function')
          document.removeEventListener('input', onInput, true);
      };
    }

    // Host TodoPanel mounts collapsed (useState(true)) with no config switch,
    // so open each panel on first sight. Per-panel once: later user collapse
    // stays collapsed (panel already seen, no reopen on unrelated sweeps).
    // ponytail: ceiling is DOM-level (no slot prop exposes collapsed);
    // upgrade path: host option or shadow entry if host adds one.
    function autoOpenTodoPanels() {
      if (
        typeof document === 'undefined' ||
        typeof MutationObserver === 'undefined'
      )
        return () => {};
      const seen = new WeakSet();
      let obs = null;
      const sweep = () => {
        if (!document.querySelectorAll) return;
        for (const panel of document.querySelectorAll(
          '[data-testid="todo-panel"]',
        )) {
          if (seen.has(panel)) continue;
          seen.add(panel);
          const btn =
            typeof panel.querySelector === 'function'
              ? panel.querySelector(':scope button[aria-expanded="false"]')
              : null;
          if (btn !== null && btn !== undefined) btn.click();
        }
      };
      sweep();
      obs = new MutationObserver(sweep);
      if (document.body)
        obs.observe(document.body, { childList: true, subtree: true });
      return () => {
        if (obs) obs.disconnect();
      };
    }

    // Central chat width (settings: chatWidth). Only 100/75/50 are accepted;
    // anything else falls back to the default. apply() writes the value to
    // body[data-rastin-chat-width] so the static width rules above scale the
    // host content-width vars; cleanup removes the attribute.
    const CHAT_WIDTH_DEFAULT = 100;
    function normalizeChatWidth(value) {
      const n = typeof value === 'number' ? value : Number(value);
      if (n === 75 || n === 50 || n === 100) return n;
      return CHAT_WIDTH_DEFAULT;
    }
    function installChatWidth(chatWidth) {
      if (typeof document === 'undefined') return () => {};
      const body = document.body;
      if (!body || typeof body.setAttribute !== 'function') return () => {};
      const v = String(normalizeChatWidth(chatWidth));
      body.setAttribute('data-rastin-chat-width', v);
      return () => {
        if (typeof body.removeAttribute === 'function')
          body.removeAttribute('data-rastin-chat-width');
      };
    }

    return {
      inject: ['slots'],
      apply(ctx, config) {
        const lineHeight = normalizeLineHeight(config?.lineHeight);
        const textAlign = config?.textAlign === 'justify' ? 'justify' : 'start';
        const chatWidth = normalizeChatWidth(config?.chatWidth);
        ctx.effect(
          () =>
            ctx.slots.inject('shell.overlay', () =>
              ctx.slots.register(
                { name: 'shell.overlay', id: 'rastin-style' },
                () => h(RastinStyle, { lineHeight, textAlign }),
              ),
            ),
          'rastin: style',
        );
        ctx.effect(() => installTerminalFont(), 'rastin: terminal-font');
        ctx.effect(() => installAutoDirection(), 'rastin: auto-direction');
        ctx.effect(
          () => installComposerDirection(),
          'rastin: composer-direction',
        );
        ctx.effect(() => autoOpenTodoPanels(), 'rastin: todo open');
        ctx.effect(() => installChatWidth(chatWidth), 'rastin: chat-width');
      },
    };
  },
});
