# Detalhamento da Implementação: Etapa 2 - Otimização da Estrutura de Dados e Indexação

O objetivo desta etapa é preparar a estrutura de dados de saída do Web Worker para que ela seja otimizada para o **React** e para a **indexação de busca** de alta performance com o **FlexSearch**.

## 1. Estrutura de Dados Otimizada (`MarketItem`)

Para o React e para a indexação, a estrutura de dados deve seguir dois princípios:

1.  **Identificador Único (`id`):** Essencial para o React (prop `key`) e para o FlexSearch (que usa IDs para mapear resultados).
2.  **Campos de Busca Consolidados:** Agrupar os campos que serão pesquisados em um único campo de texto para simplificar a indexação.

```typescript
// types.ts (Estrutura de Dados Otimizada)

export interface MarketItem {
    // 1. Identificador Único (Obrigatório para React Keys e FlexSearch)
    id: number; 
    
    // 2. Campos de Dados Estruturados (Para Filtros e Tabela)
    name: string; // Nome do item (ex: "Stone Shard")
    seller: string; // Nome do vendedor
    material: string; // Material (ex: "Iron", "Steel")
    quality: number; // Qualidade (ql)
    unitPrice: number; // Preço por unidade (calculado no ETL)
    timestamp: number; // Data/Hora da transação
    
    // 3. Campo de Busca Consolidado (Opcional, mas recomendado para FlexSearch)
    // Combina os campos que serão pesquisados textualmente
    searchableText: string; 
}
```

### 1.1. Saída do Web Worker

O Web Worker deve garantir que cada item processado possua um `id` único (pode ser um índice sequencial ou um *hash* da linha) e que o campo `searchableText` seja preenchido com os dados relevantes.

```typescript
// parser.worker.ts (Trecho de Saída)

// ... dentro do loop de processamento de linha
const item: MarketItem = {
    id: results.length + 1, // Exemplo: ID sequencial
    name: extractedName,
    seller: extractedSeller,
    // ... outros campos
    searchableText: `${extractedName} ${extractedSeller} ${extractedMaterial}`.toLowerCase(),
};
results.push(item);

// ... no final do worker
self.postMessage({ type: 'success', data: results });
```

## 2. Integração do FlexSearch e Construção do Índice

A construção do índice deve ocorrer na *Main Thread* (ou no `useFileProcessor.ts`) imediatamente após o recebimento dos dados do Web Worker.

### 2.1. Instalação e Configuração

Primeiro, instale a biblioteca:

```bash
pnpm install flexsearch
```

### 2.2. Construção do Índice no `useFileProcessor.ts`

O índice deve ser construído apenas uma vez e armazenado em um estado ou referência.

```typescript
// useFileProcessor.ts (Continuação)

import { Index } from 'flexsearch';
// ... outros imports

// Definição do tipo do índice (para TypeScript)
type FlexSearchIndex = Index<MarketItem>;

export const useFileProcessor = () => {
    // ... estados existentes
    const [flexIndex, setFlexIndex] = useState<FlexSearchIndex | null>(null);
    
    // Função para construir o índice
    const buildIndex = useCallback((data: MarketItem[]) => {
        // 1. Configuração do FlexSearch
        // O campo 'searchableText' será o campo de busca
        const index = new Index<MarketItem>({
            tokenize: "forward", // Otimizado para busca de prefixos (ex: "sto" encontra "stone")
            document: {
                id: "id", // Campo de ID
                field: ["searchableText"] // Campo(s) a serem indexados
            }
        });

        // 2. Adicionar todos os documentos ao índice
        data.forEach(item => index.add(item.id, item.searchableText));
        
        setFlexIndex(index);
        console.log("FlexSearch Index construído com sucesso!");
        
        return index;
    }, []);

    useEffect(() => {
        worker.onmessage = (event) => {
            // ... lógica de progresso e erro
            
            if (type === 'success') {
                const processedData = event.data;
                setData(processedData);
                
                // *** NOVO PASSO: CONSTRUIR O ÍNDICE ***
                buildIndex(processedData); 
                
                setIsLoading(false);
                setProgress(100);
            }
        };
        // ... lógica de cleanup
    }, [buildIndex]);

    // ... restante do hook
    return { data, progress, isLoading, error, flexIndex, processFile };
};
```

## 3. Benefícios da Indexação

1.  **Performance:** A busca textual não percorrerá mais o array de 100k itens, mas sim o índice otimizado do FlexSearch, resultando em latência de milissegundos.
2.  **Fuzzy Search:** O FlexSearch suporta *fuzzy search* (busca aproximada) por padrão, resolvendo o problema de "busca burra" e erros de digitação.
3.  **Separação de Preocupações:** O *dataset* (`data`) permanece imutável, e o índice (`flexIndex`) é usado apenas para encontrar os IDs dos itens que correspondem à *query*. A filtragem final no React será feita apenas no pequeno subconjunto de IDs retornados.

A próxima etapa seria detalhar como usar o `flexIndex` para a busca e como implementar a lógica de *query* estruturada (`"ql > 90"`).
