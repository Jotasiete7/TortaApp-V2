# 🇧🇷 TortaApp - Wurm Trade Analytics - Guia Completo para Beta Testers

**Versão:** 0.1.0-beta  
**Última Atualização:** Dezembro 2025

---

## 📋 Índice

1. [Bem-vindo ao Beta](#bem-vindo-ao-beta)
2. [Primeiros Passos](#primeiros-passos)
3. [Guia Completo das Abas](#guia-completo-das-abas)
   - [Dashboard](#1-dashboard)
   - [Market Intelligence](#2-market-intelligence)
   - [Analytics](#3-analytics)
   - [ML Predictor](#4-ml-predictor)
   - [Price Manager](#5-price-manager-admin)
   - [Admin Panel](#6-admin-panel-admin)
   - [Bulk Upload](#7-bulk-upload-admin)
   - [Settings](#8-settings)
4. [Sistema de Gamificação](#sistema-de-gamificação)
5. [Como Reportar Bugs](#como-reportar-bugs)

---

## 🎯 Bem-vindo ao Beta

Obrigado por participar do beta do **TortaApp - Wurm Trade Analytics**! Esta é uma plataforma de inteligência de mercado para Wurm Online que usa **Machine Learning** para análise de preços e gamificação para tornar o trading mais divertido.

### O que testar:

- ✅ Criação de conta e login
- ✅ Upload de logs de trade
- ✅ Busca e filtros de mercado
- ✅ Predições de preço com ML
- ✅ Sistema de XP, níveis e badges
- ✅ Leaderboards
- ✅ Painel administrativo (se você for admin)

---

## 🚀 Primeiros Passos

### 1. Criar Conta

1. Clique em **"Sign Up"** na tela inicial
2. Digite seu **email** e **senha**
3. Verifique seu email (cheque spam/lixo eletrônico)
4. Faça login com suas credenciais

### 2. Vincular seu Nick do Jogo

Para que suas estatísticas sejam rastreadas:

1. Vá em **Settings** (ícone de engrenagem)
2. Clique em **"Link Game Nick"**
3. Digite seu **nome exato** do personagem Wurm
4. Siga o processo de verificação
5. ✅ Pronto! Suas trades serão automaticamente associadas ao seu perfil

> ⚠️ **Importante:** O nome do personagem é **case-sensitive** (diferencia maiúsculas/minúsculas)!

### 3. Upload de Logs (Opcional)

Você pode fazer upload de logs de trade chat para popular o banco de dados:

1. Vá em **Dashboard**
2. Clique em **"Upload Logs"** ou arraste o arquivo
3. Formatos aceitos: .txt, .log
4. Aguarde o processamento

---

## 📚 Guia Completo das Abas

### 1. 📊 Dashboard

**Função:** Visão geral das estatísticas globais e do seu perfil.

#### Estatísticas Exibidas:

| Estatística | Descrição | Como é Calculada |
|-------------|-----------|------------------|
| **Total Trades** | Total de transações no banco de dados | Soma de todos os registros de trade (WTS + WTB + PC) |
| **Active Traders** | Número de traders únicos | Contagem de vendedores/compradores distintos |
| **Avg Price** | Preço médio global | Média de todos os preços em cobre |
| **Market Health** | Saúde do mercado (0-100) | Baseado em volume, diversidade e atividade recente |

#### Cards do Dashboard:

1. **Upload de Logs**
   - Arraste arquivos .txt ou .log
   - Processamento automático
   - Feedback em tempo real

2. **Estatísticas Globais**
   - Atualização em tempo real
   - Dados do Supabase
   - Indicadores visuais (setas ↑↓)

3. **Seu Perfil**
   - XP e Nível atual
   - Badges conquistados
   - Posição no ranking

4. **Leaderboard**
   - Top 10 traders
   - Filtro por servidor (Harmony, Melody, Cadence)
   - Atualização automática

---

### 2. 🔍 Market Intelligence

**Função:** Busca avançada e análise de mercado com mais de 100.000 registros de trade.

#### Funcionalidades:

##### Busca Inteligente

Digite o nome do item e use **operadores** para filtrar:

```
iron ore ql>90 price<50
```

**Operadores Disponíveis:**

| Operador | Exemplo | Descrição |
|----------|---------|-----------|
| ql>X | ql>90 | Qualidade maior que X |
| ql<X | ql<80 | Qualidade menor que X |
| price>X | price>100 | Preço maior que X copper |
| price<X | price<50 | Preço menor que X copper |
| qty>X | qty>1000 | Quantidade maior que X |
| qty<X | qty<100 | Quantidade menor que X |

##### Filtros Avançados:

- **Tipo de Ordem:** WTS (venda), WTB (compra), PC (price check)
- **Raridade:** Common, Rare, Supreme, Fantastic
- **Servidor:** Harmony, Melody, Cadence
- **Período:** Últimos 7 dias, 30 dias, 90 dias, Tudo

##### Tabela de Resultados:

Cada linha mostra:
- **Item:** Nome e material
- **Quality (QL):** 0-100
- **Rarity:** Cor-coded (cinza, azul, roxo, dourado)
- **Price:** Em copper (c) ou silver (s)
- **Quantity:** Quantidade
- **Seller:** Nome do vendedor
- **Location:** Localização
- **Date:** Data da trade
- **Type:** WTS/WTB/PC

##### Estatísticas da Busca:

- **Total Results:** Número de resultados encontrados
- **Avg Price:** Preço médio dos resultados
- **Price Range:** Menor e maior preço
- **Most Common Seller:** Vendedor mais frequente

---

### 3. 📈 Analytics

**Função:** Gráficos e análises visuais de tendências de mercado.

#### Gráficos Disponíveis:

##### 1. Price Trend (Tendência de Preço)
- **Eixo X:** Tempo (dias/semanas)
- **Eixo Y:** Preço médio em copper
- **Linha:** Mostra evolução do preço
- **Área sombreada:** Variação de preço

**Como interpretar:**
- Linha subindo = Preço aumentando
- Linha descendo = Preço caindo
- Linha estável = Mercado estável

##### 2. Volume Chart (Gráfico de Volume)
- **Barras:** Quantidade de trades por período
- **Cor:** Intensidade de atividade

**Como interpretar:**
- Barras altas = Muita atividade
- Barras baixas = Pouca atividade
- Picos = Eventos especiais ou promoções

##### 3. Candlestick Chart (Gráfico de Velas)
- **Vela Verde:** Preço fechou acima da abertura
- **Vela Vermelha:** Preço fechou abaixo da abertura
- **Pavio superior:** Preço máximo do período
- **Pavio inferior:** Preço mínimo do período

**Como interpretar:**
- Velas longas = Grande variação
- Velas curtas = Preço estável
- Pavios longos = Volatilidade

##### 4. Supply Heatmap (Mapa de Calor de Oferta)
- **Cores quentes (vermelho):** Alta oferta
- **Cores frias (azul):** Baixa oferta
- **Eixos:** Tempo vs Quantidade

##### 5. Seller Insights (Insights de Vendedores)
- **Market Share:** Participação no mercado (%)
- **Avg Price:** Preço médio praticado
- **Strategy:** Premium (caro), Discount (barato), Market (médio)
- **Activity Score:** Nível de atividade (0-100)

---

### 4. 🤖 ML Predictor

**Função:** Predição de preços usando Machine Learning.

#### Como Funciona:

O ML Predictor analisa:
1. **Histórico de preços** (últimos 90 dias)
2. **Volume de trades**
3. **Sazonalidade** (padrões temporais)
4. **Tendências de mercado**
5. **Comportamento de vendedores**

#### Como Usar:

1. Busque um item no campo de pesquisa
2. Clique em **"Predict Price"**
3. Aguarde o processamento (5-10 segundos)
4. Veja os resultados

#### Resultados da Predição:

| Métrica | Descrição |
|---------|-----------|
| **Predicted Price** | Preço previsto para os próximos 7-30 dias |
| **Confidence** | Confiança da predição (0-100%) |
| **Trend** | Tendência: ↑ Subindo, ↓ Caindo, → Estável |
| **Z-Score** | Desvio do preço atual em relação à média |
| **Volatility** | Volatilidade do item (baixa/média/alta) |

#### Gráfico de Predição:

- **Linha Azul:** Preços históricos
- **Linha Pontilhada:** Predição futura
- **Área sombreada:** Margem de erro (intervalo de confiança)

#### Dicas de Interpretação:

- ✅ **Confidence > 70%:** Predição confiável
- ⚠️ **Confidence 40-70%:** Predição moderada
- ❌ **Confidence < 40%:** Dados insuficientes

---

### 5. 💰 Price Manager (Admin)

**Função:** Gerenciar preços de referência para itens.

> 🔒 **Apenas Admins** têm acesso a esta aba.

#### Funcionalidades:

1. **Adicionar Preço de Referência**
   - Nome do item
   - Preço em copper
   - Salvar no banco de dados

2. **Editar Preços Existentes**
   - Atualizar valores
   - Histórico de mudanças

3. **Deletar Preços**
   - Remover itens obsoletos

#### Estatísticas:

- **Total Reference Prices:** Total de preços cadastrados
- **Last Updated:** Última atualização
- **Coverage:** % de itens com preço de referência

---

### 6. 🛡️ Admin Panel (Admin)

**Função:** Painel de administração completo.

> 🔒 **Apenas Admins** têm acesso a esta aba.

#### Seções:

##### 1. User Manager (Gerenciador de Usuários)
- **Lista de usuários:** Todos os usuários cadastrados
- **Informações:** Email, nick do jogo, XP, nível
- **Ações:**
  - Promover/rebaixar admin
  - Banir/desbanir usuário
  - Resetar senha
  - Ver histórico de atividades

**Estatísticas:**
- Total de usuários
- Usuários ativos (últimos 7 dias)
- Novos usuários (últimos 30 dias)

##### 2. System Stats (Estatísticas do Sistema)
- **Database Size:** Tamanho do banco de dados
- **Total Trades:** Total de trades processados
- **API Calls:** Chamadas à API (últimas 24h)
- **Storage Used:** Armazenamento usado

##### 3. Anomaly Detective (Detector de Anomalias)
- **Price Anomalies:** Preços suspeitos (muito altos/baixos)
- **Spam Detection:** Detecção de spam
- **Duplicate Trades:** Trades duplicados
- **Suspicious Activity:** Atividade suspeita

**Como funciona:**
- Algoritmo detecta padrões anormais
- Lista de alertas com severidade (baixa/média/alta)
- Ações: Investigar, Ignorar, Banir

---

### 7. 📤 Bulk Upload (Admin)

**Função:** Upload em massa de dados NDJSON pré-processados.

> 🔒 **Apenas Admins** têm acesso a esta aba.

#### Como Usar:

1. Prepare arquivo .txt com dados NDJSON
2. Cada linha deve ser um JSON válido:
```json
{"name":"iron ore","quality":90,"price":45,"seller":"PlayerName",...}
```
3. Arraste o arquivo ou clique em "Choose File"
4. Aguarde processamento
5. Veja estatísticas de importação

#### Estatísticas de Upload:

- **Total Lines:** Total de linhas processadas
- **Successful:** Registros inseridos com sucesso
- **Failed:** Registros com erro
- **Duplicates:** Registros duplicados (ignorados)
- **Processing Time:** Tempo de processamento

---

### 8. ⚙️ Settings

**Função:** Configurações da conta e preferências.

#### Opções Disponíveis:

##### 1. Account Settings (Configurações da Conta)
- **Email:** Seu email (não editável)
- **Game Nick:** Vincular/desvincular nick do jogo
- **Server:** Selecionar servidor principal (Harmony/Melody/Cadence)

##### 2. Profile Settings (Configurações de Perfil)
- **Display Name:** Nome de exibição
- **Avatar:** Upload de avatar (em breve)
- **Bio:** Biografia curta

##### 3. Privacy Settings (Configurações de Privacidade)
- **Show Email:** Mostrar email publicamente
- **Show Stats:** Mostrar estatísticas no perfil
- **Leaderboard Visibility:** Aparecer no ranking

##### 4. Notification Settings (Configurações de Notificações)
- **Email Notifications:** Receber emails
- **Price Alerts:** Alertas de preço
- **Badge Notifications:** Notificações de badges

##### 5. Language (Idioma)
- **English** 🇺🇸
- **Português** 🇧🇷

##### 6. Theme (Tema)
- **Dark Mode** 🌙 (padrão)
- **Light Mode** ☀️ (em breve)

---

## 🎮 Sistema de Gamificação

### Como Ganhar XP:

| Ação | XP Ganho |
|------|----------|
| Vender item (WTS) | +10 XP |
| Comprar item (WTB) | +10 XP |
| Price Check (PC) | +10 XP |
| Daily Login | +10 XP |
| Upload de log | +50 XP |
| Primeira trade do dia | +20 XP |

### Níveis e Títulos:

| Nível | Título | Trades Necessários | XP Total |
|-------|--------|-------------------|----------|
| 1 | Novice Trader | 0 - 50 | 0 - 500 |
| 2 | Apprentice Merchant | 50 - 150 | 500 - 1,500 |
| 3 | Skilled Merchant | 150 - 500 | 1,500 - 5,000 |
| 4 | Veteran Trader | 500 - 1,000 | 5,000 - 10,000 |
| 5 | Master Tycoon | 1,000+ | 10,000+ |

### Badges (Conquistas):

Veja todos os badges disponíveis em **Rules & Compendium** no menu.

Exemplos:
- 🥇 **First Trade:** Primeira trade registrada
- 💯 **Century Club:** 100 trades
- 🔥 **Hot Streak:** 7 dias consecutivos de login
- 💰 **Big Spender:** Trade de 1 silver ou mais
- 📊 **Data Analyst:** Usar ML Predictor 10 vezes

### Leaderboard:

- **Global:** Top traders de todos os servidores
- **Por Servidor:** Harmony, Melody, Cadence
- **Atualização:** A cada 1 hora
- **Critérios:** XP total, número de trades, badges

---

## 🐛 Como Reportar Bugs

### Informações Necessárias:

1. **Descrição do bug:** O que aconteceu?
2. **Passos para reproduzir:** Como fazer o bug acontecer novamente?
3. **Comportamento esperado:** O que deveria ter acontecido?
4. **Screenshots:** Se possível, tire prints da tela
5. **Navegador:** Chrome, Firefox, Edge, etc.
6. **Sistema Operacional:** Windows, Mac, Linux

### Onde Reportar:

- **Discord:** [canal #beta-testing]
- **Email:** [seu-email@exemplo.com]
- **GitHub Issues:** (se você tem acesso ao repo privado)

### Prioridades:

- 🔴 **Crítico:** App trava, perda de dados
- 🟡 **Alto:** Funcionalidade não funciona
- 🟢 **Médio:** Bug visual, texto errado
- 🔵 **Baixo:** Sugestão de melhoria

---

## 📞 Suporte

Precisa de ajuda? Entre em contato:

- **Discord:** [link do servidor]
- **Email:** [seu-email]
- **FAQ:** Veja [FAQ.md](FAQ.md) para perguntas comuns

---

## 🙏 Agradecimentos

Obrigado por participar do beta! Seu feedback é essencial para tornar o TortaApp melhor.

**Happy Trading!** 🎯

---

*TortaApp - Wurm Trade Analytics - Inteligência de Mercado para Wurm Online*
