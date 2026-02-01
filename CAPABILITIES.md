# Capacidades e Documentação do Projeto 2FAC

Este documento serve como referência central para agentes de IA e desenvolvedores sobre as funcionalidades, estrutura e instruções operacionais do projeto 2FAC.

## 1. Visão Geral do Projeto
O **2FAC** é um gerenciador de autenticação de dois fatores (2FA) para desktop, desenvolvido para replicar a funcionalidade de aplicativos como o Authy, mas com foco em privacidade e armazenamento local.

- **Stack Principal:** Electron, React, TypeScript.
- **Armazenamento:** Local (via `electron-store`), criptografado.
- **Segurança:** Isolamento de contexto, sem dependências de nuvem.

## 2. Instruções para Agentes e Desenvolvedores

### Normas de Código
- **Estilo:** Seguir padrões TypeScript estritos (no `any` implícito se possível, embora o código atual use alguns).
- **Componentes:** Componentes React funcionais com Hooks.
- **Estado:** Gerenciamento de estado local com `useState` e efeitos colaterais com `useEffect`.
- **Comunicação:** Uso estrito de `ipcMain` e `ipcRenderer` (exposto via `window.electron` no preload) para comunicação entre processos. Nunca importar módulos Node.js diretamente nos componentes React.

### Scripts de Desenvolvimento (via `package.json`)
- `npm run dev`: Inicia processos de desenvolvimento (Main + Renderer) concorrentemente.
- `npm run electron:dev`: Inicia build do Main e servidor dev do Renderer, depois abre o Electron.
- `npm run build`: Compila ambos os processos para produção.
- `npm run electron:build`: Gera o instalador/executável final (ex: `.exe`).

### Estrutura de Arquivos Relevante
- `src/main/main.ts`: Lógica de backend, persistência, menus de bandeja e IPC handlers.
- `src/renderer/components/App.tsx`: Orquestrador da interface, gerenciamento de estado global da UI.
- `src/renderer/components/Settings.tsx`: Gerenciamento de preferências do usuário.
- `src/renderer/types.ts`: Definições de tipos compartilhados.

## 3. Funcionalidades Implementadas

### Gerenciamento de Contas (Core)
- **Adicionar Conta:** Suporte manual via formulário (Nome, Emissor, Chave Secreta, Algoritmo, Dígitos, Período).
- **Visualização:** Modos de Lista e Grade (Grid).
- **Busca:** Filtragem em tempo real por nome ou emissor.
- **Edição/Remoção:** Atualização de dados ou exclusão de contas existentes.
- **Reordenação:** Capacidade de mover itens para cima/baixo na lista.

### Geração de Tokens
- **TOTP:** Suporte completo ao padrão RFC 6238.
- **Feedback Visual:** Barra de progresso circular/linear indicando tempo restante (30s).
- **Copiar:** Clique no token copia para a área de transferência.

### Importação e Exportação (Backup)
- **Exportar JSON:** Gera um arquivo `.json` descriptografado com todas as chaves (Cuidado: dados sensíveis).
- **Importar JSON:** Restaura backups gerados pelo próprio app.
- **Importar Authy:** Script de conversão para ler backups JSON exportados do Authy.

### Segurança e Privacidade
- **Senha Mestre:** Proteção do acesso ao app via hash SHA-256 (armazenado localmente).
- **Bloqueio Automático:** Bloqueia a tela após X minutos de inatividade (mouse/teclado).
- **Blur de Privacidade:** Desfoca a interface quando a janela perde o foco (configurável).
- **Minimizar para Bandeja:** Opção para manter o app rodando em background.

### Configurações do Sistema
- **Inicialização:** Opção "Run on Startup".
- **Comportamento de Fechamento:** Minimizar para tray ao fechar janela.
- **Scan de QR Code:** Capacidade de escanear a tela (desktop) em busca de QR codes para adicionar contas automaticamente (implementado via `desktopCapturer` no main process).

### Atalhos de Teclado
- **Ctrl+F / Cmd+F:** Focar na barra de busca.
- **Ctrl+L / Cmd+L:** Bloquear o aplicativo.
- **Ctrl+N / Cmd+N:** Abrir/Fechar painel de adicionar conta.
- **Ctrl+, / Cmd+,:** Abrir Configurações.
- **Esc:** Fechar modais/limpar busca.

## 4. API Interna (IPC)
As seguintes funções estão disponíveis na ponte `window.electron`:

| Função | Descrição |
|--------|-----------|
| `get2FAItems()` | Retorna lista de contas salvas. |
| `add2FAItem(item)` | Salva nova conta. |
| `remove2FAItem(id)` | Remove conta por ID. |
| `update2FAItem(id, data)` | Atualiza campos de uma conta. |
| `set2FAItems(items)` | Salva a lista inteira (usado para reordenação). |
| `export2FA()` | Abre diálogo de salvamento de backup. |
| `import2FA()` | Abre diálogo de leitura de backup JSON. |
| `importAuthy()` | Abre diálogo de leitura de backup Authy. |
| `getSettings()` | Lê configurações globais. |
| `setSettings(settings)` | Salva configurações globais. |
| `setMasterPassword(pwd)` | Define/Altera senha mestre. |
| `checkMasterPassword(pwd)` | Valida senha mestre. |
| `hasMasterPassword()` | Verifica se existe senha configurada. |
| `scanScreenQR()` | Captura tela para decodificar QR Code. |

---
*Documento gerado automaticamente por análise de código em 13/01/2025.*
