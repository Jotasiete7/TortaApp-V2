# 🛡️ Checklist de Release (A Prova de Falhas)

Use este guia antes de subir qualquer arquivo para o GitHub. Se **qualquer** passo falhar, **NÃO SUBA O RELEASE**.

## 🛑 1. Verificação de Ambiente (Antes do Build)
- [ ] Abra a pasta `src-tauri` e verifique se o arquivo `.env` existe.
- [ ] Abra esse `.env` e confirme que começa com `TAURI_SIGNING_PRIVATE_KEY=...`
- [ ] Abra `src-tauri/tauri.conf.json` e procure por `"pubkey"`. Confirme que não está vazio.

> **Falhou?** Pare. Siga o arquivo `RESTORE_KEYS.md`.

## 🏗️ 2. Verificação do Build
- [ ] Rode o comando: `npm run tauri build`
- [ ] O terminal terminou com "Exit code: 0"? (Sem erros vermelhos de Rust?)

> **Falhou?** Corrija os erros do código antes de continuar.

## 📦 3. Verificação de Artefatos (Pasta Output)
Vá até: `src-tauri/target/release/bundle/msi/`
Você **DEVE** ver 2 arquivos:
1.  `TortaApp_X.X.X_x64_en-US.msi` (O instalador)
2.  `TortaApp_X.X.X_x64_en-US.msi.sig` (A assinatura)

> **Falta o .sig?**
> Isso significa que a chave privada não foi lida corretamente.
> **Solução:** Rode o comando manual:
> `npx tauri signer sign -p "" src-tauri/target/release/bundle/msi/SEU_ARQUIVO.msi`

## 📡 4. Verificação do `latest.json`
Abra o arquivo `latest.json` que você vai subir.
- [ ] O campo `"version"` bate com o instalador (ex: 2.0.3)?
- [ ] O campo `"url"` aponta para o release correto no GitHub?
- [ ] O campo `"signature"` contém um texto longo e aleatório (não um placeholder de erro)?
    *   *Você deve copiar o conteúdo do arquivo .msi.sig e colar nesse campo.*

## ✅ 5. Sinal Verde
Se você marcou TODOS os itens acima:
1.  Crie a Release no GitHub (Draft).
2.  Suba o `.msi` e o `.msi.sig`.
3.  Suba o `latest.json`.
4.  Suba o Backup Zip (Opcional, mas recomendado).
5.  Publique! 🚀
