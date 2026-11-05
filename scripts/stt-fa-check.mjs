/** Persian voice provider check: WAV parsing, language allowlist, manifest pins, host wiring. No native load, no downloads. Run: node scripts/stt-fa-check.mjs */
import assert from 'node:assert/strict';
import {
  InputError,
  LANGUAGES,
  MODEL_FILES,
  PROVIDER_ID,
  RastinFaStt,
  isNearSilent,
  mapLanguage,
  parseWav16kMono,
} from '../src/stt-fa.js';
import { apply } from '../src/index.js';

// ── LANGUAGE ALLOWLIST ───────────────────────────────────────────
assert.deepEqual(LANGUAGES, ['fa', 'auto']);
assert.equal(mapLanguage('fa'), 'fa');
assert.equal(mapLanguage('auto'), '');
for (const bad of ['en', 'zh', 'ja', 'ko', 'yue', '', 'FA', 'per']) {
  assert.throws(() => mapLanguage(bad), InputError, `language ${bad} rejected`);
}

// ── MODEL MANIFEST PINS ──────────────────────────────────────────
assert.equal(MODEL_FILES.length, 3);
assert.deepEqual(
  MODEL_FILES.map((f) => f.name),
  ['base-encoder.int8.onnx', 'base-decoder.int8.onnx', 'base-tokens.txt'],
);
let pinnedBytes = 0;
for (const file of MODEL_FILES) {
  assert.match(file.sha256, /^[0-9a-f]{64}$/, `${file.name} sha256 pinned`);
  assert.ok(file.bytes > 0, `${file.name} bytes pinned`);
  assert.ok(
    file.path.startsWith('csukuangfj/sherpa-onnx-whisper-base/resolve/main/'),
    `${file.name} repo path`,
  );
  pinnedBytes += file.bytes;
}
assert.ok(
  pinnedBytes > 100 * 1024 * 1024,
  `whisper-base pins total ${pinnedBytes} bytes`,
);

// ── WAV PARSER ───────────────────────────────────────────────────
function wav({
  channels = 1,
  sampleRate = 16000,
  bits = 16,
  seconds = 0.5,
  riff = true,
}) {
  const frames = Math.floor(sampleRate * seconds);
  const blockAlign = channels * (bits / 8);
  const data = new Uint8Array(frames * blockAlign);
  for (let i = 0; i < frames; i++) {
    const s = Math.round(
      Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 10000,
    );
    for (let ch = 0; ch < channels; ch++) {
      const off = i * blockAlign + ch * (bits / 8);
      if (bits === 16) new DataView(data.buffer).setInt16(off, s, true);
      else data[off] = 128;
    }
  }
  const head = new Uint8Array(44);
  const view = new DataView(head.buffer);
  const ascii = (off, s) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
  };
  ascii(0, riff ? 'RIFF' : 'RIFX');
  view.setUint32(4, 36 + data.byteLength, true);
  ascii(8, 'WAVE');
  ascii(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bits, true);
  ascii(36, 'data');
  view.setUint32(40, data.byteLength, true);
  const out = new Uint8Array(44 + data.byteLength);
  out.set(head, 0);
  out.set(data, 44);
  return out;
}

{
  const { samples, seconds } = parseWav16kMono(wav({}), 120);
  assert.ok(Math.abs(seconds - 0.5) < 1e-6, `duration ${seconds}s`);
  assert.ok(samples instanceof Float32Array && samples.length === 8000);
  assert.ok(
    samples.some((v) => v !== 0),
    'sine survives round-trip',
  );
}
for (const [label, audio] of [
  ['riff', wav({ riff: false })],
  ['stereo', wav({ channels: 2 })],
  ['8kHz', wav({ sampleRate: 8000 })],
  ['8-bit', wav({ bits: 8 })],
  ['empty', new Uint8Array(0)],
  ['header-only', wav({}).subarray(0, 44)],
]) {
  assert.throws(
    () => parseWav16kMono(audio, 120),
    InputError,
    `wav ${label} rejected`,
  );
}
assert.throws(
  () => parseWav16kMono(wav({ seconds: 5 }), 1),
  InputError,
  'over-long wav rejected',
);

// ── SILENCE GATE (no inference, no models needed) ────────────────
{
  const zeros = wav({});
  zeros.fill(0, 44);
  assert.equal(isNearSilent(new Float32Array(8000)), true);
  assert.equal(isNearSilent(parseWav16kMono(wav({}), 120).samples), false);
  const worker = new RastinFaStt({ dataRoot: '/tmp/rastin-fa-test-missing' });
  const silent = await worker.transcribe(
    { audio: zeros, language: 'fa' },
    new AbortController().signal,
  );
  assert.equal(silent.text, '');
  assert.ok(Math.abs(silent.audioSeconds - 0.5) < 1e-6);
}

// ── HOST WIRING (mocked ctx, no native) ─────────────────────────
{
  const captured = {};
  const mockCtx = {
    speechToText: {
      register: (provider) => {
        captured.provider = provider;
        return async () => {
          captured.unregistered = true;
        };
      },
    },
    effect: (fn) => fn(),
  };
  const cleanup = apply(mockCtx, { dataRoot: '/tmp/rastin-fa-test' });
  assert.equal(typeof cleanup, 'function');
  assert.equal(captured.provider.info.id, PROVIDER_ID);
  assert.equal(captured.provider.info.location, 'host-local');
  assert.deepEqual(captured.provider.info.languages, ['fa', 'auto']);
  assert.equal(typeof captured.provider.transcribe, 'function');
  // inspect() runs async: checking first, then unprepared (dir missing).
  for (let i = 0; i < 100; i++) {
    if (captured.provider.preparation.snapshot().phase === 'unprepared') break;
    await new Promise((r) => setTimeout(r, 10));
  }
  assert.equal(captured.provider.preparation.snapshot().phase, 'unprepared');
  await cleanup();
  assert.equal(captured.unregistered, true);
}
assert.throws(
  () =>
    apply(
      { speechToText: { register: () => {} }, effect: (fn) => fn() },
      { dataRoot: 'rel/path' },
    ),
  /absolute/,
  'relative dataRoot rejected',
);
// No speechToText service (voice bundle off): host half stays inert.
assert.equal(typeof apply({}, {}), 'function');

// ── TRANSCRIBE GUARDS (never reach native here) ──────────────────
{
  const worker = new RastinFaStt({ dataRoot: '/tmp/rastin-fa-test-missing' });
  await assert.rejects(
    worker.transcribe(
      { audio: wav({}), language: 'en' },
      new AbortController().signal,
    ),
    InputError,
    'unsupported language rejected before inference',
  );
  await assert.rejects(
    worker.transcribe(
      { audio: wav({}), language: 'fa' },
      new AbortController().signal,
    ),
    /مدل صوتی فارسی/,
    'missing models explain the voice-settings Prepare step',
  );
  const aborted = new AbortController();
  aborted.abort(new Error('gone'));
  await assert.rejects(
    worker.transcribe({ audio: wav({}), language: 'fa' }, aborted.signal),
    /gone/,
    'aborted calls reject',
  );
}

console.log(
  'OK: fa/auto allowlist, pinned whisper-base manifest, WAV guards, host wiring',
);
