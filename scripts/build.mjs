/** Reproducible build: src/client.template.js + src/direction.js + fonts -> client.js. */
import { readFileSync, writeFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const b64 = (p) => readFileSync(new URL(p, root)).toString('base64');

let src = readFileSync(new URL('src/client.template.js', root), 'utf8');
for (const [ph, file] of [
  ['__IRANYEKAN_B64__', 'fonts/IRANYekanX-Regular.woff2'],
  ['__IRANYEKAN_BOLD_B64__', 'fonts/IRANYekanX-Bold.woff2'],
  ['__FIRAMONO_B64__', 'fonts/FiraMonoNerdFontMono-Regular.woff2'],
]) {
  if (src.split(ph).length - 1 !== 1)
    throw new Error(`${ph}: expected 1 occurrence`);
  src = src.replace(ph, b64(file));
}
if (/__[A-Z]+_B64__/.test(src)) throw new Error('placeholder remains');
// Single source of truth: strip `export` so the module body inlines into the factory.
const direction = readFileSync(new URL('src/direction.js', root), 'utf8')
  .replace(/^export /gm, '')
  .trim();
if (src.split('/*__RASTIN_DIRECTION__*/').length - 1 !== 1)
  throw new Error('__RASTIN_DIRECTION__: expected 1 occurrence');
src = src.replace('/*__RASTIN_DIRECTION__*/', direction);
writeFileSync(new URL('client.js', root), src);
console.log(`OK: client.js ${src.length} bytes`);
