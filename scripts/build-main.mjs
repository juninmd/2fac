// Empacota o processo main (ESM) e o preload (CJS, exigido pelo sandbox do Electron) com esbuild.
// A checagem de tipos continua no `tsc --noEmit`.
import { build, context } from 'esbuild';

const watch = process.argv.includes('--watch');

const common = {
    bundle: true,
    platform: 'node',
    target: 'node22',
    sourcemap: true,
    packages: 'external', // dependências ficam em node_modules (argon2 é nativo)
    logLevel: 'info',
};

const targets = [
    { ...common, entryPoints: ['src/main/main.ts'], outfile: 'dist/main/main.js', format: 'esm' },
    { ...common, entryPoints: ['src/preload/preload.ts'], outfile: 'dist/preload/preload.cjs', format: 'cjs' },
];

if (watch) {
    await Promise.all(targets.map(async (options) => (await context(options)).watch()));
} else {
    await Promise.all(targets.map((options) => build(options)));
}
