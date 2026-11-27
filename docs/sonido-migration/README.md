# Troca das primitivas locais pelo Sonido

O renderer do 2FAC mantinha à mão os mesmos padrões que o
[`@juninmd/sonido`](https://github.com/juninmd/sonido) publica: botões, campos,
diálogo, toasts, estado vazio, anel de tempo, abas, interruptores. Nesta troca
essas peças passam a vir do pacote **2.5.0**; a identidade do app (paleta escura,
acento vermelho `#e23e3e`, cartões com borda superior na cor do emissor) continua
igual.

| Componente | Antes (2FAC) | Depois (`@juninmd/sonido@2.5.0`) | Arquivos |
| --- | --- | --- | --- |
| `Button` / ícone | `<button class="btn btn-primary">`, `.btn-icon`, `.btn-icon-small` | `Button` com `variant`, `size="xs"`/`"icon"`, `appearance="outline"`, `loading`, `iconStart` | `App.tsx`, `Item.tsx`, `TokenDetail.tsx`, `AddItemForm.tsx`, `LockScreen.tsx`, `Settings.tsx`, `UpdateBanner.tsx`, `UpdateSection.tsx`, `settings/*` |
| `Dialog` | form de edição inline dentro do cartão | `Dialog` (modal nativo, foco preso, Esc/clique no fundo) | `Item.tsx`, `TokenDetail.tsx` |
| `EmptyState` | `<div class="empty-state">` com `<p>` e botão | `EmptyState` com ícone, título, descrição e ação | `App.tsx` |
| `Odometer` + `ProgressRing` | `<span class="token">` e dois `<svg>` circulares escritos à mão | `Odometer` por dígito + `ProgressRing` no tempo restante | `TokenCode.tsx` (novo), `Item.tsx`, `TokenDetail.tsx` |
| `Toast` | `alert()` e overlays "Copiado!" | `ToastProvider` + `useToast` (sucesso/erro, cópia, importação) | `index.tsx`, `App.tsx`, `Item.tsx`, `TokenDetail.tsx`, `AddItemForm.tsx` |
| `TextField` | `<input>`/`<textarea>` com `.form-group` | `TextField` (label, dica, erro, `multiline`) | `AddItemForm.tsx`, `Item.tsx`, `TokenDetail.tsx`, `LockScreen.tsx`, `settings/SecurityTab.tsx` |
| `SearchField` | `<input class="search-bar">` | `SearchField` (lupa, limpar, dica `/`) | `App.tsx` |
| `Select` | `<select>` cru | `Select` nativo estilizado com label | `AddItemForm.tsx`, `settings/GeneralTab.tsx` |
| `Switch` | `<input type="checkbox">` | `Switch` sobre `role="switch"` | `settings/GeneralTab.tsx`, `settings/SecurityTab.tsx` |
| `Tabs` | `<div class="settings-tabs">` com `.tab-btn.active` | `Tabs` (`variant="pill"`, foco itinerante, `aria-selected`) | `Settings.tsx` |
| `Skeleton` / `Spinner` | "Carregando..." textual | `Skeleton` na lista e `Spinner` no lock/atualização | `App.tsx`, `LockScreen.tsx`, `UpdateBanner.tsx` |
| `Badge` | contagem e categoria sem estilo | `Badge` (`appearance="count"`, tons, `dot`) | `App.tsx`, `Item.tsx`, `TokenDetail.tsx`, `UpdateBanner.tsx`, `settings/AboutTab.tsx`, `settings/DevicesTab.tsx` |
| `Card` / `PageHeader` / `Kbd` / `ConfirmButton` | `.settings-card`, header próprio, `<kbd>` cru, `window.confirm` | `Card`, `PageHeader`, `Kbd`, `ConfirmButton appearance="inline"` | `Settings.tsx`, `settings/*`, `Item.tsx`, `TokenDetail.tsx` |

## Tema

`src/renderer/sonido-bridge.css` liga os tokens `--sn-*` à paleta do app:
`--sn-color-accent` → `--primary-color`, superfícies → `--bg-dark`/`--bg-card`/
`--bg-hover`, texto → `--text-primary`/`--text-secondary`. O acento escolhido em
Configurações continua valendo, inclusive no gradiente do botão primário e no anel
do código. `data-theme` segue o tema do app (`dark`/`light`) e é gravado em
`App.loadSettings`, junto com as variáveis de paleta que já existiam.

O CSS do Sonido entra uma vez em `index.tsx`, antes do bridge e do `App.css`.

## Capturas

`antes.png` e `depois.png` são a mesma tela com os mesmos dados fictícios
(Acme Bank, Globex, Initech, Hooli; códigos fixos do harness), em Chromium
1180×900 a `deviceScaleFactor: 2`, `fullPage`:

```bash
# antes: worktree temporário de origin/main, fora do repositório
git worktree add --detach C:/Users/jr_ac/AppData/Local/Temp/opencode/before-2fac origin/main
# harness efêmero + CSS real daquele checkout, porta 5335

# depois: harness efêmero no working tree, porta 5325
node C:/Users/jr_ac/AppData/Local/Temp/opencode/shot/full.cjs \
  "http://127.0.0.1:5325/" "D:/Solutions/pessoal/wt-sonido/2fac/docs/sonido-migration/depois.png"
node C:/Users/jr_ac/AppData/Local/Temp/opencode/shot/full.cjs \
  "http://127.0.0.1:5335/" "D:/Solutions/pessoal/wt-sonido/2fac/docs/sonido-migration/antes.png"
```

O harness não é versionado: nenhuma cópia de `legacy/`, `preview.*` ou HTML de
captura entrou no commit. `useToken` foi substituído por um stub de códigos fixos
apenas no bundle de captura, para o anel e os dígitos ficarem determinísticos.

## Verificação

| Comando | Resultado |
| --- | --- |
| `pnpm exec tsc --noEmit` | 0 erros |
| `pnpm lint` | 0 erros, 6 avisos (todos pré-existentes) |
| `pnpm test` | 19 suítes, 219 testes, todos passando |
| `pnpm build` | `tsc --noEmit` + main + webpack OK; 3 avisos de tamanho do bundle |

Linha de base em `origin/main` (9e7495b), mesmo Windows: `tsc` 0 erros, `lint`
0 erros/9 avisos, 219 testes passando. Não há falha específica de Windows nova;
o diff só acrescenta o pacote e a migração.

### Jest e ESM

O Sonido é publicado só como ESM. O Jest do projeto roda em CommonJS, então
`jest.config.ts` passou a transformar `@juninmd/sonido` com o ts-jest
(`transformIgnorePatterns` + `allowJs`) em vez de mockar o pacote — os testes
executam os componentes reais.

## O que ficou de fora

- **`TimerCard` não tem declaração de tipos no 2.5.0.** O componente existe no
  `dist/index.js` (e no README do pacote), mas não há `components/TimerCard/*.d.ts`
  nem export em `dist/index.d.ts`; importá-lo quebra o `tsc`. O contador continua
  como `ProgressRing` + `Odometer`, que são tipados.
- **Color picker**: o Sonido não publica um seletor de cor; o `<input type="color">`
  de Configurações e os swatches de cor do emissor continuam locais (são dados do
  app, não uma primitiva de UI).
- **`Menu`/`Tooltip`/`Kbd`**: `Tooltip` e `Kbd` foram usados; `Menu` não foi
  necessário — as ações do header continuam botões explícitos, que é o que os
  atalhos e os testes esperam.
- O toast do Sonido se fecha pela animação CSS (`animationend`); no jsdom a
  animação não roda, então os testes verificam o toast visível e não o auto-dismiss.
- O bundle do renderer ficou em 519 KiB (aviso de performance do webpack); o CSS
  do Sonido responde por ~143 KiB dele.
