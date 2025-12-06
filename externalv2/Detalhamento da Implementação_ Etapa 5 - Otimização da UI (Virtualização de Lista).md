# Detalhamento da Implementação: Etapa 5 - Otimização da UI (Virtualização de Lista)

O objetivo desta etapa é resolver o gargalo de **performance de re-renderização em listas grandes** no `MarketTable.tsx` através da **Virtualização de Lista**.

## 1. Escolha da Biblioteca: `react-window`

A virtualização de lista garante que apenas os itens visíveis na tela (e alguns adjacentes) sejam renderizados no DOM, reduzindo drasticamente o número de elementos e melhorando a fluidez da UI.

*   **Recomendação:** **`react-window`** [1].
    *   **Motivo:** É uma biblioteca leve, focada em performance e com uma API simples, ideal para listas com altura de linha fixa (como uma tabela simples). Se você precisar de altura de linha variável, `react-virtualized` seria a alternativa, mas `react-window` é geralmente suficiente e mais rápido.

### 1.1. Instalação

```bash
pnpm install react-window @types/react-window
```

## 2. Refatoração do `MarketTable.tsx` com Virtualização

O componente `MarketTable.tsx` será refatorado para usar o componente `FixedSizeList` do `react-window`.

### 2.1. Componente de Linha (`Row`)

Primeiro, definimos o componente que renderizará cada linha da sua tabela. Ele receberá o índice da linha e o estilo necessário para o posicionamento.

```typescript
// components/MarketTableRow.tsx

import React from 'react';
import { MarketItem } from '../types'; // Sua tipagem MarketItem

// O 'style' é obrigatório e fornecido pelo react-window para posicionamento
interface RowProps {
    index: number;
    style: React.CSSProperties;
    data: MarketItem[]; // O array completo de dados filtrados
}

const MarketTableRow: React.FC<RowProps> = ({ index, style, data }) => {
    const item = data[index];

    // Se o item não existir (por algum erro de índice), retorna null
    if (!item) return null; 

    // O estilo é aplicado ao elemento pai da linha
    return (
        <div style={style} className={index % 2 ? 'ListItemOdd' : 'ListItemEven'}>
            {/* Aqui você renderiza as colunas da sua tabela */}
            <span style={{ width: '20%', display: 'inline-block' }}>{item.name}</span>
            <span style={{ width: '20%', display: 'inline-block' }}>{item.seller}</span>
            <span style={{ width: '20%', display: 'inline-block' }}>{item.quality}</span>
            <span style={{ width: '20%', display: 'inline-block' }}>{item.unitPrice.toFixed(2)}</span>
            {/* ... outras colunas */}
        </div>
    );
};

export default MarketTableRow;
```

### 2.2. Integração no `MarketTable.tsx`

O componente principal usará o `FixedSizeList` para renderizar a lista.

```typescript
// MarketTable.tsx (Refatorado)

import { FixedSizeList } from 'react-window';
import MarketTableRow from './MarketTableRow';
import { useFileProcessor } from './useFileProcessor';
import { useMarketSearch } from './useMarketSearch';

const MarketTable = () => {
    const { data, flexIndex, isLoading } = useFileProcessor();
    const [searchText, setSearchText] = useState('');
    
    // Dados filtrados (do FlexSearch)
    const filteredData = useMarketSearch({ data: data || [], flexIndex, searchText });

    // Dimensões da lista (ajuste conforme o layout do seu app)
    const LIST_HEIGHT = 500;
    const LIST_WIDTH = 800;
    const ROW_HEIGHT = 35; // Altura fixa de cada linha em pixels

    return (
        <div>
            {/* Input de Busca (da Etapa 3) */}
            <input 
                type="text" 
                placeholder="Buscar (ex: stone ql>90)"
                value={searchText} 
                onChange={(e) => setSearchText(e.target.value)} 
            />
            
            {/* Indicador de Progresso (da Etapa 1) */}
            {isLoading && <p>Processando...</p>}
            
            {/* Cabeçalho da Tabela (Não Virtualizado) */}
            <div style={{ width: LIST_WIDTH, height: ROW_HEIGHT, fontWeight: 'bold', borderBottom: '1px solid #ccc' }}>
                <span style={{ width: '20%', display: 'inline-block' }}>Item</span>
                <span style={{ width: '20%', display: 'inline-block' }}>Vendedor</span>
                <span style={{ width: '20%', display: 'inline-block' }}>QL</span>
                <span style={{ width: '20%', display: 'inline-block' }}>Preço Unit.</span>
            </div>

            {/* Lista Virtualizada */}
            <FixedSizeList
                height={LIST_HEIGHT}
                width={LIST_WIDTH}
                itemCount={filteredData.length} // O número total de itens filtrados
                itemSize={ROW_HEIGHT} // A altura de cada linha
                itemData={filteredData} // Os dados que serão passados para o componente Row
            >
                {/* Passamos o componente de linha como child */}
                {MarketTableRow}
            </FixedSizeList>
        </div>
    );
};
```

## 3. Considerações Finais

*   **Integração com Dados Indexados:** O `FixedSizeList` renderiza apenas o `MarketTableRow` para os índices visíveis. O `MarketTableRow` acessa os dados diretamente do `filteredData` (que já foi otimizado pelo FlexSearch e `useMemo`), garantindo que a renderização seja sempre rápida, independentemente do tamanho total do *dataset* (100k+).
*   **Ordenação:** A ordenação (seu antigo `Array.prototype.sort()`) deve ser aplicada ao `filteredData` antes de ser passado para o `FixedSizeList`. Como o `filteredData` é um subconjunto, a ordenação será muito mais rápida do que era no *dataset* completo.

Com a conclusão desta etapa, você terá um aplicativo totalmente otimizado, desde a ingestão de dados até a exibição na UI.

## Referências

[1] **React-Window:** Uma biblioteca leve para virtualização de lista. [https://github.com/bvaughn/react-window](https://github.com/bvaughn/react-window)
