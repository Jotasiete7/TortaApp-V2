# Live Trade Monitor - Plano Refinado (Claude + Gemini)

> **Nota**: Este é o plano refinado após análise colaborativa. O plano original está em `proto_plan_v1.md`.

---

## 🎯 Objetivo

Transformar o TortaApp em um **companheiro ativo** que detecta trades em tempo real, com sistema de verificação multi-fonte e alertas inteligentes.

---

## 🧠 Insights dos Agentes

### Gemini (Estratégia)
- ✅ Priorizar File Watcher sobre otimização de DB (13% não é crítico)
- ✅ Trust System (PENDING → VERIFIED) para prevenir fraudes
- ✅ Fuzzy Hashing para tolerar diferenças de timestamp

### Claude (Técnica)
- ⚠️ Hash muito restritivo (1min window → 5min window)
- ⚠️ UNIQUE constraint no hash impede reposts legítimos
- ⚠️ Falta rate limiting explícito
- ⚠️ Falta plano de offline/retry
- ⚠️ UX do Trust System não especificada

### Antigravity (Implementação & Robustez)
- 🔧 **Tauri Command Wrapper**: Precisamos de um comando `check_permissions(path: &str)` antes de iniciar o watcher para evitar crashes silenciosos por erro de permissão.
- 🔧 **Startup Strategy**: App deve fazer **SeekToEnd** ao iniciar. Tentar "alcançar" (Catch Up) logs antigos pode travar a UI ou enviar dados irrelevantes.
- 🔧 **Regex Fallback**: Um único regex não cobre tudo. Precisamos de uma "Strategy Pattern" de parsers: tente parser A -> falhou? -> tente parser B.
- 🔧 **Consentimento GDPR/LGPD**: Upload automático requer opt-in explícito. O "Setup Wizard" inicial é mandatório.

---

## 🔧 Arquitetura Técnica Refinada

### 1. Hash de Deduplicação (Robusto)

**Problema Original**: Hash com 1min window e sem normalização.

**Solução Refinada**:
```typescript
interface TradeHashInput {
    server: string;
    seller: string;
    item: string;
    priceCopper: number;
    timeWindow: number; // 5min blocks
}

function generateTradeHash(trade: RawTrade): string {
    const normalized = {
        server: trade.server.toLowerCase().trim(),
        seller: trade.nick.toLowerCase().trim(),
        item: normalizeItemName(trade.item), // Remove QL, rarity, etc
        priceCopper: convertToCopper(trade.price), // "1s50c" → 150
        timeWindow: Math.floor(trade.timestamp / 300000) // 5min = 300000ms
    };
    
    return sha256(JSON.stringify(normalized));
}

// Normalização de item
function normalizeItemName(item: string): string {
    return item
        .toLowerCase()
        .replace(/\b(ql|quality)\s*\d+/gi, '') // Remove "QL95"
        .replace(/\b(rare|supreme|fantastic)\b/gi, '') // Remove raridade
        .replace(/[,\s]+/g, ' ') // Normaliza espaços
        .trim();
}

// Conversão de preço
// Conversão de preço
function convertToCopper(price: string): number {
    let copper = 0;
    
    // Extrair silver (ex: "1s" -> 100 copper)
    const silverMatch = price.match(/(\d+)s/i);
    if (silverMatch) {
        copper += parseInt(silverMatch[1], 10) * 100;
    }
    
    // Extrair copper (ex: "50c" -> 50 copper)
    const copperMatch = price.match(/(\d+)c/i);
    if (copperMatch) {
        copper += parseInt(copperMatch[1], 10);
    }
    
    return copper;
}
```

**Vantagens**:
- Tolera diferenças de até 5 minutos entre relógios
- Ignora variações de formatação de preço
- Remove ruído (QL, raridade) do nome do item

---

### 2. Schema do Banco (Sem UNIQUE Constraint)

**Problema Original**: `trade_hash UNIQUE` impede reposts legítimos.

