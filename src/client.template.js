window.__ModuleLoader__.load({
  id: '@amir83nasr/rastin',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    // IranYekanX Regular, base64 data URI so the face ships inside the bundle.
    const FONT_B64 = '__IRANYEKAN_B64__';
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
  text-align: left !important;
}
[data-question-key] [class*='fieldInput'],
[data-question-key] textarea,
[data-question-key] [class*='customBlock'] {
  direction: rtl;
  text-align: right;
}
/* Process status titles stay LTR so English labels anchor left. */
[data-step-process] [data-process-activity],
[data-turn-process] {
  direction: ltr;
  text-align: left;
}
/* User bubbles stay on the right under RTL: host aligns the row/stack
   columns with flex-end (right in LTR, left in RTL), so flip those two
   levels to flex-start (right in RTL). Attachments row likewise. Text
   inherits right alignment; code keeps its LTR rule below. */
[data-chat-flow] [data-chat-flow-kind='user'],
[data-chat-flow] [data-chat-flow-kind='steering'],
[data-chat-flow] [data-submission-echo],
[data-chat-flow] [data-pending-steering] {
  text-align: right;
}
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
[data-plan-review-key] pre, [data-plan-review-key] code {
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
      if (proto.__rastinFontPatched) return () => {};
      const set = desc.set;
      Object.defineProperty(proto, 'font', {
        configurable: true,
        get: desc.get,
        set(v) {
          if (
            typeof v === 'string' &&
            v.indexOf('monospace') !== -1 &&
            this.canvas &&
            this.canvas.closest &&
            this.canvas.closest('[data-sidebar-terminal]')
          ) {
            if (v.indexOf('ui-monospace') !== -1) {
              v = v.replace('ui-monospace', `'${TERMINAL_FACE}', ui-monospace`);
            } else {
              v = v.replace(/^(\d+(?:\.\d+)?px\s+)/, `$1'${TERMINAL_FACE}', `);
            }
          }
          set.call(this, v);
        },
      });
      proto.__rastinFontPatched = true;
      if (document.fonts && document.fonts.load) {
        document.fonts.load(`13px "${TERMINAL_FACE}"`).catch(() => {});
      }
      return () => {
        Object.defineProperty(proto, 'font', desc);
        delete proto.__rastinFontPatched;
      };
    }

    function RastinStyle() {
      return h('style', { 'data-raastin': '' }, css);
    }

    // Host TodoPanel mounts collapsed (useState(true)) with no config switch,
    // so open it on mount. One-way: user can still collapse after.
    // ponytail: ceiling is DOM-level (no slot prop exposes collapsed);
    // upgrade path: host option or shadow entry if host adds one.
    function autoOpenTodoPanels() {
      if (
        typeof document === 'undefined' ||
        typeof MutationObserver === 'undefined'
      )
        return () => {};
      const seen = new WeakSet();
      const sweep = () => {
        if (!document.querySelectorAll) return;
        for (const panel of document.querySelectorAll(
          '[data-testid="todo-panel"]',
        )) {
          if (seen.has(panel)) continue;
          seen.add(panel);
          const btn =
            typeof panel.querySelector === 'function'
              ? panel.querySelector('button[aria-expanded="false"]')
              : null;
          if (btn !== null && btn !== undefined) btn.click();
        }
      };
      sweep();
      const obs = new MutationObserver(sweep);
      if (document.body)
        obs.observe(document.body, { childList: true, subtree: true });
      return () => {
        obs.disconnect();
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
        ctx.effect(() => autoOpenTodoPanels(), 'rastin: todo open');
      },
    };
  },
});
