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
| 015 | 🟢 Baixa | [DevOps] | **Organização do Projeto** | Estruturação de pastas e limpeza da raiz (_archive). | ✅ Concluído (08/01) |
| 016 | 🟡 Média | [Feature] | **Controle de Volume** | Persistência de volume e mute para alertas e sons do app. | ✅ Concluído (12/12) |
| 017 | 🔴 Alta | [Feature] | **Simplificação do Parser** | Remover modo legado e usar apenas AdvancedParser como modo único. | ✅ Concluído (14/12) |
| 018 | 🔴 Alta | [DevOps] | **Auto-Update Signing (CI/CD)** | Corrigir automação de chaves/assinatura. (Adiado v2.1.5) | ⬜ Pendente |
| 019 | 🟡 Média | [Fix] | **Daily Badge Notification** | Corrigir notificação repetida ao reivindicar check-in diário. | ✅ Concluído (05/01/2026) |

---

## 🔄 Permanente / Contínuo

Lista de tarefas que nunca "acabam" e exigem atenção constante.

- [Perm] **Otimização de Performance**: Monitorar e melhorar tempo de carregamento.
- [Perm] **Tradução PT-BR**: Manter interfaces sincronizadas.
- [Perm] **Segurança**: Revisar RLS policies no Supabase.

---

## 📊 Resumo

**Total de Tarefas:** 19
**Concluídas:** 16 (84.2%)
**Pendentes:** 3 (15.8%)

**Última Atualização:** 05/01/2026 - Correção de Bug (Notificação Diária)
---

## 📝 Notas da Sessão (05/01/2026) - Correção de Bug de Notificação

### ✅ Realizado Hoje:
1.  **Investigação e Correção de Bug**:
    -   Identificado problema onde a notificação de badge era disparada repetidamente ao clicar em "Claim today".
    -   Implementado método idempotente `processNewAchievements` no `GamificationService`.
    -   Atualizado `GamificationRules` para usar este método, garantindo notificações únicas.

### ⚠️ Próximos Passos:
-   Continuar monitoramento de bugs do modo visitante e novas features.


---

## 📝 Notas da Sessão (30/12/2024) - Release v2.0.3 "Fat Rabbit" 🐇

### ✅ Realizado Hoje:
1.  **Refinamento visual (UI/UX)**:
    -   Settings redesenhadas (Grid layout compacto)
    -   Sidebar com tipografia balanceada e logo ajustado
    -   Botão "Monitor" com pulso e melhor visibilidade
2.  **Funcionalidades**:
    -   Sistema i18n completo (Toggle EN/PT)
    -   NewsTicker bilíngue
3.  **Release Engineering**:
    -   Bump de versão `v2.0.3`
    -   Build manual de MSI/EXE bem-sucedido
    -   `latest.json` gerado (Manual Mode)

### ⚠️ Próximos Passos (Dívida Técnica):
-   **Resolver assinatura digital**: O ambiente Windows está dificultando a propagação de chaves privadas via env vars. Para a v2.0.4, precisamos de um pipeline de assinatura robusto ou usar GitHub Actions para gerar os artefatos assinados.
-   Reabilitar Auto-Update no `latest.json`.

## 📝 Nota de Performance
**IMPORTANTE**: App.tsx ajustado para limite variável:
- DEV: 5.000 registros (rápido)
- PROD: 50.000 registros (completo)
