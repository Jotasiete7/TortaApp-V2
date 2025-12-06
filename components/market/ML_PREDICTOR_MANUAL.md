# 📊 ML Predictor - Manual do Usuário

## 🎯 O que é o ML Predictor?

O **ML Predictor** (Price Predictor Engine PRO) é uma ferramenta avançada de análise estatística que calcula o **valor justo de mercado** de itens do Wurm Online baseado em dados históricos reais de negociações.

### **Para que serve?**
- 🔍 **Descobrir o preço justo** de qualquer item
- 💰 **Identificar oportunidades de compra** (preços abaixo do mercado)
- 📈 **Identificar oportunidades de venda** (preços acima do mercado)
- 📊 **Analisar a volatilidade** do mercado
- 🎯 **Tomar decisões informadas** ao invés de adivinhar preços

---

## 🚀 Como Usar (Passo a Passo)

### **1. Digite o Nome do Item**
- No campo "Item Name", digite o item que deseja analisar
- Exemplos: "Stone Brick", "Iron Lump", "Plank"
- O sistema tem autocomplete - comece a digitar e veja sugestões

### **2. Selecione o Material (Opcional)**
- Se quiser filtrar por material específico (Iron, Wood, etc.), selecione no dropdown
- Deixe como "Any Material" para ver todos os materiais

### **3. Ajuste a Qualidade (QL)**
- Use o slider para definir a qualidade alvo (1-100)
- Isso é apenas referencial, não afeta o cálculo

### **4. Clique em "Calculate Fair Price"**
- O sistema vai:
  - ✅ Buscar todas as negociações do item
  - ✅ Remover outliers (preços extremos)
  - ✅ Calcular estatísticas (mediana, quartis)
  - ✅ Apresentar o valor justo

---

## 📊 Entendendo os Resultados

### **Fair Market Value (Valor Justo de Mercado)**
- 💎 **O número grande no centro** é o preço mais confiável
- Calculado usando a **mediana** (não a média)
- Outliers são removidos automaticamente
- Baseado em negociações reais

### **Métricas Principais**

#### **1. Confidence (Confiança)**
- **O que é:** Quão confiável é a previsão (0-100%)
- **Como interpretar:**
  - 🟢 **>70%**: Alta confiança - pode confiar no preço
  - 🟡 **50-70%**: Confiança moderada - use com cautela
  - 🔴 **<50%**: Baixa confiança - poucos dados ou muito volátil

#### **2. Volatility (Volatilidade)**
- **O que é:** Desvio padrão dos preços
- **Como interpretar:**
  - 🟢 **Baixa**: Preços estáveis, mercado previsível
  - 🟡 **Média**: Flutuação normal
  - 🔴 **Alta**: Preços variam muito, mercado arriscado

#### **3. Buy Zone (<P25)**
- **O que é:** Preços abaixo do percentil 25
- **Estratégia:** Se encontrar um item nessa faixa, é uma **boa oportunidade de compra**
- **Exemplo:** Se P25 = 45s, qualquer preço abaixo de 45s é barganha

#### **4. Sell Zone (>P75)**
- **O que é:** Preços acima do percentil 75
- **Estratégia:** Se você tem estoque, venda nessa faixa para **maximizar lucro**
- **Exemplo:** Se P75 = 78s, venda por 78s ou mais

---

## 💡 Estratégias de Trading

### **Estratégia 1: Compra e Revenda Rápida**
1. Procure itens com **alta confiança** (>70%)
2. Compre abaixo do **Buy Zone** (<P25)
3. Revenda pelo **Fair Market Value**
4. Lucro garantido: diferença entre P25 e mediana

**Exemplo:**
- Fair Value: 67s
- Buy Zone: <45s
- Você compra por 40s → Revende por 67s = **27s de lucro**

### **Estratégia 2: Investimento de Longo Prazo**
1. Procure itens com **baixa volatilidade**
2. Compre em grandes quantidades no **Fair Value**
3. Espere o mercado subir
4. Venda no **Sell Zone** (>P75)

### **Estratégia 3: Arbitragem de Bulk**
1. Use o **Bulk Selector** (aparece se houver lotes)
2. Compare preço unitário de lotes vs. singles
3. Compre o lote com **melhor valor** (indicado com 🟡)
4. Revenda em singles se o multiplicador for favorável

**Exemplo:**
- Single: 10s/unidade
- Bulk 50x: 8s/unidade (💸 melhor valor!)
- Compre bulk, revenda singles = **2s de lucro por unidade**

---

## 🔍 Recursos Avançados

### **Bulk Analysis (Análise de Lotes)**

