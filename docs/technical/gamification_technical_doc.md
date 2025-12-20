Documentação Técnica: Gamificação & Profile System
📋 Visão Geral
Este documento descreve a arquitetura técnica do sistema de gamificação e perfis de jogadores do TortaApp, incluindo fluxo de dados, camadas de serviço, estrutura de banco de dados e propostas de melhorias.

🏗️ Arquitetura Atual
Camadas do Sistema
┌─────────────────────────────────────────────────────────┐
│                    UI LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ PlayerProfile│  │ LevelUpOverlay│  │ BadgeSelector│  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Achievement  │  │ Leaderboard  │  │ ShoutBox     │  │
│  │ Panel        │  │              │  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                  SERVICE LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Intelligence │  │ BadgeService │  │ ShoutService │  │
│  │ Service      │  │              │  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────┐  ┌──────────────┐                    │
│  │ SoundService │  │ EmojiService │                    │
│  └──────────────┘  └──────────────┘                    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                  DATA LAYER                             │
│                   (Supabase)                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ profiles     │  │ trade_logs   │  │ badges       │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────┐  ┌──────────────┐                    │
│  │ user_badges  │  │ shouts       │                    │
│  └──────────────┘  └──────────────┘                    │
└─────────────────────────────────────────────────────────┘
🔄 Fluxo de Dados: Profile & Gamification
1. Carregamento do PlayerProfile
// FLUXO ATUAL
PlayerProfile.tsx (UI)
    ↓
loadProfileData()
    ↓
IntelligenceService.getPlayerStatsAdvanced(nick)
    ↓
┌─────────────────────────────────────────┐
│ 1️⃣ Tentar RPC (se existir)             │
│    get_player_stats_advanced()          │
│         ↓ (404 Error)                   │
│ 2️⃣ Fallback: Query trade_logs          │
│    - Calcular WTS/WTB counts            │
│    - Calcular volume, avg_price         │
│    - Contar unique_items                │
│    - Determinar first/last seen         │
│         ↓ (Sem dados)                   │
│ 3️⃣ Fallback: Query profiles            │
│    - Buscar level, xp, badges           │
│    - Retornar dados de gamificação      │
│         ↓ (Ainda sem dados)             │
│ 4️⃣ Fallback Final: Mock Data           │
│    - Retornar objeto vazio              │
│    - level: 0, xp: 0, badges: []        │
└─────────────────────────────────────────┘
    ↓
Retorna PlayerStatsAdvanced
    ↓
PlayerProfile renderiza:
    - Level badge
    - XP progress bar
    - Badges conquistados
    - Trade history
    - Activity chart
