# 🐋 TortaApp - Prompt Técnico para Brainstorming

## 📖 Visão Geral

**TortaApp** é um aplicativo desktop multiplataforma para jogadores de **Wurm Online**, focado em análise de dados de gameplay, gerenciamento de perfil de personagem, e monitoramento de mercado em tempo real.

**Versão Atual:** "Venerable Whale" 🐋  
**Plataforma:** Desktop (Windows, macOS, Linux via Tauri)  
**Público-Alvo:** Jogadores hardcore de Wurm Online que buscam vantagem competitiva através de dados

---

## 🏗️ Arquitetura Técnica

### Stack Principal

**Frontend:**
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** TailwindCSS
- **State Management:** React Context API
- **UI Components:** Lucide Icons, Sonner (toasts)
- **Charts:** Recharts (planejado)

**Backend/Desktop:**
- **Runtime:** Tauri 2.0 (Rust)
- **File System:** `@tauri-apps/plugin-fs`
- **Notifications:** `@tauri-apps/plugin-notification`
- **Deep Linking:** `@tauri-apps/plugin-deep-link`
- **Dialog:** `@tauri-apps/plugin-dialog`

**Database:**
- **Provider:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (Google OAuth, Email/Password)
- **Realtime:** Supabase Realtime Subscriptions
- **Storage:** Supabase Storage (para assets)

**Linguagens:**
- TypeScript/JavaScript (Frontend - ~85%)
- Rust (Backend Tauri - ~15%)
- SQL (Queries Supabase)

---

## 🎯 Funcionalidades Principais

### 1. Dashboard de Jogador
- **Overview de Stats:** Total de trades, preço médio, items indexados
- **Activity Heatmap:** Visualização de atividade por dia (últimos 90 dias)
- **Trade History:** Histórico completo de transações
- **My Shouts:** Anúncios públicos do jogador
- **Badges System:** Conquistas automáticas (level ups, milestones)

### 2. Trade Master (Gerenciador de Preços)
- **Casket Pricing:** Sistema de tiers e preços para caskets (QL-based)
- **Bulk Upload:** Importação CSV/Excel de inventário
- **Price Calculator:** Calculadora de preços com markup

### 3. Live Trade Monitor ⭐ (Foco Principal)
**Descrição:** Monitora o arquivo de log do Wurm Online em tempo real, faz parsing de mensagens de trade do chat, e dispara alertas instantâneos.

**Fluxo de Dados:**
```
Wurm Log File → Rust Watcher → Parse Trade → Emit Event → React Context → 
→ Check Alerts → Fire Notification → Store in Supabase
```

**Componentes:**
- `watcher.rs` (Rust): Monitora `_Event.*.txt` via file system watcher
- `TradeEventContext.tsx`: State management, alert logic, persistence
- `LiveTradeSetup.tsx`: UI de configuração (1000+ linhas)
- `AlertService.ts`: Lógica centralizada de matching
- `AdCooldownWidget.tsx`: Timer flutuante de cooldown

**Features Implementadas:**
- ✅ Parsing de WTB/WTS/WTT
- ✅ Alertas por palavra-chave (AND logic)
- ✅ Filtros por trade type
- ✅ Notificações do Windows
- ✅ Histórico de alertas (últimos 10)
- ✅ Estatísticas diárias (WTS/WTB/WTT/Alerts)
- ✅ Modo Não Perturbe (DND) com horários
- ✅ Export/Import de configurações
- ✅ Auto-backup (5 min)
- ✅ Templates de anúncios
- ✅ Timer de cooldown (30 min padrão)
- ✅ Controle de volume persistente
- ✅ Atalhos de teclado (Ctrl+M, Ctrl+T, ESC)

**Dados Capturados por Trade:**
```typescript
interface ParsedTrade {
  timestamp: string;      // ISO 8601
  nick: string;           // Nome do jogador
  type: 'WTB' | 'WTS' | 'WTT';
  message: string;        // Mensagem completa
  item?: string;          // Item mencionado (regex básico)
  price?: string;         // Preço como string (ex: "50s", "1g")
}
```

---

## 🔒 Limitações Atuais

