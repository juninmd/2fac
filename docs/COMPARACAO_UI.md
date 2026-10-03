# 2FAC → substituto desktop do Authy (Tauri): protótipo × UI atual

Protótipo navegável em [`prototype/`](../prototype/index.html) (HTML/CSS/JS puros, sem build; abra o `index.html`, ou `?open` para pular o bloqueio). Capturas em [`docs/ui-comparison/`](ui-comparison/) — visão geral: [`comparacao.png`](ui-comparison/comparacao.png).

O Authy Desktop foi descontinuado em 2024; por isso o foco é **desktop-first**: teclado, bandeja, atalho global, biometria do SO.

## Comparação de UI

| Aspecto | Atual (Electron) | Protótipo |
|---|---|---|
| Janela | Barra nativa + header próprio com emojis (🔐 ⚙ 🔒) | Titlebar customizada (Tauri `decorations:false`), ícones SVG |
| Layout | Grade de cards **ou** lista; alterna por botão | Sempre mestre‑detalhe: lista à esquerda, código grande à direita |
| Código | Sempre mascarado (●●●); precisa clicar para revelar | Código legível na seleção; lista mascarada e revelada no hover (configurável) |
| Tempo restante | Círculo com "28s" | Anel + cor âmbar (≤10s) / vermelha (≤5s) + **próximo código** nos últimos 8s |
| Busca / filtro | Só busca por texto | Busca + chips (Todos, Favoritos, categorias) |
| Adicionar | Painel lateral longo (rola para fora da tela), tudo num formulário | Modal com abas: Escanear tela · Colar URI · Chave manual · Importar |
| Importar | Botões soltos em Settings → Dados | Aba dedicada: Authy, Google Authenticator, Aegis/2FAS, backup `.2fac` |
| Atalhos | Ctrl+F/L/N/, | + **Ctrl+K paleta de comandos** (buscar e copiar sem mouse), ↑↓, Enter copia |
| Bandeja | Só minimizar | **Mini janela da bandeja** (`?view=tray`) com códigos de 1 clique + atalho global |
| Bloqueio | Senha | Senha + Windows Hello/Touch ID, auto‑bloqueio visível (contagem), bloquear ao suspender |
| Settings | 5 abas simples, checkboxes nativos | Navegação lateral, toggles, tema claro/escuro/sistema, cor de destaque, atalhos |
| Ícones de serviço | SVGs de marca (`IssuerIcon`) | Monograma colorido ⚠️ (regressão — reaproveitar `IssuerIcon` na versão real) |
| Tema claro | Existe, parcial (variáveis soltas) | Tokens completos (`css/tokens.css`) |

## Paridade com o Authy

| Feature do Authy | Atual | Protótipo | Observação |
|---|---|---|---|
| TOTP (30s, 6/7/8 dígitos) | ✅ | ✅ (RFC 6238 validado) | |
| Adicionar por QR / chave / URI | ✅ | ✅ UI | QR de tela via Rust (`xcap` + `rqrr`) |
| Proteção com senha | ⚠️ SHA‑256 | UI pronta | Trocar por Argon2id + AES‑256‑GCM |
| Biometria | ❌ | UI pronta | Plugin Tauri biometric / Windows Hello |
| Backup criptografado | ✅ | UI pronta | |
| Importar Authy / Google Auth | ✅ | UI pronta | |
| Ordenar / favoritar / categorias | ⚠️ ordenar | ✅ favoritar+categorias | |
| **Sync multi‑dispositivo** | ❌ | marcado "Roadmap" | Principal lacuna; sugestão: E2E via pasta (Drive/Dropbox), sem servidor |
| App mobile | ❌ | ❌ | Fora do escopo (desktop first) |

## O que o protótipo **não** é
- Não roda em Tauri ainda: é só o frontend que o Tauri hospedaria. Dados em memória; botões de import/export/biometria só mostram toast.
- O TOTP no protótipo roda em JS só para demo. No app real, **segredos nunca devem chegar ao webview**: geração de código e criptografia em Rust, exposta via `#[tauri::command]` com capabilities mínimas (equivalente ao `contextBridge`).
- JS puro (sem TypeScript) por ser descartável; a versão real deve seguir o `AGENTS.md` (TS estrito, arquivos <200 linhas).

## Migração Electron → Tauri (proposta)
| Electron hoje | Tauri |
|---|---|
| `main.ts` + `electron-store` | Rust: `tauri-plugin-store` ou SQLite cifrado (SQLCipher) |
| `crypto.ts`, `importers.ts` | Rust (`argon2`, `aes-gcm`, `totp-rs`, parsers) |
| `preload.ts` / IPC | `invoke()` + capabilities |
| `desktopCapturer` QR | `xcap` + `rqrr` |
| Tray, autostart, protocolo `otpauth://` | `tray-icon`, `tauri-plugin-autostart`, `deep-link` |
| `electron-builder` | `tauri build` (MSI/NSIS, dmg, AppImage/deb), updater assinado |

Próximos passos sugeridos: (1) scaffold `src-tauri` com o frontend atual em React portando este design; (2) mover cofre/TOTP para Rust com testes (RFC 6238); (3) Argon2id + AES‑GCM com migração do cofre atual; (4) tray + atalho global; (5) sync E2E.
