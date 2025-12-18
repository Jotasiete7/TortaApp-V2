# TortaApp - Manual do Usuário

**Versão:** 2.0.0 - "Venerable Whale"  
**Última Atualização:** Dezembro 2024

---

## 📖 Índice

1. [Primeiros Passos](#primeiros-passos)
2. [Login e Autenticação](#login-e-autenticação)
3. [Auto-Verificação de Nick](#auto-verificação-de-nick)
4. [Dashboard](#dashboard)
5. [Upload de Logs](#upload-de-logs)
6. [Análise de Mercado](#análise-de-mercado)
7. [Sistema de Gamificação](#sistema-de-gamificação)
8. [Live Trade Feed](#live-trade-feed)
9. [Configurações](#configurações)
10. [Auto-Atualização](#auto-atualização)
11. [Solução de Problemas](#solução-de-problemas)

---

## 🚀 Primeiros Passos

### O que é o TortaApp?

TortaApp é uma plataforma completa de inteligência de mercado para Wurm Online. Analise dados de trade em tempo real, acompanhe preços, ganhe XP e níveis, e tome decisões informadas sobre o mercado.

### Requisitos do Sistema

- **Windows 10/11** (64-bit)
- **4GB RAM** mínimo
- **200MB** espaço em disco
- **Conexão com internet** para auto-updates

### Instalação

1. Baixe o instalador do [GitHub Releases](https://github.com/Jotasiete7/TortaApp-V2/releases)
2. Escolha entre:
   - **MSI Installer** (recomendado para empresas)
   - **NSIS Installer** (recomendado para usuários finais)
3. Execute o instalador
4. Siga as instruções na tela

---

## 🔐 Login e Autenticação

### Primeiro Acesso

1. **Abra o TortaApp**
2. Clique em **"Sign in with Google"**
3. Autorize o acesso à sua conta Google
4. Você será redirecionado automaticamente

> **💡 Dica:** O TortaApp usa Google OAuth para segurança máxima. Suas credenciais nunca são armazenadas no app.

---

## ✅ Auto-Verificação de Nick

### Como Funciona

O TortaApp verifica automaticamente seu nick do Wurm Online através de um **código único** que você cola no chat de trade.

### Passos para Verificar

1. No app, clique no seu **perfil** no canto superior direito
2. Clique em **"Verify Game Nick"**
3. Digite seu nick exato do Wurm
4. O app gera um **código único** (ex: `@torta12345`)
5. **Copie o código**
6. **No Wurm Online**, abra o chat de trade e **cole o código**
7. Quando o app processar os logs de trade, ele **cruza seu nick com o código**
8. Pronto! Seu nick está verificado automaticamente ✅

> **💡 Como funciona:** O app lê os logs de trade, encontra o código que você colou e associa automaticamente ao seu nick. Nada é enviado para o Wurm - tudo acontece localmente!

> **⚠️ Importante:** O nick é case-sensitive. Digite exatamente como aparece no jogo.

---

## 📊 Dashboard

### Visão Geral

O Dashboard é sua central de comando. Aqui você vê:

- **Estatísticas Pessoais**: Seus trades, XP, nível
- **Market Stats**: Volume de trades, itens mais negociados
- **Player Profile**: Seu perfil de trader
- **Live Feed**: Trades em tempo real

### Indicadores de Status

- **🟢 LIVE FILE DATA**: Dados carregados de arquivo local
- **🔵 DATABASE CONNECTED**: Conectado ao banco de dados
- **⚪ NO DATA LOADED**: Nenhum dado carregado

---

## 📤 Upload de Logs

### Formatos Suportados

- `.txt` - Logs de chat de trade do Wurm
- `.log` - Formato alternativo

### Como Fazer Upload

1. Navegue até **Dashboard**
2. Clique em **"Upload Trade Log"** ou arraste o arquivo
3. Aguarde o processamento (pode levar alguns segundos para arquivos grandes)
4. Os dados aparecerão automaticamente na tabela de mercado

### Localização dos Logs

Os logs de trade do Wurm ficam em:
```
C:\Users\[SeuUsuário]\wurm\players\[SeuNick]\logs\
```

Procure por arquivos como `_Event.2024-12.txt`

---

## 📈 Análise de Mercado

### Tabela de Mercado

Visualize todos os trades com:
- **Item**: Nome do item
- **Seller**: Vendedor
- **Price**: Preço em copper
- **Quality**: Qualidade (QL)
- **Location**: Servidor
- **Timestamp**: Data e hora

### Busca Avançada

Use operadores para filtrar:

```
iron ore ql>90 price<50
```

**Operadores Disponíveis:**
- `ql>X` - Qualidade maior que X
- `ql<X` - Qualidade menor que X
- `price>X` - Preço maior que X copper
- `price<X` - Preço menor que X copper
- `qty>X` - Quantidade maior que X

### Gráficos e Analytics

Acesse **Analytics** no menu lateral para ver:
- **Price Trends**: Tendências de preço ao longo do tempo
- **Volume Analysis**: Volume de trades por item
- **Server Distribution**: Distribuição por servidor

---

## 🎮 Sistema de Gamificação

### Níveis (1-50)

Ganhe **10 XP** por cada trade registrado!

**Fórmula de Nível:**
```
Nível = √(XP / 100)
```

**Exemplos:**
- Nível 1: 0-100 XP (0-10 trades)
- Nível 5: 2,500 XP (250 trades)
- Nível 10: 10,000 XP (1,000 trades)
- Nível 50: 250,000 XP (25,000 trades)

### Conquistas (Achievements)

Desbloqueie conquistas especiais:
- 🏆 **First Trade**: Registre seu primeiro trade
- 💰 **Merchant**: Alcance 100 trades
- 🎯 **Market Expert**: Alcance nível 10
- 👑 **Trade Master**: Alcance nível 50

### Notificações de Level Up

Quando você sobe de nível:
- 🎊 Overlay animado aparece
- 🔊 Som de level up toca
- ✨ Efeitos visuais especiais

---

## 📡 Live Trade Feed

### News Ticker

No topo da tela, você verá:
- **Dicas rotativas** em português e inglês
- **Mensagens do sistema**
- **Indicador de loop** (🥧 emoji)

### Live Trade Ticker

Acompanhe trades em tempo real estilo "Nasdaq":
- Scroll automático
- Últimos 10 trades
- Atualização em tempo real

### Configuração

Clique no **ícone de configuração** (⚙️) no canto inferior direito para:
- Ativar/desativar notificações
- Configurar alertas de preço
- Ajustar preferências de som

---

## ⚙️ Configurações

### Idioma

Troque entre **Inglês** e **Português** clicando nos botões **EN/PT** no header.

### Perfil

- **Nick Verificado**: Aparece com ícone de escudo 🛡️
- **Email**: Clique no ícone de olho 👁️ para mostrar/ocultar
- **Role**: Admin, Moderator ou User

### Preferências

Acesse **Settings** no menu lateral para:
- Gerenciar identidades de jogadores
- Configurar notificações
- Ajustar preferências de privacidade

---

## 🔄 Auto-Atualização

### Como Funciona

O TortaApp verifica automaticamente por atualizações quando você abre o app.

### Quando Há Atualização

1. Você receberá uma notificação
2. A atualização baixa em segundo plano
3. O app reinicia automaticamente
4. Pronto! Você está na versão mais recente

### Verificação Manual

Atualmente, o TortaApp verifica atualizações automaticamente toda vez que é iniciado. Se houver uma nova versão, você será notificado.

Você pode conferir sua versão atual em **Settings** > **About**.


---

## 🔧 Solução de Problemas

### App Não Abre

1. Verifique se você tem Windows 10/11
2. Execute como Administrador
3. Reinstale o app

### Login Não Funciona

1. Verifique sua conexão com internet
2. Tente fazer logout e login novamente
3. Limpe o cache do navegador

### Dados Não Aparecem

1. Verifique se o arquivo de log está correto
2. Tente fazer upload novamente
3. Verifique a conexão com o banco de dados

### Nick Não Verifica

1. Certifique-se de digitar o nick exatamente como no jogo
2. Clique no link dentro do Wurm Online
3. Se não funcionar, tente novamente após 5 minutos

### Performance Lenta

1. Feche outros programas
2. Verifique se tem pelo menos 4GB RAM disponível
3. Limite o tamanho dos arquivos de log (use logs mensais, não anuais)

---

## 📚 Recursos Adicionais

### Documentação

- **FAQ**: Perguntas frequentes
- **Admin Guide**: Guia para administradores
- **Technical Docs**: Documentação técnica

### Suporte

- **GitHub Issues**: Reporte bugs
- **Feedback Widget**: Envie sugestões (ícone no canto inferior direito)
- **Discord**: Comunidade de usuários

### Links Úteis

- [GitHub Repository](https://github.com/Jotasiete7/TortaApp-V2)
- [Changelog](../CHANGELOG.md)
- [Versioning Guide](../VERSIONING.md)

---

## 🎯 Dicas Rápidas

1. **Verifique seu nick** logo no primeiro uso para começar a ganhar XP
2. **Use a busca avançada** para encontrar as melhores ofertas
3. **Acompanhe o Live Feed** para não perder nenhum trade importante
4. **Mantenha o app atualizado** para ter as últimas features
5. **Explore os gráficos** para entender tendências de mercado

---

*TortaApp v2.0.0 - Tornando o trading de Wurm mais inteligente!* 🐋
