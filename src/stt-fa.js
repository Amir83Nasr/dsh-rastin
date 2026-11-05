/**
 * Rastin Persian speech provider (host half).
 *
 * Why this exists: DSH's built-in local voice input (`sensevoice-local`)
 * only accepts `auto, zh, en, yue, ja, ko` — its sherpa-onnx SenseVoice
 * export is a 5-language build (zh/en/ja/ko/yue), so Persian (`fa`) is
 * rejected before inference and `auto` mishears Persian as English.
 * This module registers a second `speechToText` provider,
 * `rastin-fa-local`, backed by multilingual Whisper (base, int8) via the
 * same `sherpa-onnx-node` runtime the official bundle uses, with an
 * explicit `fa` language hint. Models download on demand into the
 * provider-owned `dataRoot` (pinned sha256, atomic publish).
 *
 * ponytail: ceiling is in-process inference (a native crash would take
 * down the host instead of one worker); upgrade path: move decoding into
 * a managed subprocess like `speech-to-text-sensevoice` does.
 * ponytail: ceiling is fixed Whisper-base; upgrade path: `model` config
 * (`tiny`/`base`/`small`) with per-model manifests.
 */

import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { access, mkdir, readFile, rename, rm, stat } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Transform } from 'node:stream';

// ── PUBLIC CONTRACT ──────────────────────────────────────────────

export const PROVIDER_ID = 'rastin-fa-local';
export const PROVIDER_NAME = 'Rastin Persian (Whisper base)';

/** Language hints this provider accepts. `auto` lets Whisper detect. */
export const LANGUAGES = ['fa', 'auto'];

/** Map our hint to sherpa-onnx Whisper's `language` ('' = detect). */
export function mapLanguage(language) {
  if (language === 'fa') return 'fa';
  if (language === 'auto') return '';
  throw new InputError(`Unsupported Rastin Persian language: ${language}`);
}

/** Rejected before native inference; the recognizer stays reusable. */
export class InputError extends Error {}

// ── MODEL MANIFEST (pinned) ──────────────────────────────────────
//
// Whisper base multilingual, int8 ONNX, converted by the sherpa-onnx team:
// https://huggingface.co/csukuangfj/sherpa-onnx-whisper-base
// `path` is the repo path; downloads resolve against each origin.
// Bytes + sha256 below are the integrity pins — update all three fields
// together when changing revision or precision.

const MODEL_REPO = 'csukuangfj/sherpa-onnx-whisper-base';
const MODEL_REVISION = 'main';

export const MODEL_FILES = [
  {
    name: 'base-encoder.int8.onnx',
    path: `${MODEL_REPO}/resolve/${MODEL_REVISION}/base-encoder.int8.onnx`,
    bytes: 29120534,
    sha256: '0b8fb1304b6109976038efff5ace81720e00386f3ff6b54ee8c75291ca0a1e11',
  },
  {
    name: 'base-decoder.int8.onnx',
    path: `${MODEL_REPO}/resolve/${MODEL_REVISION}/base-decoder.int8.onnx`,
    bytes: 130672026,
    sha256: '9759d217388a01b3a4c7c15533201067b48ae819c4daafc8624e64b9409dc02d',
  },
  {
    name: 'base-tokens.txt',
    path: `${MODEL_REPO}/resolve/${MODEL_REVISION}/base-tokens.txt`,
    bytes: 816730,
    sha256: 'b34b360dbb493e781e479794586d661700670d65564001f23024971d1f2fa126',
  },
];

const DEFAULT_ORIGINS = ['https://huggingface.co', 'https://hf-mirror.com'];

// ── WAV ──────────────────────────────────────────────────────────
//
// Canonical 16 kHz mono PCM16 WAV, matching what the voice-input client
// sends. Returns recording duration in seconds; rejects anything else
// with InputError before touching native code.

export function parseWav16kMono(audio, maxDurationSeconds) {
  const fail = (why) => {
    throw new InputError(`Invalid speech WAV: ${why}`);
  };
  if (!(audio instanceof Uint8Array) || audio.byteLength < 46)
    fail('too short');
  const view = new DataView(audio.buffer, audio.byteOffset, audio.byteLength);
  const ascii = (off, len) => {
    let s = '';
    for (let i = 0; i < len; i++)
      s += String.fromCharCode(view.getUint8(off + i));
    return s;
  };
  if (
    ascii(0, 4) !== 'RIFF' ||
    ascii(8, 4) !== 'WAVE' ||
    ascii(12, 4) !== 'fmt '
  )
    fail('not RIFF/WAVE/fmt');
  if (view.getUint16(20, true) !== 1) fail('not PCM');
  if (view.getUint16(22, true) !== 1) fail('not mono');
  if (view.getUint32(24, true) !== 16000) fail('not 16 kHz');
  if (view.getUint16(34, true) !== 16) fail('not 16-bit');
  // Locate the data chunk (fmt may carry extra bytes; chunks may pad).
  let off = 12;
  let samples = null;
  while (off + 8 <= audio.byteLength) {
    const id = ascii(off, 4);
    const size = view.getUint32(off + 4, true);
    if (id === 'data') {
      samples = audio.subarray(off + 8, off + 8 + size);
      break;
    }
    off += 8 + size + (size % 2);
  }
  if (!samples || samples.byteLength % 2 !== 0) fail('no PCM data');
  const seconds = samples.byteLength / 2 / 16000;
  if (!(seconds > 0) || seconds > maxDurationSeconds) fail('bad duration');
  const pcm = new DataView(
    samples.buffer,
    samples.byteOffset,
    samples.byteLength,
  );
  const out = new Float32Array(samples.byteLength / 2);
  for (let i = 0; i < out.length; i++)
    out[i] = pcm.getInt16(i * 2, true) / 32768;
  return { samples: out, seconds };
}

