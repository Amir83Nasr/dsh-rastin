/** Reproducible build: src/client.template.js + fonts/*.woff2 -> client.js. Run: node scripts/build.mjs */
import { readFileSync, writeFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const b64 = (p) => readFileSync(new URL(p, root)).toString('base64');

let src = readFileSync(new URL('src/client.template.js', root), 'utf8');
for (const [ph, file] of [
  ['__IRANYEKAN_B64__', 'fonts/IRANYekanX-Regular.woff2'],
  ['__FIRAMONO_B64__', 'fonts/FiraMonoNerdFontMono-Regular.woff2'],
]) {
  if (src.split(ph).length - 1 !== 1)
    throw new Error(`${ph}: expected 1 occurrence`);
  src = src.replace(ph, b64(file));
}
if (/__[A-Z]+_B64__/.test(src)) throw new Error('placeholder remains');
writeFileSync(new URL('client.js', root), src);
console.log(`OK: client.js ${src.length} bytes`);
