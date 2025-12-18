import React, { useState } from 'react';
import { ArrowLeft, Book, Trophy, Award, Scroll, Calculator } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface DocumentationPageProps {
    onBack: () => void;
}

const MARKDOWN_CONTENT = `
# 🎮 TortaApp Gamification Rules

Welcome to the TortaApp Trade Career system. Here is how you can level up, earn badges, and become a Tycoon.

## 1. Levels & XP System

Your progress is automatically calculated based on your market activity.
**XP Formula:** \`1 Interaction (Trade/PC) = 10 XP\`

### 📊 Career Ladder

| Level | Title | Trades Needed | Total XP | Description |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **Novice** | 0 - 50 | 0 - 500 | New to the market. |
| **2** | **Apprentice** | 50 - 150 | 500 - 1.5k | Learning the ropes. |
| **3** | **Merchant** | 150 - 500 | 1.5k - 5k | Established trader. |
| **4** | **Veteran** | 500 - 1,000 | 5k - 10k | Highly respected. |
| **5** | **Tycoon** | 1,000+ | 10k+ | Market Legend. |

---

## 2. Badges Collection

Badges are unique honors displayed on your profile.

### 🎖️ Current Badges

| Icon | Name | Class | How to Obtain |
| :---: | :--- | :--- | :--- |
| 🛡️ | **Administrator** | \`Red\` | TortaApp Staff only. |
| 💜 | **Patreon Supporter** | \`Purple\` | Support the project financially. |
| 🧪 | **Beta Tester** | \`Cyan\` | Participated in early testing phases. |
| 📈 | **Market Mogul** | \`Green\` | Significant market influence (Manual). |
| 🎁 | **Christmas 2025** | \`Red\` | Active during Dec 2025 event. |

---

## 3. Earning XP (Tasks)

Currently, volume is king. Future updates will bring daily quests.

- **WTS (Sell Item):** +10 XP
- **WTB (Buy Item):** +10 XP
- **Price Check:** +10 XP
- **Earn Badge:** 0 XP (Soon)
- **Send Shout:** 0 XP (Soon)
`;

export const DocumentationPage: React.FC<DocumentationPageProps> = ({ onBack }) => {
    return (
        <div className="space-y-6 animate-fade-in pb-12">
            {/* Header */}
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
                        Game Rules & Docs
                    </h1>
                    <p className="text-slate-400 text-sm">Everything you need to know about progression.</p>
                </div>
            </div>

            {/* Content Card */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 max-w-4xl mx-auto shadow-2xl">
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
                            )
                        }}
                    >
                        {MARKDOWN_CONTENT}
                    </ReactMarkdown>
                </article>
            </div>
        </div>
    );
};