**Solução Refinada**:
```sql
-- Novos campos
ALTER TABLE trade_logs 
ADD COLUMN trade_hash TEXT,                    -- Hash para deduplicação
ADD COLUMN verification_status TEXT DEFAULT 'PENDING', -- PENDING | VERIFIED
ADD COLUMN source_count INT DEFAULT 1,         -- Quantas fontes confirmaram
ADD COLUMN source_user_ids UUID[],             -- Array de user_ids que reportaram
ADD COLUMN first_reported_by UUID,             -- Primeiro a reportar
ADD COLUMN last_updated_at TIMESTAMP DEFAULT NOW();

-- Índices para performance
CREATE INDEX idx_hash_time ON trade_logs(trade_hash, trade_timestamp_utc);
CREATE INDEX idx_verification_status ON trade_logs(verification_status);
CREATE INDEX idx_first_reporter ON trade_logs(first_reported_by);
-- Índice composto para query principal do dashboard e busca
CREATE INDEX idx_server_status_time ON trade_logs(server, verification_status, trade_timestamp_utc DESC);
CREATE INDEX idx_item_search ON trade_logs USING gin(to_tsvector('english', message));

-- Constraint: Mesmo user não pode reportar mesmo hash 2x
CREATE UNIQUE INDEX idx_unique_user_hash 
ON trade_logs(trade_hash, first_reported_by);

### 2.1 Security Policies (RLS)
```sql
-- Habilitar RLS
ALTER TABLE trade_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_user_reports ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "read_verified_trades" ON trade_logs FOR SELECT USING (verification_status = 'VERIFIED');
CREATE POLICY "read_own_pending_trades" ON trade_logs FOR SELECT USING (auth.uid() = first_reported_by AND verification_status = 'PENDING');
CREATE POLICY "insert_via_rpc_only" ON trade_logs FOR INSERT WITH CHECK (auth.uid() = first_reported_by);
CREATE POLICY "update_via_rpc_only" ON trade_logs FOR UPDATE USING (false);
CREATE POLICY "read_own_reports" ON trade_user_reports FOR SELECT USING (auth.uid() = user_id);
```
```

---

### 3. RPC de Inserção com Deduplicação

```sql
-- Nova tabela para tracking de reports (Evita Race Conditions)
CREATE TABLE trade_user_reports (
    trade_hash TEXT NOT NULL,
    user_id UUID NOT NULL,
    trade_id BIGINT NOT NULL,
    reported_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (trade_hash, user_id)
);

CREATE OR REPLACE FUNCTION submit_live_trade(
    p_trade_hash TEXT,
    p_nick TEXT,
    p_trade_type TEXT,
    p_message TEXT,
    p_timestamp TIMESTAMP,
    p_server TEXT,
    p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_existing_id BIGINT;
    v_new_source_count INT;
    v_marker_id BIGINT;
BEGIN
    -- 1. Rate Limiting (100 trades/min por usuário)
    IF NOT check_rate_limit(p_user_id) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'RATE_LIMIT_EXCEEDED',
            'message', 'Máximo de 100 trades por minuto'
        );
    END IF;

    -- 2. Validar timestamp (prevenir bypass de rate limit)
    IF p_timestamp < NOW() - INTERVAL '1 hour' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'TIMESTAMP_TOO_OLD',
            'message', 'Trade muito antiga para ser submetida'
        );
    END IF;
    
    -- 3. Verificar se hash já existe (janela de 10min)
    SELECT id INTO v_existing_id
    FROM trade_logs
    WHERE trade_hash = p_trade_hash
    AND trade_timestamp_utc > NOW() - INTERVAL '10 minutes'
    LIMIT 1;
    
    IF v_existing_id IS NOT NULL THEN
        -- 4. Tentar inserir marker (atômico) para evitar Race Condition
        BEGIN
            INSERT INTO trade_user_reports (trade_hash, user_id, trade_id)
            VALUES (p_trade_hash, p_user_id, v_existing_id)
            RETURNING trade_id INTO v_marker_id;
        EXCEPTION WHEN unique_violation THEN
            -- User já reportou
            RETURN jsonb_build_object(
                'success', false,
                'error', 'DUPLICATE_SUBMISSION'
            );
        END;

        -- 5. Atualizar contadores
        UPDATE trade_logs
        SET 
            source_count = source_count + 1,
            source_user_ids = array_append(source_user_ids, p_user_id),
            verification_status = CASE 
                WHEN source_count + 1 >= 2 THEN 'VERIFIED'
                ELSE 'PENDING'
            END,
            last_updated_at = NOW()
        WHERE id = v_existing_id
        RETURNING source_count INTO v_new_source_count;
        
        RETURN jsonb_build_object(
            'success', true,
            'action', 'CONFIRMED',
            'trade_id', v_existing_id,
            'source_count', v_new_source_count
        );
    ELSE
        -- 6. Hash novo → Inserir
        INSERT INTO trade_logs (
            nick, trade_type, message, trade_timestamp_utc, server,
            trade_hash, verification_status, source_count, 
            source_user_ids, first_reported_by
        ) VALUES (
            p_nick, p_trade_type, p_message, p_timestamp, p_server,
            p_trade_hash, 'PENDING', 1,
            ARRAY[p_user_id], p_user_id
        )
        RETURNING id INTO v_existing_id;
        
        -- Inserir marker
        INSERT INTO trade_user_reports (trade_hash, user_id, trade_id)
        VALUES (p_trade_hash, p_user_id, v_existing_id);
        
        RETURN jsonb_build_object(
            'success', true,
            'action', 'INSERTED',
            'trade_id', v_existing_id,
            'source_count', 1
        );
    END IF;
END;
$$;

-- Rate Limiting Helper
CREATE OR REPLACE FUNCTION check_rate_limit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_recent_count INT;
BEGIN
    SELECT COUNT(*) INTO v_recent_count
    FROM trade_logs
    WHERE first_reported_by = p_user_id
    AND created_at > NOW() - INTERVAL '1 minute';
    
    RETURN v_recent_count < 100;
END;
$$ LANGUAGE plpgsql;
```

