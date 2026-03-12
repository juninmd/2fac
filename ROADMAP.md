# 🗺️ Roadmap - 2FAC

Este roadmap descreve as fases planejadas para a evolução do **2FAC**.

## 🚀 Fase 1: Core & Estabilidade (Concluído ✅)
- [x] Arquitetura base Electron + React + TypeScript.
- [x] Geração de códigos TOTP seguindo o padrão RFC 6238.
- [x] Persistência local segura via `electron-store`.
- [x] Exportação e Importação de arquivos JSON.
- [x] Suporte básico para importação de backups do Authy.
- [x] Interface moderna com Drag-and-Drop para reordenação.

## 🔒 Fase 2: Segurança Avançada (Em Progresso 🏃)
- [ ] **Criptografia em Repouso:** Proteger o arquivo de armazenamento com uma Master Password (AES-256).
- [ ] **Lock Screen:** Bloqueio automático do app após inatividade.
- [ ] **Mascaramento de Segredos:** Opção para ocultar chaves secretas na interface.
- [ ] **Auditoria de Segurança:** Revisão de IPC e permissões do renderer.

## 🎨 Fase 3: Experiência do Usuário & UI (Próximos Passos 🕒)
- [ ] **Suporte a Temas:** Tema escuro (nativo), claro e sistema.
- [ ] **Leitor de QR Code Integrado:** Usar a câmera do computador para escanear códigos diretamente.
- [ ] **Categorização:** Agrupar tokens por categorias (Trabalho, Pessoal, Social).
- [ ] **Ícones Automáticos:** Buscar ícones oficiais de serviços com base no nome do emissor.

## 🌐 Fase 4: Ecossistema & Integrações (Futuro 🔮)
- [ ] **Sincronização Nuvem (Opcional/Criptografada):** Sincronizar via Google Drive ou Dropbox com chave privada.
- [ ] **Suporte a HOTP:** Implementar tokens baseados em contador (RFC 4226).
- [ ] **App Companion Mobile:** Sincronização direta com app móvel via rede local.
- [ ] **Suporte Multi-língua:** Adicionar suporte para Inglês, Espanhol e outros idiomas.

---

*Nota: As prioridades podem mudar conforme o feedback da comunidade e necessidades de segurança.*
