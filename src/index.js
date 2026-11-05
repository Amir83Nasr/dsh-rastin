/** Host half of the Rastin bundle; the Client module owns the rendering. */
import Schema from '@deepseek-ai/schemastery';

// Line spacing for the Persian prose surfaces (chat, queue, question cards,
// todos, markdown previews). The client reads it in apply() and rebuilds its
// style seat on change, so the value is also tunable from the Settings UI.
// Chat width narrows the central conversation column (100 full, 75 or 50
// percent) via the host's content-width variables; same Settings UI path.
export const Config = Schema.object({
  lineHeight: Schema.number()
    .min(1)
    .max(3)
    .step(0.1)
    .default(2)
    .description(
      'Line spacing (line-height) for Persian text: 1 tight, 2 comfortable (default), up to 3 airy. / فاصله بین خطوط متن‌های فارسی: ۱ فشرده، ۲ راحت (پیش‌فرض)، تا ۳ باز.',
    ),
  textAlign: Schema.union([Schema.const('start'), Schema.const('justify')])
    .default('start')
    .description(
      'Paragraph alignment for Persian prose: start (default) or justify. / تراز پاراگراف‌های متن فارسی: شروع (پیش‌فرض) یا میزان (justify).',
    ),
  chatWidth: Schema.union([
    Schema.const(100),
    Schema.const(75),
    Schema.const(50),
  ])
    .default(100)
    .description(
      'Central chat width: 100 full width (default), 75 or 50 percent of the conversation column. / عرض فضای وسط چت: ۱۰۰ درصد کامل (پیش‌فرض)، ۷۵ یا ۵۰ درصد ستون گفت‌وگو.',
    ),
});

export function apply() {}
