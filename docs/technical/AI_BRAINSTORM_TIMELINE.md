# 🤖 AI Brainstorm Timeline

Este documento mantém um histórico cronológico de análises e sugestões técnicas de diferentes IAs sobre o projeto TortaApp.

---

## 📅 12 de Dezembro de 2024

### 🔵 Manus AI - Análise Completa do Live Trade Monitor

**Principais Insights:**
- ✅ "A chave é a conversão de strings de preço em dados numéricos"
- ✅ "Transformar dados brutos em inteligência de mercado acionável"
- ✅ "Focar em Parsing Avançado para precisão"

**Recomendações Prioritárias:**
1. **Normalização de Preços** (CRÍTICO)
2. **Extração de QL/Material** (Alto valor)
3. **Price Tracker Interativo** (Market Intelligence)
4. **Demand Analysis** (Oportunidades de mercado)

---

## 📅 13 de Dezembro de 2024

### 🟢 ChatGPT - Review de Produto + Arquitetura

**Principais Insights:**
- 🎯 **"TortaApp não é um 'helper' — é um Market Intelligence Tool"**
- 🏗️ Arquitetura concentrada demais (componentes gigantes)
- 💰 Normalização de preço desbloqueia 80% das features futuras
- 🧠 Domain Layer explícito é fundamental para escalar

**FASE 1 - Estabilização & Base de Inteligência (0-2 semanas):**
1. ✅ Normalização de Preço (Money.fromString(), price_copper no banco)
2. ✅ Separar parsing em camadas (raw → tokens → atributos → normalizado)
3. ✅ Extrair lógica do LiveTradeSetup.tsx (1000+ linhas)
4. ✅ Domain Layer explícito (src/domain/trade/, price/, alert/)

---

### 🟣 Antigravity (Google Deepmind) - Análise Crítica

#### ✅ OURO PURO - Implementar JÁ

1. **Normalização de Preço (Money class)** - 🟢 Alto valor, baixo risco
2. **Tokenização/Pipeline de Parsing** - 🟢 Alto valor, médio risco
3. **Refatorar LiveTradeSetup.tsx** - 🟡 Médio valor, alto risco SE feito errado
4. **Domain Layer explícito** - 🟢 Médio valor, baixo risco

#### ❌ ARMADILHAS - NÃO Fazer Agora

- **Rewrite Completo** - Refatore incrementalmente
- **ML/AI Agora** - Só depois da Fase 2
- **Modo Offline-first** - Só se Supabase ficar caro demais

---

## 🎯 Consenso entre as 3 IAs

### Prioridade Máxima (Unanimidade)
1. ✅ **Normalização de Preços** - Todos concordam que é CRÍTICO
2. ✅ **Pipeline de Parsing Estruturado** - Base para tudo
3. ✅ **Refatoração do LiveTradeSetup** - Dívida técnica perigosa
4. ✅ **Domain Layer** - Organização fundamental

### Concordância em Evitar
- ❌ **Rewrite completo** - Muito arriscado
- ❌ **ML/AI prematuro** - Sem dados normalizados
- ❌ **Auto-Response** - Risco de ToS violation

---

## 🚨 Limitações e Barreiras Críticas

### ⛔ Barreiras Perigosas (NÃO AVANÇAR)

1. **Auto-Response Automático** - Possível violação de ToS do Wurm Online
2. **Rewrite Completo da Aplicação** - 80% de chance de abandono
3. **ML/AI sem Dados Normalizados** - Garbage in, garbage out

### ⚠️ Limitações Técnicas Atuais

1. **Parsing Simples** - Solução: Pipeline de parsing em 3 fases
2. **Preço como String** - Solução: Money class + normalização
3. **Componentes Gigantes** - Solução: Domain Layer + Services + Hooks
4. **Encoding UTF-8** - Solução: Forçar encoding no watcher Rust

---

**Última Atualização:** 13/12/2024