---

### 4. Frontend: Offline Support & Retry

```typescript
// services/LiveMonitor.ts
interface QueuedTrade extends Trade {
    retryCount?: number;
    lastAttempt?: number;
}

class LiveTradeMonitor {
    private offlineQueue: QueuedTrade[] = [];
    private isOnline = navigator.onLine;
    private readonly MAX_RETRIES = 3;
    private readonly RETRY_DELAY = 1000; // 1s base delay
    
    constructor() {
        // Monitorar status de conexão
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
        
        // Restaurar queue do localStorage
        this.loadOfflineQueue();
    }
    
    async submitTrade(trade: Trade) {
        if (!this.isOnline) {
            this.queueTrade(trade);
            return;
        }
        
        try {
            await this.submitTradeInternal(trade);
        } catch (err) {
            console.error('Failed to submit trade:', err);
            this.queueTrade(trade);
        }
    }
    
    private async submitTradeInternal(trade: Trade) {
        const hash = generateTradeHash(trade);
        const { data, error } = await supabase.rpc('submit_live_trade', {
            p_trade_hash: hash,
            p_nick: trade.nick,
            p_trade_type: trade.type,
            p_message: trade.message,
            p_timestamp: trade.timestamp,
            p_server: trade.server,
            p_user_id: this.currentUserId
        });
        
        if (error) throw error;
        this.handleSubmitResponse(data);
    }
    
    private queueTrade(trade: Trade) {
        const queuedTrade: QueuedTrade = {
            ...trade,
            retryCount: (trade as QueuedTrade).retryCount || 0,
            lastAttempt: Date.now()
        };
        
        this.offlineQueue.push(queuedTrade);
        this.saveOfflineQueue();
        console.log('📴 Trade queued for retry:', queuedTrade.retryCount);
    }
    
    private async handleOnline() {
        this.isOnline = true;
        console.log('🌐 Online: Processing queue...');
        
        const failedTrades: QueuedTrade[] = [];
        const tempQueue = [...this.offlineQueue];
        this.offlineQueue = [];
        
        for (const trade of tempQueue) {
            trade.retryCount = (trade.retryCount || 0) + 1;
            
            if (trade.retryCount > this.MAX_RETRIES) {
                failedTrades.push(trade);
                continue;
            }
            
            // Exponential backoff
            const delay = this.RETRY_DELAY * Math.pow(2, trade.retryCount - 1);
            await sleep(delay);
            
            try {
                await this.submitTradeInternal(trade);
                console.log(`✅ Trade submitted after ${trade.retryCount} retries`);
            } catch (err) {
                console.error(`❌ Retry ${trade.retryCount} failed:`, err);
                this.offlineQueue.push(trade); // Re-queue with incremented count
            }
        }
        
        this.saveOfflineQueue();
        
        if (failedTrades.length > 0) {
            console.warn(`⚠️ ${failedTrades.length} trades falharam após ${this.MAX_RETRIES} tentativas`);
        }
    }
    
    private handleOffline() {
        this.isOnline = false;
        console.log('📴 Offline: Trades serão salvas localmente');
    }
}
```

---

### 5. UX do Trust System

**Badges Visuais**:
```tsx
// components/TradeBadge.tsx
function TradeBadge({ status, sourceCount }: { status: string, sourceCount: number }) {
    if (status === 'VERIFIED') {
        return (
            <div className="flex items-center gap-1 text-emerald-400">
                <Shield className="w-4 h-4" />
                <span className="text-xs">Verificado ({sourceCount} fontes)</span>
            </div>
        );
    }
    
    return (
        <div className="flex items-center gap-1 text-amber-400">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs">Não confirmado</span>
        </div>
    );
}
```

