# Protocolo de Auto-Update (TortaApp)

Este guia detalha como garantir que a funcionalidade de auto-update funcione para usuários finais.
A configuração técnica já está feita em `tauri.conf.json`.

## 1. O que acontece no Build
Quando você roda `npm run tauri build`, o Tauri gera:
1.  **Instalador:** `TortaApp_2.0.3_x64_en-US.msi` (ou .exe)
2.  **Assinatura:** `TortaApp_2.0.3_x64_en-US.msi.sig` (Arquivo de chave pública)
3.  **JSON de Update:** O Tauri pode não gerar o `latest.json` automaticamente pronto para deploy, você precisa criá-lo ou atualizá-lo.

## 2. O Arquivo `latest.json`
Este é o arquivo que o app consulta para saber se há updates. Ele deve estar hospedado em:
`https://github.com/Jotasiete7/TortaApp-V2/releases/latest/download/latest.json`

### Estrutura Obrigatória
Crie ou edite este arquivo com os dados da nova versão:

```json
{
  "version": "2.0.3",
  "notes": "v2.0.3 - Torta Fat Rabbit 🐇\n\n- Nova Interface Compacta\n- Sidebar Refinada\n- Performance Otimizada",
  "pub_date": "2025-12-30T15:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "signature": "CONTEUDO_DO_ARQUIVO_SIG_AQUI",
      "url": "https://github.com/Jotasiete7/TortaApp-V2/releases/download/v2.0.3/TortaApp_2.0.3_x64_en-US.msi"
    }
  }
}
```

> **IMPORTANT:** A `signature` é o conteúdo de texto do arquivo `.sig` gerado no build.
> **IMPORTANT:** A `url` deve ser o link direto para o download do instalador no GitHub Releases.

## 3. Passo a Passo para Lançamento

1.  **Gerar Build:**
    Rode `npm run tauri build`.
    
2.  **Coletar Artefatos:**
    Vá para `src-tauri/target/release/bundle/msi/` (ou `nsis`).
    Pegue o `.msi` (ou .exe) e o `.msi.sig`.

3.  **Criar Release no GitHub:**
    - Crie uma nova release com a tag `v2.0.3`.
    - Título: "v2.0.3 - Torta Fat Rabbit 🐇".
    - Faça upload do instalador (`.msi` ou `.exe`).
    - Publique.

4.  **Atualizar `latest.json`:**
    - Copie o conteúdo da assinatura `.sig`.
    - Atualize o JSON conforme modelo acima.
    - Faça commit desse arquivo no repositório ou upload como asset (se for asset, garanta que o link no `tauri.conf.json` aponte para ele).
    *Nota: A configuração atual aponta para `releases/latest/download/latest.json`, o que implica que este arquivo deve ser um asset da release.*

## 4. Chaves de Assinatura
As chaves privadas para assinar o update estão em variáveis de ambiente:
- `TAURI_PRIVATE_KEY`
- `TAURI_KEY_PASSWORD` (se houver)

Se o build falhar pedindo chave, verifique se elas estão no `.env` ou nas Secrets do GitHub Actions.
