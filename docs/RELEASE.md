# Releases e atualização automática (GitLab)

## Como publicar uma versão
1. Atualize o `package.json` se quiser manter o repositório coerente (o CI sobrescreve a versão pela da tag).
2. Crie e envie uma tag semântica:
   ```bash
   git tag v1.2.0 && git push origin v1.2.0
   ```
3. O pipeline (`.gitlab-ci.yml`) roda `test` → `build:linux-windows` (+ `build:macos` se `BUILD_MACOS=true`) → `release`.
4. O job `release` (`scripts/gitlab-release.mjs`) envia cada arquivo ao **Generic Package Registry** e cria o **Release** da tag com um link `direct_asset_path` (`/<arquivo>`) para cada artefato, incluindo `latest*.yml`.

Artefatos: `2fac-<versão>-linux-x86_64.AppImage`, `.deb`, `…-win-x64-setup.exe`, `…-portable.exe`, `.dmg`/`.zip` (macOS) e os `latest*.yml` + `.blockmap` usados pelo updater.

## Como o auto-update funciona
- Os builds do CI embutem (`app-update.yml`) o feed `https://<gitlab>/<projeto>/-/releases/permalink/latest/downloads` (`UPDATE_FEED_URL`), que o GitLab redireciona para os arquivos do **release mais recente**.
- O app (`electron-updater`, `src/main/updater.ts`) verifica 15 s após abrir e a cada 6 h, baixa em segundo plano, valida o `sha512` do `latest*.yml` e aplica ao fechar o app, ou imediatamente em **Reiniciar e atualizar** (banner no topo e Configurações → Sobre).
- Em desenvolvimento (app não empacotado) a verificação é desativada.

## Requisitos e limitações
- **Projeto público.** O feed é consultado sem autenticação; num projeto privado o updater não consegue baixar.
- **Linux:** só o **AppImage** se atualiza sozinho (`.deb` não).
- **Windows:** o instalador NSIS se atualiza; o `portable` não.
- **macOS:** o auto-update exige app **assinado e notarizado** (`CSC_LINK`, `CSC_KEY_PASSWORD`, `APPLE_ID`…). Sem isso, o job gera os arquivos mas a atualização falhará.
- **Sem assinatura de código** (Windows/macOS) a integridade depende apenas do TLS do GitLab + `sha512` publicado no mesmo local. Recomenda-se configurar assinatura (e `publisherName` no Windows).
- Pré-releases (`v1.2.0-beta.1`) são publicados, mas o app ignora pré-releases (`allowPrerelease=false`) e o `latest` do GitLab pode apontá-los; evite-os na linha estável.

## Testar localmente
```bash
pnpm install && pnpm run build
pnpm exec electron-builder --linux AppImage --publish never \
  -c.publish.provider=generic -c.publish.url=http://127.0.0.1:8899
# sirva release/latest-linux.yml + AppImage de uma versão maior em :8899 e abra o AppImage antigo
node scripts/gitlab-release.mjs --dry-run   # exige CI_COMMIT_TAG, CI_API_V4_URL, CI_PROJECT_ID
```
