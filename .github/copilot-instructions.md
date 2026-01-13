# 2FAC Development Guide

## Project Overview

**2FAC** é um gerenciador de autenticação de dois fatores (2FA) desenvolvido com Electron e React. Funciona de forma similar à extensão Authy, permitindo gerenciar todas as suas contas 2FA em um único local, com suporte a backup e restauração.

## ✅ Project Status - FULLY IMPLEMENTED

- [x] Scaffold Electron project structure - TypeScript, React, Webpack configurados
- [x] Create UI components para 2FA management com geração de código TOTP
- [x] Implement funcionalidade export/import JSON com file dialogs
- [x] Add Authy OAuth import com parsing de arquivo
- [x] Add geração de 2FA code com TOTP e refresh automático
- [x] Create electron-store storage system para dados persistentes
- [x] Install todas as dependências com sucesso
- [x] Build projeto sem erros de compilação

## Development Workflow

### Iniciar Servidor de Desenvolvimento
```bash
npm run dev
# ou para iniciar Electron com hot-reload
npm run electron:dev
```

### Build para Produção
```bash
npm run build
npm run electron:build
```

## Key Features Implementadas

### 1. 2FA Item Management
- ✅ Adicionar novas contas 2FA com nome, issuer e chave secreta
- ✅ Exibir códigos TOTP que auto-refresh a cada 30 segundos
- ✅ Remover contas com diálogo de confirmação
- ✅ Agrupar contas por issuer (Google, GitHub, etc.)
- ✅ Clicar no código para copiar para clipboard

### 2. Code Generation
- ✅ Biblioteca `speakeasy` para geração TOTP
- ✅ Suporte para algoritmos SHA1, SHA256, SHA512
- ✅ Dígitos configuráveis (6, 7, 8)
- ✅ Período configurável (30s, 60s)
- ✅ Refresh automático com visual countdown

### 3. Import/Export
- ✅ **Export**: Salvar todas as contas em arquivo JSON
- ✅ **Import JSON**: Carregar backups previamente exportados
- ✅ **Import Authy**: Parse e conversão de arquivos Authy
- ✅ Dados armazenados localmente com electron-store

### 4. Security Features
- ✅ Context isolation habilitado
- ✅ Node integration desabilitado
- ✅ Sandbox mode ativo
- ✅ Sem chamadas de API externa - dados permanecem no dispositivo
- ✅ Comunicação segura via IPC

## File Structure
```
2fac/
├── src/
│   ├── main/
│   │   └── main.ts              # Processo principal do Electron + IPC handlers
│   ├── renderer/
│   │   ├── components/
│   │   │   ├── App.tsx          # Componente principal
│   │   │   ├── App.css          # Estilos CSS (responsive)
│   │   │   ├── Item.tsx         # Card individual do 2FA
│   │   │   ├── ItemList.tsx     # Lista agrupada por issuer
│   │   │   └── AddItemForm.tsx  # Formulário de adição
│   │   ├── types.ts             # Definições TypeScript
│   │   └── index.tsx            # Entry point React
│   └── preload/
│       └── preload.ts           # Exposição segura de APIs Electron
├── public/
│   └── index.html               # Template HTML
├── dist/                         # Build output (gerado)
├── node_modules/                 # Dependencies
├── package.json                  # Scripts e dependências
├── tsconfig.json                 # TypeScript config
├── webpack.config.js             # Webpack config com polyfills
├── electron-builder.json         # Config do instalador
├── .eslintrc.js                  # ESLint config
├── README.md                      # Documentação do usuário
└── .github/copilot-instructions.md # Este arquivo
```

## Common Commands

| Command | Purpose |
|---------|---------|
| `npm install` | Instalar todas as dependências |
| `npm run dev` | Iniciar dev server (React + TypeScript watch) |
| `npm run electron:dev` | Iniciar Electron com hot-reload |
| `npm run build:main` | Compilar TypeScript do main process |
| `npm run build:renderer` | Compilar React com Webpack |
| `npm run build` | Build completo (main + renderer) |
| `npm run electron:build` | Build com Electron Builder (cria instalador) |
| `npm start` | Executar aplicação built |

## Technology Stack

- **Electron 27.x** - Framework para aplicações desktop
- **React 18.x** - UI library
- **TypeScript 5.x** - Tipagem estática
- **Webpack 5.x** - Module bundler com polyfills para browser
- **Speakeasy 2.x** - Geração TOTP/HOTP
- **Electron Store 8.x** - Armazenamento persistente local

## Troubleshooting

### Erro: "Cannot find module 'electron'"
```bash
npm install
```

### Aplicação não inicia
```bash
# Limpar build anterior
rm -rf dist/

# Recompilar
npm run build

# Iniciar novamente
npm start
```

### Porta 3000 já em uso
Modificar porta em `webpack.config.js` (devServer.port)

### Erros de módulos após npm install
```bash
rm -rf node_modules/ package-lock.json
npm install
```

## Next Steps & Future Enhancements

### Implementado ✅
- Sistema completo de 2FA
- TOTP generation automático
- Import/Export JSON
- Import Authy
- UI responsiva

### Opcional/Futuro 📋
1. Adicionar display de QR code para setup mais fácil
2. Password protection para backups
3. Funcionalidade de search/filter
4. Ícones para serviços populares (Google, GitHub, etc.)
5. Suporte a HOTP além de TOTP
6. Dark mode
7. Sincronização com nuvem (opcional)
8. Backup automático

## Build Output

Após `npm run electron:build`, será criado:
- Instalador NSIS para Windows (.exe)
- Arquivo portable standalone
- Todos os arquivos em `dist/`

## Notes

- Projeto está **100% funcional** e pronto para uso
- Todos os dados são armazenados **localmente** no computador do usuário
- **Sem rastreamento** ou envio de dados para servidores
- Compatível com Windows, macOS, Linux (via Electron)