**Filtros**:
```tsx
// Dashboard: Filtro de confiança
<select onChange={(e) => setTrustFilter(e.target.value)}>
    <option value="all">Todas as trades</option>
    <option value="verified">Apenas verificadas</option>
    <option value="pending">Não confirmadas</option>
</select>
```

**Tooltip Explicativo**:
```tsx
<Tooltip content={
    <div>
        <p className="font-bold">Sistema de Verificação</p>
        <p>✅ Verificado: 2+ jogadores reportaram</p>
        <p>⚠️ Não confirmado: Apenas 1 fonte</p>
    </div>
}>
    <HelpCircle className="w-4 h-4" />
</Tooltip>
```

---

## 📋 Fases de Implementação

### Fase 1: Rust Watcher (1 semana)
- [ ] Implementar `check_file_access` command (Tauri)
- [ ] Setup Tauri file watcher com `notify` crate (Debounced Events)
- [ ] Implementar `FileSeeker` (Start at End vs Resume)
- [ ] Parsing Multi-pass (Strategy Pattern para formatos de log)
- [ ] Teste com caracteres especiais e acentos
- [ ] Emissão de eventos para frontend (`emit`)

### Fase 2: Backend (1 semana)
- [ ] Atualizar schema do Supabase
- [ ] Criar RPC `submit_live_trade` com deduplicação
- [ ] Implementar rate limiting
- [ ] Criar RLS policies

### Fase 3: Frontend (1 semana)
- [ ] Criar `LiveMonitor` service
- [ ] Implementar offline queue
- [ ] UI de configuração (path do arquivo)
- [ ] Trust badges e filtros

### Fase 4: Alerts & Polish (1 semana)
- [ ] Sistema de alertas de preço
- [ ] Notificações do SO (Tauri)
- [ ] Dashboard de trades ao vivo
- [ ] Testing completo

---

## ✅ Plano de Testes

### 1. Teste de Concorrência
- Simular 5 usuários reportando mesma trade
- Verificar: `source_count = 5`, `status = VERIFIED`

### 2. Teste de Timestamp Fuzzy
- Alterar relógio em ±4min
- Verificar: Hash idêntico, deduplicação funciona

### 3. Teste de Rate Limiting
- Enviar 150 trades em 1 minuto
- Verificar: Primeiras 100 aceitas, resto rejeitado

### 4. Teste de Offline
- Desconectar internet
- Enviar 10 trades
- Reconectar
- Verificar: Todas enviadas automaticamente

### 5. Teste de Parsing
- Logs com acentos, QL, raridade, múltiplos formatos de preço
- Verificar: Parsing correto em todos os casos

---

## 🎯 Métricas de Sucesso

- ✅ 95%+ de deduplicação correta
- ✅ <100ms latência de detecção
- ✅ 0 crashes por file watching
- ✅ Taxa de verificação >60% (2+ fontes)
- ✅ <1% de falsos positivos em alertas

---
## 📜 Considerações LGPD & Privacidade

- **Natureza dos Dados**: O `trade.txt` contém apenas informações de mercado (item, preço, horário) que são públicas no chat do jogo. Não há dados pessoais identificáveis além do nickname, que já é público.
- **Consentimento**: Mesmo sendo público, a LGPD recomenda oferecer **opt‑out** da coleta automática. Implementamos um *Setup Wizard* que pergunta se o usuário deseja enviar trades em tempo real. A escolha é armazenada em `localStorage` (`autoUploadEnabled`) e pode ser alterada nas *Settings*.
- **Minimização de Dados**: Enviamos apenas os campos necessários (`nick`, `trade_type`, `item`, `price`, `timestamp`, `server`). Campos auxiliares (ex.: versão da BIOS, lag) são descartados.
- **Retenção**: Trades são mantidos no Supabase por **90 dias** e somente após verificação (`VERIFIED`). Uma função de limpeza (`prune_old_trades`) remove registros antigos automaticamente.
- **Transparência**: UI exibe badge “⚖️ LGPD” ao lado da configuração, com tooltip explicando o que é coletado e como revogar o consentimento.
- **Segurança**: Todas as requisições usam HTTPS e o `trade_hash` impede re‑envio de dados sensíveis.

**Timeline Realista**: 4 semanas  
**Risk Level**: Medium  
**Prioridade**: Alta (Killer Feature para Beta)