Quando há negociações em lote (10x, 50x, 100x), o sistema mostra:

- **Ícones:**
  - 💸 = Mais barato que single (bom negócio!)
  - ✓ = Preço similar ao single
  - ⚠️ = Mais caro que single (evite)

- **Ponto Dourado (🟡)**: Indica o lote com **melhor custo-benefício**

### **Price Distribution (Distribuição de Preços)**

O histograma mostra:
- **Barras verdes**: Faixa de preços normais
- **Linha roxa**: Fair Market Value
- **Altura das barras**: Quantas negociações naquela faixa

### **Analysis Source Data (Dados de Origem)**

Tabela com as últimas 20 negociações usadas no cálculo:
- **Qty**: Quantidade (se for bulk)
- **Unit Price**: Preço por unidade
- **Bulk (1k)**: Preço se comprar 1000 unidades
- **Seller**: Quem vendeu

---

## ⚠️ Limitações e Avisos

### **O que o ML Predictor NÃO faz:**
- ❌ Não prevê eventos futuros (updates do jogo, etc.)
- ❌ Não garante que você vai encontrar itens naquele preço
- ❌ Não considera sazonalidade ou tendências de longo prazo
- ❌ Não analisa oferta/demanda em tempo real

### **Quando NÃO confiar:**
- 🔴 Confidence < 50%
- 🔴 Menos de 10 negociações encontradas
- 🔴 Muitos outliers removidos (>30%)
- 🔴 Volatilidade muito alta

### **Boas Práticas:**
- ✅ Use com itens que têm muitas negociações
- ✅ Compare com Trade Master para validar
- ✅ Considere o contexto do mercado (eventos, updates)
- ✅ Use como ferramenta de apoio, não como verdade absoluta

---

## 🎓 Glossário de Termos

| Termo | Significado |
|-------|-------------|
| **Fair Market Value** | Preço mediano após remover outliers |
| **Median** | Valor do meio quando os preços são ordenados |
| **P25 (Percentil 25)** | 25% dos preços estão abaixo deste valor |
| **P75 (Percentil 75)** | 75% dos preços estão abaixo deste valor |
| **Outliers** | Preços extremos (muito altos ou baixos) |
| **Volatility** | Desvio padrão - mede a variação dos preços |
| **Confidence** | Quão confiável é a previsão |
| **Bulk** | Lote/pacote de múltiplas unidades |

---

## 📈 Exemplos Práticos

### **Exemplo 1: Compra Segura**
```
Item: Stone Brick
Fair Value: 67s 50c
Confidence: 85%
Buy Zone: <45s
Sell Zone: >78s

Ação: Procure vendedores abaixo de 45s
Lucro esperado: ~22s por unidade
```

### **Exemplo 2: Mercado Volátil**
```
Item: Rare Item X
Fair Value: 2g 30s
Confidence: 35%
Volatility: 1g 20s

Ação: EVITE! Confiança muito baixa e alta volatilidade
```

### **Exemplo 3: Arbitragem de Bulk**
```
Item: Iron Lump
Single: 15s/unidade
Bulk 100x: 12s/unidade (💸)

Ação: Compre bulk de 100x, revenda singles
Lucro: 3s por unidade × 100 = 3g de lucro
```

---

## 🆚 ML Predictor vs Charts Engine

| Aspecto | ML Predictor | Charts Engine |
|---------|--------------|---------------|
| **Objetivo** | Calcular preço justo | Analisar tendências |
| **Foco** | Valor atual | Histórico temporal |
| **Melhor para** | Decisões rápidas | Análise profunda |
| **Complexidade** | Simples | Avançado |
| **Tempo de uso** | 30 segundos | 5-10 minutos |

**Use ML Predictor quando:**
- Quer saber rapidamente se um preço é justo
- Precisa decidir comprar/vender agora
- Quer comparar múltiplos itens rapidamente

**Use Charts Engine quando:**
- Quer entender tendências de longo prazo
- Precisa analisar volatilidade detalhada
- Quer ver padrões de supply/demand

---

## 🎯 Dicas Finais

1. **Sempre compare com o mercado real** - O preço justo é uma referência, não uma garantia
2. **Use em conjunto com Charts Engine** - Ferramentas complementares
3. **Preste atenção na confiança** - Só confie em previsões com >70%
4. **Considere o contexto** - Updates do jogo podem mudar tudo
5. **Pratique!** - Quanto mais usar, melhor vai entender os padrões

---

## 📞 Suporte

**Precisa de ajuda?**
- 💬 Pergunte no Discord da comunidade
- 📧 Reporte bugs via GitHub Issues
- 📚 Consulte a documentação completa

**Bom trading! 🚀**
