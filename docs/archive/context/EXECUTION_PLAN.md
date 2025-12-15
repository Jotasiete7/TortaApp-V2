# 🛡️ Safe Execution Plan - Phase 1 Foundation

> **Princípio**: Nunca quebrar o que funciona. Sempre ter rollback.

## 🎯 Objetivo

Implementar **Advanced Parsing + Normalization + DB Optimization** de forma incremental e segura.

---

## 📋 Preparação do Ambiente

### Pré-requisitos
- [x] VS Code otimizado (watcher exclusions)
- [ ] Branch de desenvolvimento (`git checkout -b feature/advanced-parsing`)
- [ ] Backup do banco de dados (export Supabase)
- [ ] Testes manuais documentados (checklist)

### Estrutura de Pastas
```
src-tauri/src/
├── watcher.rs (EXISTENTE - não tocar ainda)
├── parser.rs (NOVO - parsing avançado)
└── price.rs (NOVO - normalização)

src/domain/ (NOVO)
├── price/
│   └── Money.ts
└── trade/
    └── Trade.ts
```

---

## 🔄 Estratégia de Implementação

### Princípio: **Feature Flag Pattern**
Cada mudança terá um "interruptor" para voltar ao comportamento antigo se algo quebrar.

```rust
// Exemplo
const USE_ADVANCED_PARSING: bool = false; // Toggle para testar
```

---

## 📦 FASE 1: Rust Parsing (Sem Quebrar Nada)

### Step 1.1: Criar Módulo Novo (2h)
**O que fazer**:
- Criar `src-tauri/src/parser.rs` (arquivo NOVO)
- Implementar tokenização + classificação
- **NÃO modificar `watcher.rs` ainda**

**Código**:
```rust
// src-tauri/src/parser.rs
pub struct AdvancedParser {
    // Tokenização + classificação
}

impl AdvancedParser {
    pub fn parse(&self, message: &str) -> ParsedTrade {
        let tokens = self.tokenize(message);
        let attrs = self.classify(tokens);
        self.normalize(attrs)
    }
    
    fn tokenize(&self, msg: &str) -> Vec<&str> {
        msg.split_whitespace().collect()
    }
    
    fn classify(&self, tokens: Vec<&str>) -> TradeAttributes {
        // Extrair QL, rarity, price
    }
    
    fn normalize(&self, attrs: TradeAttributes) -> ParsedTrade {
        // Converter para estrutura final
    }
}
```

**Teste**:
```rust
#[cfg(test)]
mod tests {
    #[test]
    fn test_parse_wts_with_ql() {
        let parser = AdvancedParser::new();
        let result = parser.parse("WTS rare pickaxe QL 90 5g");
        assert_eq!(result.quality, Some(90));
        assert_eq!(result.price_copper, Some(500000));
    }
}
```

**Checkpoint**: Testes passam ✅

---

### Step 1.2: Normalização de Preços (2h)
**O que fazer**:
- Criar `src-tauri/src/price.rs`
- Função `parse_price_to_copper()`

**Código**:
```rust
// src-tauri/src/price.rs
pub fn parse_price_to_copper(price_str: &str) -> Option<i64> {
    let mut copper: i64 = 0;
    
    // Diamond: 1d = 10,000,000c
    if let Some(caps) = Regex::new(r"(\d+)d").unwrap().captures(price_str) {
        copper += caps[1].parse::<i64>().ok()? * 10_000_000;
    }
    
    // Gold: 1g = 100,000c
    if let Some(caps) = Regex::new(r"(\d+)g").unwrap().captures(price_str) {
        copper += caps[1].parse::<i64>().ok()? * 100_000;
    }
    
    // Silver: 1s = 100c
    if let Some(caps) = Regex::new(r"(\d+)s").unwrap().captures(price_str) {
        copper += caps[1].parse::<i64>().ok()? * 100;
    }
    
    // Copper: 1c = 1c
    if let Some(caps) = Regex::new(r"(\d+)c").unwrap().captures(price_str) {
        copper += caps[1].parse::<i64>().ok()?;
    }
    
    Some(copper)
}
```