2. Sistema de Level-Up
// LISTENER EM TEMPO REAL (App.tsx)
useEffect(() => {
    const channel = supabase
        .channel('global-level-listener')
        .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`
        }, (payload) => {
            const diff = payload.new.level - payload.old.level;
            if (diff > 0) {
                // 🎉 Level Up detectado!
                setNewLevel(payload.new.level);
                setShowLevelUp(true);
                SoundService.play('level_up');
            }
        })
        .subscribe();
}, [user]);
// CÁLCULO DE XP (Backend ou Frontend)
// Opção A: Trigger no Supabase
CREATE OR REPLACE FUNCTION update_player_level()
RETURNS TRIGGER AS $$
BEGIN
    NEW.level := (
        SELECT level FROM levels 
        WHERE NEW.total_trades >= min_trades 
        AND NEW.total_trades < max_trades
        LIMIT 1
    );
    NEW.xp := NEW.total_trades * 100; -- XP_PER_TRADE
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
// Opção B: Cálculo no Frontend
const calculateLevel = (totalTrades: number): number => {
    const level = LEVELS.find(l => 
        totalTrades >= l.minTrades && 
        totalTrades < l.maxTrades
    );
    return level?.level || 1;
};
3. Sistema de Badges
// FLUXO DE BADGES
BadgeService.getUserBadges(userId)
    ↓
Query: user_badges JOIN badges
    ↓
Retorna: UserBadge[] {
    id, user_id, badge_id,
    earned_at, is_displayed,
    badge: {
        name, description, icon,
        color, rarity
    }
}
    ↓
PlayerProfile renderiza badges
    ↓
Usuário clica "Edit Badges"
    ↓
BadgeSelector abre
    ↓
Usuário seleciona até 5 badges
    ↓
BadgeService.setDisplayBadges([badge_ids])
    ↓
RPC: update_displayed_badges()
    ↓
Atualiza is_displayed = true/false
📊 Estrutura de Dados
Interface: PlayerStatsAdvanced
export interface PlayerStatsAdvanced {
    // Identificação
    nick: string;
    user_id?: string;
    
    // Estatísticas de Trade
    total: number;              // Total de trades (usado como XP base)
    wts_count: number;          // Quantidade de WTS
    wtb_count: number;          // Quantidade de WTB
    avg_price: number;          // Preço médio
    total_volume: number;       // Volume total negociado
    unique_items: number;       // Itens únicos negociados
    
    // Timestamps
    first_seen: string;         // Primeira trade registrada
    last_seen: string;          // Última trade registrada
    
    // Gamificação
    xp: number;                 // Experiência (total * XP_PER_TRADE)
    level: number;              // Nível atual (1-50)
    rank_position: number;      // Posição no ranking global
    
    // Metadados
    pc_count: number;           // Price checks realizados
    fav_server?: string;        // Servidor favorito
    favorite_items: string[];   // Itens mais negociados
}
Tabela: profiles
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    game_nick TEXT UNIQUE NOT NULL,
    
    -- Stats básicos
    total_trades INTEGER DEFAULT 0,
    wts_count INTEGER DEFAULT 0,
    wtb_count INTEGER DEFAULT 0,
    avg_price NUMERIC DEFAULT 0,
    total_volume NUMERIC DEFAULT 0,
    unique_items INTEGER DEFAULT 0,
    
    -- Gamificação
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    
    -- Timestamps
    first_seen TIMESTAMP WITH TIME ZONE,
    last_seen TIMESTAMP WITH TIME ZONE,
    
    -- Metadados
    fav_server TEXT,
    is_verified BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Índices para performance
CREATE INDEX idx_profiles_game_nick ON profiles(game_nick);
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_level ON profiles(level DESC);
CREATE INDEX idx_profiles_total_trades ON profiles(total_trades DESC);
Tabela: badges
CREATE TABLE badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT NOT NULL,           -- Emoji ou nome do ícone
    color TEXT DEFAULT 'slate',   -- Cor do badge
    rarity TEXT DEFAULT 'common', -- common, rare, epic, legendary
    
    -- Critérios de conquista (JSON)
    requirements JSONB,
    -- Exemplo: {"type": "trades", "value": 1000}
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Badges padrão
INSERT INTO badges (name, description, icon, color, rarity, requirements) VALUES
('First Trade', 'Complete your first trade', '🎯', 'blue', 'common', '{"type":"trades","value":1}'),
('Trader', 'Complete 100 trades', '📜', 'cyan', 'common', '{"type":"trades","value":100}'),
('Merchant', 'Complete 1,000 trades', '📦', 'emerald', 'rare', '{"type":"trades","value":1000}'),
('Tycoon', 'Complete 10,000 trades', '💰', 'gold', 'epic', '{"type":"trades","value":10000}'),
('Trade God', 'Complete 100,000 trades', '👑', 'purple', 'legendary', '{"type":"trades","value":100000}');
Tabela: user_badges
CREATE TABLE user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
    
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_displayed BOOLEAN DEFAULT false, -- Se aparece no perfil
    
    UNIQUE(user_id, badge_id) -- Um badge por usuário
);
-- Índices
CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX idx_user_badges_displayed ON user_badges(user_id, is_displayed) WHERE is_displayed = true;
🎮 Sistema de Níveis
Constantes (constants/gamification.ts)
export const XP_PER_TRADE = 100;
export const LEVELS = [
    { level: 1, name: 'Novice Trader', minTrades: 0, maxTrades: 100 },
    { level: 2, name: 'Apprentice', minTrades: 100, maxTrades: 250 },
    // ... até level 50
    { level: 50, name: 'Wurm Trade God', minTrades: 10000000, maxTrades: 999999999 }
];
Cálculo de Progresso
const getLevelProgress = (totalTrades: number): {
    level: number;
    currentXP: number;
    requiredXP: number;
    progress: number;
} => {
    const currentLevel = LEVELS.find(l => 
        totalTrades >= l.minTrades && 
        totalTrades < l.maxTrades
    ) || LEVELS[0];
    
    const currentXP = (totalTrades - currentLevel.minTrades) * XP_PER_TRADE;
    const requiredXP = (currentLevel.maxTrades - currentLevel.minTrades) * XP_PER_TRADE;
    const progress = (currentXP / requiredXP) * 100;
    
    return {
        level: currentLevel.level,
        currentXP,
        requiredXP,
        progress: Math.min(progress, 100)
    };
};
🔧 Propostas de Melhoria
1. Separação de Responsabilidades
Problema Atual: 
intelligence.ts
 está fazendo muitas coisas (stats, gamificação, rankings).

Proposta: Criar serviços especializados

// services/profileService.ts
export const ProfileService = {
    getProfile: async (nick: string): Promise<Profile | null> => {
        // Busca dados do perfil (level, xp, badges)
    },
    
    updateProfile: async (userId: string, data: Partial<Profile>) => {
        // Atualiza perfil
    },
    
    calculateLevel: (totalTrades: number): number => {
        // Cálculo de nível
    }
};
// services/gamificationService.ts
export const GamificationService = {
    checkAchievements: async (userId: string) => {
        // Verifica e concede achievements
    },
    
    awardBadge: async (userId: string, badgeId: string) => {
        // Concede badge
    },
    
    getLevelProgress: (totalTrades: number) => {
        // Retorna progresso do nível
    }
};
// intelligence.ts continua focado em:
// - Market intelligence
// - Trade analytics
// - Price trends
// - Arbitrage opportunities
2. Cache de Dados de Perfil
Problema: Queries repetidas ao Supabase para os mesmos dados.

Proposta: Implementar cache local

// services/cacheService.ts
class ProfileCache {
    private cache = new Map<string, {
        data: PlayerStatsAdvanced;
        timestamp: number;
    }>();
    
    private TTL = 5 * 60 * 1000; // 5 minutos
    
    get(nick: string): PlayerStatsAdvanced | null {
        const entry = this.cache.get(nick);
        if (!entry) return null;
        
        if (Date.now() - entry.timestamp > this.TTL) {
            this.cache.delete(nick);
            return null;
        }
        
        return entry.data;
    }
    
    set(nick: string, data: PlayerStatsAdvanced) {
        this.cache.set(nick, {
            data,
            timestamp: Date.now()
        });
    }
    
    invalidate(nick: string) {
        this.cache.delete(nick);
    }
}
export const profileCache = new ProfileCache();
// Uso em intelligence.ts
getPlayerStatsAdvanced: async (nick: string) => {
    // Tentar cache primeiro
    const cached = profileCache.get(nick);
    if (cached) return cached;
    
    // Buscar do Supabase
    const data = await fetchFromSupabase(nick);
    
    // Armazenar em cache
    if (data) profileCache.set(nick, data);
    
    return data;
}
3. Sincronização Automática de Stats
Problema: profiles.total_trades pode ficar desatualizado em relação a trade_logs.

Proposta: Trigger automático no Supabase

-- Trigger para atualizar stats automaticamente
CREATE OR REPLACE FUNCTION sync_profile_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar contadores na tabela profiles
    UPDATE profiles
    SET 
        total_trades = (
            SELECT COUNT(*) FROM trade_logs 
            WHERE LOWER(nick) = LOWER(NEW.nick)
        ),
        wts_count = (
            SELECT COUNT(*) FROM trade_logs 
            WHERE LOWER(nick) = LOWER(NEW.nick) 
            AND trade_type = 'WTS'
        ),
        wtb_count = (
            SELECT COUNT(*) FROM trade_logs 
            WHERE LOWER(nick) = LOWER(NEW.nick) 
            AND trade_type = 'WTB'
        ),
        last_seen = NEW.trade_timestamp_utc,
        updated_at = NOW()
    WHERE LOWER(game_nick) = LOWER(NEW.nick);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER update_profile_on_trade
AFTER INSERT ON trade_logs
FOR EACH ROW
EXECUTE FUNCTION sync_profile_stats();
4. Sistema de Achievements Automático
Proposta: Verificar achievements após cada trade

// services/achievementEngine.ts
export const AchievementEngine = {
    async checkAndAward(userId: string, stats: PlayerStatsAdvanced) {
        const allBadges = await BadgeService.getAllBadges();
        const userBadges = await BadgeService.getUserBadges(userId);
        const earnedIds = new Set(userBadges.map(ub => ub.badge_id));
        
        for (const badge of allBadges) {
            // Já tem esse badge?
            if (earnedIds.has(badge.id)) continue;
            
            // Verifica critério
            const req = badge.requirements;
            let earned = false;
            
            switch (req.type) {
                case 'trades':
                    earned = stats.total >= req.value;
                    break;
                case 'wts':
                    earned = stats.wts_count >= req.value;
                    break;
                case 'wtb':
                    earned = stats.wtb_count >= req.value;
                    break;
                // ... outros tipos
            }
            
            if (earned) {
                await BadgeService.awardBadge(userId, badge.id);
                // Notificar usuário
                await this.notifyAchievement(userId, badge);
            }
        }
    },
    
    async notifyAchievement(userId: string, badge: Badge) {
        // Mostrar AchievementNotification
        // Tocar som
        // Enviar notificação do sistema (opcional)
    }
};
5. Ranking Global Eficiente
Problema: Calcular rank_position para cada player é custoso.

Proposta: Materialized View + atualização periódica

-- View materializada para rankings
CREATE MATERIALIZED VIEW player_rankings AS
SELECT 
    game_nick,
    total_trades,
    level,
    ROW_NUMBER() OVER (ORDER BY total_trades DESC) as rank_position
FROM profiles
WHERE is_verified = true
ORDER BY total_trades DESC;
-- Índice para busca rápida
CREATE INDEX idx_player_rankings_nick ON player_rankings(game_nick);
-- Refresh automático (via cron job ou trigger)
REFRESH MATERIALIZED VIEW CONCURRENTLY player_rankings;
-- Função para buscar rank
CREATE OR REPLACE FUNCTION get_player_rank(player_nick text)
RETURNS INTEGER AS $$
    SELECT rank_position 
    FROM player_rankings 
    WHERE LOWER(game_nick) = LOWER(player_nick);
$$ LANGUAGE sql STABLE;
🎯 Decisões de Arquitetura
Por que intelligence.ts centraliza os dados?
Vantagens:

✅ Ponto único de acesso aos dados
✅ Facilita implementação de cache
✅ Consistência nas queries
✅ Fallbacks centralizados
Desvantagens:

❌ Arquivo grande e complexo
❌ Mistura responsabilidades (market + profile + gamification)
❌ Dificulta testes unitários
Proposta: Arquitetura em Camadas
┌─────────────────────────────────────────┐
│          UI Components                  │
│  (PlayerProfile, Leaderboard, etc.)     │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│       Facade Layer (intelligence.ts)    │
│  - Orquestra chamadas aos services      │
│  - Implementa cache                     │
│  - Retorna dados agregados              │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│          Service Layer                  │
│  ┌─────────────┐  ┌─────────────┐      │
│  │ Profile     │  │ Badge       │      │
│  │ Service     │  │ Service     │      │
│  └─────────────┘  └─────────────┘      │
│  ┌─────────────┐  ┌─────────────┐      │
│  │ Achievement │  │ Ranking     │      │
│  │ Service     │  │ Service     │      │
│  └─────────────┘  └─────────────┘      │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│          Data Layer (Supabase)          │
└─────────────────────────────────────────┘
Benefícios:

Cada service tem responsabilidade única
Fácil de testar isoladamente
intelligence.ts vira um "facade" leve
Melhor organização do código
📝 Checklist de Implementação
Fase 1: Refatoração (Opcional, mas recomendado)
 Criar services/profileService.ts
 Criar 
services/gamificationService.ts
 Criar services/rankingService.ts
 Migrar lógica de 
intelligence.ts
 para services especializados
 Manter 
intelligence.ts
 como facade
Fase 2: Otimizações de Performance
 Implementar ProfileCache
 Criar materialized view player_rankings
 Adicionar índices nas tabelas
 Implementar trigger de sincronização automática
Fase 3: Features Avançadas
 Sistema de achievements automático
 Notificações de conquistas
 Ranking global em tempo real
 Histórico de level-ups
🔍 Monitoramento & Debug
Logs Importantes
// Em intelligence.ts
console.log('[Intelligence] Fetching stats for:', nick);
console.log('[Intelligence] Cache hit:', !!cached);
console.log('[Intelligence] Fallback to trade_logs');
console.log('[Intelligence] Fallback to profiles');
console.log('[Intelligence] Using mock data');
// Em ProfileService
console.log('[Profile] Level calculated:', level);
console.log('[Profile] XP progress:', progress);
// Em GamificationService
console.log('[Gamification] New achievement earned:', badge.name);
console.log('[Gamification] Level up:', newLevel);
Métricas a Monitorar
Tempo de resposta de 
getPlayerStatsAdvanced
Taxa de cache hit/miss
Número de fallbacks para mock data
Frequência de level-ups
Badges mais conquistados
🚀 Próximos Passos
Curto Prazo (Esta Sprint):

Copiar componentes de gamificação
Integrar com intelligence.ts
Testar modal PlayerProfile
Médio Prazo (Próxima Sprint):

Implementar cache de perfis
Criar triggers de sincronização
Otimizar queries
Longo Prazo (Futuro):

Refatorar para arquitetura em camadas
Sistema de achievements automático
Ranking global em tempo real
Analytics de gamificação
📚 Referências
Análise da Gamificação
Plano de Implementação
Supabase Realtime Docs
PostgreSQL Triggers