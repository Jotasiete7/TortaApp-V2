# Semantic Versioning (SemVer) - TortaApp

Este projeto segue o padrão **Semantic Versioning 2.0.0** ([semver.org](https://semver.org)).

## Formato de Versão

```
MAJOR.MINOR.PATCH[-PRERELEASE][+BUILD]
```

### Componentes

- **MAJOR** (X.0.0): Mudanças incompatíveis (breaking changes)
- **MINOR** (0.X.0): Novas funcionalidades compatíveis
- **PATCH** (0.0.X): Correções de bugs
- **PRERELEASE**: Versão pré-lançamento (alpha, beta, rc)
- **BUILD**: Metadados de build

## Exemplos

```
1.0.0           - Release estável
2.0.0-beta.1    - Primeiro beta da v2
2.1.0-alpha.3   - Terceiro alpha da v2.1
2.1.1           - Correção de bug
```

## Regras de Incremento

### MAJOR (X.0.0) - Breaking Changes
- Remoção de features
- Mudanças incompatíveis na API
- Alterações no formato de dados

**Exemplo:** Migração Tauri v1 → v2

### MINOR (0.X.0) - Novas Features
- Novos componentes
- Melhorias de UI
- Novas APIs

**Exemplo:** Sistema de gamificação

### PATCH (0.0.X) - Bug Fixes
- Correções de bugs
- Otimizações
- Correções de segurança

**Exemplo:** Widget overlay fix

## Pre-releases

### Sequência
```
2.0.0-alpha.1
2.0.0-alpha.2
2.0.0-beta.1
2.0.0-beta.2
2.0.0-rc.1
2.0.0
```

## Versão Atual

**TortaApp v2.0.0-beta.1**

## Workflow de Release

### Pre-release
```bash
npm version 2.1.0-beta.1 --no-git-tag-version
npm run tauri build
git tag v2.1.0-beta.1
git push origin v2.1.0-beta.1
```

### Release Estável
```bash
npm version 2.1.0 --no-git-tag-version
npm run tauri build
git tag v2.1.0
git push origin v2.1.0
```

## Commits Convencionais

```
feat: nova funcionalidade (MINOR)
fix: correção de bug (PATCH)
BREAKING CHANGE: mudança incompatível (MAJOR)
```

## Referências

- [Semantic Versioning 2.0.0](https://semver.org)
- [Conventional Commits](https://www.conventionalcommits.org)
