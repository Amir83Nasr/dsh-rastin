/** Host half of the Rastin bundle; the Client module owns the rendering. */
import Schema from '@deepseek-ai/schemastery';

// Line spacing for the Persian prose surfaces (chat, queue, question cards,
// todos, markdown previews). The client reads it in apply() and rebuilds its
// style seat on change, so the value is also tunable from the Settings UI.
export const Config = Schema.object({
  lineHeight: Schema.number()
    .min(1)
    .max(3)
    .step(0.1)
    .default(2)
    .description(
      'Line spacing (line-height) for Persian text: 1 tight, 2 comfortable (default), up to 3 airy. / فاصله بین خطوط متن‌های فارسی: ۱ فشرده، ۲ راحت (پیش‌فرض)، تا ۳ باز.',
    ),
});

export function apply() {}
