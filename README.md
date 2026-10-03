# 🔐 2FAC - Gerenciador Universal de Autenticação 2FA

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Electron](https://img.shields.io/badge/platform-Electron-lightgrey.svg)
![React](https://img.shields.io/badge/UI-React-blue.svg)

O **2FAC** é um gerenciador de autenticação de dois fatores (2FA) desktop de alto desempenho, focado em privacidade e facilidade de uso. Desenvolvido com **Electron** e **React**, ele oferece uma alternativa robusta e local para gerenciar seus segredos TOTP com segurança total.

---

## ✨ Recursos de Elite

*   📱 **Gestão Unificada:** Gerencie múltiplas contas de serviços diversos em uma única interface elegante.
*   🔐 **TOTP Nativo:** Geração instantânea de códigos (Time-based One-Time Password) conforme RFC 6238.
*   📤 **Portabilidade Total:** Exportação e importação via JSON para backups fáceis e seguros.
*   🔑 **Migração do Authy:** Importe facilmente suas contas existentes do Authy.
*   🎯 **Experiência Fluida:** Interface responsiva com suporte a Drag-and-Drop para reordenação personalizada.
*   ⚡ **Leve & Rápido:** Construído para ser eficiente em recursos do sistema.

---

## 🛠️ Tecnologias Utilizadas

| Camada | Tecnologia |
| :--- | :--- |
| **Engine** | [Electron](https://www.electronjs.org/) |
| **Interface** | [React](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/) |
| **Core 2FA** | [OTPAuth](https://github.com/hectorm/otpauth) / [Speakeasy](https://github.com/speakeasyjs/speakeasy) |
| **Storage** | [Electron Store](https://github.com/sindresorhus/electron-store) |
| **Bundler** | [Webpack](https://webpack.js.org/) |

---

## 🚀 Como Iniciar

### Pré-requisitos

*   Node.js (v22+)
*   pnpm (recomendado) ou npm

### Instalação & Desenvolvimento

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/2fac.git

# Instale as dependências
pnpm install

# Inicie o modo de desenvolvimento
pnpm run electron:dev
```

### Build para Produção

```bash
# Gere o instalador para sua plataforma
pnpm run electron:build
```

### Releases e atualização automática

Tags `vX.Y.Z` disparam o build dos instaladores e o Release no GitLab; o app se atualiza sozinho. Detalhes em [`docs/RELEASE.md`](docs/RELEASE.md).

---

## 🔒 Segurança em Primeiro Lugar

O **2FAC** adota uma política de **Zero Trust** e **Privacidade Local**:
*   **Isolamento Total:** Context Isolation e Sandbox habilitados por padrão.
*   **Dados Locais:** Nenhuma informação sai do seu computador. Não há sincronização com nuvens proprietárias sem seu consentimento explícito (em planos futuros).
*   **Sem Telemetria:** O app não rastreia seu uso nem coleta métricas.

---

## 📂 Estrutura do Projeto

```text
src/
├── main/              # Processo principal (Lógica de Sistema/OS)
├── preload/          # Ponte segura entre Main e Renderer
├── renderer/         # Interface do Usuário (React)
│   ├── components/   # Blocos de construção da UI
│   ├── hooks/        # Lógica de estado e efeitos
│   └── styles/       # Estilização e Temas
└── public/           # Ativos estáticos e HTML base
```

---

## 🤝 Contribuição

Contribuições são o que tornam a comunidade open source um lugar incrível para aprender, inspirar e criar.

1. Faça um **Fork** do projeto
2. Crie sua **Feature Branch** (`git checkout -b feature/AmazingFeature`)
3. Faça **Commit** de suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Faça **Push** para a branch (`git push origin feature/AmazingFeature`)
5. Abra um **Pull Request**

---

## 📄 Licença

Distribuído sob a licença **MIT**. Veja `LICENSE` para mais informações.

---

*"Proteja seu acesso digital com simplicidade e soberania de dados."*
