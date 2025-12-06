# Especificações Técnicas: Gamificação (Badges & Shouts)

Este documento reúne os detalhes técnicos, schemas de banco de dados e lógica de frontend necessários para desenvolver as funcionalidades de **Badges (Conquistas)** e **Shouts (Gritos/Anúncios)** no Torta App.

---

## 1. Stack Tecnológica Atual

*   **Frontend**: React (Vite), TypeScript, TailwindCSS.
*   **Backend/DB**: Supabase (PostgreSQL), Row Level Security (RLS).
*   **Ícones**: Lucide-React.
*   **Estado Global**: React Context (AuthContext).

---

## 2. Sistema de Badges (Conquistas)

### Objetivo
Permitir que usuários ganhem badges por conquistas (ex: Admin, Top Seller, Patreon) e escolham até **5 badges** para exibir em seu perfil e no cabeçalho do Overview.

### Banco de Dados (Supabase)

Já existe um script de migração inicial (`06_badges_system.sql`) com a seguinte estrutura:

**Tabela: `badges`**
*   `id` (UUID, PK): Identificador único.
*   `slug` (TEXT, Unique): Identificador legível (ex: `admin`, `patreon_tier1`).
*   `name` (TEXT): Nome de exibição (ex: "Administrator").
*   `description` (TEXT): Descrição (ex: "System Administrator").
*   `icon_name` (TEXT): Nome do ícone da biblioteca Lucide (ex: `Shield`, `Award`).
*   `color` (TEXT): Cor do badge (ex: `amber`, `purple`).

**Tabela: `user_badges`**
*   `id` (UUID, PK).
*   `user_id` (UUID, FK -> `auth.users`).
*   `badge_id` (UUID, FK -> `badges`).
*   `earned_at` (TIMESTAMP): Data da conquista.
*   `is_displayed` (BOOLEAN): Se o usuário escolheu exibir este badge (Max 5 true por usuário).

**Função RPC: `update_displayed_badges`**
*   Recebe uma lista de IDs de badges.
*   Reseta todos os `is_displayed` do usuário para `false`.
*   Define `is_displayed = true` para os IDs fornecidos (limitando a 5 no backend para segurança).

### Frontend (Componentes a Criar/Alterar)

1.  **`BadgeService.ts`**:
    *   `getAllBadges()`: Busca todas as definições de badges.
    *   `getUserBadges(userId)`: Busca badges ganhos pelo usuário.
    *   `setDisplayBadges(badgeIds[])`: Chama a RPC `update_displayed_badges`.

2.  **`BadgeSelector.tsx` (Novo Componente)**:
    *   Modal/Janela no perfil do usuário.
    *   Lista todos os badges ganhos.
    *   Checkbox/Select para escolher até 5.
    *   Validação visual (desabilitar checkboxes após selecionar 5).

3.  **`PlayerProfile.tsx` & `Dashboard.tsx` (Alterações)**:
    *   Buscar e exibir os badges onde `is_displayed === true`.
    *   No `Dashboard` (Overview), exibir ao lado do Nick.
    *   No `PlayerProfile`, exibir em destaque.

---

## 3. Sistema de Shouts (Anúncios Gratuitos)

### Objetivo
Conceder aos usuários ativos **3 Shouts Semanais**, com um teto não cumulativo de **10 Shouts Mensais**. O Shout é uma mensagem de destaque (Ticker) gratuita.

### Banco de Dados (Proposta)

**Tabela: `user_shout_balance`**
*   `user_id` (UUID, PK, FK -> `auth.users`).
*   `weekly_shouts_remaining` (INT, Default 3): Reseta toda semana.
*   `monthly_shouts_remaining` (INT, Default 10): Reseta todo mês.
*   `last_weekly_reset` (TIMESTAMP).
*   `last_monthly_reset` (TIMESTAMP).

**Tabela: `shouts` (ou uso da tabela `ticker_messages` existente)**
*   Adicionar coluna `is_free_shout` (BOOLEAN) na tabela `ticker_messages`.
*   Adicionar coluna `shout_deducted_from` (UUID) para rastreio.

### Lógica de Negócio (Backend/Edge Functions ou RPC)

1.  **Reset Automático (Cron ou Trigger)**:
    *   Precisamos de uma função que rode periodicamente (ou na tentativa de uso) para verificar se passou 1 semana/1 mês e resetar os contadores.
    *   *Lógica "Lazy Reset"*: Quando o usuário tenta usar um shout, verificamos `last_weekly_reset`. Se faz mais de 7 dias, resetamos `weekly_shouts_remaining` para 3 e atualizamos a data.

2.  **Consumo de Shout**:
    *   Ao enviar uma mensagem:
        *   Verificar se `weekly_shouts_remaining > 0` E `monthly_shouts_remaining > 0`.
        *   Deduzir 1 de ambos.
        *   Inserir mensagem na tabela `ticker_messages` com `paid = true` (ou flag específica de shout).

### Frontend (Componentes)

1.  **`ShoutBox.tsx` (Novo Componente ou Integração no Perfil)**:
    *   Exibir saldo atual: "Você tem X Shouts esta semana".
    *   Input de texto para a mensagem.
    *   Botão "Gritar para o Mundo" (Desabilitado se saldo for 0).

2.  **Integração com `NewsTicker.tsx`**:
    *   Garantir que os Shouts apareçam no ticker rotativo.

---

## 4. Fluxo de Desenvolvimento Sugerido

1.  **Banco de Dados**:
    *   Rodar `06_badges_system.sql` no Supabase.
    *   Criar script `07_shouts_system.sql` para as tabelas de saldo de shouts.

2.  **Backend (Supabase)**:
    *   Criar Policies RLS para garantir que ninguém altere seu próprio saldo de shouts manualmente.
    *   Criar RPC `use_free_shout(message_text)` que encapsula a lógica de verificação, dedução e inserção.

3.  **Frontend**:
    *   Criar interfaces TypeScript em `types.ts`.
    *   Implementar `BadgeService` e `ShoutService`.
    *   Criar componentes de UI.

---

## 5. Exemplo de Dados (JSON)

**Exemplo de Objeto Badge:**
```json
{
  "id": "uuid...",
  "slug": "dirt_seller",
  "name": "Dirt Tycoon",
  "description": "Sold over 100k dirt",
  "icon": "Shovel",
  "color": "brown"
}
```

**Exemplo de Objeto UserBadge:**
```json
{
  "user_id": "uuid...",
  "badge_id": "uuid...",
  "earned_at": "2025-12-05T10:00:00Z",
  "is_displayed": true
}
```
