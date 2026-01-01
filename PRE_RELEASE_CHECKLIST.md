# ⚠️ PRÉ-RELEASE CHECKLIST - LEIA ANTES DE CADA RELEASE

Este documento contém **problemas reais** que já ocorreram e devem ser verificados ANTES de criar qualquer tag de release.

## 🔴 PROBLEMAS CRÍTICOS VENCIDOS

### 1. Funções Inexistentes / Imports Não Utilizados

**O que aconteceu (v2.1.1, v2.1.2-test, v2.1.3)**:
- `App.tsx` importava `generateChartDataFromHistory` que não existia em `dataUtils.ts`
- Build falhava com: `"generateChartDataFromHistory" is not exported`
- Criamos 2 tags de teste antes de descobrir o problema real

**Como evitar**:
```bash
# SEMPRE rodar build local ANTES de criar tag
npm run build
```

**Checklist**:
- [ ] `npm run build` passou sem erros?
- [ ] Não há imports de funções que não existem?

### 2. Null Safety em Dados Dinâmicos

**O que aconteceu (v2.1.3 → v2.1.4)**:
- App compilava mas crashava ao abrir (tela azul)
- `LiveTradeTicker` tentava fazer `.toLowerCase()` em `itemName` undefined

**Como evitar**:
```typescript
// ❌ ERRADO
itemId: trade.itemName.toLowerCase()

// ✅ CORRETO
itemId: (trade.itemName || 'unknown').toLowerCase()
```

**Checklist**:
- [ ] Testei o app instalado (não só dev mode)?
- [ ] Dados externos têm null checks?

### 3. Path Aliases Incorretos

**Checklist**:
- [ ] Path aliases consistentes entre `vite.config.ts` e `tsconfig.json`?

### 4. Versão no tauri.conf.json

**Checklist**:
- [ ] Versão em `tauri.conf.json` bate com a tag?

### 5. Code Signing Keys

**Checklist**:
- [ ] Workflow tem GITHUB_TOKEN, SIGNING_KEY, SIGNING_PASSWORD?

## 📋 CHECKLIST COMPLETO PRÉ-RELEASE

### Antes de Criar a Tag

1. **Build Local**
   - [ ] `npm run build` passou?
   - [ ] `npm run tauri build` passou?

2. **Teste o App Compilado**
   - [ ] App abre sem crash?
   - [ ] Funcionalidades principais funcionam?

3. **Verificações de Configuração**
   - [ ] `tauri.conf.json` version bate com a tag?
   - [ ] Workflow tem code signing keys?

4. **Git Status**
   - [ ] `git status` limpo?

### Depois de Criar a Tag

5. **Monitorar GitHub Actions**
   - [ ] Workflow completou com sucesso?

6. **Verificar Release**
   - [ ] Arquivos `.exe` e `.msi` presentes?
   - [ ] Arquivo `latest.json` gerado?

7. **Teste Final**
   - [ ] Baixei e instalei do GitHub?
   - [ ] App abre corretamente?

## 🎯 Regra de Ouro

**Se o build local não passar, NÃO crie a tag.**

**Se o app local crashar, NÃO crie a tag.**

**Teste SEMPRE antes de tagear.**
