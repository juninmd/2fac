# 2FAC - Two-Factor Authentication Manager

Um gerenciador de autenticação de dois fatores (2FA) desktop desenvolvido com Electron e React.

## Funcionalidades

✨ **Recursos principais:**
- 📱 Gerenciar múltiplas contas 2FA em um só lugar
- 🔐 Gerar códigos TOTP (Time-based One-Time Password) automaticamente
- 📤 Exportar backup em formato JSON
- 📥 Importar backup de arquivos JSON
- 🔑 Importar contas do Authy
- 🎯 Interface intuitiva e responsiva
- ⚡ Aplicação rápida e leve

## Começando

### Pré-requisitos

- Node.js (v16 ou superior)
- npm ou yarn

### Instalação

```bash
# Instalar dependências
npm install
```

### Desenvolvimento

```bash
# Iniciar em modo desenvolvimento
npm run dev

# Ou iniciar Electron depois
npm run electron:dev
```

### Build

```bash
# Compilar e construir aplicação
npm run build

# Construir com Electron Builder (gera instalador)
npm run electron:build
```

## Como usar

### Adicionar uma nova conta 2FA

1. Preencha o formulário na barra lateral
2. Informe: Nome da Conta, Emissor (serviço), Chave Secreta
3. Configure opções avançadas se necessário (algoritmo, período, etc.)
4. Clique em "Adicionar Conta"

### Copiar o código 2FA

1. Clique no token (código de 6 dígitos) para copiar para a área de transferência
2. O código é válido durante 30 segundos (indicado pela barra de tempo)

### Exportar Backup

1. Clique em "📥 Exportar Backup"
2. Selecione local para salvar o arquivo JSON
3. Um arquivo com todas as suas contas será criado

### Importar de arquivo JSON

1. Clique em "📤 Importar JSON"
2. Selecione um arquivo JSON anteriormente exportado
3. As contas serão adicionadas ao seu gerenciador

### Importar do Authy

1. Clique em "📱 Importar Authy"
2. Selecione o arquivo de backup exportado do Authy
3. As contas serão convertidas e importadas automaticamente

## Estrutura do Projeto

```
src/
├── main/              # Processo principal do Electron
│   └── main.ts       # Configuração do app e handlers IPC
├── preload/          # Scripts de preload (segurança)
│   └── preload.ts    # Exposição segura de APIs
├── renderer/         # Processo renderer (React)
│   ├── components/   # Componentes React
│   ├── types.ts      # Definições de tipos TypeScript
│   └── index.tsx     # Entry point do React
└── public/           # Arquivos estáticos
    └── index.html    # HTML template
```

## Segurança

- 🔒 Context Isolation habilitado
- 🔒 Node Integration desabilitado
- 🔒 Sandbox ativado
- 🔒 Dados armazenados localmente sem envio a servidores

## Tecnologias Utilizadas

- **Electron** - Framework para aplicações desktop
- **React** - Interface de usuário
- **TypeScript** - Tipagem estática
- **Webpack** - Module bundler
- **Speakeasy** - Geração de códigos TOTP/HOTP
- **Electron Store** - Armazenamento de dados

## Formatos Suportados

### Importação/Exportação JSON

```json
[
  {
    "id": "unique_id",
    "account": "user@example.com",
    "issuer": "Google",
    "secret": "JBSWY3DPEBLW64TMMQ======",
    "algorithm": "SHA1",
    "digits": 6,
    "period": 30,
    "encoding": "base32",
    "type": "totp"
  }
]
```

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

## Licença

MIT

## Contribuindo

Sinta-se livre para fazer fork, criar branches e enviar pull requests!

---

**Nota**: Este é um gerenciador local. Todos os seus dados de 2FA são armazenados apenas no seu computador. Nenhuma informação é enviada para servidores externos.
