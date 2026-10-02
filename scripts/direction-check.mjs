/** detectSeatDir: leading-run rule across fa/en mixes. */
import assert from 'node:assert/strict';
import { detectSeatDir } from '../src/direction.js';

const cases = [
  // [text, expected, label]
  ['سلام دنیا', 'rtl', 'fa-only'],
  ['Hello world', 'ltr', 'en-only'],
  ['Hello', 'ltr', 'single-en-word'],
  ['سلام', 'rtl', 'single-fa-word'],
  ['', null, 'empty'],
  ['123 ... !?', null, 'digits-punct-only'],
  ['🎉 سلام', 'rtl', 'emoji-then-fa'],
  ['... Hello', 'ltr', 'punct-then-en'],
  ['123 سلام', 'rtl', 'digits-then-fa'],
  ['سلام Hello', 'rtl', 'fa-first-mixed'],
  ['Hello سلام', 'rtl', 'lone-en-then-fa-stays-rtl'],
  ['Merge کن', 'rtl', 'lone-tech-term-stays-rtl'],
  ['OK سلام دنیا', 'rtl', 'lone-ok-then-fa-stays-rtl'],
  ['Here is the fix', 'ltr', 'en-run-no-fa'],
  ['Here is the fix برای مشکل', 'ltr', 'en-run-then-fa-flips'],
  ['سلام\nHello', 'rtl', 'fa-first-multiline'],
  ['Hello\nسلام', 'rtl', 'lone-en-line-then-fa-stays-rtl'],
  ['Hello world\nسلام دنیا', 'ltr', 'en-run-then-fa-lines-flips'],
  ['<div>سلام</div>', 'rtl', 'literal-markup-lone-latin-stays-rtl'],
  ['<div>Hello</div>', 'ltr', 'literal-markup-en'],
  ['\n  سلام', 'rtl', 'whitespace-then-fa'],
  ['```js\nconst x = 1;\n```', 'ltr', 'code-fence-en'],
  ['Note: این یک تست است', 'rtl', 'lone-note-then-fa-stays-rtl'],
  ['Step 1: سلام', 'rtl', 'lone-step-then-fa-stays-rtl'],
  ['I سلام', 'rtl', 'single-letter-then-fa-stays-rtl'],
  ['a b سلام', 'ltr', 'two-letters-then-fa-flips'],
  ['... ... Hello world سلام', 'ltr', 'punct-runs-then-en-run-flips'],
  ['سلام ... Hello world', 'rtl', 'fa-first-word-always-rtl'],
  ['שלום', 'rtl', 'hebrew-rtl'],
  ['Привет', 'ltr', 'cyrillic-ltr'],
  ['Οδυσσέας', 'ltr', 'greek-ltr'],
  ['This turn failed API key is invalid', 'ltr', 'turn-error-en'],
  // Queue-dock mixes: counters and previews with Persian digits/units.
  ['۳ مورد', 'rtl', 'fa-digits-with-unit'],
  ['3 مورد در صف', 'rtl', 'latin-digit-then-fa-stays-rtl'],
  ['Queue 3 مورد', 'rtl', 'lone-en-then-fa-counter-stays-rtl'],
  ['Queued items 3 در انتظار', 'ltr', 'en-run-then-fa-counter-flips'],
  ['پیش‌نمایش: Hello world', 'rtl', 'fa-label-then-en-stays-rtl'],
];

for (const [text, expected, label] of cases) {
  assert.equal(detectSeatDir(text)?.dir ?? null, expected, label);
}

console.log(
  `OK: detectSeatDir ${cases.length} cases (fa-only, en-only, lone-word gate, runs, markup, scripts)`,
);
