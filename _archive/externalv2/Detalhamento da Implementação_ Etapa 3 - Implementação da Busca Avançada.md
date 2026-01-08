# Detalhamento da Implementação: Etapa 3 - Implementação da Busca Avançada

O objetivo desta etapa é criar um motor de busca robusto que combine a velocidade do **FlexSearch** para busca textual (*fuzzy search*) com a capacidade de filtrar dados estruturados (ex: `"ql > 90"`).

## 1. Criação do Hook de Busca Otimizado (`useMarketSearch.ts`)

Para manter a performance, a busca deve ser feita em duas fases: **Busca Textual (FlexSearch)** e **Filtragem Estruturada (JavaScript)**. O `useMemo` do React será crucial para otimizar o recálculo.

```typescript
// useMarketSearch.ts

import { useMemo } from 'react';
import { MarketItem } from './types'; // Importe sua tipagem
import { Index } from 'flexsearch'; // Importe o FlexSearch

// Defina a interface para o hook, que receberá os dados e o índice
interface SearchProps {
    data: MarketItem[];
    flexIndex: Index<MarketItem> | null;
    searchText: string;
}

export const useMarketSearch = ({ data, flexIndex, searchText }: SearchProps) => {
    
    // O useMemo garante que a filtragem só ocorra quando as dependências mudarem
    const filteredData = useMemo(() => {
        if (!data || !flexIndex || !searchText) {
            return data; // Retorna todos os dados se não houver busca
        }

        // 1. Separar a Query em Textual e Estruturada
        const { textQuery, structuredQuery } = parseSearchText(searchText);

        let itemIds: number[] = [];
        
        // 2. Fase 1: Busca Textual (FlexSearch)
        if (textQuery && flexIndex) {
            // O FlexSearch retorna um array de IDs (números)
            // 'limit' é opcional, mas ajuda a limitar o número de resultados iniciais
            itemIds = flexIndex.search(textQuery, { limit: 5000 }) as number[];
        } else {
            // Se não houver busca textual, consideramos todos os IDs para a filtragem estruturada
            itemIds = data.map(item => item.id);
        }

        // 3. Fase 2: Filtragem Estruturada (JavaScript)
        // Primeiro, mapeamos os IDs para os objetos MarketItem
        const itemsToFilter = itemIds.map(id => data.find(item => item.id === id)).filter(Boolean) as MarketItem[];
        
        // 4. Aplicar o filtro estruturado
        // A função getStructuredFilter(structuredQuery) será criada no próximo passo
        const structuredFilter = getStructuredFilter(structuredQuery);

        return itemsToFilter.filter(structuredFilter);

    }, [data, flexIndex, searchText]); // Recalcula apenas se os dados ou a query mudarem

    return filteredData;
};
```

## 2. Implementação do Parser de Query Estruturada

Para suportar queries como `"ql > 90"`, precisamos de uma função que converta a *string* em uma função de filtro JavaScript.

### 2.1. Função `parseSearchText` (Separação)

Esta função separa a busca textual da busca estruturada.

```typescript
// utils/queryParser.ts

interface ParsedQuery {
    textQuery: string;
    structuredQuery: string;
}

export const parseSearchText = (searchText: string): ParsedQuery => {
    // Regex simples para encontrar padrões de filtro: [campo][operador][valor]
    // Ex: ql>90, price<100c, seller=jotasiete
    const filterRegex = /(\w+)\s*(>|<|=|>=|<=)\s*([\w\d\.]+)/g;
    
    let structuredQuery = '';
    let textQuery = searchText;

    // Extrai todas as correspondências de filtro
    const matches = [...searchText.matchAll(filterRegex)];
    
    if (matches.length > 0) {
        structuredQuery = matches.map(match => match[0]).join(' ');
        // Remove os filtros estruturados da query textual
        textQuery = searchText.replace(filterRegex, '').trim();
    }

    return { textQuery, structuredQuery };
};
```

### 2.2. Função `getStructuredFilter` (Conversão para Função de Filtro)

Esta função é o coração do *parser* simples. Ela recebe a *string* estruturada e retorna uma função que pode ser usada no `Array.prototype.filter()`.

```typescript
// utils/queryParser.ts (Continuação)

type FilterFunction = (item: MarketItem) => boolean;

export const getStructuredFilter = (structuredQuery: string): FilterFunction => {
    if (!structuredQuery) {
        return () => true; // Retorna verdadeiro se não houver filtro
    }

    const filterRegex = /(\w+)\s*(>|<|=|>=|<=)\s*([\w\d\.]+)/g;
    const matches = [...structuredQuery.matchAll(filterRegex)];

    // Retorna uma função que aplica TODOS os filtros (lógica AND)
    return (item: MarketItem) => {
        return matches.every(match => {
            const field = match[1]; // Ex: 'ql'
            const operator = match[2]; // Ex: '>'
            const valueStr = match[3]; // Ex: '90'
            
            // Mapeamento de campos (se o nome da query for diferente do campo no objeto)
            const itemField = (field === 'ql') ? 'quality' : field;
            
            // Verifica se o campo existe no item
            if (!(itemField in item)) return true; 

            const itemValue = item[itemField as keyof MarketItem];
            let value: any = valueStr;

            // Tenta converter o valor para número se o campo for numérico
            if (typeof itemValue === 'number') {
                value = parseFloat(valueStr);
                if (isNaN(value)) return true; // Ignora filtro inválido
            }
            
            // Aplica a lógica do operador
            switch (operator) {
                case '>': return itemValue > value;
                case '<': return itemValue < value;
                case '=': return itemValue == value;
                case '>=': return itemValue >= value;
                case '<=': return itemValue <= value;
                default: return true;
            }
        });
    };
};
```

## 3. Uso no Componente `MarketTable.tsx`

O componente agora usará o `useMarketSearch` para obter os dados filtrados:

```typescript
// MarketTable.tsx (Exemplo)

import { useFileProcessor } from './useFileProcessor';
import { useMarketSearch } from './useMarketSearch';

const MarketTable = () => {
    const { data, flexIndex, isLoading } = useFileProcessor();
    const [searchText, setSearchText] = useState('');
    
    // AQUI: Usa o hook de busca otimizado
    const filteredData = useMarketSearch({ data: data || [], flexIndex, searchText });

    return (
        <div>
            <input 
                type="text" 
                placeholder="Buscar (ex: stone ql>90)"
                value={searchText} 
                onChange={(e) => setSearchText(e.target.value)} 
            />
            
            {/* Exibir o número de resultados */}
            <p>Resultados: {filteredData.length}</p>
            
            {/* Renderizar a tabela usando filteredData */}
            {/* AQUI VOCÊ USARÁ A VIRTUALIZAÇÃO (Etapa 4) */}
            <Table data={filteredData} /> 
        </div>
    );
};
```

Com esta implementação, você terá uma busca extremamente rápida que combina a flexibilidade da busca textual (*fuzzy*) com a precisão da filtragem estruturada, resolvendo o gargalo do seu *Query Engine*.
