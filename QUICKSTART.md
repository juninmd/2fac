# 🚀 Quick Start Guide - 2FAC

## Iniciando o Desenvolvimento

### 1️⃣ Instalação Inicial
```bash
cd d:\Solutions\pessoal\2fac
npm install
```

### 2️⃣ Modo Desenvolvimento
Execute o comando para iniciar o servidor React dev (hot-reload) e Electron:
```bash
npm run electron:dev
```

A aplicação abrirá automaticamente e recarregará quando você fizer alterações no código.

### 3️⃣ Build para Produção
```bash
npm run build
npm run electron:build
```

Isso criará um instalador Windows (.exe) em `dist/` com o nome `2FAC Setup 1.0.0.exe`

### 4️⃣ Executar App Built
```bash
npm start
```

## Como Usar a Aplicação

### Adicionar uma Conta 2FA
1. Preencha o formulário no **painel esquerdo**
2. **Nome da Conta**: ex: `seu_email@gmail.com`
3. **Emissor**: ex: `Google`, `GitHub`, `Microsoft`
4. **Chave Secreta**: Cole a chave base32 do serviço (geralmente fornecida como QR code ou texto)
5. Configure opções avançadas se necessário (algoritmo, período, etc.)
6. Clique em **"+ Adicionar Conta"**

### Usar o Código 2FA
- O código de 6 dígitos aparece no **card** da conta
- **Clique no código** para copiar para a área de transferência
- O código é renovado automaticamente a cada 30 segundos
- Uma **barra de progresso** mostra o tempo restante

### Exportar Backup
1. Clique em **"📥 Exportar Backup"** na barra superior
2. Escolha local para salvar o arquivo `2fa-backup-[timestamp].json`
3. Guarde este arquivo em segurança (ele contém suas chaves secretas!)

### Importar de Arquivo JSON
1. Clique em **"📤 Importar JSON"** na barra superior
2. Selecione um arquivo JSON previamente exportado
3. As contas serão adicionadas à sua lista

### Importar do Authy
1. Exporte suas contas do Authy em formato JSON
2. Clique em **"📱 Importar Authy"** na barra superior
3. Selecione o arquivo JSON do Authy
4. As contas serão automaticamente convertidas e importadas

### Remover uma Conta
1. Clique no **❌** (X vermelho) no canto superior direito do card
2. Confirme a remoção no diálogo

## Estrutura de Dados

### Formato JSON (Export/Import)
```json
[
  {
    "id": "1234567890.5",
    "account": "user@gmail.com",
    "issuer": "Google",
    "secret": "JBSWY3DPEBLW64TMMQ======",
    "description": "Minha conta Google",
    "algorithm": "SHA1",
    "digits": 6,
    "period": 30,
    "encoding": "base32",
    "type": "totp"
  }
]
```

## Variáveis de Ambiente (Opcional)

Se precisar, você pode criar um arquivo `.env` na raiz:
```
NODE_ENV=development
ELECTRON_ENABLE_LOG=true
```

## Dicas de Desenvolvimento

### Inspecionar Elemento
- Pressione **F12** para abrir DevTools quando a app está em desenvolvimento
- Use DevTools para debugar React e Electron

### Limpar Cache
Se encontrar problemas, limpe cache e node_modules:
```bash
rm -rf node_modules dist package-lock.json
npm install
npm run build
```

### Compilação Apenas
```bash
npm run build:main      # Compila TypeScript do Electron main
npm run build:renderer  # Compila React com Webpack
npm run build           # Ambos
```

## Compatibilidade

| Feature | Status |
|---------|--------|
| Windows 10/11 | ✅ Full |
| macOS | ✅ Full (com Electron) |
| Linux | ✅ Full (com Electron) |
| TOTP (RFC 6238) | ✅ Full |
| HOTP | ⏳ Suportado, não testado |
| SHA1/SHA256/SHA512 | ✅ Full |

## Segurança

⚠️ **Importante**:
- Este é um gerenciador **LOCAL** - seus dados não saem do seu computador
- Faça **backup regular** de seus arquivos 2FA
- Não compartilhe seus arquivos JSON de backup
- A aplicação não tem acesso à internet

## Troubleshooting

### "Module not found" errors
```bash
npm install
npm run build
```

### App não inicia
- Verifique que não há processo anterior: `tasklist | grep electron`
- Mate o processo: `taskkill /IM electron.exe /F`
- Recompile: `npm run build`

### Porta 3000 em uso
```bash
# Windows - find process
netstat -ano | findstr :3000
taskkill /PID [PID] /F

# Ou mudar porta em webpack.config.js
```

### Arquivo de backup corrompido
Se não conseguir importar um JSON:
1. Abra em editor de texto (Notepad++)
2. Verifique se é um JSON válido: `[...]`
3. Tente abrir em https://jsonlint.com/ para validar

## Performance

- Build: ~2-3 minutos (primeira vez), ~1 min (subsequent)
- Startup: ~2-3 segundos
- Memory: ~150-200MB (normal para Electron)
- CPU: Mínimo quando idle

## Próximos Passos

1. **Testar** todas as funcionalidades
2. **Adicionar** suas contas 2FA
3. **Exportar** backup de segurança
4. **Personalizar** conforme necessário

## Suporte

Para problemas ou sugestões:
- Verifique o README.md principal
- Revise os logs do DevTools (F12)
- Consulte a documentação do Electron: https://www.electronjs.org/docs

---

**Versão**: 1.0.0
**Última atualização**: 2025-01-13
