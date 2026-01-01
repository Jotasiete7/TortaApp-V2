# Protocolo de Release e Backup

Este documento define os procedimentos obrigatórios para cada nova versão ou atualização significativa do TortaApp.

## Regra de Ouro: Double Backup (Backup Duplo)
**TODA** vez que uma nova versão for gerada ou um grande marco de correção for atingido, deve-se realizar o backup em duas frentes:

### 1. Versionamento (Git)
Garantir que o código esteja commitado e tageado corretamente.
```powershell
git add .
git commit -m "chore: vX.X.X - [Descrição]"
git push origin [branch]
```

### 2. Backup Local (.zip)
Criar um arquivo compactado do projeto inteiro para garantir redundância independente do GitHub.
**Destino:** `C:\Users\Pichau\.gemini\antigravity\backups\`

**Comando Padrão:**
```powershell
$date = Get-Date -Format 'yyyyMMdd-HHmm'
Compress-Archive -Path '.\TortaApp-V2' -DestinationPath "C:\Users\Pichau\.gemini\antigravity\backups\TortaApp-V2-v[VERSAO]-$date.zip" -Force
```

## 0. Pré-requisitos de Ambiente (CRÍTICO)
Antes de iniciar qualquer build de release, verifique:
1.  [ ] Arquivo `src-tauri/.env` existe?
2.  [ ] Variável `TAURI_SIGNING_PRIVATE_KEY` está definida nele?
3.  [ ] Se **NÃO**: Pare tudo e siga o guia `RESTORE_KEYS.md`.
    *   *Sem isso, o auto-update quebrará para todos os usuários.*

## Checklist de Pré-Release
1.  [ ] Verificar status do Git (`git status` limpo).
2.  [ ] **Testar build local ANTES de criar tag** (`npm run build`).
3.  [ ] Verificar que não há imports de funções inexistentes.
4.  [ ] **Executar Double Backup**.
5.  [ ] Publicar Release (Ver [AUTO_UPDATE_GUIDE.md](docs/technical/AUTO_UPDATE_GUIDE.md)).

## Troubleshooting: Build Failures

### Se o GitHub Actions falhar:

1. **NÃO crie múltiplas tags de teste** - isso polui o histórico
2. **Teste o build localmente primeiro**:
   ```powershell
   npm run build
   npm run tauri build
   ```

3. **Verifique os logs completos** do GitHub Actions para identificar o erro específico

4. **Erros comuns**:
   - **Função não exportada**: Verifique se todos os imports existem nos arquivos de origem
   - **Path alias não resolvido**: Confirme que `vite.config.ts` e `tsconfig.json` têm paths corretos
   - **Exit code 128 (git)**: Geralmente secundário, foque no erro de build primeiro

### Limpeza após testes falhados:

```powershell
# Deletar tags locais
git tag -d v2.1.1 v2.1.2-test

# Deletar tags remotas
git push origin --delete v2.1.1 v2.1.2-test
```

## Histórico de Releases

- **v2.1.3** (2026-01-01) - "Champion Unicorn" - Critical build fix
- **v2.1.0** (2025-12-XX) - Major feature release
- **v2.0.0** (2025-12-XX) - Initial stable release