### Técnicas
1. **Parsing Simples:** Regex básico, não extrai QL, material, enchantments
2. **No Price Validation:** Preço é string, não número normalizado
3. **Monolíngue:** Só detecta keywords em inglês
4. **Single Server:** Não distingue entre servidores diferentes
5. **No Scam Detection:** Não valida se preço é suspeito
6. **Limited History:** Só últimos 50 trades em memória
7. **No ML/AI:** Sem previsão de demanda ou análise preditiva

### De Negócio
1. **Dependência de Log:** Requer acesso ao arquivo local do jogo
2. **Desktop Only:** Não funciona em mobile/web
3. **Manual Setup:** Usuário precisa configurar path do log
4. **No Multi-Account:** Um usuário = um personagem
5. **Supabase Costs:** Escala de custos com volume de dados

### UX
1. **Encoding Issues:** Caracteres especiais corrompidos (UTF-8)
2. **UI Inconsistency:** Botões flutuantes com designs diferentes
3. **No Tooltips:** Filtros WTB/WTS/WTT confusos para novos usuários
4. **Large Widget:** Timer widget muito grande e intrusivo

---

## 📊 Dados Disponíveis (Supabase)

### Tabelas Principais

**`trades`**
```sql
- id: uuid
- user_id: uuid (FK)
- timestamp: timestamptz
- nick: text
- type: text (WTB/WTS/WTT)
- message: text
- item: text (nullable)
- price: text (nullable)
- server: text (nullable)
```

**`alerts`**
```sql
- id: uuid
- user_id: uuid (FK)
- term: text
- sound: text
- enabled: boolean
- trade_types: text[] (nullable)
```

**`profiles`**
```sql
- id: uuid (PK, FK to auth.users)
- username: text
- avatar_url: text
- created_at: timestamptz
```

**Queries Disponíveis:**
- Histórico de trades (últimos 30 dias)
- Agregação por item (count, avg price)
- Top traders por volume
- Activity heatmap (trades por dia)

---

## 🎯 Objetivos de Produto

### Curto Prazo (1-2 semanas)
1. **Normalização de Preços:** Converter "50s" → número em cobre
2. **Extração de QL/Material:** Regex avançado
3. **Price Tracker:** Gráficos de preço histórico

### Médio Prazo (1-2 meses)
1. **Market Intelligence:** Trends, demand analysis, volatilidade
2. **Automação:** Sugestão de preço, atalhos de resposta
3. **Social Features:** Reputation system, trade history por player

### Longo Prazo (3-6 meses)
1. **ML/AI:** Demand forecasting, scam detection
2. **Mobile App:** React Native ou PWA
3. **Multi-Server:** Suporte para SFI, Chaos, etc.

---

## 🚫 Restrições e Considerações

### Legais/ToS
- ⚠️ **Auto-Response:** Pode violar ToS do Wurm Online (não implementar)
- ⚠️ **Bot Detection:** Evitar automação que simule jogador
- ✅ **Read-Only Log:** Apenas leitura do log é seguro

### Performance
- **File Watching:** Rust watcher é eficiente, mas log pode ser grande (100MB+)
- **Memory:** Limitar trades em memória (50 max)
- **Supabase RLS:** Row Level Security pode impactar queries complexas

### Segurança
- **API Keys:** Nunca expor no frontend
- **User Data:** LGPD compliance (consentimento obrigatório)
- **Deep Links:** Validar redirect URLs

---

## 💡 Contexto de Wurm Online

**Wurm Online** é um MMORPG sandbox medieval com economia player-driven.

**Sistema de Trade:**
- **Chat-Based:** Trades anunciados em chat global (`/shout`)
- **No Auction House:** Sem sistema centralizado de leilão
- **Moedas:** Copper (c), Silver (s), Gold (g), Diamond (d)
  - 1s = 100c, 1g = 100s, 1d = 100g
- **Items:** Ferramentas, armas, armaduras, recursos, caskets
- **Qualidade (QL):** 1-100, afeta preço drasticamente
- **Raridade:** Normal, Rare, Supreme, Fantastic

**Exemplo de Mensagem:**
```
[10:23:45] <PlayerName> WTS rare supreme pickaxe QL 90 [101] 5g
[10:24:12] <AnotherPlayer> WTB casket harmony 50s
```

