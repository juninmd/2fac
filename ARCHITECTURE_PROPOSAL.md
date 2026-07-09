# Proposta Técnica: Arquitetura de Gerenciador 2FA Local-First de Alta Segurança

Como Arquiteto de Software Sênior e Especialista em Segurança da Informação, apresento a arquitetura e o plano de desenvolvimento para o aplicativo gerenciador de Autenticação de Dois Fatores (2FA / TOTP) focado em ser local-first, seguro e multiplataforma.

O objetivo desta proposta é garantir uma base sólida, auditável e extremamente segura para gerenciar segredos TOTP, protegendo o usuário contra vetores de ataque modernos sem sacrificar a conveniência de ter seus códigos acessíveis em múltiplas plataformas.

---

## A. Stack Tecnológico

Para atingir um equilíbrio ideal entre segurança, velocidade de desenvolvimento, controle sobre criptografia e multiplataforma, proponho a seguinte stack:

### Aplicativo Desktop (Windows e Ubuntu)
*   **Engine & Interface:** **Electron + React + TypeScript**
    *   **Por que não Rust/Tauri ou C++/Qt?** Embora Tauri seja mais leve e seguro (pois não empacota o Chromium), Electron (com *Context Isolation* e *Node Integration* estritamente desabilitado no Renderer) é a tecnologia padrão da indústria (usado pelo 1Password, Bitwarden, etc.), permitindo ciclo de iteração mais rápido, ecossistema gigante de bibliotecas criptográficas robustas via Node.js e compatibilidade impecável com Windows e Ubuntu Linux. Rust é excelente, mas introduz um tempo de desenvolvimento significativamente maior.
    *   **Banco de Dados Local:** `electron-store` (com camada de criptografia transparente construída por cima) ou SQLite + `sqlcipher` (se prevermos um volume muito alto de dados ou estruturação complexa futura).

### Criptografia Core (Node.js)
*   Aproveitaremos o módulo nativo `crypto` do Node.js no Main Process para todas as operações sensíveis, garantindo que estejam fora do alcance de vulnerabilidades XSS no Renderer Process.
*   Bibliotecas utilitárias: `crypto-js` para padding, hashing auxiliar se necessário, mas dependência primária no `node:crypto`.

### Extensão Web (Firefox / Chrome)
*   **Tecnologia:** HTML/CSS/JS puros ou React minimalista.
*   **Comunicação Segura:** **Native Messaging API**. A extensão *não* conterá lógica de decodificação do cofre nem a senha mestra. Em vez disso, ela se comunicará via Native Messaging com o aplicativo Desktop (ou um daemon extraído dele).
*   **Alternativa Autônoma:** Se o usuário desejar usar a extensão de forma 100% autônoma (sem o app desktop instalado), a extensão integrará a lógica criptográfica em WebAssembly (usando algo como `libsodium.js` ou Web Crypto API) para decodificar o arquivo recuperado do Google Drive em memória.

### Sincronização Cloud
*   **API:** Google Drive REST API.
*   **Integração:** Implementada inteiramente no Node.js (Main Process) com fluxo OAuth2 para autorização.

---

## B. Arquitetura de Segurança: O Fluxo Zero-Knowledge

A fundação do aplicativo é o modelo Zero-Knowledge. Nem o Google, nem potenciais atacantes com acesso físico ao disco (em estado de repouso) devem ser capazes de extrair as chaves.

### 1. Derivação da Chave (Key Derivation)
A "Senha Mestra" digitada pelo usuário nunca é usada diretamente como chave de criptografia.
*   **Algoritmo:** **Argon2id** (fortemente recomendado sobre PBKDF2 devido à sua resistência a ataques por GPU e ASIC). Se a biblioteca Argon2 não estiver disponível nativamente, o fallback será **PBKDF2 com HMAC-SHA256** (no mínimo 600.000 iterações, com um salt aleatório longo gerado por dispositivo).
*   **Processo:** `Senha Mestra + Salt Aleatório -> Chave de Encriptação do Cofre (KDF_Key)`.
*   **Armazenamento de Senha:** O aplicativo *nunca* armazena a Senha Mestra em disco. Armazena apenas o Salt e um "Verification Hash" (um hash do KDF_Key) para validar rapidamente se a senha digitada está correta antes de tentar decriptar o banco inteiro.

### 2. Criptografia em Repouso
O cofre (banco de dados ou arquivo JSON) contendo os segredos 2FA (TOTP) é encriptado antes de ser gravado em disco.
*   **Algoritmo:** **AES-256-GCM** (Galois/Counter Mode). É mandatório usar um modo autenticado (AEAD) como o GCM. Isso previne que atacantes alterem o arquivo criptografado (ataques de maleabilidade) sem serem detectados.
*   **Vetor de Inicialização (IV):** Um nonce/IV aleatório de 12 bytes gerado criptograficamente forte para *cada* gravação de arquivo. Nunca reutilizar o IV.

