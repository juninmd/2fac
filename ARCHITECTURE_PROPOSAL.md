# Proposta Técnica: Arquitetura de Gerenciador 2FA Local-First de Alta Segurança

Como Arquiteto de Software Sênior e Especialista em Segurança da Informação, apresento a arquitetura e o plano de desenvolvimento para o aplicativo gerenciador de Autenticação de Dois Fatores (2FA / TOTP) focado em ser local-first, seguro e multiplataforma.

O objetivo desta proposta é garantir uma base sólida, auditável e extremamente segura para gerenciar segredos TOTP, protegendo o usuário contra vetores de ataque modernos sem sacrificar a conveniência de ter seus códigos acessíveis em múltiplas plataformas.

---

## A. Stack Tecnológico

Para atingir um equilíbrio ideal entre segurança, velocidade de desenvolvimento, controle sobre criptografia e multiplataforma, proponho a seguinte stack:

### Aplicativo Desktop (Windows e Ubuntu)
*   **Engine & Interface:** **Rust + Tauri** (Recomendado para Segurança Extrema) ou **Electron + React + TypeScript** (Foco em Velocidade de Desenvolvimento).
    *   **Por que Rust/Tauri?** Tauri é mais leve e seguro por não empacotar o Chromium, possuindo uma superfície de ataque menor. O backend em Rust proporciona extrema segurança de memória e velocidade.
    *   **Por que Electron?** Se o time dominar Node.js, Electron (com *Context Isolation* estrito e *Node Integration* desabilitado) é viável, permitindo iteração mais rápida.
    *   **Banco de Dados Local:** `SQLite + sqlcipher` para criptografia transparente e robusta em disco.

### Extensão Web (Firefox / Chrome)
*   **Tecnologia:** HTML/CSS/JS puros ou framework web minimalista (como Svelte) empacotado como WebExtension (Manifest V3).
*   **Criptografia na Extensão:** Utilizar WebAssembly (`libsodium.js` ou Web Crypto API) para decodificar o arquivo recuperado do Google Drive em memória caso seja executado de forma 100% autônoma.
*   **Comunicação Segura:** Se o app Desktop estiver rodando, a extensão deve usar **Native Messaging API** para se comunicar com o app, solicitando os códigos sem precisar lidar com a senha mestra.

### Sincronização Cloud
*   **API:** Google Drive REST API.
*   **Integração:** Implementada no backend (Rust/Node) com fluxo OAuth2.

---

## B. Arquitetura de Segurança: O Fluxo Zero-Knowledge

A fundação do aplicativo é o modelo Zero-Knowledge. Nem o Google, nem potenciais atacantes com acesso físico ao disco em repouso devem ser capazes de extrair as chaves.

### 1. Derivação da Chave (Key Derivation)
A "Senha Mestra" digitada pelo usuário nunca é usada diretamente como chave de criptografia.
*   **Algoritmo:** **Argon2id** (fortemente recomendado devido à sua resistência a ataques por GPU e ASIC).
*   **Processo:** `Senha Mestra + Salt Aleatório -> Chave de Encriptação do Cofre (KDF_Key)`.
*   **Armazenamento de Senha:** O aplicativo *nunca* armazena a Senha Mestra em disco. Armazena apenas o Salt e um "Verification Hash" (um hash do KDF_Key) para validar rapidamente se a senha digitada está correta.

### 2. Criptografia em Repouso
O cofre (banco de dados ou arquivo) contendo os segredos 2FA é encriptado antes de ser gravado em disco.
*   **Algoritmo:** **AES-256-GCM** (Galois/Counter Mode). É mandatório usar um modo autenticado (AEAD) como o GCM para prevenir ataques de maleabilidade.
*   **Vetor de Inicialização (IV):** Um nonce/IV aleatório criptograficamente forte para *cada* gravação de arquivo. Nunca reutilizar o IV.

### 3. Proteção em Memória
As chaves privadas não devem ficar em memória mais do que o necessário.
*   **Limitação de Escopo:** Variáveis que armazenam a chave não criptografada só existem durante o processamento do código TOTP, idealmente zeroizadas ou destruídas do escopo o mais rápido possível para aproveitar o garbage collector ou ser descartado ativamente (se em Rust).
*   **Interface Limpa:** A interface de usuário acessa o TOTP final (os 6 dígitos) sem guardar em memória o token root que o gerou na visualização diária.

### 4. O Fluxo de Backup (Google Drive)
*   **Zero-Knowledge:** O aplicativo local criptografa o arquivo completo (`vault.enc`) usando AES-256-GCM.
*   O aplicativo faz o upload do binário `vault.enc` diretamente para o Google Drive.
*   O Google apenas vê bytes ininteligíveis. Sem a Senha Mestra, o arquivo é inútil para terceiros.

---

## C. Sincronização (Sync) e Resolução de Conflitos

Quando lidamos com sistemas descentralizados e offline-first, a resolução de conflitos é crítica. O cenário: "Usuário adiciona 2FA no Windows offline, e outro no Ubuntu offline. Ambos ficam online."

Existem duas abordagens. Proponho a **Opção 2 (CRDT / Event Sourcing Log)** por ser à prova de balas, embora a Opção 1 seja viável para o MVP.

