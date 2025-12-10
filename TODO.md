# 📝 Lista de Tarefas (TODO)

Este arquivo rastreia recursos planejados, melhorias e tarefas contínuas para o TortaApp.

## 📌 Convenções

### Prioridades
- **🔴 Alta**: Crítico ou bloqueador. Deve ser feito o mais rápido possível.
- **🟡 Média**: Importante, mas não crítico. Planejado para próximas atualizações.
- **🟢 Baixa**: Bom ter (Nice to have). Baixa urgência.

### Tipos/Tags
- **[Feature]**: Nova funcionalidade.
- **[Fix]**: Correção de bug.
- **[Doc]**: Documentação.
- **[Perm]**: Permanente/Recorrente (Melhoria contínua).
- **[DevOps]**: Infraestrutura e Build.

---

## 🚀 Futuro & Planejamento

| ID | Prioridade | Tipo | Tarefa | Detalhes | Status |
|----|------------|------|--------|----------|--------|
| 001 | 🟡 Média | [Feature] | **Tooltip/Info do Shout** | Adicionar dica visual (ao lado ou abaixo do shout) explicando:<br>• Duração dos tickers<br>• Funcionamento do ganho de shouts<br>• Tickers Premium: Investimento vai para **Prêmios** e **Banco de Dados**<br>• Ticker de Admin<br>• Cores do Market Standard | ✅ Concluído (09/12) |
| 002 | 🟡 Média | [Feature] | **Ticker Refresh Automático** | Implementar refresh a cada 1 minuto para receber shouts instantaneamente. | ✅ Concluído (09/12) |
| 003 | 🔴 Alta | [Feature] | **Suporte SFI (Southern Freedom Isles)** | Implementação do app para o cluster SFI (Ilhas e servers novos com chat de mercado separado do NFI). | ⬜ Pendente |
| 004 | 🟢 Baixa | [DevOps] | **Compilação Linux** | Configurar ambiente ou pipeline (GitHub Actions) para gerar executáveis Linux (.deb/.AppImage) oficialmente. | ⬜ Pendente |
| 005 | 🟡 Média | [Feature] | **Regra de Caskets (Trade)** | Desenvolver lógica para Caskets: Diferença de Tier e Preços no upload/identificação. | ✅ Concluído (09/12) |
| 006 | 🔴 Alta | [Fix] | **Badges Automáticos (Bug)** | Corrigir bug onde usuários (ex: padrejarbas) sobem de nível mas não ganham badges iniciais. | ✅ Concluído (09/12) |
| 007 | 🟡 Média | [Feature] | **Login UX em Português** | Interface de login 100% em português com mensagens claras e tooltip para novos usuários. | ✅ Concluído (09/12) |
| 008 | 🟢 Baixa | [Feature] | **Navegação Persistente** | Manter página atual ao dar F5 (localStorage). | ✅ Concluído (09/12) |
| 009 | 🟡 Média | [Fix] | **Modal de Confirmação - Delete User** | Adicionar modal visual em português para confirmar deleção de usuários no Admin Panel. | ✅ Concluído (09/12) |
| 010 | 🔴 Alta | [Fix] | **Activity Heatmap - Date Distribution** | Corrigir bug onde todas as barras aparecem empilhadas em vez de distribuídas no calendário. | ⬜ Pendente (Debug necessário) |
| 011 | 🟡 Média | [Fix] | **Admin Delete - user_streaks Error** | Remover referência à tabela user_streaks que não existe na função admin_delete_user. | ⬜ Pendente (SQL criado) |

## 🔄 Permanente / Contínuo

Lista de tarefas que nunca "acabam" e exigem atenção constante.

- [Perm] **Otimização de Performance**: Monitorar e melhorar tempo de carregamento e uso de memória.
- [Perm] **Tradução PT-BR**: Manter `README_PT.md` e interfaces sincronizadas com novas features.
- [Perm] **Segurança**: Revisar RLS policies no Supabase regularmente.

---

## 📊 Resumo

**Total de Tarefas:** 11  
**Concluídas:** 7 (64%)  
**Pendentes:** 4 (36%)

**Última Atualização:** 09/12/2024 - Versão "Venerable Whale" 🐋

---

## 📝 Notas da Sessão (09/12/2024)

### ✅ Implementado Hoje:
1. Sistema de Caskets (Parser + Tier badges + Fair Price)
2. 18 Badges (Seller, Buyer, Treasure, Pioneer, Verdant Vicar, Beta Tester)
3. Login em Português
4. Ticker Auto-Refresh (60s)
5. Navegação Persistente (localStorage)
6. Admin Delete Fix (Foreign Key cleanup)
7. Modal Delete Confirmation (português + "DELETAR")
8. Tooltip Shout Info (modal explicativo)

### ⚠️ Bugs Encontrados (Para Amanhã):
1. **Activity Heatmap** - Barras empilhadas (fix aplicado mas não funcionou)
2. **Admin Delete** - Erro "user_streaks does not exist" (SQL corrigido criado)

### 📁 Arquivos Criados:
- `44_fix_admin_delete_CORRECTED.sql` - Fix do admin delete
- `CLEANUP_CASKETS_FIXED.sql` - Limpeza de caskets sem QL
- `HEATMAP_FIX_WITH_DEBUG.md` - Debug do heatmap


## 📝 Nota de Performance (10/12/2024)

**IMPORTANTE**: App.tsx foi modificado para usar limite baseado em ambiente:
- DEV: 5.000 registros (mais leve para testes no navegador)
- PROD: 50.000 registros (dados completos para app instalado)

Backup salvo em: `App.tsx.backup_before_dev_limit`

Quando compilar nova versão, verificar se o limite está correto.


## 📝 Nota de Performance (10/12/2024)

**IMPORTANTE**: App.tsx foi modificado para usar limite baseado em ambiente:
- DEV: 5.000 registros (mais leve para testes no navegador)
- PROD: 50.000 registros (dados completos para app instalado)

Backup salvo em: `App.tsx.backup_before_dev_limit`

Quando compilar nova versão, verificar se o limite está correto.