### 3. Proteção em Memória
As chaves 2FA (texto plano) devem residir na memória apenas o tempo estritamente necessário.
*   O cálculo do token TOTP (usando bibliotecas como `otpauth`) será feito no Main Process (Node.js).
*   O Renderer Process (React/Interface) receberá apenas o código de 6 dígitos gerado e, no máximo, a URI `otpauth://` temporariamente durante edição ou exibição de QR Code.
*   Buffers contendo chaves cruas devem ser ativamente sobrescritos (zeroed out) na memória se possível, embora o garbage collector do v8 dificulte essa garantia absoluta. Ao menos, limitamos o escopo das variáveis.

### 4. O Fluxo de Backup (Google Drive)
*   **Zero-Knowledge:** O aplicativo local criptografa o arquivo completo (`vault.enc`) usando a arquitetura AES-256-GCM descrita.
*   O aplicativo realiza o upload do binário `vault.enc` diretamente para o Google Drive através da API OAuth.
*   O Google apenas vê bytes ininteligíveis. Sem a Senha Mestra (que nunca sai da cabeça do usuário ou, temporariamente, da memória RAM do dispositivo local), o arquivo é inútil para o Google, para hackers ou para governos.

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

Dividiremos a construção em 4 fases claras e iterativas.

### Fase 1: MVP (Minimum Viable Product) Local-First Seguríssimo
**Foco:** Funcionalidade principal de geração de códigos e criptografia blindada em disco local. Sem nuvem. Sem extensão.
1.  Setup base do projeto (Electron + React + TypeScript + Webpack/Vite).
2.  Implementar motor de criptografia no Main Process (AES-256-GCM, PBKDF2/Argon2 para a Senha Mestra).
3.  Criação da interface de usuário (UI): Formulário para adicionar conta, visualização em Grade e Lista.
4.  Lógica TOTP (gerar códigos de 6 dígitos baseados na hora local e atualizar barra de progresso a cada 30s).
5.  Implementação do isolamento seguro entre interface (Renderer) e regras de segurança (Main Process) via `contextBridge`.
6.  *Auditoria de segurança interna: garantir que o cofre salva criptografado e não vaza em memória.*

### Fase 2: Integração Cloud (Google Drive Sync)
**Foco:** Garantir que o usuário não perca seus dados se o HD queimar. Zero-Knowledge backup.
1.  Registro no Google Cloud Console e configuração de credenciais OAuth2 para API do Drive.
2.  Implementação do fluxo de autenticação OAuth2 no app Desktop (abrindo navegador e redirecionando para localhost ou URI customizada).
3.  Implementação da lógica de Upload e Download do cofre criptografado (`vault.enc`) usando a API do Drive.
4.  Implementação da **Opção 1 (Merge de Timestamps)** para resolução de conflitos, incluindo lidar com "Tombstones" (deleções).
5.  Automação do Sync: Sincronizar ao abrir o app e ao fazer mudanças (se online).

### Fase 3: Extensão de Navegador Autônoma (Firefox/Chrome)
**Foco:** Conveniência (Auto-fill) sem comprometer o modelo Zero-Knowledge.
1.  Estruturação da Extensão (Manifest V3).
2.  Implementação da comunicação com Google Drive API diretamente da extensão, recuperando o `vault.enc`.
3.  Implementar biblioteca criptográfica WebAssembly (ou Web Crypto API) na extensão para derivar chave da Senha Mestra e decodificar o arquivo do Google Drive *completamente dentro do ambiente isolado do navegador*.
4.  Implementar UI na extensão (popup) para visualizar códigos TOTP e botão de auto-fill na página atual.
5.  *(Opcional)* Comunicação nativa via *Native Messaging API* com o App Desktop se ele estiver aberto, evitando decriptação dupla.

### Fase 4: Polimento, UX e Funcionalidades Avançadas
**Foco:** Tornar o produto "World-Class" e rivalizar com gigantes.
1.  Migração de estratégia de resolução de conflitos para **Opção 2 (Log de Operações/CRDT)**.
2.  Melhoria visual (Prism/Design): Suporte a Temas (Claro/Escuro/Acessibilidade).
3.  Implementação de bloqueio de aplicativo (Lock Screen) por inatividade com timeout customizável.
4.  Blur de interface por perda de foco (evitar ombros curiosos).
5.  Facilidades de importação massiva: ler formato de exportação do Authy, Google Authenticator ou JSON genérico.
6.  Testes de penetração independentes ou auditoria (Bug Bounty) para confirmar robustez.
