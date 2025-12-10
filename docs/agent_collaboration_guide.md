# Guia de Colaboração entre Agentes

## Como Agentes Podem Contribuir

### Claude (Perspectiva Técnica)
**Foco**: Implementação, edge cases, robustez

**Contribuições típicas**:
- ✅ Identificar problemas de schema/constraints
- ✅ Sugerir algoritmos mais robustos
- ✅ Apontar edge cases não cobertos
- ✅ Detalhar código de exemplo
- ✅ Especificar testes técnicos

**Exemplo desta sessão**:
- Identificou problema com `UNIQUE constraint` no hash
- Sugeriu 5min window vs 1min para fuzzy hashing
- Adicionou rate limiting explícito
- Especificou UX do trust system

---

### Gemini (Perspectiva Estratégica)
**Foco**: Priorização, impacto no usuário, viabilidade

**Contribuições típicas**:
- ✅ Avaliar se feature vale o esforço
- ✅ Priorizar fases de implementação
- ✅ Identificar "killer features"
- ✅ Sugerir simplificações pragmáticas
- ✅ Contextualizar com estado do projeto

**Exemplo desta sessão**:
- Recomendou engavetar Fase 1 (otimização de DB)
- Priorizou File Watcher como "killer feature"
- Justificou timing (Beta é momento certo)
- Propôs Trust System para segurança

### Antigravity (Perspectiva de Implementação & Robustez)
**Foco**: Detalhes de baixo nível, Integração OS (Tauri), UX de Borda, Compliance

**Contribuições típicas**:
- ✅ Validar viabilidade específica de plataforma (Windows/Tauri)
- ✅ Definir estratégias de recuperação de falha (Seek vs Catchup)
- ✅ Patterns de código robustos (Strategy para Regex)
- ✅ Requisitos não-funcionais (Privacidade/Consentimento/GDPR)
- ✅ Prevenção de "Tela Branca" ou erros silenciosos

**LGPD & Privacidade**: Dados do `trade.txt` são públicos, mas oferecemos opt‑out via Setup Wizard; retenção 90 dias, minimização de campos, transparência UI.

**Exemplo desta sessão**:
- Exigiu check de permissões antes de iniciar watcher
- Definiu estratégia de startup `SeekToEnd` para evitar travas
- Propôs Parsing Multi-pass para suportar múltiplos idiomas/formatos
- Lembrou do Setup Wizard para consentimento explícito


### Claude (Revisão Técnica Detalhada)
**Foco**: Code review profundo, race conditions, edge cases de implementação

**Contribuições nesta revisão**:
- 🔍 **Race Condition no RPC**: Identificou possível violação de constraint entre SELECT e UPDATE (linhas 159-172)
- 🔍 **Bug no Price Parsing**: Regex não extrai corretamente "1s50c" - precisa de refatoração
- 🔍 **Memory Leak na Offline Queue**: Loop infinito se retry falhar - adicionar limite de tentativas
- 🔍 **Missing Index**: Dashboard precisa de `idx_server_status_time` para queries eficientes
- 🔍 **Rate Limit Bypass**: Validação de timestamp permite submissão de trades antigas
- 🔍 **RLS Policies**: Especificou as 3 policies necessárias (não estavam detalhadas no plano)

**Padrão de revisão**:
1. Ler código linha por linha procurando por race conditions
2. Testar mentalmente edge cases (ex: "e se dois usuários submitarem ao mesmo tempo?")
3. Verificar se índices cobrem queries reais do dashboard
4. Procurar por loops que podem não terminar
5. Validar que toda entrada do usuário é sanitizada

---

## Processo de Revisão Iterativa

### 1. Plano Inicial (Proto)
- Um agente cria plano base
- Salvar como `proto_plan_v1.md`

### 2. Revisão Crítica
- Outro agente analisa:
  - ✅ O que está correto
  - ⚠️ O que precisa atenção
  - 🚨 O que está faltando

### 3. Plano Refinado
- Incorporar insights de ambos
- Documentar origem das mudanças
- Manter rastreabilidade

### 4. Validação com Usuário
- Apresentar ambas as versões
- Explicar trade-offs
- Obter aprovação final

---

## Checklist de Gaps Comuns

### Arquitetura
- [ ] Edge cases cobertos?
- [ ] Fallbacks para erros?
- [ ] Performance considerada?
- [ ] Segurança avaliada?

### Dados
- [ ] Schema suporta casos futuros?
- [ ] Índices para queries frequentes?
- [ ] Constraints muito restritivos?
- [ ] Migração de dados planejada?

### UX
- [ ] Estados de erro visíveis?
- [ ] Loading states definidos?
- [ ] Feedback ao usuário claro?
- [ ] Acessibilidade considerada?

### DevOps
- [ ] Rollback possível?
- [ ] Monitoramento definido?
- [ ] Logs suficientes?
- [ ] Feature flags planejadas?

### Timeline
- [ ] Estimativa realista?
- [ ] Dependências identificadas?
- [ ] Riscos mapeados?
- [ ] Milestones claros?

---

## Exemplo de Colaboração Efetiva

**Situação**: Plano de File Watcher

**Gemini identificou**:
- Prioridade estratégica (fazer agora vs depois)
- Impacto no usuário (killer feature)
- Timing correto (Beta)

**Claude identificou**:
- Problemas técnicos (hash, schema)
- Gaps de implementação (rate limiting, offline)
- Necessidade de especificação (UX, testes)

**Antigravity identificou**:
- Gaps de robustez (permissão de arquivo, startup strategy)
- Soluções de código (Regex strategy pattern)
- Requisitos legais (Consentimento do usuário)
- Prevenção de UX ruim (travar app lendo logs velhos)

**Resultado**:
- Plano refinado com visão completa
- Estratégia + Técnica + Robustez alinhadas
- Definição clara do QUE fazer e COMO fazer


---

## Dicas para Usuário

### Quando pedir revisão de agente
- Planos grandes (>1 semana de trabalho)
- Features críticas
- Mudanças de arquitetura
- Quando houver incerteza

### Como aproveitar melhor
1. Deixe um agente criar plano inicial
2. Peça ao outro para revisar criticamente
3. Compare perspectivas
4. Decida baseado em contexto do projeto

### Sinais de que precisa refinamento
- Plano muito vago
- Faltam detalhes técnicos
- Não menciona riscos
- Timeline irrealista
- Não considera edge cases
