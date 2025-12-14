# Synthesis: ChatGPT + Manus AI Recommendations

## 🎯 Consenso Absoluto (Ambos Concordam)

| Item | ChatGPT | Manus | Prioridade |
|------|---------|-------|------------|
| **Parsing em Rust** | ✅ Mover lógica para backend | ✅ **Prioridade Máxima** | #1 🔥 |
| **Normalização de Preços** | ✅ Money class | ✅ Em Rust, retornar `price_copper` | #2 🔥 |
| **Domain Layer** | ✅ Separar lógica de UI | ✅ (Implícito via Rust) | #3 |
| **Database Optimization** | ⚠️ Mencionado | ✅ **Materialized Views** | #4 |
| **Evitar Auto-Response** | ✅ Violação ToS | ✅ **Quick-Reply** manual | ✅ |

---

## 🔥 Top 5 Executáveis (Impacto Drástico)

### 1. **Advanced Parsing em Rust** (6-8h)
**Consenso**: ChatGPT + Manus
**Por quê**:
- **Performance**: 10x mais rápido que JS
- **Confiabilidade**: Rust é mais robusto para regex complexas
- **UTF-8 Fix**: Resolve encoding na fonte

**O que fazer**:
```rust
// watcher.rs
pub struct ParsedTrade {
    timestamp: String,
    nick: String,
    message: String,
    trade_type: String,      // WTB/WTS/WTT
    item: Option<String>,
    quality: Option<u8>,     // QL 0-100
    rarity: Option<String>,  // rare, supreme, fantastic
    price_copper: Option<i64>, // NORMALIZADO
}
```

---

### 2. **Normalização de Preços em Rust** (3-4h)
**Consenso**: ChatGPT + Manus
**Por quê**: Desbloqueia 80% das features futuras

**O que fazer**:
```rust
fn parse_price_to_copper(price_str: &str) -> Option<i64> {
    // "5g" -> 500000
    // "50s" -> 5000
    // "100c" -> 100
}
```

---

### 3. **Money Class (Domain)** (2-3h)
**ChatGPT Only**
**Por quê**: Facilita uso no frontend

**O que fazer**:
```typescript
class Money {
  readonly copper: number;
  static fromCopper(copper: number): Money;
  toSilver(): number;
  toGold(): number;
}
```

---

### 4. **Materialized Views (Database)** (4-5h)
**Manus Only**
**Por quê**: Reduz custo Supabase em 60%

**O que fazer**:
```sql
CREATE MATERIALIZED VIEW mv_avg_price_by_item AS
SELECT 
  item,
  AVG(price_copper) as avg_price,
  COUNT(*) as trade_count
FROM trade_logs
WHERE price_copper IS NOT NULL
GROUP BY item;

-- Refresh periódico (cron)
REFRESH MATERIALIZED VIEW mv_avg_price_by_item;
```

---

### 5. **Quick-Reply Contextualizado** (2-3h)
**Manus Only**
**Por quê**: ToS-safe, aumenta velocidade de resposta

**O que fazer**:
- Alerta copia template pré-preenchido
- `Ctrl+Enter` para colar no chat
- Exemplo: `"Hi {nick}, interested in your {item}!"`

---

## 🆚 Divergências (Onde Diferem)

| Item | ChatGPT | Manus | Recomendação |
|------|---------|-------|--------------|
| **Onde fazer parsing** | Domain Layer (TS) | **Rust** | ✅ **Manus** (performance) |
| **Scam Detection** | Heurística simples | Baseado em desvio-padrão | ✅ **Manus** (mais robusto) |
| **LiveTradeSetup refactor** | **Dividir em hooks** | (Não mencionado) | ✅ **ChatGPT** (UX) |

---

## 📊 Roadmap Unificado (Fase 1)

### Semana 1 (Fundação)
- [x] Otimização VS Code (settings.json)
- [ ] **Advanced Parsing em Rust** (6-8h)
- [ ] **Normalização de Preços (Rust)** (3-4h)
- [ ] **Money Class (TS)** (2-3h)

### Semana 2 (Database + UX)
- [ ] **Materialized Views** (4-5h)
- [ ] **Quick-Reply** (2-3h)
- [ ] **Refatorar LiveTradeSetup** (6-8h)

**Total**: 23-31 horas (~2 semanas part-time)

---

## ✅ O Que Fazer AGORA

**Prioridade Absoluta**: 
1. **Parsing em Rust** (desbloqueia tudo)
2. **Normalização de Preços** (pré-requisito para análises)

**Depois**:
3. Money Class (facilita frontend)
4. Materialized Views (reduz custo)
5. Quick-Reply (melhora UX)