### Opção 1: Merge Baseado em Timestamp (Last-Write-Wins Modificado) - Adequado para MVP
*   O cofre salva os itens como um array de objetos, onde cada item tem um `id` único (UUIDv4) e um `updatedAt` (timestamp).
*   **Ao Sincronizar:** Baixamos o `vault.enc` da nuvem, descriptografamos em memória. Lemos o `vault.local`.
*   Para cada item, mesclamos:
    *   Se um UUID existe apenas local, ele é adicionado à lista mesclada.
    *   Se um UUID existe apenas na nuvem, ele é mantido.
    *   Se um UUID existe em ambos, o item com o `updatedAt` mais recente sobrepõe o outro.
*   **O Problema de Deleção (Tombstones):** Para que exclusões não voltem dos mortos, precisamos armazenar "Tombstones" (IDs deletados) com timestamps.

### Opção 2: CRDT / Append-Only Log (Recomendado para Polimento/Produção)
*   O cofre não é apenas o estado atual, mas um log de operações (Event Sourcing). Ex: `{ action: "ADD", item: {...}, timestamp: 161... }`, `{ action: "DELETE", id: "...", timestamp: 161... }`.
*   **Sincronização:** Quando ambos ficam online, nós juntamos os logs da Nuvem e do Local, ordenamos por timestamp, e "reproduzimos" as ações do início ao fim para gerar o estado final perfeitamente mesclado.
*   Isso garante que nenhuma alteração (adição ou deleção) seja perdida em cenários de rede instável ou modificações concorrentes pesadas.

---

## D. Plano de Desenvolvimento (Roadmap)

O desenvolvimento será dividido em 4 fases incrementais.

### Fase 1: MVP (Minimum Viable Product) Local-First
**Foco:** Funcionalidade principal de geração de códigos e criptografia forte em disco.
*   Setup do projeto base e UI principal (Lista e Grade).
*   Implementação do motor de criptografia (Argon2id + AES-256-GCM).
*   Formulário para adicionar contas e lógica de geração de tokens (TOTP RFC 6238).
*   Auditoria básica de segurança: garantir que dados em repouso são protegidos e IVs não são reutilizados.

### Fase 2: Integração Cloud (Google Drive Sync)
**Foco:** Backup Zero-Knowledge.
*   Registro de App no Google Cloud e fluxo OAuth2 no app desktop.
*   Implementação do upload/download do `vault.enc` na API do Google Drive.
*   Lógica de resolução de conflitos (Timestamps e Tombstones) e mesclagem de cofres offline/online.

### Fase 3: Extensão de Navegador (Firefox)
**Foco:** Auto-fill seguro e acessibilidade.
*   Estruturação da WebExtension Manifest V3 para Firefox.
*   Implementação de Native Messaging API para obter tokens do app Desktop com segurança.
*   (Alternativa) Integração com Google Drive e Web Crypto/WASM na extensão para decriptação independente (solicitando a senha mestra ao usuário na extensão).

### Fase 4: Polimento e Funcionalidades Avançadas
**Foco:** UX de primeira linha e integrações.
*   Facilidades de migração (importar QR codes ou exportações de outros apps como Authy/Google Authenticator).
*   Refinamentos de UI/UX (atalhos de teclado globais, temas claro/escuro).
*   Proteções extras: Blur em inatividade/perda de foco da janela, auto-lock com timeout de sessão.
*   Auditoria de Segurança (PenTest).
---

## E. Limitações e Considerações

Embora a arquitetura proposta priorize a segurança extrema, existem algumas limitações inerentes ao modelo adotado:

1.  **Recuperação de Conta:** Em uma arquitetura puramente Zero-Knowledge, a perda da Senha Mestra resulta na perda irrevogável de todos os dados do cofre. Não há mecanismo de "esqueci minha senha" que não comprometa a segurança. É crucial educar o usuário sobre a necessidade de guardar a senha mestra ou backups físicos (papel) dos códigos de recuperação.
2.  **Complexidade do Sincronismo CRDT:** A implementação de um log de eventos (Event Sourcing / CRDT) aumenta a complexidade de desenvolvimento e o tamanho do cofre ao longo do tempo (embora compactações periódicas - *snapshots* - possam mitigar o crescimento do arquivo).
3.  **Dependência de APIs Externas:** O sincronismo depende da estabilidade e disponibilidade da API do Google Drive e das regras de autenticação OAuth2 do Google Cloud, que podem mudar.
4.  **Extensão Autônoma e WebAssembly:** Executar criptografia forte (como Argon2id) diretamente no navegador via WebAssembly pode ter limitações de performance dependendo do hardware do usuário em comparação com o aplicativo nativo (Rust/Tauri).
5.  **Acesso à Memória (Dump):** Embora as chaves sejam mantidas em memória pelo menor tempo possível, durante o momento da geração do TOTP elas existem em texto plano. Malwares sofisticados com acesso em nível de sistema operacional (ex: rootkits ou dumps de memória) teoricamente poderiam extraí-las no exato milissegundo de uso. As proteções do Electron/Tauri não podem prevenir completamente ataques se o dispositivo físico já estiver totalmente comprometido em nível *kernel*.
