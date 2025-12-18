# Cronograma Estimado de Implementação (1 Desenvolvedor)

A estimativa de tempo é baseada em um desenvolvedor com experiência em React, TypeScript e Web Workers, trabalhando em tempo integral (aproximadamente 8 horas por dia).

## 1. Estimativa de Esforço por Etapa

| Etapa | Foco | Complexidade | Esforço Estimado (Dias) | Observações |
| :--- | :--- | :--- | :--- | :--- |
| **1** | Desbloqueio da UI (ETL) | Média | 2 dias | Criação do Worker, implementação do Streaming (`File.stream()`) e comunicação via `postMessage`. Requer testes de transferência de dados. |
| **2** | Estrutura de Dados e Indexação | Baixa | 1 dia | Instalação do FlexSearch, definição final da estrutura `MarketItem` e implementação da função `buildIndex` no `useFileProcessor`. |
| **3** | Busca Avançada | Média/Alta | 3 dias | Implementação do `useMarketSearch`, desenvolvimento do *parser* de *query* estruturada (`ql>90`) e integração da busca textual com o FlexSearch. Requer testes de *fuzzy search*. |
| **4** | Robustez do Parser | Alta | 4 dias | Refatoração da lógica de parsing para o **Lexer Simples Manual**. Esta é a etapa mais demorada, pois depende da análise detalhada e da cobertura de todos os formatos de log do Wurm Online. |
| **5** | Otimização da UI | Baixa/Média | 2 dias | Instalação do `react-window`, refatoração do `MarketTable.tsx` e criação do componente `MarketTableRow`. Requer ajustes de layout (CSS) para a tabela virtualizada. |
| **Total** | | | **12 dias** | Excluindo tempo de *deploy* e *bug fixing* pós-lançamento. |

## 2. Cronograma Consolidado

O cronograma total estimado para a implementação das 5 etapas é de **12 dias úteis**.

| Período | Etapa | Foco Principal |
| :--- | :--- | :--- |
| **Dia 1 - 2** | Etapa 1 | **Web Workers e Streaming** (Desbloqueio da UI) |
| **Dia 3** | Etapa 2 | **FlexSearch Index** (Preparação para Busca) |
| **Dia 4 - 6** | Etapa 3 | **Busca Avançada** (FlexSearch + Parser de Query) |
| **Dia 7 - 10** | Etapa 4 | **Lexer Simples Manual** (Robustez do Parser) |
| **Dia 11 - 12** | Etapa 5 | **Virtualização de Lista** (Otimização da UI) |

## 3. Recomendações de Priorização

A ordem proposta é a mais lógica, pois cada etapa se baseia na anterior. No entanto, se o objetivo for entregar valor rapidamente, a priorização deve ser:

1.  **Etapa 1 (Dias 1-2):** Resolve o problema mais crítico (bloqueio da UI).
2.  **Etapa 5 (Dias 11-12):** Resolve o segundo problema mais visível (lentidão da tabela).
3.  **Etapas 2 e 3 (Dias 3-6):** Implementa a busca de alta performance.
4.  **Etapa 4 (Dias 7-10):** Aumenta a robustez do parser, o que é crucial, mas menos visível para o usuário final inicialmente.

**Observação Crítica:** A Etapa 4 (Lexer) é a mais arriscada. O tempo estimado de 4 dias pressupõe que você já tenha uma boa compreensão de todos os formatos de log que precisa cobrir. Se a complexidade dos logs for muito alta, esta etapa pode consumir mais tempo. É fundamental que a refatoração do parser seja feita com testes unitários robustos.
