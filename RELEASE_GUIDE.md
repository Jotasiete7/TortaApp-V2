# Guia de Release (Lançamento)

Este documento descreve o processo para lançar uma nova versão do **TortaApp**.

## 🚀 Processo Automático

O projeto utiliza **GitHub Actions** para gerar os executáveis (`.msi` para Windows) automaticamente.

### Passo a Passo

1.  **Atualize a Versão**:
    *   No `package.json`
    *   No `src-tauri/tauri.conf.json`
    *   Faça o commit e push para a **main**.

2.  **Crie a Release no GitHub**:
    *   Acesse a página de Releases do repositório.
    *   Clique em "Draft a new release".
    *   Escolha a tag.

### ⚠️ Regra Crítica: A Tag deve começar com "v"

Para que a automação funcione, **a TAG da release OBRIGATORIAMENTE deve começar com a letra `v` minúscula**.

*   ✅ **Correto**: `v2.0.2`, `v2.1.0`, `v3.0.0-beta`
*   ❌ **Errado**: `2.0.2`, `version-2`, `release-2`

**Se a tag não começar com `v`, o GitHub Actions NÃO irá rodar e os arquivos de instalação NÃO serão gerados.**

---

### Onde ficam os arquivos?
Após criar a Release correta (com tag `v...`), aguarde cerca de 5 minutos. O GitHub irá anexar automaticamente os arquivos (`TortaApp_..._x64_en-US.msi`, `latest.json`, etc.) na própria página da Release.

