import React, { useState } from 'react';
import { ArrowLeft, Book, Trophy, Award, Scroll, Globe, HelpCircle, History } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface DocumentationPageProps {
    onBack: () => void;
}

type DocTab = 'manual' | 'origin' | 'rules';
type Lang = 'PT' | 'EN';

const MANUAL_PT = `
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
- **Conexão com internet** para auto-updates

---

## 🔐 Login e Autenticação

1. **Abra o TortaApp**
2. Clique em **"Sign in with Google"**
3. Autorize o acesso à sua conta Google

> **💡 Dica:** O TortaApp usa Google OAuth para segurança máxima. Suas credenciais nunca são armazenadas no app.

---

## ✅ Auto-Verificação de Nick

### Como Funciona

O TortaApp verifica automaticamente seu nick do Wurm Online através de um **código único** que você cola no chat de trade.

### Passos para Verificar

1. No app, clique no seu **perfil** no canto superior direito
2. Clique em **"Verify Game Nick"**
3. Digite seu nick exato do Wurm
4. O app gera um **código único** (ex: \`@torta12345\`)
5. **Copie o código**
6. **No Wurm Online**, abra o chat de trade e **cole o código**
7. Quando o app processar os logs de trade, ele **cruza seu nick com o código**
8. Pronto! Seu nick está verificado automaticamente ✅

> **💡 Como funciona:** O app lê os logs de trade, encontra o código que você colou e associa automaticamente ao seu nick. Nada é enviado para o Wurm - tudo acontece localmente!

---

## 📊 Dashboard

O Dashboard é sua central de comando. Aqui você vê:
- **Estatísticas Pessoais**: Seus trades, XP, nível
- **Market Stats**: Volume de trades, itens mais negociados
- **Player Profile**: Seu perfil de trader
- **Live Feed**: Trades em tempo real

---

## 📤 Upload de Logs

### Formatos Suportados
- \`.txt\` - Logs de chat de trade do Wurm
- \`.log\` - Formato alternativo

### Como Fazer Upload
1. Navegue até **Dashboard**
2. Clique em **"Upload Trade Log"** ou arraste o arquivo
3. Aguarde o processamento

### Localização dos Logs
\`C:\\Users\\[SeuUsuário]\\wurm\\players\\[SeuNick]\\logs\\\`

---

## 📈 Análise de Mercado

### Busca Avançada
Use operadores para filtrar:
\`\`\`
iron ore ql>90 price<50
\`\`\`

**Operadores Disponíveis:**
- \`ql>X\` / \`ql<X\` - Qualidade
- \`price>X\` / \`price<X\` - Preço (copper)
- \`qty>X\` - Quantidade

---

## 🎮 Sistema de Gamificação

### Níveis (1-50)
Ganhe **10 XP** por cada trade registrado!

**Fórmula de Nível:**
\`Nível = √(XP / 100)\`

**Exemplos:**
- Nível 1: 0-100 XP
- Nível 50: 250,000 XP

### Notificações de Level Up
- 🎊 Overlay animado
- 🔊 Som de level up
- ✨ Efeitos visuais

---

## 🔄 Auto-Atualização

### Como Funciona
O TortaApp verifica automaticamente por atualizações quando você abre o app (silenciosamente).

### Verificação Manual
Você pode conferir sua versão atual em **Settings** > **About**. O app avisará se houver updates pendentes.

---

## 🔧 Solução de Problemas

### Nick Não Verifica
1. Certifique-se de digitar o nick **exatamente** como no jogo (case-sensitive)
2. Cole o token no chat **Local** ou **Trade**
3. Faça upload do log que contém essa mensagem

### Dados Não Aparecem
1. Verifique se o arquivo de log está correto
2. Tente fazer upload novamente
`;