---

## 🎨 Estilo de Código

**Convenções:**
- TypeScript strict mode
- Functional components (React Hooks)
- Context API para state global
- Tailwind para styling (utility-first)
- Comentários em português para lógica complexa

**Estrutura de Pastas:**
```
src/
├── components/     # UI components
├── contexts/       # React contexts
├── services/       # Business logic
├── types/          # TypeScript types
├── hooks/          # Custom hooks
└── utils/          # Helper functions

src-tauri/
└── src/
    ├── main.rs
    └── watcher.rs  # File system watcher
```

---

## 📝 Como Usar Este Prompt

**Para Brainstorming:**
1. Cole este prompt completo
2. Adicione contexto específico (ex: "Foco em análise de mercado")
3. Peça sugestões priorizadas por viabilidade técnica

**Para Implementação:**
1. Referencie as limitações atuais
2. Considere o tech stack disponível
3. Respeite as restrições de ToS

**Para Análise:**
1. Use os dados disponíveis no Supabase
2. Considere o volume de dados (escala)
3. Pense em UX mobile-first (futuro)

---

## 🔗 Referências

- [Wurm Online Wiki](https://www.wurmpedia.com/)
- [Tauri Docs](https://tauri.app/)
- [Supabase Docs](https://supabase.com/docs)
- [React Context API](https://react.dev/reference/react/useContext)

---

**Última Atualização:** 12/12/2024  
**Versão do Prompt:** 1.0
## 🚨 Barreiras Críticas e Caminhos Perigosos

> **IMPORTANTE:** Baseado em análise de múltiplas IAs (Manus, ChatGPT, Antigravity), estas são áreas identificadas como **ALTO RISCO** e devem ser evitadas ou abordadas com extrema cautela.

### ⛔ NÃO IMPLEMENTAR (Risco Crítico)

1. **Auto-Response Automático**
   - ⚠️ **Violação de ToS:** Possível violação dos Termos de Serviço do Wurm Online
   - 🚫 **Risco de Ban:** Pode resultar em banimento permanente da conta
   - ✅ **Alternativa Segura:** Sistema de "Quick Copy" (já implementado)

2. **Rewrite Completo da Aplicação**
   - 📊 **Taxa de Falha:** 80% de chance de abandono no meio do processo
   - ⏱️ **Custo de Oportunidade:** 3+ meses sem features novas para usuários
   - 🔄 **Abordagem Correta:** Refatoração incremental e gradual

3. **ML/AI sem Dados Normalizados**
   - 🗑️ **Garbage In, Garbage Out:** Modelos treinados em dados ruins produzem resultados ruins
   - 💰 **Desperdício de Recursos:** Tempo e esforço sem retorno
   - ✅ **Pré-requisito:** Completar Fase 1 (normalização de dados) primeiro

### ⚠️ IMPLEMENTAR COM CAUTELA (Risco Médio)

4. **Scam Detection Heurística**
   - ❌ **Falso Positivo = Oportunidade Perdida:** Usuário pode perder negócio legítimo
   - 🎯 **Abordagem Segura:** Começar com alertas passivos ("preço incomum")
   - 📊 **Pré-requisito:** Coletar dados históricos suficientes primeiro

5. **Multi-Server Real**
   - 📈 **Implementar Sob Demanda:** Só se houver demanda real de usuários
   - 💰 **Custo Adicional:** Aumenta complexidade e custos do Supabase

6. **Modo Offline-First / SQLite Local**
   - 🔄 **Complexidade de Sync:** Adiciona camada complexa de sincronização
   - 💰 **Implementar Sob Demanda:** Só se Supabase ficar caro demais

### 📋 Princípios de Implementação Segura

**Ao considerar novas features, pergunte:**
1. ✅ Viola algum ToS do Wurm Online?
2. ✅ Requer dados normalizados que ainda não temos?
3. ✅ Adiciona complexidade sem validação de demanda?
4. ✅ Pode ser feito incrementalmente ou requer rewrite?
5. ✅ Tem alternativa mais simples e segura?

**Regra de Ouro:** Refatore incrementalmente, nunca rewrite completo.

---
