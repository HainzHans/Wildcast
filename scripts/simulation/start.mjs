// Bündelt die Simulation mit esbuild (kommt mit Angular) und führt sie aus.
import { buildSync } from 'esbuild';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const hier = dirname(fileURLToPath(import.meta.url));
const ergebnis = buildSync({
  entryPoints: [join(hier, process.env.SIM_EINSTIEG ?? 'bosskampf.ts')],
  bundle: true,
  format: 'cjs',
  platform: 'node',
  write: false,
  logLevel: 'error',
});
const require = createRequire(import.meta.url);
const modul = { exports: {} };
new Function('require', 'process', 'module', 'exports', ergebnis.outputFiles[0].text)(
  require,
  process,
  modul,
  modul.exports,
);
