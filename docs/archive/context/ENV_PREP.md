# 🔧 Environment Preparation Checklist

## ✅ Pre-Flight Checks

### 1. Git Setup
```bash
# Verificar branch atual
git branch

# Criar branch de desenvolvimento
git checkout -b feature/advanced-parsing

# Verificar status
git status
```

### 2. Backup do Código
```bash
# Commit tudo que está pendente
git add .
git commit -m "chore: backup before Phase 1 implementation"

# Push para segurança
git push origin feature/advanced-parsing
```

### 3. Backup do Banco (Supabase)
- [ ] Acessar Supabase Dashboard
- [ ] Database → Backups → Create Backup
- [ ] Anotar timestamp do backup

### 4. Dependências Rust
```bash
cd src-tauri

# Verificar versão do Rust
rustc --version

# Adicionar dependências (se necessário)
# Editar Cargo.toml:
# regex = "1.10"
# serde = { version = "1.0", features = ["derive"] }

# Build para verificar
cargo build
```

### 5. Testes Manuais (Baseline)
- [ ] Abrir app em dev mode
- [ ] Monitorar arquivo de log
- [ ] Enviar mensagem de teste no chat
- [ ] Verificar alerta dispara
- [ ] Anotar comportamento atual (screenshot)

---

## 📂 Estrutura de Pastas a Criar

```bash
# Frontend
mkdir -p src/domain/price
mkdir -p src/domain/trade

# Backend (Rust)
cd src-tauri/src
touch parser.rs
touch price.rs

# Adicionar módulos no main.rs
# mod parser;
# mod price;
```

---

## 🧪 Ambiente de Testes

### Mensagens de Teste (Copiar para arquivo)
```
WTS rare supreme pickaxe QL 90 [101] 5g
WTB casket harmony 50s
WTS iron lump QL 70 10c
WTT rare sword for supreme axe
WTS fantastic meditation rug QL 95 [105] 10g50s
```

### Resultados Esperados (Baseline)
| Mensagem | Alerta? | Preço Detectado? |
|----------|---------|------------------|
| WTS rare supreme pickaxe QL 90 [101] 5g | ✅ | ❌ (string) |
| WTB casket harmony 50s | ✅ | ❌ (string) |

---

## 🛡️ Safety Checklist

Antes de começar cada fase:
- [ ] Branch criado
- [ ] Backup feito (código + banco)
- [ ] Testes baseline documentados
- [ ] Feature flag preparada
- [ ] Rollback testado (git revert)

---

## 🚀 Ready to Start

Quando tudo acima estiver ✅:
1. Abrir `EXECUTION_PLAN.md`
2. Começar **Fase 1.1: Criar Módulo Novo**
3. Seguir checklist passo a passo
4. Testar após cada step

---

**Status**: Pronto para execução quando você quiser! 🎯
