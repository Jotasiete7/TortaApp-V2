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
| 001 | 🟡 Média | [Feature] | **Tooltip/Info do Shout** | Dica visual explicando shouts, tickers e investimentos. | ✅ Concluído (09/12) |
| 002 | 🟡 Média | [Feature] | **Ticker Refresh Automático** | Implementar refresh a cada 1 minuto. | ✅ Concluído (09/12) |
| 003 | 🟢 Baixa | [Feature] | **Suporte SFI** | Suporte para Southern Freedom Isles (novos servidores). | ⬜ Pendente |
| 004 | 🟢 Baixa | [DevOps] | **Compilação Linux** | Configurar pipeline para .deb/.AppImage. | ⬜ Pendente |
| 005 | 🟡 Média | [Feature] | **Regra de Caskets** | Lógica de Tier e Preços para Caskets. | ✅ Concluído (09/12) |
| 006 | 🔴 Alta | [Fix] | **Badges Automáticos** | Corrigir bug de distribuição de badges no level up. | ✅ Concluído (09/12) |
| 007 | 🟡 Média | [Feature] | **Login UX em Português** | Interface traduzida e intuitiva. | ✅ Concluído (09/12) |
| 008 | 🟢 Baixa | [Feature] | **Navegação Persistente** | Manter página ao recarregar. | ✅ Concluído (09/12) |
| 009 | 🟡 Média | [Fix] | **Modal Delete User** | Confirmação visual para deleção de usuários. | ✅ Concluído (09/12) |
| 010 | 🔴 Alta | [Fix] | **Activity Heatmap** | Corrigir barras empilhadas no gráfico de atividade. | ✅ Concluído (12/12) |
| 011 | 🟡 Média | [Fix] | **Admin Delete Error** | Corrigir referência à tabela inexistente user_streaks. | ✅ Concluído (10/12) |
| 012 | 🔴 Alta | [Fix] | **Google OAuth (Tauri)** | Implementar Deep Linking para login Google funcionar no .exe. | ✅ Concluído (12/12) |
| 013 | 🟡 Média | [Feature] | **Live Trade Alerts** | Notificações do Windows para palavras-chave (ex: "casket"). | ✅ Concluído (12/12) |
| 014 | 🟡 Média | [Feature] | **WTS Timer & Widget** | Widget flutuante de cooldown (30min) e gerenciador de anúncios. | ✅ Concluído (12/12) |
| 015 | 🟢 Baixa | [DevOps] | **Organização do Projeto** | Estruturação de pastas (docs, secrets, resources) e limpeza da raiz. | ✅ Concluído (12/12) |
| 016 | 🟡 Média | [Feature] | **Controle de Volume** | Persistência de volume e mute para alertas e sons do app. | ✅ Concluído (12/12) |
| 017 | 🔴 Alta | [Feature] | **Simplificação do Parser** | Remover modo legado e usar apenas AdvancedParser como modo único. | ✅ Concluído (14/12) |

---

## 🔄 Permanente / Contínuo

Lista de tarefas que nunca "acabam" e exigem atenção constante.

- [Perm] **Otimização de Performance**: Monitorar e melhorar tempo de carregamento.
- [Perm] **Tradução PT-BR**: Manter interfaces sincronizadas.
- [Perm] **Segurança**: Revisar RLS policies no Supabase.

---

## 📊 Resumo

**Total de Tarefas:** 17
**Concluídas:** 15 (88.2%)
**Pendentes:** 2 (11.8%)

**Última Atualização:** 14/12/2024 - Versão "Advanced Only Mode" 🚀

---

## 📝 Notas da Sessão (14/12/2024)

### ✅ Realizado Hoje:
1.  **Simplificação do Parser**:
    *   Removido parser legado (`StandardLogParser`)
    *   Removida trait `LogParser` e abstrações desnecessárias
    *   Removida flag `USE_ADVANCED_PARSING`
    *   Sistema agora usa apenas `AdvancedParser` como modo único
    *   Redução de ~50 linhas de código
    *   Compilação bem-sucedida (9m 27s) com apenas 2 warnings

### ⚠️ Próximos Passos:
-   Testar o watcher com logs reais
-   Verificar se campos avançados estão sendo populados corretamente
-   Validar performance com arquivos grandes

## 📝 Nota de Performance
**IMPORTANTE**: App.tsx ajustado para limite variável:
- DEV: 5.000 registros (rápido)
- PROD: 50.000 registros (completo)
