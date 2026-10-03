# Releases e atualização automática (GitHub)

## Como publicar uma versão
```bash
git tag v1.2.0 && git push origin v1.2.0
```
O workflow `.github/workflows/release.yml` roda em Ubuntu, Windows e macOS: instala, checa tipos, roda os testes, builda e executa `electron-builder --publish always`, que anexa os instaladores a um **GitHub Release em rascunho**. Quando todos os builds terminam, o job `publish` publica o rascunho. A versão do app vem da tag (`v1.2.0` → `1.2.0`).

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
- **Sem assinatura de código** (Windows/macOS) a integridade depende apenas do TLS do GitHub + `sha512` publicado no mesmo release. Recomenda-se configurar assinatura (e `publisherName` no Windows).

## Testar o empacotamento localmente
```bash
pnpm install && pnpm run build
pnpm exec electron-builder --linux AppImage --publish never   # gera release/ e latest-linux.yml
```
