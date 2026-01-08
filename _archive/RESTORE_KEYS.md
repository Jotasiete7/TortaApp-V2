# 🔑 Como Restaurar as Chaves de Assinatura

Para que o Auto-Update funcione, o Tauri precisa assinar o executável durante o build. Como o arquivo `.sig` não foi gerado, suas chaves privadas não estão visíveis para o compilador.

Aqui está o passo a passo para corrigir isso:

## 1. Onde estão as chaves?
Se você gerou as chaves anteriormente usando o comando do Tauri, elas geralmente ficam salvas no seu diretório de usuário (fora do projeto para segurança):
*   **Local Padrão:** `C:\Users\Pichau\.tauri\`
*   **Arquivo Privado:** `torta-app.key` (ou similar)
*   **Arquivo Público:** `torta-app.key.pub`

> **Abra o arquivo `.key` com o Bloco de Notas e copie todo o conteúdo.**
> (O conteúdo se parece com `untar...` ou uma string longa codificada).

---

## 2. Como Adicionar ao Projeto

### Método A: Arquivo `.env` (Recomendado para Dev Local)
1.  Vá até a pasta: `src-tauri`
2.  Crie um arquivo chamado `.env` (sem nome, só extensão .env)
3.  Adicione o seguinte conteúdo:

```properties
TAURI_PRIVATE_KEY="cole_sua_chave_privada_aqui"
TAURI_KEY_PASSWORD="sua_senha_se_tiver"
```
*(Se você não definiu senha na criação, pode deixar a linha da senha vazia ou removê-la).*

### Método B: PowerShell (Apenas para essa sessão)
Se não quiser criar arquivo, rode isso no terminal antes do build:

```powershell
$env:TAURI_PRIVATE_KEY="cole_sua_chave_privada_aqui"
$env:TAURI_KEY_PASSWORD="sua_senha_se_tiver"
```

---

## 3. Testando
Após adicionar a chave, rode o build novamente:
```powershell
npm run tauri build
```
Desta vez, verifique se apareceu o arquivo `.msi.sig` na pasta `src-tauri/target/release/bundle/msi/`.

---

## ⚠️ Segurança
Nunca suba o arquivo `.env` com a chave privada para o GitHub! Adicione `.env` ao seu `.gitignore` se ainda não estiver lá.
