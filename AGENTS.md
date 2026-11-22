# AGENTS.md

2FAC: a desktop 2FA (TOTP) manager on Electron. Sensitive data is encrypted at rest with AES-256-GCM (`src/main/crypto.ts`).

## Personas

- **Sentinel** (security and architecture): crypto, process isolation, secure IPC, data integrity.
- **Prism** (UI/UX): accessibility, clear interaction, smooth motion.
- **Catalyst** (quality and automation): Jest, Playwright, CI/CD, edge cases.

## Stack

- Electron (main + preload + renderer), React function components with hooks, TypeScript (strict).
- Bundling: `tsc` for the main process, webpack for the renderer. Tests: Jest. Lint: ESLint.
- Packaging: electron-builder. Package manager: pnpm (`pnpm-lock.yaml`).

## Commands

```bash
npm run dev            # main build (watch) + renderer dev server
npm run build          # tsc --noEmit, main build, renderer production build
npm test               # jest
npm run lint           # eslint .
npm run test:scripts   # node --test scripts/*.test.mjs
npm run electron:build # build + electron-builder (no publish)
```

## Structure

- `src/main/`: main process (`main.ts`, `store.ts`, `crypto.ts`, `masterPassword.ts`, `importers.ts`, `updater.ts`).
- `src/preload/preload.ts`: the only bridge to the renderer, through `contextBridge`.
- `src/renderer/`: React UI (`components/`, `hooks/`, `utils/`).
- `prototype/`: static UI prototype, not part of the app build.
- `scripts/`: build helpers and their tests.

## Rules

1. **IPC**: never expose the `remote` module. Expose a narrow API through `contextBridge` only.
2. **Input**: validate every input at the boundary (IPC, imports, user input).
3. **Storage**: sensitive data is encrypted at rest (AES-256-GCM, `src/main/crypto.ts`).
4. **Types**: `any` is forbidden. Keep the TypeScript strict.
5. **Components**: function components with hooks.
6. **Tests**: write the test before the implementation for critical logic. Aim above 80% coverage on business logic.
7. **Size**: keep files under 200 lines. Split by responsibility when they grow.
8. **Design**: DRY, KISS, SOLID. Remove code that a change makes dead.
9. **Commits**: Conventional Commits.

## Gotchas

- Do not commit secrets, keys, or certificates. `.gitignore` covers `.env*`, `*.key`, `*.pem`, `secrets/`.
- `test-results/` and `coverage/` are generated output. Do not commit them.

<!-- base-actions-main-policy -->
## GitHub Actions — padrão obrigatório (@main)

- Referencie as actions internas sempre pelo branch, nunca por SHA:
  - `uses: juninmd/base-actions/<action>@main`
  - `uses: juninmd/base-actions/.github/workflows/<arquivo>.yml@main`
- Não fixe `@<sha>` em `juninmd/base-actions`: a atualização é centralizada no
  `main` e passa a valer no próximo run.
- PRs cujos checks não iniciam por billing/spending limit são mesclados pelo bot central
  `juninmd/base-actions/.github/workflows/auto-merge-billing-blocked.yml`.
  Para impedir o merge automático de um PR, aplique a label `do-not-merge`.