**Teste**:
```rust
#[test]
fn test_price_normalization() {
    assert_eq!(parse_price_to_copper("5g"), Some(500_000));
    assert_eq!(parse_price_to_copper("50s"), Some(5_000));
    assert_eq!(parse_price_to_copper("1g50s"), Some(105_000));
}
```

**Checkpoint**: Testes passam ✅

---

### Step 1.3: Integração com Feature Flag (3h)
**O que fazer**:
- Modificar `watcher.rs` COM feature flag
- Manter código antigo funcional

**Código**:
```rust
// watcher.rs
use crate::parser::AdvancedParser;

const USE_ADVANCED_PARSING: bool = false; // TOGGLE

impl FileWatcher {
    pub fn start(&mut self, app_handle: AppHandle) -> Result<(), String> {
        // ... código existente ...
        
        let parser = if USE_ADVANCED_PARSING {
            Box::new(AdvancedParser::new()) as Box<dyn TradeParser>
        } else {
            Box::new(StandardLogParser::new()) as Box<dyn TradeParser>
        };
        
        // Resto do código usa `parser` (abstração)
    }
}
```

**Teste Manual**:
1. `USE_ADVANCED_PARSING = false` → app funciona normal ✅
2. `USE_ADVANCED_PARSING = true` → app usa novo parser ✅
3. Comparar resultados (devem ser iguais ou melhores)

**Checkpoint**: App funciona com ambos os parsers ✅

---

## 📦 FASE 2: Database Optimization (Sem Quebrar Queries)

### Step 2.1: Adicionar Coluna (1h)
**O que fazer**:
- Migration SQL para `price_copper`
- **NÃO remover `price` (string) ainda**

**SQL**:
```sql
-- Migration: add_price_copper.sql
ALTER TABLE trade_logs 
ADD COLUMN price_copper BIGINT;

-- Índice para performance
CREATE INDEX idx_price_copper 
ON trade_logs(price_copper) 
WHERE price_copper IS NOT NULL;

-- Backfill (opcional, rodar offline)
UPDATE trade_logs
SET price_copper = parse_price_to_copper(message)
WHERE price_copper IS NULL;
```

**Checkpoint**: Coluna existe, queries antigas funcionam ✅

---

### Step 2.2: Materialized Views (3h)
**O que fazer**:
- Criar views para análises
- **NÃO modificar queries existentes ainda**

**SQL**:
```sql
-- Materialized View: Preço médio por item
CREATE MATERIALIZED VIEW mv_avg_price_by_item AS
SELECT 
  item,
  AVG(price_copper) as avg_price_copper,
  STDDEV(price_copper) as price_volatility,
  COUNT(*) as trade_count,
  MAX(trade_timestamp_utc) as last_trade
FROM trade_logs
WHERE price_copper IS NOT NULL
  AND item IS NOT NULL
GROUP BY item;

-- Refresh automático (cron job)
CREATE OR REPLACE FUNCTION refresh_price_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW mv_avg_price_by_item;
END;
$$ LANGUAGE plpgsql;

-- Agendar refresh (a cada 1 hora)
SELECT cron.schedule(
  'refresh-price-views',
  '0 * * * *',
  'SELECT refresh_price_views();'
);
```

**Checkpoint**: Views criadas, dados corretos ✅

---

## 📦 FASE 3: Frontend (Modular e Seguro)

### Step 3.1: Money Class (2h)
**O que fazer**:
- Criar `src/domain/price/Money.ts`
- Usar APENAS em código novo (não refatorar tudo)

