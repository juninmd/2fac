# Releases e atualização automática (GitHub)

## Release automático a cada commit
Todo commit que chega no `main` gera uma versão nova (`.github/workflows/release.yml`):

1. `scripts/next-version.mjs` lê as tags `vX.Y.Z` e os commits desde a última (Conventional Commits):

   | Commit | Incremento |
   |---|---|
   | `feat: …` | minor (1.2.0 → 1.3.0) |
   | `tipo!: …` ou `BREAKING CHANGE:` no corpo | major (1.2.0 → 2.0.0) |
   | qualquer outro (`fix:`, `chore:`, sem prefixo…) | patch (1.2.0 → 1.2.1) |

   O maior incremento entre os commits desde a última tag vence. A primeira versão é a do `package.json` (`1.0.0`).
2. O workflow cria a tag no commit e um **release em rascunho**.
3. Builda em Ubuntu, Windows e macOS (`electron-builder --publish always` anexa os instaladores ao rascunho). A versão do app vem da tag; o `package.json` não é alterado.
4. Com todos os builds prontos, o release é publicado com notas geradas automaticamente (commits/PRs desde a tag anterior).

- **Pular o release** de um commit: inclua `[skip release]` (ou `[skip ci]`) na mensagem.
- Commits em sequência entram numa fila (`concurrency`); se vários chegarem durante um build, o último pendente cobre todos.
- **Se um build falhar**, a tag e o rascunho ficam órfãos (não aparecem para os usuários) e o próximo commit gera a versão seguinte. Apague o rascunho e a tag se quiser reaproveitar o número.
- Rodar manualmente: *Actions → Release → Run workflow* (só gera versão se houver commits novos desde a última tag).

Artefatos: `2fac-<versão>-linux-x86_64.AppImage`, `.deb`, `…-win-x64-setup.exe`, `…-portable.exe`, `.dmg`/`.zip` (macOS) e os `latest*.yml` + `.blockmap` usados pelo updater.

O workflow `ci.yml` roda tipos, lint, testes e build em PRs e no `main`.

## Como o auto-update funciona
- `electron-builder.json` define `publish: github` (`juninmd/2fac`); o build grava isso em `app-update.yml` dentro do app.
- O app (`electron-updater`, `src/main/updater.ts`) consulta o último release publicado 15 s após abrir e a cada 6 h, baixa em segundo plano, valida o `sha512` do `latest*.yml` e aplica ao fechar o app ou em **Reiniciar e atualizar** (banner no topo e Configurações → Sobre).
- Rascunhos e pré-releases são ignorados (`allowPrerelease=false`).
- Em desenvolvimento (app não empacotado) a verificação é desativada.

## Requisitos e limitações
- **Repositório público** (o updater consulta o GitHub sem token).
- **Linux:** só o **AppImage** se atualiza sozinho (`.deb` não).
- **Windows:** o instalador NSIS se atualiza; o `portable` não.
- **macOS:** o auto-update exige app **assinado e notarizado**. Configure os segredos do repositório `CSC_LINK`, `CSC_KEY_PASSWORD`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`. Sem eles os builds saem sem assinatura e a atualização no macOS falha.
- **Sem assinatura de código** (Windows/macOS) a integridade depende apenas do TLS do GitHub + `sha512` publicado no mesmo release.
- Como cada commit vira release, usuários com o app aberto recebem atualizações com frequência; use `[skip release]` em commits sem impacto para o usuário (docs, CI).

## Testar localmente
```bash
node scripts/next-version.mjs                                  # mostra a próxima versão
pnpm install && pnpm run build
pnpm exec electron-builder --linux AppImage --publish never   # gera release/ e latest-linux.yml
```