const MANUAL_EN = `
# TortaApp - User Manual

**Version:** 2.0.0 - "Venerable Whale"  
**Last Updated:** December 2024

---

## 📖 Index

1. [Getting Started](#getting-started)
2. [Login & Auth](#login--auth)
3. [Auto-Nick Verification](#auto-nick-verification)
4. [Dashboard](#dashboard)
5. [Log Upload](#log-upload)
6. [Market Analysis](#market-analysis)
7. [Gamification](#gamification)
8. [Live Feed](#live-feed)
9. [Settings](#settings)
10. [Auto-Update](#auto-update)
11. [Troubleshooting](#troubleshooting)

---

## 🚀 Getting Started

### What is TortaApp?

TortaApp is a complete market intelligence platform for Wurm Online. Analyze trade data in real-time, track prices, earn XP/Levels, and make informed market decisions.

### System Requirements
- **Windows 10/11** (64-bit)
- **4GB RAM** minimum
- **Internet Connection** for auto-updates

---

## 🔐 Login & Auth

1. **Open TortaApp**
2. Click **"Sign in with Google"**
3. Authorize access

> **💡 Tip:** TortaApp uses Google OAuth for maximum security. Your credentials are never stored in the app.

---

## ✅ Auto-Nick Verification

### How it Works

TortaApp automatically verifies your Wurm Online nick using a **unique code** you paste in trade chat.

### Verification Steps

1. In the app, click your **profile** (top right)
2. Click **"Verify Game Nick"**
3. Enter your **exact** Wurm nick
4. App generates a **unique code** (e.g., \`@torta12345\`)
5. **Copy the code**
6. **In Wurm Online**, open trade chat and **paste the code**
7. When you upload/process logs, the app **matches your nick with the code**
8. Done! Your nick is verified automatically ✅

> **💡 How it works:** The app scans trade logs locally for the token you pasted. Nothing is sent to Wurm servers!

---

## 📊 Dashboard

Your command center. Here you see:
- **Personal Stats**: Trades, XP, Level
- **Market Stats**: Volume, top traded items
- **Player Profile**: Your trader badge
- **Live Feed**: Real-time trades

---

## 📤 Log Upload

### Supported Formats
- \`.txt\` - Standard Wurm logs
- \`.log\` - Alternative format

### How to Upload
1. Go to **Dashboard**
2. Click **"Upload Trade Log"** or drag & drop
3. Wait for processing

### Log Location
\`C:\\Users\\[User]\\wurm\\players\\[Nick]\\logs\\\`

---

## 📈 Market Analysis

### Advanced Search
Use operators to filter:
\`\`\`
iron ore ql>90 price<50
\`\`\`

**Operators:**
- \`ql>X\` / \`ql<X\` - Quality
- \`price>X\` / \`price<X\` - Price (copper)
- \`qty>X\` - Quantity

---

## 🎮 Gamification System

### Levels (1-50)
Earn **10 XP** for every trade recorded!

**Level Formula:**
\`Level = √(XP / 100)\`

**Examples:**
- Level 1: 0-100 XP
- Level 50: 250,000 XP

### Level Up Perks
- 🎊 Animated Overlay
- 🔊 Unique Sound FX
- ✨ Visual Effects

---

## 🔄 Auto-Update

### How it Works
TortaApp checks for updates automatically and silently on startup.

### Manual Check
Check your version in **Settings** > **About**. The app will notify you if an update is pending.

---

## 🔧 Troubleshooting

### Nick Verification Failed
1. Ensure you typed the nick **exactly** as ingame (case-sensitive)
2. Paste token in **Local** or **Trade** chat
3. Upload the log containing that message

### No Data
1. Check if log file is correct
2. Re-upload
`;

const ORIGIN_PT = `
# 🥧 Por que "Torta"?

## A Origem do Nome

O nome **TortaApp** tem uma história curiosa e divertida que reflete a evolução do projeto.

### A Jornada

**Início: Scripts Python Espalhados**
- Tudo começou com pequenos programas Python
- Cada um lia dados e gerava gráficos do mercado de trade
- Com o tempo, foram ficando muitos scripts separados

**A Ideia: SuperPy**
- Pensamos: "Por que não fazer um super Python?"
- Nasceu o conceito: **SuperPy**
- Em inglês, soa como: **Super Pie** (Super Torta!)

**O Nome Final: TortaApp**
- SuperPy → Super Pie → Super Torta
- Um caminho longo para um nome tão bobo... mas funciona!
- É tão aleatório que pega! 😄

### O Conceito

> **"Nada melhor que uma fatia do mercado com o Torta"** 🥧

O nome captura perfeitamente a essência do app:
- **Torta** = Gráficos circulares (pie charts)
- **Fatia** = Sua parte do mercado de Wurm Online
- **Doce** = Análise de mercado que é fácil de digerir
`;

const ORIGIN_EN = `
# 🥧 Why "Torta"?

## The Origin Story

The name **TortaApp** has a fun and curious history reflecting the project's evolution.

### The Journey

**Start: Scattered Python Scripts**
- It all started with small Python programs
- Each read data and generated market charts
- Using many separate scripts became messy

**The Idea: SuperPy**
- We thought: "Why not make a Super Python?"
- The concept was born: **SuperPy**
- In English, it sounds like: **Super Pie**!

**The Final Name: TortaApp**
- SuperPy → Super Pie → Super Torta (Portuguese for Pie)
- A long road for a silly name... but it works!
- It's random enough to stick! 😄

### The Concept

> **"Nothing better than a slice of the market with Torta"** 🥧

The name perfectly captures the app's essence:
- **Torta** = Pie Charts
- **Slice** = Your share of the Wurm Online market
- **Sweet** = Market analysis that is easy to digest
`;

