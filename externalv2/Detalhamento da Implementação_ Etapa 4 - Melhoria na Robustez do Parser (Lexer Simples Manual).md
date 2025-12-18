# Detalhamento da Implementação: Etapa 4 - Melhoria na Robustez do Parser (Lexer Simples Manual)

O objetivo desta etapa é substituir a lógica de "Regex Pesado" por um **Lexer Simples Manual** dentro do Web Worker. Isso aumentará a robustez, a manutenibilidade e a clareza do seu motor de ETL.

## 1. Estrutura do Lexer/Parser

A abordagem de Lexer Simples Manual envolve dividir a linha de log em *tokens* e, em seguida, analisar a sequência desses *tokens* para extrair os dados estruturados.

### 1.1. Definição de Tokens e Regex Simples

Em vez de uma Regex gigante, definimos Regex pequenas e específicas para cada tipo de informação que você precisa extrair:

| Tipo de Token | Descrição | Regex de Exemplo |
| :--- | :--- | :--- |
| **TIMESTAMP** | Data e hora do log. | `^\[\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}\]` |
| **MOEDA** | Preço e tipo de moeda (ouro, prata, cobre). | `(\d+)\s*([gsc])` |
| **QUANTIDADE** | Quantidade de itens (para cálculo de `unitPrice`). | `(\d+)(?:x|\s)` |
| **AÇÃO** | Palavras-chave que definem o tipo de transação. | `(vendeu|comprou|por|ofereceu)` |
| **TEXTO** | Qualquer outra palavra ou frase. | (Capturado por exclusão ou por Regex de limpeza) |

### 1.2. A Função Central: `parseLine`

A função `parseLine` (que reside no `parser.worker.ts`) será refatorada para usar esta lógica sequencial.

```typescript
// utils/logParser.ts (Este arquivo será importado pelo parser.worker.ts)

import { MarketItem } from './types'; // Sua tipagem MarketItem

// Regex para identificar o padrão de transação (o gatilho)
const TRANSACTION_TRIGGER_REGEX = /(vendeu|comprou|ofereceu|por)\s*(\d+)\s*([gsc])/i;
const QUANTITY_REGEX = /(\d+)(?:x|\s)/i;
const PRICE_REGEX = /(\d+)\s*([gsc])/i;

export function parseLine(line: string, id: number): MarketItem | null {
    // 1. Classificação da Linha (Gatilho)
    const transactionMatch = line.match(TRANSACTION_TRIGGER_REGEX);
    
    if (!transactionMatch) {
        // Não é uma transação de mercado, é um chat normal.
        return null; 
    }

    // 2. Extração de Tokens Chave (Parser)
    try {
        const action = transactionMatch[1].toLowerCase(); // 'vendeu', 'comprou', etc.
        
        // Extração do Preço Total
        const priceMatch = line.match(PRICE_REGEX);
        if (!priceMatch) return null; // Preço obrigatório
        const totalPrice = parseInt(priceMatch[1]);
        const currency = priceMatch[2].toLowerCase();
        
        // Extração da Quantidade (Bulk)
        let quantity = 1;
        const quantityMatch = line.match(QUANTITY_REGEX);
        if (quantityMatch) {
            quantity = parseInt(quantityMatch[1]);
        }
        
        // 3. Limpeza e Extração do Item/Vendedor
        // A parte mais complexa: isolar o nome do item e do vendedor.
        // O Lexer Manual aqui é a remoção sequencial dos tokens já encontrados.
        let cleanLine = line
            .replace(TRANSACTION_TRIGGER_REGEX, '') // Remove a ação e o preço
            .replace(QUANTITY_REGEX, '') // Remove a quantidade
            .trim();

        // Lógica de Limpeza de "Stop Words" e lixo de chat (seu isNoise)
        // Ex: cleanLine = cleanLine.replace(/isNoise\s*/g, '');
        
        // Assumindo que o restante da linha é o Item e o Vendedor
        // (Esta parte requer a lógica mais específica do seu log)
        const parts = cleanLine.split(' ');
        const seller = parts[0]; // Exemplo: O primeiro token restante é o vendedor
        const itemName = parts.slice(1).join(' '); // O restante é o item
        
        // 4. Cálculo e Normalização
        const unitPrice = totalPrice / quantity;
        
        // 5. Retorno do Objeto MarketItem
        return {
            id: id,
            name: itemName,
            seller: seller,
            material: 'Desconhecido', // Precisa de lógica de extração
            quality: 0, // Precisa de lógica de extração
            unitPrice: unitPrice,
            timestamp: Date.now(), // Ou extrair do log
            searchableText: `${itemName} ${seller} Desconhecido`.toLowerCase(),
        };

    } catch (e) {
        console.error("Erro no parsing da linha:", line, e);
        return null;
    }
}
```

## 2. Benefícios da Abordagem Lexer Simples

| Aspecto | Regex Pesado (Antigo) | Lexer Simples Manual (Novo) |
| :--- | :--- | :--- |
| **Robustez** | Frágil. Uma pequena mudança no log quebra tudo. | Robusto. Focado em *tokens* específicos. |
| **Manutenibilidade** | Baixa. Regex complexas são difíceis de ler e modificar. | Alta. Lógica sequencial e Regex simples são fáceis de ajustar. |
| **Performance** | Múltiplas Regex complexas rodando 100k vezes. | Regex simples e lógica de *string* sequencial (mais rápido). |
| **Clareza** | Baixa. A intenção da Regex é obscura. | Alta. O código reflete o fluxo de análise do log. |

Ao mover a lógica de parsing para este modelo sequencial e baseado em *tokens*, você resolve o problema de fragilidade e complexidade, tornando o `fileParser.ts` (agora `logParser.ts` dentro do Worker) muito mais confiável.

A próxima e última etapa seria a **Otimização da UI (Virtualização de Lista)**.