**Código**:
```typescript
// src/domain/price/Money.ts
export class Money {
  private constructor(readonly copper: number) {}

  static fromCopper(copper: number): Money {
    return new Money(copper);
  }

  static fromString(price: string): Money {
    // Chamar backend Rust ou fazer parsing local
    const copper = this.parseToCopper(price);
    return new Money(copper);
  }

  toSilver(): number {
    return this.copper / 100;
  }

  toGold(): number {
    return this.copper / 100_000;
  }

  toString(): string {
    if (this.copper >= 100_000) {
      return `${(this.copper / 100_000).toFixed(2)}g`;
    }
    if (this.copper >= 100) {
      return `${(this.copper / 100).toFixed(2)}s`;
    }
    return `${this.copper}c`;
  }

  private static parseToCopper(price: string): number {
    // Implementação similar ao Rust
  }
}
```

**Teste**:
```typescript
describe('Money', () => {
  it('converts from string', () => {
    const m = Money.fromString('5g');
    expect(m.copper).toBe(500_000);
  });

  it('formats correctly', () => {
    const m = Money.fromCopper(500_000);
    expect(m.toString()).toBe('5.00g');
  });
});
```

**Checkpoint**: Testes passam ✅

---

### Step 3.2: Refatorar LiveTradeSetup (6h)
**O que fazer**:
- Extrair hooks SEM modificar UI
- Criar componentes SEM deletar código antigo

**Estratégia**:
```tsx
// Passo 1: Extrair hook (não usar ainda)
function useTradeAlerts() {
  // Lógica extraída
}

// Passo 2: Usar hook em PARALELO
function LiveTradeSetup() {
  // Código antigo (comentado, não deletado)
  // const [alerts, setAlerts] = useState([]);
  
  // Código novo
  const { alerts, addAlert } = useTradeAlerts();
  
  // Resto do código
}
```

**Checkpoint**: UI funciona igual, código mais limpo ✅

---

## 🧪 Plano de Testes

### Testes Automatizados
- [ ] Unit tests: `parser.rs` (10 casos)
- [ ] Unit tests: `price.rs` (8 casos)
- [ ] Unit tests: `Money.ts` (6 casos)
- [ ] Integration test: watcher → parser → frontend

### Testes Manuais
- [ ] Abrir app, monitorar log
- [ ] Enviar mensagem de teste no chat
- [ ] Verificar alerta dispara
- [ ] Verificar preço normalizado no banco
- [ ] Verificar UI não quebrou

---

## 🚨 Rollback Strategy

### Se algo quebrar:
1. **Rust**: `USE_ADVANCED_PARSING = false`
2. **Database**: Queries antigas ainda funcionam (coluna `price` existe)
3. **Frontend**: Código antigo comentado, fácil restaurar

### Backup antes de começar:
```bash
# Backup do código
git checkout -b feature/advanced-parsing

# Backup do banco
# (Supabase Dashboard → Database → Backups)
```

---

## 📊 Timeline Realista

| Fase | Tempo | Risco | Rollback |
|------|-------|-------|----------|
| **Preparação** | 1h | Baixo | N/A |
| **Fase 1: Rust** | 7h | Médio | Feature flag |
| **Fase 2: DB** | 4h | Baixo | Queries antigas |
| **Fase 3: Frontend** | 8h | Médio | Código comentado |
| **Testes** | 4h | - | - |

**Total**: 24 horas (~3 dias part-time)

---

## ✅ Checklist de Segurança

Antes de cada fase:
- [ ] Branch criado
- [ ] Backup feito
- [ ] Testes escritos
- [ ] Feature flag implementada
- [ ] Rollback testado

Depois de cada fase:
- [ ] Testes passam
- [ ] App funciona
- [ ] Commit + push
- [ ] Documentar mudanças

---

## 🎯 Próximos Passos

1. **Revisar este plano** ✅
2. **Criar branch** (`git checkout -b feature/advanced-parsing`)
3. **Começar Fase 1.1** (criar `parser.rs`)
4. **Testar incrementalmente**
5. **Iterar com segurança**

---

**Princípio Final**: Se em qualquer momento algo quebrar, temos 3 níveis de rollback:
1. Feature flag (instantâneo)
2. Git revert (1 minuto)
3. Backup do banco (5 minutos)

**Nunca vamos quebrar o que funciona.** 🛡️
