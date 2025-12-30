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
2.  [ ] Executar build de verificação (`npm run build`).
3.  [ ] **Executar Double Backup**.
4.  [ ] Publicar Release (Ver [AUTO_UPDATE_GUIDE.md](docs/technical/AUTO_UPDATE_GUIDE.md)).
