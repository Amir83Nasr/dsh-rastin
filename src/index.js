/**
 * Host half of the Rastin bundle.
 *
 * - Client rendering (RTL layout, fonts) lives in the client module and is
 *   untouched by this file.
 * - Persian voice input: registers the `rastin-fa-local` speechToText
 *   provider (Whisper base, explicit `fa` hint). Requires the official
 *   Voice input bundle to be enabled — it provides the `speechToText`
 *   service and the voice preferences UI this provider plugs into.
 */
import { isAbsolute } from 'node:path';
import {
  LANGUAGES,
  PROVIDER_ID,
  PROVIDER_NAME,
  RastinFaStt,
} from './stt-fa.js';

export const inject = ['speechToText'];

export function apply(ctx, config = {}) {
  if (!ctx?.speechToText) return () => {};
  const dataRoot = config.dataRoot;
  if (
    dataRoot !== undefined &&
    (typeof dataRoot !== 'string' || !isAbsolute(dataRoot))
  )
    throw new Error(
      `Rastin Persian voice dataRoot must be absolute: ${dataRoot}`,
    );
  const worker = new RastinFaStt({ ...config, dataRoot });
  return ctx.effect(() => {
    const unregister = ctx.speechToText.register({
      info: {
        id: PROVIDER_ID,
        name: PROVIDER_NAME,
        location: 'host-local',
        languages: LANGUAGES,
        downloadSources: worker.origins,
        setupEstimate: {
          recommendedDiskBytes: 1e9,
          expectedMemoryBytes: 1e9,
          minimumMinutes: 1,
          maximumMinutes: 15,
        },
      },
      preparation: worker,
      transcribe: async (input, signal) => worker.transcribe(input, signal),
    });
    worker.inspect();
    return async () => {
      const removing = unregister();
      await worker.dispose();
      await removing;
    };
  });
}