const RULES_CONTENT = `
# 🎮 TortaApp Gamification Rules

Welcome to the TortaApp Trade Career system.

## 1. Levels & XP System
**XP Formula:** \`1 Interaction (Trade/PC) = 10 XP\`

### 📊 Career Ladder
| Level | Title | Trades Needed | Description |
| :---: | :--- | :--- | :--- |
| **1** | **Novice** | 0 - 50 | New to the market. |
| **2** | **Apprentice** | 50 - 150 | Learning the ropes. |
| **3** | **Merchant** | 150 - 500 | Established trader. |
| **4** | **Veteran** | 500 - 1,000 | Highly respected. |
| **5** | **Tycoon** | 1,000+ | Market Legend. |

## 2. Badges
| Icon | Name | Class |
| :---: | :--- | :--- |
| 🛡️ | **Administrator** | \`Red\` |
| 💜 | **Patreon** | \`Purple\` |
| 🧪 | **Beta Tester** | \`Cyan\` |
| 📈 | **Market Mogul** | \`Green\` |
`;

export const DocumentationPage: React.FC<DocumentationPageProps> = ({ onBack }) => {
    const [activeTab, setActiveTab] = useState<DocTab>('manual');
    const [lang, setLang] = useState<Lang>('PT');

    const getContent = () => {
        if (activeTab === 'manual') return lang === 'PT' ? MANUAL_PT : MANUAL_EN;
        if (activeTab === 'origin') return lang === 'PT' ? ORIGIN_PT : ORIGIN_EN;
        return RULES_CONTENT; // Rules are EN only for now, simple enough
    };

    return (
        <div className="space-y-6 animate-fade-in pb-12 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Book className="w-6 h-6 text-amber-500" />
                            Documentation
                        </h1>
                        <p className="text-slate-400 text-sm">Guides, rules, and history.</p>
                    </div>
                </div>

                {/* Language Toggle */}
                {activeTab !== 'rules' && (
                    <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                        <button
                            onClick={() => setLang('PT')}
                            className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${lang === 'PT' ? 'bg-amber-600 text-white' : 'text-slate-500 hover:text-white'}`}
                        >
                            PT
                        </button>
                        <button
                            onClick={() => setLang('EN')}
                            className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${lang === 'EN' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'}`}
                        >
                            EN
                        </button>
                    </div>
                )}
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-4 border-b border-slate-700 shrink-0">
                <button
                    onClick={() => setActiveTab('manual')}
                    className={`pb-3 px-1 text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'manual' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-slate-400 hover:text-white'}`}
                >
                    <HelpCircle className="w-4 h-4" />
                    User Manual
                </button>
                <button
                    onClick={() => setActiveTab('origin')}
                    className={`pb-3 px-1 text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'origin' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-slate-400 hover:text-white'}`}
                >
                    <History className="w-4 h-4" />
                    The Origin
                </button>
                <button
                    onClick={() => setActiveTab('rules')}
                    className={`pb-3 px-1 text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'rules' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-slate-400 hover:text-white'}`}
                >
                    <Trophy className="w-4 h-4" />
                    Gamification Rules
                </button>
            </div>

            {/* Content Card - Scrollable */}
            <div className="flex-1 min-h-0 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col">
                <div className="overflow-y-auto p-8 custom-scrollbar">
                    <article className="prose prose-invert prose-amber max-w-none">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                table: ({ node, ...props }) => (
                                    <div className="overflow-x-auto my-6 rounded-lg border border-slate-700">
                                        <table className="min-w-full divide-y divide-slate-700 bg-slate-900/50" {...props} />
                                    </div>
                                ),
                                th: ({ node, ...props }) => (
                                    <th className="px-6 py-3 text-left text-xs font-medium text-amber-500 uppercase tracking-wider bg-slate-900" {...props} />
                                ),
                                td: ({ node, ...props }) => (
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 border-t border-slate-700/50" {...props} />
                                ),
                                code: ({ node, ...props }) => (
                                    <code className="bg-slate-900 text-amber-300 px-1 py-0.5 rounded text-xs font-mono border border-slate-700" {...props} />
                                ),
                                blockquote: ({ node, ...props }) => (
                                    <blockquote className="border-l-4 border-amber-500 pl-4 py-2 bg-slate-900/30 rounded-r-lg italic text-slate-300" {...props} />
                                )
                            }}
                        >
                            {getContent()}
                        </ReactMarkdown>
                    </article>
                </div>
            </div>
        </div>
    );
};