// ── RUNTIME ──────────────────────────────────────────────────────

/**
 * Near-digital-silence gate (RMS < -46 dBFS): Whisper hallucinates short
 * Persian fragments on empty recordings, so skip inference entirely and
 * report no speech. Real room tone and soft speech sit well above this.
 */
export function isNearSilent(samples) {
  let energy = 0;
  for (let i = 0; i < samples.length; i++) energy += samples[i] * samples[i];
  return Math.sqrt(energy / samples.length) < 0.005;
}

async function fileMatches(path, bytes, sha256, signal) {
  try {
    const info = await stat(path);
    if (!info.isFile() || info.size !== bytes) return false;
    const digest = createHash('sha256');
    const { createReadStream } = await import('node:fs');
    for await (const chunk of createReadStream(path, { signal }))
      digest.update(chunk);
    return digest.digest('hex') === sha256;
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
}

async function downloadOne(origin, file, root, signal, report) {
  const destination = join(root, file.name);
  if (await fileMatches(destination, file.bytes, file.sha256, signal)) return;
  const url = `${origin.replace(/\/$/, '')}/${file.path}`;
  const response = await fetch(url, { signal });
  if (!response.ok || !response.body) {
    await response.body?.cancel?.();
    throw new Error(`Model download HTTP ${response.status}: ${file.name}`);
  }
  await mkdir(root, { recursive: true });
  const partial = `${destination}.${Date.now()}.part`;
  const digest = createHash('sha256');
  let done = 0;
  const total = file.bytes;
  const hashing = new Transform({
    transform(chunk, _enc, cb) {
      done += chunk.length;
      if (done > total) {
        cb(new Error(`Model file grew past its pin: ${file.name}`));
        return;
      }
      digest.update(chunk);
      report({
        phase: 'downloading',
        resource: file.name,
        completedBytes: done,
        totalBytes: total,
      });
      cb(null, chunk);
    },
  });
  try {
    await pipeline(
      response.body,
      hashing,
      createWriteStream(partial, { flags: 'wx', mode: 0o600 }),
      {
        signal,
      },
    );
    if (done !== total || digest.digest('hex') !== file.sha256)
      throw new Error(`Model integrity mismatch: ${file.name}`);
    signal.throwIfAborted();
    await rename(partial, destination);
  } finally {
    await rm(partial, { force: true });
  }
}

/**
 * One serial Whisper recognizer with Host-owned preparation state.
 * Mirrors the `SpeechPreparation` shape the voice-input UI understands.
 */
export class RastinFaStt {
  constructor(config = {}) {
    this.dataRoot = config.dataRoot ?? null;
    this.origins = config.modelOrigins ?? DEFAULT_ORIGINS;
    this.threads = config.threads ?? 2;
    this.maxAudioSeconds = config.maxAudioSeconds ?? 120;
    this.inferenceTimeoutMs = config.inferenceTimeoutMs ?? 120000;
    this.modelRoot = this.dataRoot
      ? join(this.dataRoot, 'models', 'whisper-base-int8')
      : null;
    this.listeners = new Set();
    this.state = { phase: 'unprepared' };
    this.tail = Promise.resolve();
    this.recognizer = null;
    this.nativeConfig = null;
    this.disposed = false;
  }

  snapshot() {
    return this.state;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  publish(state) {
    this.state = state;
    for (const listener of this.listeners) listener();
  }

  paths() {
    const [encoder, decoder, tokens] = MODEL_FILES;
    return {
      encoder: join(this.modelRoot, encoder.name),
      tokens: join(this.modelRoot, tokens.name),
      decoder: join(this.modelRoot, decoder.name),
    };
  }

  /** Inspect disk caches; no downloads, no native load. */
  async inspect() {
    if (!this.modelRoot) {
      this.publish({ phase: 'unprepared' });
      return;
    }
    this.publish({ phase: 'checking', step: 'check', startedAt: Date.now() });
    try {
      const ok = await this.verify(undefined);
      this.publish(ok ? { phase: 'standby' } : { phase: 'unprepared' });
    } catch {
      this.publish({ phase: 'unprepared' });
    }
  }

  async verify(signal) {
    try {
      await access(this.modelRoot);
    } catch (error) {
      if (error?.code === 'ENOENT') return false;
      throw error;
    }
    for (const file of MODEL_FILES) {
      if (
        !(await fileMatches(
          join(this.modelRoot, file.name),
          file.bytes,
          file.sha256,
          signal,
        ))
      )
        return false;
    }
    return true;
  }

  /** Download + verify + load. Safe to call repeatedly; joins in-flight work. */
  async prepare() {
    if (!this.modelRoot)
      throw new Error('Rastin Persian voice needs dataRoot config');
    if (this.preparing) return this.preparing;
    this.preparing = (async () => {
      const signal = AbortSignal.timeout(60 * 60 * 1000);
      this.publish({ phase: 'checking', step: 'check', startedAt: Date.now() });
      this.publish({ phase: 'checking', step: 'model', startedAt: Date.now() });
      const report = (s) => this.publish({ ...s, step: 'model' });
      let lastError;
      for (const origin of this.origins) {
        try {
          for (const file of MODEL_FILES)
            await downloadOne(origin, file, this.modelRoot, signal, report);
          lastError = undefined;
          break;
        } catch (error) {
          lastError = error;
        }
      }
      if (lastError) {
        this.publish({
          phase: 'failed',
          message: String(lastError?.message ?? lastError),
        });
        throw lastError;
      }
      this.publish({
        phase: 'checking',
        step: 'verify',
        startedAt: Date.now(),
      });
      if (!(await this.verify(signal))) {
        const error = new Error('Persian voice model verification failed');
        this.publish({ phase: 'failed', message: error.message });
        throw error;
      }
      this.publish({ phase: 'loading', step: 'load', startedAt: Date.now() });
      this.loadNative();
      this.publish({ phase: 'ready' });
    })().finally(() => {
      this.preparing = undefined;
    });
    return this.preparing;
  }

  loadNative() {
    if (this.recognizer) return this.recognizer;
    const require = createRequire(import.meta.url);
    let sherpa;
    try {
      sherpa = require('sherpa-onnx-node');
    } catch (error) {
      throw new Error('sherpa-onnx-node is not installed; run pnpm install', {
        cause: error,
      });
    }
    const paths = this.paths();
    this.nativeConfig = {
      featConfig: { sampleRate: 16000, featureDim: 80 },
      modelConfig: {
        whisper: {
          encoder: paths.encoder,
          decoder: paths.decoder,
          language: 'fa',
          task: 'transcribe',
          tailPaddings: -1,
        },
        tokens: paths.tokens,
        numThreads: this.threads,
        provider: 'cpu',
        debug: 0,
      },
    };
    this.recognizer = new sherpa.OfflineRecognizer(this.nativeConfig);
    return this.recognizer;
  }

  async cancel() {
    // No background task owns resources between calls; nothing to cancel.
  }

  async dispose() {
    this.disposed = true;
    this.listeners.clear();
    try {
      await this.tail;
    } finally {
      // sherpa-onnx-node handles are GC-managed (no free() in this version).
      this.recognizer = null;
      this.nativeConfig = null;
    }
  }

  /**
   * Recognize one complete WAV with an explicit `fa`/`auto` hint.
   * Serial: concurrent calls queue behind the active decode so the
   * shared native handle never sees interleaved configs.
   */
  async transcribe(input, signal = new AbortController().signal) {
    signal.throwIfAborted();
    if (this.disposed) throw new Error('Rastin Persian provider disposed');
    const whisperLanguage = mapLanguage(input.language);
    const { samples, seconds } = parseWav16kMono(
      input.audio,
      this.maxAudioSeconds,
    );
    if (isNearSilent(samples))
      return { text: '', audioSeconds: seconds, inferenceSeconds: 0 };
    const job = this.tail.then(async () => {
      signal.throwIfAborted();
      if (!this.modelRoot || !(await this.verify(undefined))) {
        throw new Error(
          'مدل صوتی فارسی دانلود نشده — در تنظیمات ورودی صوتی، ارائه‌دهنده Rastin Persian را آماده (Prepare) کنید. ' +
            'Persian voice models are missing — prepare the Rastin Persian provider in voice-input settings.',
        );
      }
      const started = performance.now();
      const recognizer = this.loadNative();
      this.nativeConfig.modelConfig.whisper.language = whisperLanguage;
      recognizer.setConfig(this.nativeConfig);
      const stream = recognizer.createStream();
      stream.acceptWaveform({ sampleRate: 16000, samples });
      const call = AbortSignal.any([
        signal,
        AbortSignal.timeout(this.inferenceTimeoutMs),
      ]);
      call.throwIfAborted();
      recognizer.decode(stream);
      call.throwIfAborted();
      const text = recognizer.getResult(stream).text.trim();
      return {
        text,
        audioSeconds: seconds,
        inferenceSeconds: (performance.now() - started) / 1000,
      };
    });
    // The chain itself never rejects (jobs do); a late dispose still joins.
    this.tail = job.then(
      () => undefined,
      () => undefined,
    );
    return job;
  }
}

/** Read provider-owned model bytes (used by tests). */
export async function readModelBytes(modelRoot, name) {
  return readFile(join(modelRoot, name));
}
