# 🇧🇷 TortaApp - Sobre o Projeto (Closed Beta)

## 📋 Descrição do Repositório

**TortaApp** é uma plataforma inteligente de análise de mercado e companheira de trading para Wurm Online. Transforme seus dados de trade em insights acionáveis com machine learning, gamificação e análise em tempo real.

### 🎯 Propósito

Este repositório contém o código-fonte da versão 2.0 do TortaApp, atualmente em **Closed Beta**. O projeto visa fornecer aos jogadores de Wurm Online uma ferramenta profissional para:

- 📊 Analisar tendências de mercado
- 🤖 Prever preços usando Machine Learning
- 🎮 Gamificar a experiência de trading
- 📈 Rastrear estatísticas pessoais de trading

---

## 🔒 Status: Closed Beta

**Versão Atual:** 0.1.0-beta  
**Acesso:** Somente por convite  
**Período:** Dezembro 2025 - TBD

### Por que Closed Beta?

1. **Testes Controlados**: Queremos garantir estabilidade antes do lançamento público
2. **Feedback Direcionado**: Grupo pequeno de testers permite feedback de qualidade
3. **Iteração Rápida**: Podemos fazer mudanças significativas baseadas no feedback
4. **Segurança**: Proteger dados dos usuários durante desenvolvimento ativo

### Como Participar

Durante o período de closed beta, o acesso é **somente por convite**. Se você está interessado em participar:

1. Entre em contato através do Discord da comunidade Wurm
2. Aguarde aprovação da equipe de desenvolvimento
3. Receba credenciais de acesso
4. Leia o [Guia de Beta Testing](docs/GUIA_BETA_PT.md)

---

## 🚀 Recursos Principais

### Inteligência de Mercado
- Busca avançada com operadores (`ql>90`, `price<50`)
- Banco de dados com 100k+ registros de trade
- Insights automáticos (bons/maus negócios)
- Filtragem por raridade, qualidade, vendedor

### Preditor ML
- Previsões de preço para 7 dias
- Intervalos de confiança
- Análise de tendências históricas
- Múltiplos modelos de predição

### Gamificação
- Sistema de XP e níveis (Novice → Tycoon)
- 12+ badges desbloqueáveis
- Leaderboards globais e por servidor
- Recompensas diárias

### Ferramentas Admin
- Gerenciamento de usuários
- Atualização de preços de referência
- Upload em massa (NDJSON)
- Estatísticas do sistema

---

## 🛠️ Stack Tecnológica

- **Frontend:** React 19 + TypeScript + Vite
- **Backend:** Supabase (PostgreSQL + Auth)
- **Desktop:** Tauri 2.0 (aplicação nativa)
- **Estilização:** CSS Vanilla
- **ML:** Algoritmos customizados de predição

---

## 📚 Documentação

### Para Usuários
- [Manual do Usuário](docs/USER_MANUAL_PT.md)
- [FAQ](docs/FAQ_PT.md)
- [Guia de Beta Testing](docs/GUIA_BETA_PT.md)

### Para Administradores
- [Guia do Admin](docs/ADMIN_GUIDE_PT.md)
- [Registro de Alterações](docs/CHANGELOG_PT.md)

### Técnica
- [Especificações Técnicas](docs/technical/)
- [Guia de Gamificação](docs/technical/GAMIFICATION_GUIDE.md)

---

## 🔐 Segurança & Privacidade

### Medidas de Segurança

- ✅ Autenticação via Supabase (email verificado)
- ✅ Row-Level Security (RLS) em todas as tabelas
- ✅ Variáveis de ambiente gitignored
- ✅ Repositório privado durante beta
- ✅ Sem API keys no código
- ✅ Dados criptografados em trânsito (HTTPS)

### Política de Dados

**O que coletamos:**
- Email (para autenticação)
- Logs de trade que você faz upload
- Nick do jogo (se você verificar)
- Estatísticas de uso (anônimas)

**O que NÃO fazemos:**
- ❌ Vender seus dados
- ❌ Compartilhar com terceiros
- ❌ Usar para spam
- ❌ Acessar sem permissão

---

## 🐛 Reportando Bugs

Durante o closed beta, use:

1. **In-app Feedback** (em breve)
2. **Discord**: Canal #beta-testing
3. **GitHub Issues**: Somente para bugs críticos

**Template de Bug Report:**
```
**Descrição:** [O que aconteceu]
**Passos para Reproduzir:** [Como reproduzir]
**Esperado:** [O que deveria acontecer]
**Screenshots:** [Se aplicável]
**Versão:** [Versão do app]
```

---

## 🗺️ Roadmap

### Fase Beta (Atual)
- [x] Autenticação e perfis
- [x] Upload de logs
- [x] Busca avançada
- [x] Preditor ML
- [x] Gamificação
- [ ] Sistema de feedback
- [ ] Otimizações de performance

### Próximas Fases
- **v0.2.0**: Recursos sociais (amigos, grupos)
- **v0.3.0**: Alertas em tempo real
- **v1.0.0**: Lançamento público

---

## ❤️ Apoie o Projeto

Se você gosta do TortaApp e quer apoiar seu desenvolvimento:

[![Patreon](https://img.shields.io/badge/Patreon-Apoie%20o%20Desenvolvimento-orange?style=for-the-badge&logo=patreon)](https://www.patreon.com/c/tortawurmapp)

**[Seja um Patrono](https://www.patreon.com/c/tortawurmapp)**

---

## 📄 Licença

**Proprietário - Todos os Direitos Reservados** (durante beta)

Após o lançamento público, a licença será reavaliada.

---

## 👥 Equipe

- **Desenvolvedor:** Jotasiete7
- **Beta Testers:** Comunidade Wurm Online (selecionados)

---

## 📞 Contato

- **Discord:** [Link do servidor]
- **Email:** [Seu email de contato]
- **GitHub:** [@Jotasiete7](https://github.com/Jotasiete7)

---

**Status:** 🟡 Closed Beta  
**Última Atualização:** Dezembro 2025  
**Próximo Milestone:** Sistema de Feedback

*TortaApp - Tornando o trading de Wurm mais inteligente!* 🎯
