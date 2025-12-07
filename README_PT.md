# 🇧🇷 TortaApp V2 - Beta

> 🔒 **Repositório Privado** - Fase de Testes Beta

Plataforma inteligente de análise de mercado e companheira de trading para Wurm Online.

## 🚀 Funcionalidades

- **Inteligência de Mercado** - Busca avançada com mais de 100.000 registros de trade
- **Preditor ML** - Previsão de preços com Machine Learning
- **Gamificação** - XP, níveis, badges e leaderboards
- **Análise de Trades** - Estatísticas e insights abrangentes
- **Painel Admin** - Ferramentas de gerenciamento de usuários e preços

## 🛠️ Stack Tecnológica

- **Frontend:** React 19 + TypeScript + Vite
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Estilização:** CSS Vanilla (inline styles)
- **Ícones:** Lucide React
- **ML:** Algoritmos customizados de predição
- **Desktop:** Tauri 2.0 (aplicação nativa)

## 📋 Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta Supabase (para backend)
- **Para versão desktop:** Visual Studio Build Tools com C++ workload (Windows)

## 🔧 Instalação

### 1. Clonar Repositório

```bash
git clone https://github.com/Jotasiete7/TortaApp-V2.git
cd TortaApp-V2
```

### 2. Instalar Dependências

```bash
npm install
```

### 3. Variáveis de Ambiente

Crie o arquivo `.env.local` na raiz do projeto:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

> ⚠️ **Nunca faça commit do .env.local!** Ele já está no .gitignore.

### 4. Configuração do Banco de Dados

Execute as migrações SQL em ordem na pasta `database/migrations/`

### 5. Executar Servidor de Desenvolvimento

#### Versão Web:

```bash
npm run dev
```

Aplicação estará disponível em `http://localhost:5173`

#### Versão Desktop (Tauri):

```bash
npm run tauri:dev
```

> 📝 **Nota:** No Windows, você precisa ter o Visual Studio Build Tools instalado. Veja [docs/GUIA_BETA_PT.md](docs/GUIA_BETA_PT.md) para instruções detalhadas.

## 📚 Documentação

- **[Guia Completo para Beta Testers](docs/GUIA_BETA_PT.md)** - Guia detalhado de todas as funcionalidades ⭐
- **[Manual do Usuário](docs/USER_MANUAL.md)** - Guia completo de recursos
- **[FAQ](docs/FAQ.md)** - Perguntas frequentes
- **[Guia do Admin](docs/ADMIN_GUIDE.md)** - Recursos administrativos
- **[Changelog](docs/CHANGELOG.md)** - Histórico de versões

## 🧪 Testes Beta

### Versão Atual: 0.1.0-beta

**O que testar:**

- [ ] Criação de conta e login
- [ ] Upload de arquivos (logs de trade)
- [ ] Busca e filtros de mercado
- [ ] Predições de preço ML
- [ ] Gamificação (XP, badges, níveis)
- [ ] Painel admin (se for admin)
- [ ] Versão desktop (Tauri)

**Como Reportar Problemas:**

Veja instruções detalhadas em [docs/GUIA_BETA_PT.md](docs/GUIA_BETA_PT.md#como-reportar-bugs)

## 🏗️ Estrutura do Projeto

```
TortaApp-V2/
├── components/          # Componentes React
├── services/           # Lógica de negócio
├── database/           # Migrações SQL
├── docs/              # Documentação
├── public/            # Assets estáticos
├── src-tauri/         # Código Rust do Tauri
└── types.ts           # Tipos TypeScript
```

## 📝 Scripts

```bash
npm run dev              # Servidor de desenvolvimento (web)
npm run build            # Build de produção (web)
npm run preview          # Preview do build de produção
npm run tauri:dev        # Servidor de desenvolvimento (desktop)
npm run tauri:build      # Build de produção (desktop)
npm run lint             # Executar ESLint
npm run test             # Executar testes
```

## 🎮 Sistema de Gamificação

### Como Ganhar XP:

| Ação | XP |
|------|-----|
| Vender item (WTS) | +10 XP |
| Comprar item (WTB) | +10 XP |
| Price Check (PC) | +10 XP |
| Login diário | +10 XP |
| Upload de log | +50 XP |

### Níveis:

| Nível | Título | Requisito |
|-------|--------|-----------|
| 1 | Novice Trader | 0 - 50 Trades |
| 2 | Apprentice Merchant | 50 - 150 Trades |
| 3 | Skilled Merchant | 150 - 500 Trades |
| 4 | Veteran Trader | 500 - 1,000 Trades |
| 5 | Master Tycoon | 1,000+ Trades |

## 🌟 Recursos Destacados

### 🤖 ML Price Predictor
Algoritmo de Machine Learning que analisa:
- Histórico de preços (90 dias)
- Volume de trades
- Sazonalidade
- Tendências de mercado
- Comportamento de vendedores

### 📊 Analytics Avançado
- Gráficos de tendência de preço
- Gráficos de volume
- Candlestick charts
- Mapas de calor de oferta
- Insights de vendedores

### 🎯 Busca Inteligente
Operadores avançados:
```
iron ore ql>90 price<50 qty>1000
```

### 🏆 Leaderboards
- Rankings globais
- Rankings por servidor
- Atualização em tempo real

## 📄 Licença

Proprietário - Todos os Direitos Reservados (durante beta)

## 👥 Equipe

- **Desenvolvedor:** Jotasiete7
- **Beta Testers:** [A definir]

---

**Status:** 🟡 Testes Beta  
**Última Atualização:** Dezembro 2025  
**Próximo Release:** A definir

---

*TortaApp V2 - Tornando o trading de Wurm mais inteligente!* 🎯
